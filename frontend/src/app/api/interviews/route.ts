import { NextRequest, NextResponse } from "next/server";
import { verifyServerSession, getUserCompanyIds, canAccessApplication } from "@/lib/auth-guard";

export async function GET(req: NextRequest) {
  try {
    const { supabase, auth } = await verifyServerSession(req);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: "Yêu cầu đăng nhập." }, { status: 401 });
    }

    // 1. Fetch interviews
    let query = supabase.from("interviews").select("*");

    // If candidate, only retrieve interviews for their own applications
    if (auth.role === "candidate") {
      const { data: cand } = await supabase
        .from("candidates")
        .select("id")
        .or(`user_id.eq.${auth.userId}${auth.email ? `,email.eq.${auth.email}` : ""}`)
        .maybeSingle();

      if (!cand) {
        return NextResponse.json({ interviews: [] });
      }

      const { data: userApps } = await supabase
        .from("applications")
        .select("id")
        .eq("candidate_id", cand.id);

      const appIds = (userApps || []).map((a: any) => a.id);
      if (appIds.length === 0) {
        return NextResponse.json({ interviews: [] });
      }

      query = query.in("application_id", appIds);
    }

    const { data: interviews, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: `Lỗi truy vấn lịch phỏng vấn: ${error.message}`, interviews: [] },
        { status: 500 }
      );
    }

    if (!interviews || interviews.length === 0) {
      return NextResponse.json({ interviews: [] });
    }

    // 2. Fetch applications -> candidates & jobs for mapping
    const appIds = Array.from(new Set(interviews.map((i: any) => i.application_id).filter(Boolean)));
    const { data: appsData } = appIds.length > 0
      ? await supabase.from("applications").select("id, candidate_id, job_id").in("id", appIds)
      : { data: [] };

    const appMap = new Map((appsData || []).map((a: any) => [a.id, a]));
    const candidateIds = Array.from(new Set((appsData || []).map((a: any) => a.candidate_id).filter(Boolean)));
    const jobIds = Array.from(new Set((appsData || []).map((a: any) => a.job_id).filter(Boolean)));

    const [candRes, jobRes] = await Promise.all([
      candidateIds.length > 0
        ? supabase.from("candidates").select("id, full_name, email, phone").in("id", candidateIds)
        : Promise.resolve({ data: [] }),
      jobIds.length > 0
        ? supabase.from("jobs").select("id, title, department, company_id").in("id", jobIds)
        : Promise.resolve({ data: [] }),
    ]);

    const candMap = new Map((candRes.data || []).map((c: any) => [c.id, c]));
    const jobMap = new Map((jobRes.data || []).map((j: any) => [j.id, j]));

    // If recruiter, filter strictly by company_id
    let filteredInterviews = interviews;
    if (["recruiter", "interviewer", "hiring_manager"].includes(auth.role)) {
      const companyIds = await getUserCompanyIds(supabase, auth.userId);
      if (companyIds.length > 0) {
        filteredInterviews = interviews.filter((item: any) => {
          const app = appMap.get(item.application_id);
          const job = app ? jobMap.get(app.job_id) : null;
          return job?.company_id && companyIds.includes(job.company_id);
        });
      }
    }

    const formatted = filteredInterviews.map((item: any) => {
      const app = appMap.get(item.application_id);
      return {
        ...item,
        candidate_id: app?.candidate_id || null,
        job_id: app?.job_id || null,
        candidates: app ? candMap.get(app.candidate_id) || null : null,
        jobs: app ? jobMap.get(app.job_id) || null : null,
      };
    });

    return NextResponse.json({ interviews: formatted });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Lỗi truy vấn lịch phỏng vấn", interviews: [] },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { supabase, auth } = await verifyServerSession(req);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: "Yêu cầu đăng nhập." }, { status: 401 });
    }

    // Candidates cannot create interview appointments
    if (auth.role === "candidate") {
      return NextResponse.json(
        { error: "Ứng viên không được phép tạo lịch phỏng vấn." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { applicationId, candidateId, jobId, interviewerName, scheduledAt, meetingLink, notes } = body;

    if (!applicationId || !candidateId || !jobId) {
      return NextResponse.json(
        { error: "Thiếu thông tin application_id, candidate_id hoặc job_id" },
        { status: 400 }
      );
    }

    // Verify company ownership of this application
    const accessCheck = await canAccessApplication(supabase, auth, applicationId);
    if (!accessCheck.allowed) {
      return NextResponse.json(
        { error: accessCheck.reason || "Bạn không có quyền tạo lịch phỏng vấn cho ứng viên công ty khác." },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
      .from("interviews")
      .insert({
        id: crypto.randomUUID(),
        application_id: applicationId,
        title: `Phỏng vấn - ${interviewerName?.trim() || "Ban Tuyển Dụng"}`,
        status: "scheduled",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update application stage to 'interview'
    await supabase
      .from("applications")
      .update({ current_stage: "interview" })
      .eq("id", applicationId);

    return NextResponse.json({ success: true, interview: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Lỗi tạo lịch phỏng vấn" },
      { status: 500 }
    );
  }
}
