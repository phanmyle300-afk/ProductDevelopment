import { NextRequest, NextResponse } from "next/server";
import { verifyServerSession, getUserCompanyIds, generateBlindCode } from "@/lib/auth-guard";

export async function GET(request: NextRequest) {
  try {
    const { supabase, auth } = await verifyServerSession(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: "Yêu cầu đăng nhập." }, { status: 401 });
    }

    if (auth.role === "candidate") {
      return NextResponse.json({ error: "Ứng viên không có quyền truy cập danh sách ứng viên." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");
    const q = searchParams.get("q");

    // Recruiter company isolation
    const companyIds = await getUserCompanyIds(supabase, auth.userId);

    // 1. Fetch applications
    let query = supabase
      .from("applications")
      .select("id, candidate_id, job_id, resume_id, current_stage, jobs(id, company_id)");

    if (jobId && jobId !== "all") {
      query = query.eq("job_id", jobId);
    }

    const { data: rawApps, error: appErr } = await query;

    if (appErr) {
      return NextResponse.json(
        { error: `Lỗi truy vấn hồ sơ ứng tuyển: ${appErr.message}` },
        { status: 500 }
      );
    }

    if (!rawApps || rawApps.length === 0) {
      return NextResponse.json({ candidates: [] });
    }

    // Filter strictly by company_id if recruiter belongs to companies
    const applications = companyIds.length > 0
      ? rawApps.filter((a: any) => a.jobs?.company_id && companyIds.includes(a.jobs.company_id))
      : rawApps;

    // 2. Fetch related candidates, resumes, jobs, and AI match results in bulk
    const candidateIds = Array.from(new Set(applications.map((a) => a.candidate_id).filter(Boolean)));
    const resumeIds = Array.from(new Set(applications.map((a) => a.resume_id).filter(Boolean)));
    const jobIds = Array.from(new Set(applications.map((a) => a.job_id).filter(Boolean)));
    const applicationIds = Array.from(new Set(applications.map((a) => a.id).filter(Boolean)));

    const [candRes, resumeRes, jobRes, matchRes, allCandResumesRes] = await Promise.all([
      candidateIds.length > 0
        ? supabase.from("candidates").select("id, full_name, email, phone, location, created_at").in("id", candidateIds)
        : Promise.resolve({ data: [] }),
      resumeIds.length > 0
        ? supabase.from("resumes").select("id, file_name, file_size, file_type, parse_status, file_url").in("id", resumeIds)
        : Promise.resolve({ data: [] }),
      jobIds.length > 0
        ? supabase.from("jobs").select("id, title, department").in("id", jobIds)
        : Promise.resolve({ data: [] }),
      applicationIds.length > 0
        ? supabase.from("match_results").select("application_id, skills_score, total_score, recommendation, created_at").in("application_id", applicationIds).order("created_at", { ascending: false })
        : Promise.resolve({ data: [] }),
      candidateIds.length > 0
        ? supabase.from("resumes").select("id, candidate_id, file_name, file_size, file_type, parse_status, file_url").in("candidate_id", candidateIds)
        : Promise.resolve({ data: [] }),
    ]);

    const candMap = new Map((candRes.data || []).map((c: any) => [c.id, c]));
    const resumeMap = new Map((resumeRes.data || []).map((r: any) => [r.id, r]));
    const jobMap = new Map((jobRes.data || []).map((j: any) => [j.id, j]));

    const matchMap = new Map();
    for (const m of (matchRes.data || [])) {
      if (!matchMap.has(m.application_id)) {
        matchMap.set(m.application_id, m);
      }
    }

    const candidateParsedResumeMap = new Map();
    for (const r of (allCandResumesRes.data || [])) {
      if (r.parse_status === "parsed" && !candidateParsedResumeMap.has(r.candidate_id)) {
        candidateParsedResumeMap.set(r.candidate_id, r);
      }
    }

    // 3. Assemble response items
    const candidates = applications.map((app) => {
      const cand: any = candMap.get(app.candidate_id) || {};
      const job: any = jobMap.get(app.job_id) || {};

      let resume: any = resumeMap.get(app.resume_id);
      if (!resume || resume.parse_status !== "parsed") {
        const alt = candidateParsedResumeMap.get(app.candidate_id);
        if (alt) resume = alt;
      }
      resume = resume || {};

      const match = matchMap.get(app.id);
      let matchScore: number | null = null;
      let recommendation: string | null = null;

      if (match && typeof match.skills_score === "number") {
        matchScore = Math.round(match.skills_score);
        recommendation = match.recommendation;
      }

      let parseStatusLabel = "Chưa xử lý";
      if (resume.parse_status === "parsing") parseStatusLabel = "Đang bóc tách CV";
      else if (resume.parse_status === "parsed") parseStatusLabel = "Đã bóc tách";
      else if (resume.parse_status === "failed") parseStatusLabel = "Bóc tách thất bại";
      else if (resume.parse_status === "uploaded") parseStatusLabel = "Chưa xử lý";

      return {
        applicationId: app.id,
        candidateId: app.candidate_id,
        blindCode: generateBlindCode(app.candidate_id),
        name: cand.full_name || "Ứng viên chưa đặt tên",
        email: cand.email || "",
        phone: cand.phone || "",
        location: cand.location || "Chưa cập nhật",
        jobId: app.job_id,
        jobTitle: job.title || "Vị trí không xác định",
        department: job.department || "",
        currentStage: app.current_stage || "applied",
        parseStatus: resume.parse_status || "uploaded",
        parseStatusLabel: parseStatusLabel,
        matchScore,
        recommendation,
        aiScreeningStatus: matchScore !== null ? `${matchScore}%` : "Chưa sàng lọc",
        resumeId: resume.id || app.resume_id,
        resumeFileName: resume.file_name || "",
        resumeFileSize: resume.file_size ? `${(resume.file_size / (1024 * 1024)).toFixed(1)} MB` : "",
        createdAt: cand.created_at || new Date().toISOString(),
      };
    });

    // 4. In-memory filter by search keyword if requested
    const filtered = q
      ? candidates.filter(
          (c) =>
            c.name.toLowerCase().includes(q.toLowerCase()) ||
            c.email.toLowerCase().includes(q.toLowerCase()) ||
            c.jobTitle.toLowerCase().includes(q.toLowerCase())
        )
      : candidates;

    return NextResponse.json({ candidates: filtered });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Không thể tải danh sách ứng viên" },
      { status: 500 }
    );
  }
}

