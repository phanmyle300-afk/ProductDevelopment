import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  try {
    const supabase = createClient();

    const { data: apps, error } = await supabase
      .from("applications")
      .select(`
        id,
        current_stage,
        created_at,
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
          location
        ),
        resumes (
          id,
          file_name,
          file_url,
          parse_status
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message, applications: [] }, { status: 500 });
    }

    return NextResponse.json({ applications: apps || [] });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Lỗi truy vấn ứng dụng", applications: [] },
      { status: 500 }
    );
  }
}

