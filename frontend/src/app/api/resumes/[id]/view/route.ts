import { NextRequest, NextResponse } from "next/server";
import { verifyServerSession, canAccessResume } from "@/lib/auth-guard";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const resumeId = params?.id;
    if (!resumeId) {
      return NextResponse.json({ error: "Thiếu resumeId" }, { status: 400 });
    }

    // 1. Verify server-side session and permissions
    const { supabase, auth } = await verifyServerSession(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json(
        { error: "Yêu cầu đăng nhập để truy cập tài liệu hồ sơ CV." },
        { status: 401 }
      );
    }

    // 2. Strict IDOR and ownership check
    const accessCheck = await canAccessResume(supabase, auth, resumeId);
    if (!accessCheck.allowed) {
      return NextResponse.json(
        { error: accessCheck.reason || "Bạn không có quyền xem tệp CV này." },
        { status: 403 }
      );
    }

    const resume = accessCheck.resume;
    const objectKey = resume?.file_url;
    if (!objectKey) {
      return NextResponse.json(
        { error: "Đường dẫn tệp CV không tồn tại." },
        { status: 404 }
      );
    }

    // 3. Generate a secure, short-lived signed URL (15 minutes = 900 seconds)
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
