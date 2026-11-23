import { NextRequest, NextResponse } from "next/server";
import { verifyServerSession, getUserCompanyIds, canAccessApplication } from "@/lib/auth-guard";

export async function GET(request: NextRequest) {
  try {
    const { supabase, auth } = await verifyServerSession(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: "Yêu cầu đăng nhập.", applications: [] }, { status: 401 });
    }

    let query = supabase
      .from("applications")
      .select(`
        id,
        current_stage,
        applied_at,
        candidate_id,
        job_id,
        resume_id,
        candidates (
          id,
          full_name,
          email,
          phone,
          location
        ),
        jobs (
          id,
          title,
          department,
          location,
          company_id
        ),
        resumes (
          id,
          file_name,
          file_url,
          parse_status
        )
      `)
      .order("applied_at", { ascending: false });

    // If candidate, filter by candidate_id
    if (auth.role === "candidate") {
      const { data: cand } = await supabase
        .from("candidates")
        .select("id")
        .or(`user_id.eq.${auth.userId}${auth.email ? `,email.eq.${auth.email}` : ""}`)
        .maybeSingle();

      if (!cand) {
        return NextResponse.json({ applications: [] });
      }

      query = query.eq("candidate_id", cand.id);
    }

    const { data: rawApps, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message, applications: [] }, { status: 500 });
    }

    // If recruiter, filter strictly by company_id
    let filteredApps = rawApps || [];
    if (["recruiter", "interviewer", "hiring_manager"].includes(auth.role)) {
      const companyIds = await getUserCompanyIds(supabase, auth.userId);
      if (companyIds.length > 0) {
        filteredApps = filteredApps.filter(
          (a: any) => a.jobs?.company_id && companyIds.includes(a.jobs.company_id)
        );
      }
    }

    // Attach match_results in bulk for the returned applications
    const appIds = filteredApps.map((a: any) => a.id);
    const matchMap = new Map();
    if (appIds.length > 0) {
      const { data: matchData } = await supabase
        .from("match_results")
        .select("application_id, skills_score, total_score, recommendation, created_at")
        .in("application_id", appIds)
        .order("created_at", { ascending: false });

      for (const m of matchData || []) {
        if (!matchMap.has(m.application_id)) {
          matchMap.set(m.application_id, m);
        }
      }
    }

    const assembledApps = filteredApps.map((a: any) => {
      const m = matchMap.get(a.id);
      return {
        ...a,
        matchScore: m && typeof m.skills_score === "number" ? Math.round(m.skills_score) : null,
        recommendation: m?.recommendation || null,
        match_results: m || null,
      };
    });

    return NextResponse.json({ applications: assembledApps });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Lỗi truy vấn ứng dụng", applications: [] },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, auth } = await verifyServerSession(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json(
        { error: "Vui lòng đăng nhập để thực hiện nộp đơn ứng tuyển." },
        { status: 401 }
      );
    }

    if (auth.role !== "candidate") {
      return NextResponse.json(
        { error: "Chỉ tài khoản ứng viên mới có quyền nộp đơn ứng tuyển." },
        { status: 403 }
      );
    }

    // Chỉ tin auth.email và auth.userId từ phiên Supabase Auth/JWT
    if (!auth.userId && !auth.email) {
      return NextResponse.json(
        { error: "Phiên đăng nhập không hợp lệ." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { jobId, resumeId } = body;

    // Nếu auth.email tồn tại và body.email được gửi nhưng không khớp, trả 403
    if (auth.email && body.email && auth.email.trim().toLowerCase() !== body.email.trim().toLowerCase()) {
      return NextResponse.json(
        { error: "Email không khớp với tài khoản đăng nhập." },
        { status: 403 }
      );
    }

    if (!jobId || typeof jobId !== "string") {
      return NextResponse.json(
        { error: "Thiếu mã vị trí tuyển dụng (jobId)." },
        { status: 400 }
      );
    }

    // 1. Kiểm tra vị trí tuyển dụng tồn tại và đang mở nhận hồ sơ
    const { data: job, error: jobErr } = await supabase
      .from("jobs")
      .select("id, title, status")
      .eq("id", jobId)
      .maybeSingle();

    if (jobErr || !job) {
      return NextResponse.json(
        { error: "Không tìm thấy vị trí tuyển dụng tương ứng." },
        { status: 404 }
      );
    }

    // Chuẩn hóa job.status lowercase và trim; chỉ cho phép status thuộc ["open", "active"]
    const normalizedStatus = (job.status || "").toLowerCase().trim();
    if (!["open", "active"].includes(normalizedStatus)) {
      return NextResponse.json(
        { error: "Vị trí tuyển dụng này hiện chưa mở hoặc đã ngừng nhận hồ sơ." },
        { status: 400 }
      );
    }

    // 2. Xác định hồ sơ ứng viên tương ứng với tài khoản đăng nhập
    // Chỉ tin auth.userId và auth.email từ phiên Supabase Auth; không dùng body.email tra cứu khi auth.email tồn tại
    let candidate: any = null;

    if (auth.userId) {
      const { data: candByUserId } = await supabase
        .from("candidates")
        .select("id, full_name, email, user_id")
        .eq("user_id", auth.userId)
        .maybeSingle();
      if (candByUserId) candidate = candByUserId;
    }

    if (!candidate && auth.email) {
      const { data: candByEmail } = await supabase
        .from("candidates")
        .select("id, full_name, email, user_id")
        .eq("email", auth.email.trim().toLowerCase())
        .maybeSingle();
      if (candByEmail) candidate = candByEmail;
    }

    if (!candidate) {
      return NextResponse.json(
        { error: "Chưa tìm thấy hồ sơ ứng viên. Vui lòng hoàn thiện hồ sơ và tải lên CV trước khi nộp đơn." },
        { status: 400 }
      );
    }

    // Tự động liên kết user_id nếu trước đó bản ghi candidate chưa được gắn
    if (!candidate.user_id && auth.userId) {
      await supabase
        .from("candidates")
        .update({ user_id: auth.userId })
        .eq("id", candidate.id);
    }

    // 3. Cơ chế chống trùng lặp (Anti-duplicate application check)
    const { data: existingApp } = await supabase
      .from("applications")
      .select("id, current_stage, applied_at")
      .eq("candidate_id", candidate.id)
      .eq("job_id", jobId)
      .maybeSingle();

    if (existingApp) {
      return NextResponse.json(
        {
          error: "Bạn đã nộp đơn ứng tuyển cho vị trí này rồi. Hệ thống không cho phép tạo hồ sơ trùng lặp.",
          alreadyApplied: true,
          applicationId: existingApp.id,
          appliedAt: existingApp.applied_at,
          currentStage: existingApp.current_stage,
        },
        { status: 409 }
      );
    }

    // 4. Giải quyết CV gắn vào đơn ứng tuyển
    let targetResumeId = resumeId;

    if (targetResumeId) {
      // Xác minh CV được chọn có thuộc về ứng viên này không
      const { data: verifiedResume } = await supabase
        .from("resumes")
        .select("id, file_name, parse_status")
        .eq("id", targetResumeId)
        .eq("candidate_id", candidate.id)
        .maybeSingle();

      if (!verifiedResume) {
        return NextResponse.json(
          { error: "Tệp CV đã chọn không tồn tại hoặc không thuộc hồ sơ của bạn." },
          { status: 400 }
        );
      }
    } else {
      // Lấy CV mặc định mới nhất của ứng viên
      const { data: defaultResume } = await supabase
        .from("resumes")
        .select("id, file_name, parse_status")
        .eq("candidate_id", candidate.id)
        .order("uploaded_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!defaultResume) {
        return NextResponse.json(
          { error: "Hồ sơ của bạn chưa có tệp CV đính kèm. Vui lòng tải lên CV trước khi ứng tuyển." },
          { status: 400 }
        );
      }
      targetResumeId = defaultResume.id;
    }

    // 5. Tạo bản ghi đơn ứng tuyển mới
    const applicationId = crypto.randomUUID();
    const { data: newApp, error: insertErr } = await supabase
      .from("applications")
      .insert({
        id: applicationId,
        candidate_id: candidate.id,
        job_id: jobId,
        resume_id: targetResumeId,
        current_stage: "applied",
      })
      .select(`
        id,
        current_stage,
        applied_at,
        candidate_id,
        job_id,
        resume_id
      `)
      .single();

    if (insertErr) {
      return NextResponse.json(
        { error: `Lỗi ghi nhận đơn ứng tuyển: ${insertErr.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Ứng tuyển thành công! Hồ sơ của bạn đã được chuyển tới nhà tuyển dụng.",
      application: newApp,
      applicationId: newApp.id,
      code: `TSC-${newApp.id.slice(0, 4).toUpperCase()}`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Đã xảy ra lỗi trong quá trình nộp đơn ứng tuyển." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { supabase, auth } = await verifyServerSession(request);
    if (!auth.isAuthenticated || !auth.userId) {
      return NextResponse.json({ error: "Yêu cầu đăng nhập để cập nhật trạng thái hồ sơ." }, { status: 401 });
    }

    if (auth.role === "candidate") {
      return NextResponse.json(
        { error: "Ứng viên không có quyền thay đổi giai đoạn ứng tuyển." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { applicationId, stage } = body;

    if (!applicationId || typeof applicationId !== "string" || !stage || typeof stage !== "string") {
      return NextResponse.json(
        { error: "Thiếu applicationId hoặc stage cần cập nhật." },
        { status: 400 }
      );
    }

    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_REGEX.test(applicationId.trim())) {
      return NextResponse.json(
        { error: "applicationId không đúng định dạng UUID hợp lệ." },
        { status: 400 }
      );
    }

    // Validate stage against allowed application stages and map UI aliases to DB constraint values
    const VALID_STAGES = ["applied", "ai_screened", "screened", "recruiter_review", "review", "interview", "offer", "hired", "rejected", "withdrawn"];
    const normalizedStage = stage.trim().toLowerCase();
    if (!VALID_STAGES.includes(normalizedStage)) {
      return NextResponse.json(
        {
          error: `Giai đoạn tuyển dụng '${stage}' không hợp lệ. Các giá trị cho phép: ${VALID_STAGES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Map UI aliases to exact database check constraint (applications_current_stage_check) values:
    // 'screened' -> 'ai_screened'
    // 'review'   -> 'recruiter_review'
    let dbStage = normalizedStage;
    if (dbStage === "screened") dbStage = "ai_screened";
    if (dbStage === "review") dbStage = "recruiter_review";

    // Company isolation check: verify recruiter belongs to the company owning this application
    const access = await canAccessApplication(supabase, auth, applicationId);
    if (!access.allowed || !access.application) {
      return NextResponse.json(
        { error: access.reason || "Không tìm thấy đơn ứng tuyển hoặc bạn không có quyền sửa đơn ứng tuyển của công ty khác." },
        { status: 403 }
      );
    }

    // Strict Immutability: ONLY update current_stage, NEVER allow overwriting candidate_id, job_id, resume_id
    const { data: updatedApps, error: updateErr } = await supabase
      .from("applications")
      .update({ current_stage: dbStage })
      .eq("id", applicationId)
      .select("id, current_stage, candidate_id, job_id");

    if (updateErr) {
      return NextResponse.json(
        { error: `Lỗi cập nhật giai đoạn tuyển dụng: ${updateErr.message}` },
        { status: 500 }
      );
    }

    if (!updatedApps || updatedApps.length === 0) {
      return NextResponse.json(
        { error: "Không thể cập nhật đơn ứng tuyển (bản ghi không tồn tại hoặc bị từ chối bởi chính sách bảo mật)." },
        { status: 403 }
      );
    }

    const updatedApp = updatedApps[0];

    return NextResponse.json({
      success: true,
      message: `Đã chuyển đơn ứng tuyển sang giai đoạn '${normalizedStage}'.`,
      application: updatedApp,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Lỗi cập nhật giai đoạn tuyển dụng" },
      { status: 500 }
    );
  }
}

