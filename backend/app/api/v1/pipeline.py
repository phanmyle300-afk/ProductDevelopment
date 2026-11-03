import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import (
    get_current_user,
    require_admin,
    require_any_authenticated,
    require_hiring_manager_or_above,
    require_interviewer_or_above,
    require_recruiter_or_admin,
)
from app.core.database import get_db
from app.models.application import (
    ApplicationNote,
    ApplicationStage,
    ApplicationStageHistory,
    CandidateApplication,
    InterviewFeedback,
    Notification,
)
from app.models.candidate import Candidate
from app.models.job import Job
from app.models.user import User, UserRole
from app.schemas.pipeline import (
    ActionQueueItem,
    ApplicationNoteCreate,
    ApplicationNoteResponse,
    AssignInterviewerRequest,
    InterviewFeedbackCreate,
    InterviewFeedbackResponse,
    KanbanCardResponse,
    NotificationItem,
    OfferApprovalRequest,
    StageHistoryItem,
    StageTransitionRequest,
    StageTransitionResponse,
    TagsUpdateRequest,
)
from app.services.pipeline_service import (
    add_application_note,
    approve_offer,
    assign_interviewer,
    normalize_stage,
    submit_interview_feedback,
    transition_application_stage,
    update_application_tags,
)

router = APIRouter(prefix="/pipeline", tags=["Recruiter Pipeline & ATS Workflows"])


@router.post("/applications/{application_id}/transition", response_model=StageTransitionResponse)
async def transition_stage_endpoint(
    application_id: uuid.UUID,
    payload: StageTransitionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_interviewer_or_above),
):
    """
    State Machine Transition:
    Move application to a new stage with strict state transition validation,
    actor role permission checks, mandatory reason, and audit trail logging.
    """
    app, history = await transition_application_stage(
        db=db,
        application_id=application_id,
        to_stage_str=payload.to_stage,
        actor=current_user,
        reason=payload.reason,
        notes=payload.notes,
    )

    return StageTransitionResponse(
        application_id=app.id,
        from_stage=history.from_stage,
        to_stage=history.to_stage,
        actor_name=history.actor_name,
        actor_role=history.actor_role,
        reason=history.reason,
        timestamp=history.created_at,
        message=f"Đã chuyển trạng thái ứng viên sang '{history.to_stage}' thành công.",
    )


@router.get("/applications/{application_id}/history", response_model=List[StageHistoryItem])
async def get_application_stage_history(
    application_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_any_authenticated),
):
    """Get complete stage transition history timeline for a candidate application."""
    query = (
        select(ApplicationStageHistory)
        .where(ApplicationStageHistory.application_id == application_id)
        .order_by(desc(ApplicationStageHistory.created_at))
    )
    res = await db.execute(query)
    rows = list(res.scalars().all())
    return [
        StageHistoryItem(
            id=h.id,
            application_id=h.application_id,
            from_stage=h.from_stage,
            to_stage=h.to_stage,
            actor_id=h.actor_id,
            actor_name=h.actor_name,
            actor_role=h.actor_role,
            reason=h.reason,
            notes=h.notes,
            created_at=h.created_at,
        )
        for h in rows
    ]


@router.patch("/applications/{application_id}/assign-interviewer")
async def assign_interviewer_endpoint(
    application_id: uuid.UUID,
    payload: AssignInterviewerRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hiring_manager_or_above),
):
    """Assign an interviewer to a candidate application."""
    app = await assign_interviewer(
        db=db,
        application_id=application_id,
        interviewer_id=payload.interviewer_id,
        interviewer_name=payload.interviewer_name,
        actor=current_user,
    )
    return {
        "application_id": app.id,
        "assigned_interviewer_id": app.assigned_interviewer_id,
        "assigned_interviewer_name": app.assigned_interviewer_name,
        "message": f"Đã phân công phỏng vấn cho {payload.interviewer_name}.",
    }


@router.post("/applications/{application_id}/feedbacks", response_model=InterviewFeedbackResponse)
async def submit_feedback_endpoint(
    application_id: uuid.UUID,
    payload: InterviewFeedbackCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_interviewer_or_above),
):
    """Submit interview evaluation and recommendation (hire / no hire)."""
    feedback = await submit_interview_feedback(
        db=db,
        application_id=application_id,
        actor=current_user,
        rating=payload.rating,
        recommendation=payload.recommendation,
        notes=payload.notes,
        technical_score=payload.technical_score,
        cultural_score=payload.cultural_score,
        strengths=payload.strengths,
        weaknesses=payload.weaknesses,
    )
    return feedback


@router.get("/applications/{application_id}/feedbacks", response_model=List[InterviewFeedbackResponse])
async def list_feedbacks_endpoint(
    application_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_any_authenticated),
):
    """Get all submitted interview evaluations for an application."""
    query = (
        select(InterviewFeedback)
        .where(InterviewFeedback.application_id == application_id)
        .order_by(desc(InterviewFeedback.created_at))
    )
    res = await db.execute(query)
    return list(res.scalars().all())


@router.post("/applications/{application_id}/offer-approval")
async def approve_offer_endpoint(
    application_id: uuid.UUID,
    payload: Optional[OfferApprovalRequest] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hiring_manager_or_above),
):
    """Hiring manager or Admin approves the offer for a candidate."""
    offer_dict = payload.model_dump() if payload else None
    app = await approve_offer(
        db=db,
        application_id=application_id,
        actor=current_user,
        offer_details=offer_dict,
    )
    return {
        "application_id": app.id,
        "offer_approved": app.offer_approved,
        "offer_approved_by": app.offer_approved_by,
        "offer_approved_at": app.offer_approved_at,
        "message": "Offer đã được phê duyệt thành công.",
    }


@router.post("/applications/{application_id}/notes", response_model=ApplicationNoteResponse)
async def add_note_endpoint(
    application_id: uuid.UUID,
    payload: ApplicationNoteCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_interviewer_or_above),
):
    """Add a collaborative note to candidate application."""
    note = await add_application_note(
        db=db,
        application_id=application_id,
        actor=current_user,
        content=payload.content,
    )
    return note


@router.get("/applications/{application_id}/notes", response_model=List[ApplicationNoteResponse])
async def get_notes_endpoint(
    application_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_any_authenticated),
):
    """Get internal collaborative notes for an application."""
    query = (
        select(ApplicationNote)
        .where(ApplicationNote.application_id == application_id)
        .order_by(desc(ApplicationNote.created_at))
    )
    res = await db.execute(query)
    return list(res.scalars().all())


@router.put("/applications/{application_id}/tags")
async def update_tags_endpoint(
    application_id: uuid.UUID,
    payload: TagsUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_hiring_manager_or_above),
):
    """Update application tags (e.g. urgent, senior, culture_fit)."""
    app = await update_application_tags(
        db=db,
        application_id=application_id,
        actor=current_user,
        tags=payload.tags,
    )
    return {"application_id": app.id, "tags": app.tags, "message": "Đã cập nhật tags thành công."}


@router.get("/kanban", response_model=List[KanbanCardResponse])
async def get_kanban_board_endpoint(
    job_id: Optional[uuid.UUID] = Query(None, description="Lọc theo vị trí tuyển dụng"),
    stage: Optional[str] = Query(None, description="Lọc theo stage cụ thể"),
    tag: Optional[str] = Query(None, description="Lọc theo tag"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_any_authenticated),
):
    """
    Get Kanban board cards across the pipeline stages.
    Enforces Interviewer isolation: Interviewers ONLY see applications assigned to them.
    """
    query = (
        select(CandidateApplication, Candidate, Job)
        .join(Candidate, CandidateApplication.candidate_id == Candidate.id)
        .join(Job, CandidateApplication.job_id == Job.id)
    )

    # Interviewer isolation: Only view assigned candidates
    if current_user.role == UserRole.INTERVIEWER:
        query = query.where(CandidateApplication.assigned_interviewer_id == current_user.id)

    if job_id:
        query = query.where(CandidateApplication.job_id == job_id)
    if stage:
        query = query.where(CandidateApplication.stage == stage)

    query = query.order_by(desc(CandidateApplication.updated_at))
    res = await db.execute(query)
    rows = res.all()

    cards = []
    for app, candidate, job in rows:
        tags = app.tags or []
        if tag and tag.lower() not in [t.lower() for t in tags]:
            continue

        cards.append(
            KanbanCardResponse(
                application_id=app.id,
                candidate_id=candidate.id,
                candidate_name=candidate.full_name,
                job_id=job.id,
                job_title=job.title,
                stage=normalize_stage(app.stage),
                overall_score=app.overall_score,
                recommendation=app.recommendation,
                matched_skills_count=len(app.matched_required_skills or []),
                missing_skills_count=len(app.missing_required_skills or []),
                tags=tags,
                assigned_interviewer_id=app.assigned_interviewer_id,
                assigned_interviewer_name=app.assigned_interviewer_name,
                offer_approved=app.offer_approved,
                updated_at=app.updated_at or app.created_at,
            )
        )

    return cards


@router.get("/queue", response_model=List[ActionQueueItem])
async def get_action_queue_endpoint(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_any_authenticated),
):
    """
    Get Action Queue: Pending applications waiting for action based on current user role:
    - Recruiter: applications in recruiter_review or applied
    - Interviewer: applications assigned to interviewer in interview without feedback
    - Hiring Manager: applications in offer waiting for approval, or shortlist in recruiter_review
    """
    query = (
        select(CandidateApplication, Candidate, Job)
        .join(Candidate, CandidateApplication.candidate_id == Candidate.id)
        .join(Job, CandidateApplication.job_id == Job.id)
    )

    if current_user.role == UserRole.INTERVIEWER:
        query = query.where(
            CandidateApplication.assigned_interviewer_id == current_user.id,
            CandidateApplication.stage == ApplicationStage.INTERVIEW,
        )
    elif current_user.role == UserRole.HIRING_MANAGER:
        query = query.where(
            CandidateApplication.stage.in_([
                ApplicationStage.OFFER,
                ApplicationStage.RECRUITER_REVIEW,
                ApplicationStage.INTERVIEW,
            ])
        )
    elif current_user.role in [UserRole.RECRUITER, UserRole.ADMIN]:
        query = query.where(
            CandidateApplication.stage.in_([
                ApplicationStage.APPLIED,
                ApplicationStage.AI_SCREENED,
                ApplicationStage.SCREENED,
                ApplicationStage.RECRUITER_REVIEW,
                ApplicationStage.OFFER,
            ])
        )

    query = query.order_by(desc(CandidateApplication.updated_at)).limit(50)
    res = await db.execute(query)
    rows = res.all()

    items = []
    for app, candidate, job in rows:
        st = normalize_stage(app.stage)
        if st in ["applied", "ai_screened", "screened"]:
            action = "Cần Recruiter đánh giá sơ loại"
        elif st == "recruiter_review":
            action = "Cần quyết định mời phỏng vấn hoặc từ chối"
        elif st == "interview":
            action = "Chờ phỏng vấn và nhập feedback"
        elif st == "offer":
            action = "Chờ duyệt và gửi Offer" if not app.offer_approved else "Đã duyệt Offer, chờ ứng viên phản hồi"
        else:
            action = "Theo dõi tiến độ"

        items.append(
            ActionQueueItem(
                application_id=app.id,
                candidate_id=candidate.id,
                candidate_name=candidate.full_name,
                job_id=job.id,
                job_title=job.title,
                stage=st,
                required_action=action,
                assigned_interviewer_name=app.assigned_interviewer_name,
                overall_score=app.overall_score,
                updated_at=app.updated_at or app.created_at,
            )
        )

    return items


@router.get("/notifications", response_model=List[NotificationItem])
async def get_notifications_endpoint(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List in-app notifications for the current authenticated user."""
    query = (
        select(Notification)
        .where(Notification.user_id == current_user.id)
        .order_by(desc(Notification.created_at))
        .limit(30)
    )
    res = await db.execute(query)
    return list(res.scalars().all())


@router.patch("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark a notification as read."""
    notif = await db.get(Notification, notification_id)
    if notif and notif.user_id == current_user.id:
        notif.is_read = True
        await db.commit()
    return {"status": "success"}
