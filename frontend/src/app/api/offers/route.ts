import { NextRequest, NextResponse } from "next/server";
import { verifyServerSession, getUserCompanyIds, canAccessApplication } from "@/lib/auth-guard";

export async function GET(req: NextRequest) {
  try {
    const { supabase, auth } = await verifyServerSession(req);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: "Yêu cầu đăng nhập." }, { status: 401 });
    }

    let query = supabase.from("offers").select("*").order("created_at", { ascending: false });

    // If candidate, only retrieve offers for their own applications
    if (auth.role === "candidate") {
      const { data: cand } = await supabase
        .from("candidates")
        .select("id")
        .or(`user_id.eq.${auth.userId}${auth.email ? `,email.eq.${auth.email}` : ""}`)
        .maybeSingle();

      if (!cand) {
        return NextResponse.json({ offers: [] });
      }

      const { data: userApps } = await supabase
        .from("applications")
        .select("id")
        .eq("candidate_id", cand.id);

      const appIds = (userApps || []).map((a: any) => a.id);
      if (appIds.length === 0) {
        return NextResponse.json({ offers: [] });
      }

      query = query.in("application_id", appIds);
    }

    const { data: offers, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: `Lỗi truy vấn thư mời nhận việc: ${error.message}`, offers: [] },
        { status: 500 }
      );
    }

    if (!offers || offers.length === 0) {
      return NextResponse.json({ offers: [] });
    }

    // 2. Fetch applications -> candidates & jobs for mapping
    const appIds = Array.from(new Set(offers.map((o: any) => o.application_id).filter(Boolean)));
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
    let filteredOffers = offers;
    if (["recruiter", "interviewer", "hiring_manager"].includes(auth.role)) {
      const companyIds = await getUserCompanyIds(supabase, auth.userId);
      if (companyIds.length > 0) {
        filteredOffers = offers.filter((item: any) => {
          const app = appMap.get(item.application_id);
          const job = app ? jobMap.get(app.job_id) : null;
          return job?.company_id && companyIds.includes(job.company_id);
        });
      }
    }

    const formatted = filteredOffers.map((item: any) => {
      const app = appMap.get(item.application_id);
      return {
        ...item,
        candidate_id: app?.candidate_id || null,
        job_id: app?.job_id || null,
        candidates: app ? candMap.get(app.candidate_id) || null : null,
        jobs: app ? jobMap.get(app.job_id) || null : null,
      };
    });

    return NextResponse.json({ offers: formatted });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Lỗi truy vấn thư mời nhận việc", offers: [] },
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

    // Candidates cannot create offers
    if (auth.role === "candidate") {
      return NextResponse.json(
        { error: "Ứng viên không được phép tạo thư mời nhận việc." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { applicationId, candidateId, jobId, salary, signOnBonus, startDate, status } = body;

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
        { error: accessCheck.reason || "Bạn không có quyền tạo offer cho ứng viên công ty khác." },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
      .from("offers")
      .insert({
        id: crypto.randomUUID(),
        application_id: applicationId,
        status: status || "pending_approval",
        currency: "VND",
        start_date: startDate || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update application stage to 'offer'
    await supabase
      .from("applications")
      .update({ current_stage: "offer" })
      .eq("id", applicationId);

    return NextResponse.json({ success: true, offer: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Lỗi tạo đề nghị việc làm" },
      { status: 500 }
    );
  }
}
