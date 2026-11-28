import { NextRequest, NextResponse } from "next/server";
import { verifyServerSession, canAccessApplication, generateBlindCode } from "@/lib/auth-guard";
import fs from "fs";
import path from "path";
import crypto from "crypto";

// Path to local outbox preview storage
const OUTBOX_DIR = path.resolve(process.cwd(), "..", "data", "outbox");

function ensureOutboxDir() {
  if (!fs.existsSync(OUTBOX_DIR)) {
    fs.mkdirSync(OUTBOX_DIR, { recursive: true });
  }
}

/**
 * Generate Deterministic Interview Invitation Email Draft
 */
function generateInterviewEmailTemplate({
  candidateName,
  blindCode,
  jobTitle,
  companyName,
  matchedSkills,
}: {
  candidateName: string;
  blindCode: string;
  jobTitle: string;
  companyName: string;
  matchedSkills: string[];
}): { subject: string; body: string } {
  const subject = `Thư mời phỏng vấn vị trí ${jobTitle}`;
  const strengthsText =
    matchedSkills && matchedSkills.length > 0
      ? matchedSkills.slice(0, 2).map((s) => `• Kỹ năng thế mạnh: ${s}`).join("\n")
      : "• Năng lực chuyên môn và kinh nghiệm phù hợp với tiêu chuẩn vị trí.";

  const body = `Kính gửi ${blindCode} (${candidateName}),

Lời đầu tiên, Ban Tuyển dụng ${companyName} xin cảm ơn bạn đã dành thời gian quan tâm và nộp hồ sơ ứng tuyển vị trí ${jobTitle}.

Sau quá trình sàng lọc hồ sơ ban đầu, hội đồng chuyên môn đánh giá cao năng lực và các điểm sáng trong hồ sơ của bạn:
${strengthsText}

Chúng tôi trân trọng kính mời bạn tham gia buổi Phỏng vấn Chuyên môn để cùng trao đổi sâu hơn về kinh nghiệm và định hướng công việc. Thông tin phỏng vấn dự kiến như sau:

- Vị trí ứng tuyển: ${jobTitle}
- Thời gian: [NGÀY GIỜ PHỎNG VẤN]
- Hình thức: [HÌNH THỨC PHỎNG VẤN]
- Địa điểm / Liên kết trực tuyến: [LINK PHỎNG VẤN]

Vui lòng phản hồi email này để xác nhận sự tham gia của bạn hoặc thông báo lại nếu bạn cần sắp xếp một khung giờ thuận tiện hơn.

Chúc bạn có một buổi phỏng vấn thành công!

Trân trọng,
Bộ phận Tuyển dụng ${companyName}`;

  return { subject, body };
}

/**
 * Generate Deterministic Constructive Rejection Email Draft
 */
function generateRejectionEmailTemplate({
  candidateName,
  blindCode,
  jobTitle,
  companyName,
  missingSkills,
}: {
  candidateName: string;
  blindCode: string;
  jobTitle: string;
  companyName: string;
  missingSkills: string[];
}): { subject: string; body: string } {
  const subject = `Cập nhật kết quả ứng tuyển vị trí ${jobTitle}`;
  const missingText =
    missingSkills && missingSkills.length > 0
      ? missingSkills.slice(0, 3).join(", ")
      : "các công nghệ chuyên sâu theo yêu cầu dự án";

  const body = `Kính gửi ${blindCode} (${candidateName}),

Lời đầu tiên, Ban Tuyển dụng ${companyName} xin gửi lời cảm ơn chân thành vì bạn đã dành thời gian và sự quan tâm đến vị trí ${jobTitle}.

Chúng tôi rất trân trọng năng lực và những nỗ lực bạn đã thể hiện trong hồ sơ ứng tuyển. Tuy nhiên, ở giai đoạn hiện tại, dự án đòi hỏi ứng viên phải có kinh nghiệm thực chiến ngay lập tức với các tiêu chuẩn: ${missingText}. Do đó, chúng tôi rất tiếc chưa thể đồng hành cùng bạn ở vị trí này.

Với mong muốn đồng hành và hỗ trợ hành trình sự nghiệp của bạn (Cam kết phản hồi xây dựng):
• Chúng tôi nhận thấy nền tảng của bạn rất có tiềm năng và tư duy nghề nghiệp tốt.
• Nếu bạn tiếp tục trau dồi và bổ sung thêm kinh nghiệm triển khai thực tế với ${missingText}, chúng tôi rất hy vọng sẽ có cơ hội hợp tác cùng bạn trong các đợt tuyển dụng tiếp theo.

Hồ sơ của bạn đã được lưu trữ trong Mạng lưới Nhân tài (Talent Pool) của ${companyName} để ưu tiên liên hệ cho các cơ hội phù hợp hơn trong tương lai.

Chúc bạn luôn gặt hái nhiều thành công trên con đường sự nghiệp!

Trân trọng,
Bộ phận Tuyển dụng ${companyName}`;

  return { subject, body };
}

/**
 * GET /api/outreach/draft?applicationId=...&stage=...
 * Retrieve existing draft or generate a deterministic draft for preview & editing.
 */
export async function GET(request: NextRequest) {
  try {
    const { supabase, auth } = await verifyServerSession(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: "Yêu cầu đăng nhập." }, { status: 401 });
    }

    if (auth.role === "candidate") {
      return NextResponse.json(
        { error: "Ứng viên không có quyền truy cập chức năng soạn thư tuyển dụng." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get("applicationId");
    const stage = searchParams.get("stage") || "interview";

    // If no applicationId is provided, list all drafts for the recruiter's company (for /outbox page)
    if (!applicationId) {
      const { data: drafts, error: draftsErr } = await supabase
        .from("email_outbox")
        .select(`
          id,
          company_id,
          application_id,
          candidate_id,
          blind_code,
          stage,
          email_type,
          subject,
          body,
          metadata,
          status,
          created_at,
          updated_at,
          applications (
            id,
            current_stage,
            jobs (
              id,
              title,
              department
            ),
            candidates (
              id,
              full_name,
              email
            )
          )
        `)
        .order("updated_at", { ascending: false });

      if (draftsErr) {
        return NextResponse.json({ error: draftsErr.message, drafts: [] }, { status: 500 });
      }

      return NextResponse.json({ drafts: drafts || [] });
    }

    // Company isolation & ownership check
    const accessCheck = await canAccessApplication(supabase, auth, applicationId);
    if (!accessCheck.allowed) {
      return NextResponse.json(
        { error: accessCheck.reason || "Bạn không có quyền truy cập hồ sơ này." },
        { status: 403 }
      );
    }

    // Fetch application details from DB
    const { data: app, error: appErr } = await supabase
      .from("applications")
      .select(`
        id,
        candidate_id,
        job_id,
        current_stage,
        jobs (
          id,
          title,
          department,
          company_id,
          companies (
            id,
            name
          )
        ),
        candidates (
          id,
          full_name,
          email,
          phone
        )
      `)
      .eq("id", applicationId)
      .maybeSingle();

    if (appErr || !app) {
      return NextResponse.json({ error: "Không tìm thấy hồ sơ ứng tuyển." }, { status: 404 });
    }

    const jobTitle = (app.jobs as any)?.title || "Vị trí tuyển dụng";
    const companyName = (app.jobs as any)?.companies?.name || "TalentScout ATS";
    const candidateName = (app.candidates as any)?.full_name || "Ứng viên";
    const blindCode = generateBlindCode(app.candidate_id);

    // Fetch AI match results for evidence-backed skills
    const { data: matchRecords } = await supabase
      .from("match_results")
      .select("skills_score, total_score, recommendation, created_at")
      .eq("application_id", applicationId)
      .order("created_at", { ascending: false })
      .limit(1);

    const match = matchRecords && matchRecords.length > 0 ? matchRecords[0] : null;
    const matchScore = match ? Math.round(match.skills_score) : null;
    const recommendation = match?.recommendation || null;

    // Fetch job skills criteria for matched/missing extraction
    const { data: jobSkills } = await supabase
      .from("job_skills")
      .select("skill_id, is_required, skills(name)")
      .eq("job_id", app.job_id);

    const requiredSkills: string[] = [];
    const optionalSkills: string[] = [];
    if (jobSkills) {
      for (const js of jobSkills) {
        const skillName = (js.skills as any)?.name;
        if (skillName) {
          if (js.is_required) requiredSkills.push(skillName);
          else optionalSkills.push(skillName);
        }
      }
    }

    // Default skills heuristic if no complex snapshot
    const matchedSkills = requiredSkills.slice(0, 2);
    const missingSkills = optionalSkills.length > 0 ? optionalSkills.slice(0, 2) : ["Cloud Deployment", "Microservices"];

    // 1. Check if an active draft exists in Supabase public.email_outbox (Primary Source of Truth)
    let draftContent = { subject: "", body: "" };
    let isExisting = false;
    let savedAt: string | null = null;
    let existingDraftId: string | null = null;

    const { data: dbDraft, error: dbDraftErr } = await supabase
      .from("email_outbox")
      .select("id, subject, body, status, metadata, created_at, updated_at")
      .eq("application_id", applicationId)
      .eq("stage", stage)
      .eq("status", "draft")
      .maybeSingle();

    if (dbDraft && !dbDraftErr) {
      draftContent = {
        subject: dbDraft.subject || "",
        body: dbDraft.body || "",
      };
      isExisting = true;
      savedAt = dbDraft.updated_at || dbDraft.created_at || null;
      existingDraftId = dbDraft.id;
    }

    if (!isExisting) {
      if (stage === "rejected") {
        draftContent = generateRejectionEmailTemplate({
          candidateName,
          blindCode,
          jobTitle,
          companyName,
          missingSkills,
        });
      } else {
        draftContent = generateInterviewEmailTemplate({
          candidateName,
          blindCode,
          jobTitle,
          companyName,
          matchedSkills,
        });
      }
    }

    return NextResponse.json({
      applicationId,
      stage,
      jobTitle,
      companyName,
      candidateName,
      blindCode,
      recipientEmail: (app.candidates as any)?.email || "",
      matchScore,
      recommendation,
      matchedSkills,
      missingSkills,
      isExisting,
      savedAt,
      draftId: existingDraftId,
      draft: draftContent,
    });
  } catch (err: any) {
    console.error("Lỗi lấy thông tin email draft:", err);
    return NextResponse.json(
      { error: err?.message || "Lỗi máy chủ khi lấy bản thảo email." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/outreach/draft
 * Save an email draft into the local outbox.
 * STRICT: Does NOT send live emails. Saves JSON & HTML previews to data/outbox/.
 */
export async function POST(request: NextRequest) {
  try {
    const { supabase, auth } = await verifyServerSession(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: "Yêu cầu đăng nhập." }, { status: 401 });
    }

    if (auth.role === "candidate") {
      return NextResponse.json(
        { error: "Ứng viên không có quyền lưu bản thảo thư tuyển dụng." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { applicationId, stage, subject, body: emailBody, metadata = {} } = body;

    if (!applicationId || !stage || !subject?.trim() || !emailBody?.trim()) {
      return NextResponse.json(
        { error: "Vui lòng cung cấp đầy đủ: applicationId, stage, subject và body." },
        { status: 400 }
      );
    }

    if (!["interview", "rejected"].includes(stage)) {
      return NextResponse.json(
        { error: "Stage không hợp lệ cho chế độ soạn thư (chỉ chấp nhận 'interview' hoặc 'rejected')." },
        { status: 400 }
      );
    }

    // Company isolation & ownership check
    const accessCheck = await canAccessApplication(supabase, auth, applicationId);
    if (!accessCheck.allowed) {
      return NextResponse.json(
        { error: accessCheck.reason || "Bạn không có quyền truy cập hồ sơ này." },
        { status: 403 }
      );
    }

    // Fetch authoritative application, job, and candidate data from DB
    // Client-supplied candidate_id / job_id are NEVER trusted
    const { data: app, error: appErr } = await supabase
      .from("applications")
      .select(`
        id,
        candidate_id,
        job_id,
        current_stage,
        jobs (
          id,
          title,
          company_id,
          companies (
            id,
            name
          )
        ),
        candidates (
          id,
          full_name,
          email
        )
      `)
      .eq("id", applicationId)
      .maybeSingle();

    if (appErr || !app) {
      return NextResponse.json({ error: "Không tìm thấy hồ sơ ứng tuyển hợp lệ." }, { status: 404 });
    }

    const companyId = (app.jobs as any)?.company_id;
    if (!companyId) {
      return NextResponse.json({ error: "Không xác định được công ty chủ quản của vị trí tuyển dụng." }, { status: 400 });
    }

    const blindCode = generateBlindCode(app.candidate_id);
    const emailType = stage === "interview" ? "interview_invitation" : "rejection";
    const whetherStageChanged = app.current_stage !== stage;

    // 1. Kiểm tra xem đã có active draft (status = 'draft') cho cặp application_id + stage này chưa
    const { data: existingDraft, error: queryErr } = await supabase
      .from("email_outbox")
      .select("id, status, created_at, updated_at")
      .eq("application_id", applicationId)
      .eq("stage", stage)
      .eq("status", "draft")
      .maybeSingle();

    if (queryErr) {
      console.error("Lỗi kiểm tra email_outbox:", queryErr);
      throw new Error(`Lỗi kiểm tra bản thảo hiện có: ${queryErr.message}`);
    }

    let savedDraftRecord: any = null;
    let isUpdated = false;

    if (existingDraft) {
      // 2a. ĐÃ CÓ draft active -> UPDATE subject, body, metadata (KHÔNG INSERT mới, tránh lỗi duplicate 23505)
      isUpdated = true;
      const { data: updated, error: updateErr } = await supabase
        .from("email_outbox")
        .update({
          subject: subject.trim(),
          body: emailBody.trim(),
          metadata: {
            ...metadata,
            updated_by: auth.userId || null,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingDraft.id)
        .select("id, status, created_at, updated_at")
        .single();

      if (updateErr) {
        console.error("Lỗi cập nhật email_outbox:", updateErr);
        throw new Error(`Lỗi cập nhật bản thảo email: ${updateErr.message}`);
      }
      savedDraftRecord = updated;
    } else {
      // 2b. CHƯA CÓ draft active -> INSERT bản ghi mới vào public.email_outbox
      isUpdated = false;
      const { data: inserted, error: insertErr } = await supabase
        .from("email_outbox")
        .insert({
          company_id: companyId,
          application_id: applicationId,
          candidate_id: app.candidate_id,
          blind_code: blindCode,
          stage: stage,
          email_type: emailType,
          subject: subject.trim(),
          body: emailBody.trim(),
          status: "draft",
          metadata: {
            ...metadata,
            created_by: auth.userId || null,
          },
          created_by: auth.userId || null,
        })
        .select("id, status, created_at, updated_at")
        .single();

      if (insertErr) {
        console.error("Lỗi thêm mới email_outbox:", insertErr);
        throw new Error(`Lỗi lưu bản thảo email vào cơ sở dữ liệu: ${insertErr.message}`);
      }
      savedDraftRecord = inserted;
    }

    return NextResponse.json({
      success: true,
      message: isUpdated
        ? "Đã cập nhật nội dung bản thảo email thành công."
        : "Đã lưu bản thảo email mới vào Outbox thành công.",
      draftId: savedDraftRecord?.id,
      status: "draft",
      whetherStageChanged,
      isUpdated,
      draft: {
        id: savedDraftRecord?.id,
        applicationId,
        stage,
        subject: subject.trim(),
        blindCode,
        status: "draft",
        is_sent: false,
        savedAt: savedDraftRecord?.updated_at || savedDraftRecord?.created_at,
      },
    });
  } catch (err: any) {
    console.error("Lỗi lưu bản thảo email vào outbox:", err);
    return NextResponse.json(
      { error: err?.message || "Lỗi máy chủ khi lưu bản thảo email." },
      { status: 500 }
    );
  }
}
