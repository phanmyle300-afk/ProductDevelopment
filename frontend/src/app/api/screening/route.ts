import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get("jobId");

    let query = supabase
      .from("match_results")
      .select("*")
      .order("created_at", { ascending: false });

    if (jobId && jobId !== "all") {
      query = query.eq("job_id", jobId);
    }

    const { data: results, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: `Lỗi truy vấn kết quả sàng lọc: ${error.message}`, results: [] },
        { status: 500 }
      );
    }

    if (!results || results.length === 0) {
      return NextResponse.json({ results: [] });
    }

    const candidateIds = Array.from(new Set(results.map((r: any) => r.candidate_id).filter(Boolean)));
    const jobIds = Array.from(new Set(results.map((r: any) => r.job_id).filter(Boolean)));

    const [candRes, jobRes] = await Promise.all([
      candidateIds.length > 0
        ? supabase.from("candidates").select("id, full_name, email, phone").in("id", candidateIds)
        : Promise.resolve({ data: [] }),
      jobIds.length > 0
        ? supabase.from("jobs").select("id, title, department").in("id", jobIds)
        : Promise.resolve({ data: [] }),
    ]);

    const candMap = new Map((candRes.data || []).map((c: any) => [c.id, c]));
    const jobMap = new Map((jobRes.data || []).map((j: any) => [j.id, j]));

    const formatted = results.map((item: any) => ({
      ...item,
      candidates: candMap.get(item.candidate_id) || null,
      jobs: jobMap.get(item.job_id) || null,
    }));

    return NextResponse.json({ results: formatted });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Lỗi truy vấn kết quả sàng lọc", results: [] },
      { status: 500 }
    );
  }
}
