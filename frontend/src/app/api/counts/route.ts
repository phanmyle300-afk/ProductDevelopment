import { NextRequest, NextResponse } from "next/server";
import { verifyServerSession } from "@/lib/auth-guard";

export async function GET(req: NextRequest) {
  try {
    const { supabase, auth } = await verifyServerSession(req);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: "Yêu cầu đăng nhập." }, { status: 401 });
    }

    if (auth.role === "candidate") {
      return NextResponse.json(
        { error: "Ứng viên không có quyền truy cập số liệu nội bộ." },
        { status: 403 }
      );
    }

    const [jobsRes, candRes, intRes, draftsRes] = await Promise.all([
      supabase.from("jobs").select("*", { count: "exact", head: true }),
      supabase.from("candidates").select("*", { count: "exact", head: true }),
      supabase
        .from("applications")
        .select("*", { count: "exact", head: true })
        .eq("current_stage", "interview"),
      supabase
        .from("email_outbox")
        .select("*", { count: "exact", head: true })
        .eq("status", "draft"),
    ]);

    return NextResponse.json({
      jobs: jobsRes.count || 0,
      candidates: candRes.count || 0,
      interviews: intRes.count || 0,
      drafts: draftsRes?.count || 0,
    });
  } catch (err: any) {
    return NextResponse.json(
      { jobs: 0, candidates: 0, interviews: 0, error: err?.message },
      { status: 500 }
    );
  }
}

