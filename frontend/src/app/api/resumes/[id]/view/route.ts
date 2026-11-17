import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const resumeId = params?.id;
    if (!resumeId) {
      return NextResponse.json({ error: "Thiếu resumeId" }, { status: 400 });
    }

    const supabase = createClient();

    // 1. Fetch resume record
    const { data: resume, error: resumeErr } = await supabase
      .from("resumes")
      .select("id, file_url, file_name, file_type")
      .eq("id", resumeId)
      .single();

    if (resumeErr || !resume) {
      return NextResponse.json(
        { error: "Không tìm thấy thông tin tệp CV này trong hệ thống." },
        { status: 404 }
      );
    }

    const objectKey = resume.file_url;
    if (!objectKey) {
      return NextResponse.json(
        { error: "Đường dẫn tệp CV không tồn tại." },
        { status: 404 }
      );
    }

    // 2. Generate a secure, short-lived signed URL (15 minutes = 900 seconds)
    const { data: signedData, error: signErr } = await supabase.storage
      .from("resumes")
      .createSignedUrl(objectKey, 900);

    if (signErr || !signedData?.signedUrl) {
      return NextResponse.json(
        {
          error: `Không thể tạo đường dẫn xem CV an toàn: ${signErr?.message || "Lỗi tạo signed URL"}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      signedUrl: signedData.signedUrl,
      fileName: resume.file_name,
      fileType: resume.file_type,
      expiresInSeconds: 900,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Lỗi hệ thống khi tải CV" },
      { status: 500 }
    );
  }
}

