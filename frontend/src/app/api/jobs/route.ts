import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  try {
    const supabase = createClient();

    const { data: jobs, error } = await supabase
      .from("jobs")
      .select("id, title, department, location, status, description, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: `Lỗi truy vấn tin tuyển dụng: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ jobs: jobs || [] });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Không thể tải danh sách tin tuyển dụng" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();

    const { title, department, location, description, status, salary_min, salary_max } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Tiêu đề công việc là bắt buộc." }, { status: 400 });
    }

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
