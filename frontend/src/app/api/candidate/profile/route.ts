import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Thiếu email ứng viên" }, { status: 400 });
    }

    const supabase = createClient();

    const { data: candidate, error: candErr } = await supabase
      .from("candidates")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (candErr) {
      return NextResponse.json({ error: candErr.message }, { status: 500 });
    }

    if (!candidate) {
      return NextResponse.json({ candidate: null, resume: null });
    }

    // Get latest resume for candidate
    const { data: resume } = await supabase
      .from("resumes")
      .select("id, file_name, file_type, file_size, file_url, parse_status, raw_text")
      .eq("candidate_id", candidate.id)
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();

    return NextResponse.json({ candidate, resume });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Lỗi nạp hồ sơ" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const fullName = formData.get("fullName") as string;
    const email = formData.get("email") as string;
    const phone = (formData.get("phone") as string) || "";
    const location = (formData.get("location") as string) || "";
    const resumeFile = formData.get("resume") as File | null;

    if (!fullName || !email) {
      return NextResponse.json(
        { error: "Vui lòng nhập đầy đủ Họ tên và Email." },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // 1. Find or create candidate
    let candidateId = "";
    const { data: existingCand } = await supabase
      .from("candidates")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingCand) {
      candidateId = existingCand.id;
      const { error: updateErr } = await supabase
        .from("candidates")
        .update({
          full_name: fullName.trim(),
          phone: phone.trim(),
          location: location.trim(),
        })
        .eq("id", candidateId);

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }
    } else {
      const { data: newCand, error: insertErr } = await supabase
        .from("candidates")
        .insert({
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          location: location.trim(),
        })
        .select("id")
        .single();

      if (insertErr || !newCand) {
        return NextResponse.json(
          { error: insertErr?.message || "Không thể tạo hồ sơ ứng viên" },
          { status: 500 }
        );
      }
      candidateId = newCand.id;
    }

    // 2. Upload resume if provided
    let resumeRecord = null;
    if (resumeFile && resumeFile.size > 0) {
      const allowedExts = [".pdf", ".docx"];
      const lowerName = resumeFile.name.toLowerCase();
      const isAllowed = allowedExts.some((ext) => lowerName.endsWith(ext));

      if (!isAllowed) {
        return NextResponse.json(
          { error: "Định dạng file không hợp lệ. Chỉ chấp nhận tệp .pdf hoặc .docx." },
          { status: 400 }
        );
      }

      if (resumeFile.size > 50 * 1024 * 1024) {
        return NextResponse.json(
          { error: "Dung lượng file vượt quá giới hạn 50MB." },
          { status: 400 }
        );
      }

      const ext = lowerName.endsWith(".pdf") ? "pdf" : "docx";
      const cleanFileName = resumeFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storageKey = `candidate_${candidateId}_${Date.now()}_${cleanFileName}`;

      const buffer = Buffer.from(await resumeFile.arrayBuffer());
      const { error: uploadErr } = await supabase.storage
        .from("resumes")
        .upload(storageKey, buffer, {
          contentType:
            ext === "pdf"
              ? "application/pdf"
              : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          upsert: true,
        });

      if (uploadErr) {
        return NextResponse.json(
          { error: `Lỗi tải tệp lên lưu trữ Supabase: ${uploadErr.message}` },
          { status: 500 }
        );
      }

      // Insert record to resumes table
      const { data: resData, error: resErr } = await supabase
        .from("resumes")
        .insert({
          candidate_id: candidateId,
          file_url: storageKey,
          file_name: resumeFile.name,
          file_type: ext,
          file_size: resumeFile.size,
          parse_status: "uploaded",
        })
        .select("id, file_name, file_type, file_size, file_url, parse_status, created_at")
        .single();

      if (!resErr) {
        resumeRecord = resData;
      }
    }

    return NextResponse.json({
      success: true,
      candidate: {
        id: candidateId,
        full_name: fullName,
        email,
        phone,
        location,
      },
      resume: resumeRecord,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Lỗi lưu thông tin hồ sơ ứng viên" },
      { status: 500 }
    );
  }
}

