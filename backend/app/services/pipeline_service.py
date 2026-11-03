import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Set, Tuple
from fastapi import HTTPException, status
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import cache_service
from app.core.logging import logger
from app.models.application import (
    ApplicationNote,
    ApplicationStage,
    ApplicationStageHistory,
    AuditLog,
    CandidateApplication,
    InterviewFeedback,
    Notification,
)
from app.models.user import User, UserRole

# State Machine Transition Rules
VALID_TRANSITIONS: Dict[str, Set[str]] = {
    ApplicationStage.APPLIED.value: {
        ApplicationStage.AI_SCREENED.value,
        ApplicationStage.SCREENED.value,
        ApplicationStage.RECRUITER_REVIEW.value,
        ApplicationStage.REJECTED.value,
        ApplicationStage.WITHDRAWN.value,
    },
    ApplicationStage.AI_SCREENED.value: {
        ApplicationStage.RECRUITER_REVIEW.value,
        ApplicationStage.INTERVIEW.value,
        ApplicationStage.REJECTED.value,
        ApplicationStage.WITHDRAWN.value,
    },
    ApplicationStage.SCREENED.value: {
        ApplicationStage.RECRUITER_REVIEW.value,
        ApplicationStage.INTERVIEW.value,
        ApplicationStage.REJECTED.value,
        ApplicationStage.WITHDRAWN.value,
    },
    ApplicationStage.RECRUITER_REVIEW.value: {
        ApplicationStage.INTERVIEW.value,
        ApplicationStage.OFFER.value,
        ApplicationStage.REJECTED.value,
        ApplicationStage.WITHDRAWN.value,
        ApplicationStage.AI_SCREENED.value,
    },
    ApplicationStage.INTERVIEW.value: {
        ApplicationStage.OFFER.value,
        ApplicationStage.RECRUITER_REVIEW.value,
        ApplicationStage.REJECTED.value,
        ApplicationStage.WITHDRAWN.value,
    },
    ApplicationStage.OFFER.value: {
        ApplicationStage.HIRED.value,
        ApplicationStage.INTERVIEW.value,
        ApplicationStage.REJECTED.value,
        ApplicationStage.WITHDRAWN.value,
    },
    ApplicationStage.HIRED.value: set(),  # Terminal state
    ApplicationStage.REJECTED.value: {
        ApplicationStage.APPLIED.value,
        ApplicationStage.RECRUITER_REVIEW.value,
    },  # Only Admin / Recruiter can reopen
    ApplicationStage.WITHDRAWN.value: {
        ApplicationStage.APPLIED.value,
        ApplicationStage.RECRUITER_REVIEW.value,
    },
}


def normalize_stage(stage_val: Any) -> str:
    """Normalize enum or string value to string stage name."""
    if hasattr(stage_val, "value"):
        return str(stage_val.value)
    return str(stage_val)


def check_transition_permission(actor: User, from_stage: str, to_stage: str, application: CandidateApplication) -> None:
    """Validate that the actor has permission to perform this state transition."""
    # Read-only users cannot transition states
    if actor.role == UserRole.READ_ONLY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tài khoản Read-Only chỉ có quyền xem, không được phép thay đổi trạng thái ứng viên.",
        )

    # Interviewer can only submit feedback or move candidate to interview review; cannot make offers or hire
    if actor.role == UserRole.INTERVIEWER:
        if to_stage in [ApplicationStage.OFFER.value, ApplicationStage.HIRED.value]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Interviewer không có quyền gửi Offer hoặc Tuyển dụng ứng viên.",
            )
        # Interviewer can only touch assigned candidates
        if application.assigned_interviewer_id != actor.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Interviewer chỉ có quyền thao tác trên ứng viên được phân công cho mình.",
            )

    # Hiring manager can approve offer or hire, reject, or interview
    # Reopening rejected/withdrawn requires Recruiter or Admin
    if from_stage in [ApplicationStage.REJECTED.value, ApplicationStage.WITHDRAWN.value]:
        if actor.role not in [UserRole.ADMIN, UserRole.RECRUITER]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Chỉ Recruiter hoặc Admin mới có quyền mở lại hồ sơ đã từ chối/rút.",
            )

    # Transitioning to HIRED requires offer approval if offer is in place
    if to_stage == ApplicationStage.HIRED.value:
        if not application.offer_approved and actor.role not in [UserRole.ADMIN, UserRole.HIRING_MANAGER]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Chuyển sang 'Hired' yêu cầu Offer phải được phê duyệt trước bởi Hiring Manager hoặc Admin.",
            )


async def transition_application_stage(
    db: AsyncSession,
    application_id: uuid.UUID,
    to_stage_str: str,
    actor: User,
    reason: str,
    notes: Optional[str] = None,
) -> Tuple[CandidateApplication, ApplicationStageHistory]:
    """
    Execute a state machine transition with validation, transaction safety,
    audit trail, and notification generation.
    """
    if not reason or len(reason.strip()) < 5:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Lý do thay đổi trạng thái là bắt buộc và phải có ít nhất 5 ký tự.",
        )

    clean_reason = reason.strip()

    # 1. Fetch application
    app = await db.get(CandidateApplication, application_id)
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Đơn ứng tuyển không tồn tại.")

    current_stage_str = normalize_stage(app.stage)
    target_stage_str = to_stage_str.lower().strip()

    # Handle alias: screened -> ai_screened
    if target_stage_str == "screened":
        target_stage_str = ApplicationStage.AI_SCREENED.value

    # Check terminal state
    if current_stage_str == ApplicationStage.HIRED.value and target_stage_str != ApplicationStage.HIRED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ứng viên đã ở trạng thái HIRED (đã tuyển dụng thành công), không thể chuyển trạng thái khác.",
        )

    # Validate state transition machine
    allowed_targets = VALID_TRANSITIONS.get(current_stage_str, set())
    if target_stage_str != current_stage_str and target_stage_str not in allowed_targets:
        allowed_list = ", ".join(allowed_targets) or "Không có (Trạng thái kết thúc)"
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Chuyển đổi trạng thái không hợp lệ: từ '{current_stage_str}' sang '{target_stage_str}'. Các trạng thái hợp lệ tiếp theo: [{allowed_list}].",
        )

    # 2. Check RBAC permissions for this transition
    check_transition_permission(actor, current_stage_str, target_stage_str, app)

    # 3. Apply state changes
    app.stage = ApplicationStage(target_stage_str)
    now = datetime.now(timezone.utc)

    if target_stage_str == ApplicationStage.REJECTED.value:
        app.rejection_reason = clean_reason
    elif target_stage_str == ApplicationStage.WITHDRAWN.value:
        app.withdrawal_reason = clean_reason

    # 4. Create immutable stage history record
    history = ApplicationStageHistory(
        application_id=app.id,
        from_stage=current_stage_str,
        to_stage=target_stage_str,
        actor_id=actor.id,
        actor_name=actor.full_name,
        actor_role=actor.role.value if hasattr(actor.role, "value") else str(actor.role),
        reason=clean_reason,
        notes=notes.strip() if notes else None,
        created_at=now,
    )
    db.add(history)

    # 5. Create immutable audit log
    audit = AuditLog(
        event_id=f"evt_{uuid.uuid4().hex[:12]}",
        action="STAGE_CHANGE",
        candidate_id=app.candidate_id,
        job_id=app.job_id,
        from_stage=current_stage_str,
        to_stage=target_stage_str,
        changed_by=actor.email,
        note=f"State machine transition: {current_stage_str} -> {target_stage_str}. Reason: {clean_reason}",
    )
    db.add(audit)

    # 6. Create in-app notifications
    if target_stage_str == ApplicationStage.INTERVIEW.value and app.assigned_interviewer_id:
        notif = Notification(
            user_id=app.assigned_interviewer_id,
            title="Ứng viên mới chuyển sang vòng phỏng vấn",
            message=f"Ứng viên đã được chuyển sang vòng Phỏng vấn. Vui lòng sắp xếp lịch và gửi đánh giá.",
            type="interview_assigned",
            link=f"/candidates/{app.candidate_id}",
        )
        db.add(notif)
    elif target_stage_str == ApplicationStage.OFFER.value and app.hiring_manager_id:
        notif = Notification(
            user_id=app.hiring_manager_id,
            title="Đề nghị duyệt Offer mới",
            message=f"Ứng viên đã vào giai đoạn Offer, đang chờ Hiring Manager phê duyệt.",
            type="offer_pending_approval",
            link=f"/candidates/{app.candidate_id}",
        )
        db.add(notif)

    await db.commit()
    await db.refresh(app)
    await db.refresh(history)

    # Invalidate cached analytics reports
    try:
        await cache_service.clear_prefix("analytics:")
    except Exception as e:
        logger.warning("Failed to invalidate analytics cache: %s", e)

    return app, history


async def assign_interviewer(
    db: AsyncSession,
    application_id: uuid.UUID,
    interviewer_id: uuid.UUID,
    interviewer_name: str,
    actor: User,
) -> CandidateApplication:
    """Assign interviewer to a candidate application."""
    if actor.role not in [UserRole.ADMIN, UserRole.RECRUITER, UserRole.HIRING_MANAGER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chỉ Admin, Recruiter hoặc Hiring Manager mới có quyền phân công người phỏng vấn.",
        )

    app = await db.get(CandidateApplication, application_id)
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Đơn ứng tuyển không tồn tại.")

    app.assigned_interviewer_id = interviewer_id
    app.assigned_interviewer_name = interviewer_name

    # In-app notification
    notif = Notification(
        user_id=interviewer_id,
        title="Bạn được phân công phỏng vấn ứng viên mới",
        message=f"{actor.full_name} đã phân công bạn làm người phỏng vấn cho hồ sơ này.",
        type="interview_assigned",
        link=f"/candidates/{app.candidate_id}",
    )
    db.add(notif)

    # Audit log
    audit = AuditLog(
        event_id=f"evt_{uuid.uuid4().hex[:12]}",
        action="MANUAL_EDIT",
        candidate_id=app.candidate_id,
        job_id=app.job_id,
        changed_by=actor.email,
        note=f"Assigned interviewer {interviewer_name} ({interviewer_id})",
    )
    db.add(audit)

    await db.commit()
    await db.refresh(app)
    return app


async def submit_interview_feedback(
    db: AsyncSession,
    application_id: uuid.UUID,
    actor: User,
    rating: int,
    recommendation: str,
    notes: str,
    technical_score: Optional[float] = None,
    cultural_score: Optional[float] = None,
    strengths: Optional[str] = None,
    weaknesses: Optional[str] = None,
) -> InterviewFeedback:
    """Submit interview evaluation and feedback."""
    if actor.role == UserRole.READ_ONLY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tài khoản Read-Only không được phép gửi đánh giá phỏng vấn.",
        )

    app = await db.get(CandidateApplication, application_id)
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Đơn ứng tuyển không tồn tại.")

    # Interviewer isolation check: must be assigned interviewer
    if actor.role == UserRole.INTERVIEWER and app.assigned_interviewer_id != actor.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn chỉ được phép gửi phản hồi cho ứng viên được phân công phỏng vấn.",
        )

    if rating < 1 or rating > 5:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Đánh giá rating từ 1 đến 5 sao.")

    clean_rec = recommendation.lower().strip()
    valid_recs = ["strong_hire", "hire", "no_hire", "strong_no_hire"]
    if clean_rec not in valid_recs:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Khuyến nghị không hợp lệ. Chọn một trong: {', '.join(valid_recs)}",
        )

    feedback = InterviewFeedback(
        application_id=app.id,
        interviewer_id=actor.id,
        interviewer_name=actor.full_name,
        rating=rating,
        technical_score=technical_score,
        cultural_score=cultural_score,
        recommendation=clean_rec,
        strengths=strengths,
        weaknesses=weaknesses,
        notes=notes,
        created_at=datetime.now(timezone.utc),
    )
    db.add(feedback)

    # Audit log
    audit = AuditLog(
        event_id=f"evt_{uuid.uuid4().hex[:12]}",
        action="MANUAL_EDIT",
        candidate_id=app.candidate_id,
        job_id=app.job_id,
        changed_by=actor.email,
        note=f"Submitted interview feedback: {clean_rec} ({rating}/5)",
    )
    db.add(audit)

    await db.commit()
    await db.refresh(feedback)
    return feedback


async def approve_offer(
    db: AsyncSession,
    application_id: uuid.UUID,
    actor: User,
    offer_details: Optional[dict] = None,
) -> CandidateApplication:
    """Hiring manager or Admin approves the offer for a candidate."""
    if actor.role not in [UserRole.ADMIN, UserRole.HIRING_MANAGER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chỉ Hiring Manager hoặc Admin mới có quyền phê duyệt Offer.",
        )

    app = await db.get(CandidateApplication, application_id)
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Đơn ứng tuyển không tồn tại.")

    now = datetime.now(timezone.utc)
    app.offer_approved = True
    app.offer_approved_by = actor.id
    app.offer_approved_at = now
    if offer_details:
        app.offer_details = offer_details

    # Audit log
    audit = AuditLog(
        event_id=f"evt_{uuid.uuid4().hex[:12]}",
        action="OFFER_APPROVAL",
        candidate_id=app.candidate_id,
        job_id=app.job_id,
        changed_by=actor.email,
        note=f"Offer approved by Hiring Manager {actor.full_name} ({actor.email})",
    )
    db.add(audit)

    await db.commit()
    await db.refresh(app)
    return app


async def add_application_note(
    db: AsyncSession,
    application_id: uuid.UUID,
    actor: User,
    content: str,
) -> ApplicationNote:
    """Add a collaborative note to candidate application."""
    if actor.role == UserRole.READ_ONLY:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tài khoản Read-Only không thể thêm ghi chú.")

    app = await db.get(CandidateApplication, application_id)
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Đơn ứng tuyển không tồn tại.")

    note = ApplicationNote(
        application_id=app.id,
        author_id=actor.id,
        author_name=actor.full_name,
        content=content.strip(),
        created_at=datetime.now(timezone.utc),
    )
    db.add(note)
    await db.commit()
    await db.refresh(note)
    return note


async def update_application_tags(
    db: AsyncSession,
    application_id: uuid.UUID,
    actor: User,
    tags: List[str],
) -> CandidateApplication:
    """Update candidate tags (e.g. urgent, senior, culture_fit)."""
    if actor.role not in [UserRole.ADMIN, UserRole.RECRUITER, UserRole.HIRING_MANAGER]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Không có quyền cập nhật thẻ tag.")

    app = await db.get(CandidateApplication, application_id)
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Đơn ứng tuyển không tồn tại.")

    app.tags = [t.strip().lower() for t in tags if t.strip()]
    await db.commit()
    await db.refresh(app)
    return app
