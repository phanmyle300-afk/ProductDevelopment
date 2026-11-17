import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".doc"];

export async function POST(request: NextRequest) {
  let uploadedObjectKey: string | null = null;
  const supabase = createClient();

  try {
    const formData = await request.formData();
    const fullName = formData.get("fullName") as string | null;
    const email = formData.get("email") as string | null;
    const phone = formData.get("phone") as string | null;
    const jobId = formData.get("jobId") as string | null;
    const file = (formData.get("file") || formData.get("resume")) as File | null;

    // 1. Validation input fields
    if (!fullName || !fullName.trim()) {
      return NextResponse.json(
        { error: "Vui lòng nhập họ và tên ứng viên." },
        { status: 400 }
      );
    }

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: "Vui lòng nhập địa chỉ email ứng viên." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: "Địa chỉ email không đúng định dạng." },
        { status: 400 }
      );
    }

    if (!jobId || !jobId.trim()) {
      return NextResponse.json(
        { error: "Vui lòng chọn vị trí tuyển dụng mục tiêu." },
        { status: 400 }
      );
    }

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Vui lòng tải lên tệp hồ sơ CV (PDF hoặc DOCX)." },
        { status: 400 }
      );
    }

    // 2. Validate file type & size
    const originalFilename = file.name || "resume.pdf";
    const ext = "." + originalFilename.split(".").pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        {
          error: `Định dạng tệp '${ext}' không được hỗ trợ. Vui lòng tải lên tệp ${ALLOWED_EXTENSIONS.join(", ")}.`,
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `Dung lượng tệp (${(file.size / (1024 * 1024)).toFixed(1)}MB) vượt quá giới hạn tối đa cho phép (50MB).`,
        },
        { status: 400 }
      );
    }

    // 3. Verify Job existence
    const { data: job, error: jobErr } = await supabase
      .from("jobs")
      .select("id, title")
      .eq("id", jobId.trim())
      .single();

    if (jobErr || !job) {
      return NextResponse.json(
        { error: "Tin tuyển dụng được chọn không tồn tại hoặc đã bị xóa." },
        { status: 404 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim();
    const cleanPhone = phone ? phone.trim() : null;

    // 4. Anti-duplicate candidate check by email
    const { data: existingCandidate } = await supabase
      .from("candidates")
      .select("id, full_name, email")
      .eq("email", cleanEmail)
      .maybeSingle();

    let candidateId: string;

    if (existingCandidate) {
      candidateId = existingCandidate.id;
    } else {
      // Create new candidate record (user_id remains null)
      candidateId = crypto.randomUUID();
      const { error: candInsertErr } = await supabase.from("candidates").insert({
        id: candidateId,
        full_name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        user_id: null, // Strictly null when candidate does not have user account
      });

      if (candInsertErr) {
        return NextResponse.json(
          { error: `Lỗi khởi tạo hồ sơ ứng viên: ${candInsertErr.message}` },
          { status: 500 }
        );
      }
    }

    // 5. Anti-duplicate application check (UNIQUE candidate_id, job_id)
    const { data: existingApp } = await supabase
      .from("applications")
      .select("id")
      .eq("candidate_id", candidateId)
      .eq("job_id", jobId)
      .maybeSingle();

    if (existingApp) {
      return NextResponse.json(
        {
          error: `Ứng viên '${cleanName}' (${cleanEmail}) đã có hồ sơ ứng tuyển vào vị trí này. Không thể tạo bản ghi trùng lặp.`,
        },
        { status: 409 }
      );
    }

    // 6. Upload file to private Supabase Storage bucket 'resumes'
    const safeBaseName = originalFilename
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .replace(/_{2,}/g, "_");
    const objectKey = `${jobId}/${candidateId}/${Date.now()}_${safeBaseName}`;
    uploadedObjectKey = objectKey;

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const contentType = file.type || "application/pdf";

    const { error: uploadError } = await supabase.storage
      .from("resumes")
      .upload(objectKey, fileBuffer, {
        contentType,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        {
          error: `Lỗi tải tệp lên kho lưu trữ private 'resumes': ${uploadError.message}`,
        },
        { status: 500 }
      );
    }

    // 7. Insert resume record into 'resumes'
    // Storing relative object key in file_url column
    const resumeId = crypto.randomUUID();
    const { error: resumeInsertErr } = await supabase.from("resumes").insert({
      id: resumeId,
      candidate_id: candidateId,
      file_url: objectKey,
      file_name: originalFilename,
      file_type: ext.replace(".", ""),
      file_size: file.size,
      parse_status: "uploaded", // Strictly: uploaded, parsing, parsed, failed
    });

    if (resumeInsertErr) {
      // Rollback uploaded file from storage
      await supabase.storage.from("resumes").remove([objectKey]);
      return NextResponse.json(
        {
          error: `Lỗi lưu thông tin tệp CV vào cơ sở dữ liệu: ${resumeInsertErr.message}`,
        },
        { status: 500 }
      );
    }

    // 8. Insert application record into 'applications'
    const applicationId = crypto.randomUUID();
    const { error: appInsertErr } = await supabase.from("applications").insert({
      id: applicationId,
      candidate_id: candidateId,
      job_id: jobId,
      resume_id: resumeId,
      current_stage: "applied", // Strictly current_stage = applied
    });

    if (appInsertErr) {
      // Rollback resume record and uploaded file
      await supabase.from("resumes").delete().eq("id", resumeId);
      await supabase.storage.from("resumes").remove([objectKey]);
      return NextResponse.json(
        {
          error: `Lỗi liên kết ứng viên với tin tuyển dụng: ${appInsertErr.message}`,
        },
        { status: 500 }
      );
    }

    // 9. Successfully completed all steps!
    return NextResponse.json({
      success: true,
      message: "Thêm ứng viên và tải CV thành công",
      application_id: applicationId,
      candidate_id: candidateId,
      data: {
        candidateId,
        applicationId,
        resumeId,
        jobTitle: job.title,
        candidateName: cleanName,
        fileName: originalFilename,
        fileSize: file.size,
        parseStatus: "uploaded",
        currentStage: "applied",
      },
    });
  } catch (err: any) {
    // If unexpected error, cleanup partial file
    if (uploadedObjectKey) {
      try {
        await supabase.storage.from("resumes").remove([uploadedObjectKey]);
      } catch {}
    }

    return NextResponse.json(
      {
        error:
          err?.message || "Đã xảy ra lỗi hệ thống trong quá trình tải hồ sơ.",
      },
      { status: 500 }
    );
  }
}

