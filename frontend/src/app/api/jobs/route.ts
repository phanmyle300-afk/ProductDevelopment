import { NextRequest, NextResponse } from "next/server";
import { verifyServerSession, getUserCompanyIds } from "@/lib/auth-guard";

export async function GET(request: NextRequest) {
  try {
    const { supabase, auth } = await verifyServerSession(request);

    // If caller is an authenticated Recruiter / Admin, return all jobs for their company
    if (auth.isAuthenticated && ["recruiter", "admin", "interviewer", "hiring_manager"].includes(auth.role)) {
      const companyIds = await getUserCompanyIds(supabase, auth.userId);
      let query = supabase
        .from("jobs")
        .select("id, title, department, location, status, description, created_at")
        .order("created_at", { ascending: false });

      if (companyIds.length > 0) {
        query = query.in("company_id", companyIds);
      }

      const { data: jobs, error } = await query;
      if (error) {
        return NextResponse.json(
          { error: `Lỗi truy vấn tin tuyển dụng: ${error.message}` },
          { status: 500 }
        );
      }
      return NextResponse.json({ jobs: jobs || [] });
    }

    // Public / Candidate view: Strictly filter status = 'open' and omit company_id
    const { data: openJobs, error: publicError } = await supabase
      .from("jobs")
      .select("id, title, department, location, status, description, created_at")
      .eq("status", "open")
      .order("created_at", { ascending: false });

    if (publicError) {
      return NextResponse.json(
        { error: `Lỗi truy vấn tin tuyển dụng: ${publicError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ jobs: openJobs || [] });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Không thể tải danh sách tin tuyển dụng" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, auth } = await verifyServerSession(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: "Yêu cầu đăng nhập." }, { status: 401 });
    }

    if (auth.role === "candidate") {
      return NextResponse.json(
        { error: "Ứng viên không có quyền đăng tin tuyển dụng." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, department, location, description, status, salary_min, salary_max, company_id } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Tiêu đề công việc là bắt buộc." }, { status: 400 });
    }

    const companyIds = await getUserCompanyIds(supabase, auth.userId);
    const assignedCompanyId = company_id || (companyIds.length > 0 ? companyIds[0] : null);

    const newJobId = crypto.randomUUID();

    const { data, error } = await supabase
      .from("jobs")
      .insert({
        id: newJobId,
        title: title.trim(),
        department: department?.trim() || "Engineering",
        location: location?.trim() || "Hà Nội (Hybrid)",
        status: status || "open",
        description: description?.trim() || `Tuyển dụng vị trí ${title.trim()}`,
        salary_min: salary_min || null,
        salary_max: salary_max || null,
        company_id: assignedCompanyId,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: `Lỗi tạo tin tuyển dụng: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true, job: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Đã xảy ra lỗi khi tạo tin tuyển dụng." },
      { status: 500 }
    );
  }
}
