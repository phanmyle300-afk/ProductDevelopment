import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  try {
    const supabase = createClient();

    // Safe connectivity verification:
    // Check auth session state without querying any application data tables
    // (Zero access to users, candidates, resumes or sensitive PII tables)
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      return NextResponse.json(
        {
          status: "warning",
          message: "Supabase client initialized, auth check returned error",
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: "connected",
      message: "Kết nối Supabase thành công (Chế độ Zero-PII an toàn)",
      projectUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      authInitialized: true,
      hasActiveSession: !!data.session,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        status: "error",
        message: "Không thể khởi tạo kết nối Supabase",
        error: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}

