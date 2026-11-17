import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  try {
    const supabase = createClient();

    const [jobsRes, candRes, intRes] = await Promise.all([
      supabase.from("jobs").select("*", { count: "exact", head: true }),
      supabase.from("candidates").select("*", { count: "exact", head: true }),
      supabase
        .from("applications")
        .select("*", { count: "exact", head: true })
        .eq("current_stage", "interview"),
    ]);

    return NextResponse.json({
      jobs: jobsRes.count || 0,
      candidates: candRes.count || 0,
      interviews: intRes.count || 0,
    });
  } catch (err: any) {
    return NextResponse.json(
      { jobs: 0, candidates: 0, interviews: 0, error: err?.message },
      { status: 500 }
    );
  }
}

