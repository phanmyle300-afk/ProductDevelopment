import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { verifyServerSession, getUserCompanyIds, extractParsedDataFromRawText } from "@/lib/auth-guard";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const { supabase, auth } = await verifyServerSession(req);

    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: "Yêu cầu đăng nhập." }, { status: 401 });
    }

    // Enforce email confirmation for candidates
    if (auth.role === "candidate" && !auth.emailConfirmedAt) {
      return NextResponse.json(
        { error: "Tài khoản ứng viên chưa xác thực địa chỉ email. Vui lòng xác thực email trước khi truy cập." },
        { status: 403 }
      );
    }

    // Enforce server-verified email for candidates (lowercased); do not trust client query params
    const rawEmail = auth.role === "candidate" && auth.email ? auth.email : searchParams.get("email");
    const cleanEmail = rawEmail ? rawEmail.trim().toLowerCase() : "";

    // Tra cứu candidates theo user_id trước, rồi theo email (chữ thường)
    let candidate: any = null;

    if (auth.userId) {
      const { data: candByUserId, error: candUserErr } = await supabase
        .from("candidates")
        .select("*")
        .eq("user_id", auth.userId)
        .maybeSingle();

      if (candUserErr) {
        return NextResponse.json({ error: candUserErr.message }, { status: 500 });
      }
      if (candByUserId) {
        candidate = candByUserId;
      }
    }

    if (!candidate && cleanEmail) {
      const { data: candByEmail, error: candEmailErr } = await supabase
        .from("candidates")
        .select("*")
        .eq("email", cleanEmail)
        .maybeSingle();

      if (candEmailErr) {
        return NextResponse.json({ error: candEmailErr.message }, { status: 500 });
      }
      if (candByEmail) {
        candidate = candByEmail;
      }
    }

    if (!candidate) {
      return NextResponse.json({ candidate: null, resume: null, skills: [] });
    }

    // If recruiter, check that candidate has applied to recruiter's company jobs
    if (auth.isAuthenticated && ["recruiter", "interviewer", "hiring_manager"].includes(auth.role)) {
      const companyIds = await getUserCompanyIds(supabase, auth.userId);
      if (companyIds.length > 0) {
        const { data: appMatch } = await supabase
          .from("applications")
          .select("id, jobs(company_id)")
          .eq("candidate_id", candidate.id);

        const inPipeline = (appMatch || []).some(
          (a: any) => a.jobs?.company_id && companyIds.includes(a.jobs.company_id)
        );

        if (!inPipeline) {
          return NextResponse.json(
            { error: "Bạn không có quyền xem hồ sơ ứng viên ngoài phạm vi tuyển dụng của công ty." },
            { status: 403 }
          );
        }
      }
    }

    // Get all resumes for candidate
    const { data: allResumes } = await supabase
      .from("resumes")
      .select("id, file_name, file_type, file_size, file_url, parse_status, raw_text, uploaded_at")
      .eq("candidate_id", candidate.id)
      .order("uploaded_at", { ascending: false });

    // Latest resume is the first one
    const resume = allResumes && allResumes.length > 0 ? allResumes[0] : null;

    let skills: string[] = [];
    let parsedData: any = null;

    if (resume?.raw_text) {
      const extracted = extractParsedDataFromRawText(resume.raw_text);
      parsedData = extracted.parsedData;
    }

    if (parsedData?.skills && Array.isArray(parsedData.skills)) {
      skills = parsedData.skills
        .map((s: any) => (typeof s === "string" ? s : s?.name))
        .filter(Boolean);
    }

    return NextResponse.json({
      candidate,
      resume: resume ? { ...resume, parsed_data: parsedData } : null,
      resumes: allResumes || [],
      skills,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Lỗi nạp hồ sơ" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { supabase, auth } = await verifyServerSession(req);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: "Yêu cầu đăng nhập để cập nhật hồ sơ." }, { status: 401 });
    }

    if (auth.role === "candidate" && !auth.emailConfirmedAt) {
      return NextResponse.json(
        { error: "Tài khoản ứng viên chưa xác thực địa chỉ email. Vui lòng xác thực email trước khi truy cập." },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const fullName = formData.get("fullName") as string;
    const emailInput = formData.get("email") as string;
    const rawEmail = auth.role === "candidate" && auth.email ? auth.email : emailInput;
    const cleanEmail = rawEmail ? rawEmail.trim().toLowerCase() : "";
    const phone = (formData.get("phone") as string) || "";
    const location = (formData.get("location") as string) || "";
    const skillsRaw = formData.get("skills") as string | null;
    const resumeFile = formData.get("resume") as File | null;

    let userSkills: string[] = [];
    if (skillsRaw) {
      try {
        const parsed = JSON.parse(skillsRaw);
        if (Array.isArray(parsed)) {
          userSkills = parsed.map((s: any) => String(s).trim()).filter(Boolean);
        }
      } catch { }
    }

    if (!fullName || !cleanEmail) {
      return NextResponse.json(
        { error: "Vui lòng nhập đầy đủ Họ tên và Email." },
        { status: 400 }
      );
    }

    // 1. Find or create candidate: tra cứu theo user_id trước, rồi theo email (chữ thường)
    let candidateId = "";
    let existingCand: any = null;

    if (auth.userId) {
      const { data: byUser } = await supabase
        .from("candidates")
        .select("id, user_id")
        .eq("user_id", auth.userId)
        .maybeSingle();
      if (byUser) existingCand = byUser;
    }

    if (!existingCand && cleanEmail) {
      const { data: byEmail } = await supabase
        .from("candidates")
        .select("id, user_id")
        .eq("email", cleanEmail)
        .maybeSingle();
      if (byEmail) existingCand = byEmail;
    }

    if (existingCand) {
      candidateId = existingCand.id;
      const updatePayload: any = {
        full_name: fullName.trim(),
        phone: phone.trim(),
        location: location.trim(),
      };
      if (auth.userId && !existingCand.user_id) {
        updatePayload.user_id = auth.userId;
      }
      const { error: updateErr } = await supabase
        .from("candidates")
        .update(updatePayload)
        .eq("id", candidateId);

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }
    } else {
      candidateId = crypto.randomUUID();
      const { error: insertErr } = await supabase
        .from("candidates")
        .insert({
          id: candidateId,
          user_id: auth.userId,
          full_name: fullName.trim(),
          email: cleanEmail,
          phone: phone.trim(),
          location: location.trim(),
        });

      if (insertErr) {
        return NextResponse.json(
          { error: `Không thể tạo hồ sơ ứng viên do giới hạn phân quyền bảo mật: ${insertErr.message}` },
          { status: 403 }
        );
      }
    }

    // 2. Upload resume if provided
    let resumeRecord: any = null;
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
        .select("id, file_name, file_type, file_size, file_url, parse_status, uploaded_at")
        .single();

      if (resErr) {
        console.error("Lỗi tạo bản ghi resumes:", resErr);
        return NextResponse.json(
          { error: `Lỗi ghi nhận hồ sơ CV: ${resErr.message}` },
          { status: 500 }
        );
      }

      resumeRecord = resData;
    }

    // 3. Persist updated skills to latest resume if available
    if (userSkills.length > 0) {
      if (resumeRecord) {
        const initParsedData = {
          skills: userSkills.map((name) => ({ name })),
        };
        const rawTextWithMarker = `<!-- TS_PARSED_DATA_START -->\n${JSON.stringify(initParsedData)}\n<!-- TS_PARSED_DATA_END -->\n`;
        await supabase
          .from("resumes")
          .update({ raw_text: rawTextWithMarker })
          .eq("id", resumeRecord.id);
        resumeRecord.parsed_data = initParsedData;
      } else {
        const { data: latestResume } = await supabase
          .from("resumes")
          .select("id, file_name, file_type, file_size, file_url, parse_status, raw_text")
          .eq("candidate_id", candidateId)
          .order("id", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latestResume) {
          const extracted = extractParsedDataFromRawText(latestResume.raw_text);
          const existingParsed = extracted.parsedData || {};
          const updatedParsed = {
            ...existingParsed,
            skills: userSkills.map((name) => ({ name })),
          };
          const cleanText = extracted.cleanText || "";
          const rawTextWithMarker = `<!-- TS_PARSED_DATA_START -->\n${JSON.stringify(updatedParsed)}\n<!-- TS_PARSED_DATA_END -->\n${cleanText}`;

          await supabase
            .from("resumes")
            .update({ raw_text: rawTextWithMarker })
            .eq("id", latestResume.id);

          resumeRecord = { ...latestResume, raw_text: rawTextWithMarker, parsed_data: updatedParsed };
        }
      }
    }

    return NextResponse.json({
      success: true,
      candidate: {
        id: candidateId,
        full_name: fullName,
        email: cleanEmail,
        phone,
        location,
      },
      resume: resumeRecord,
      skills: userSkills,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Lỗi lưu thông tin hồ sơ ứng viên" },
      { status: 500 }
    );
  }
}

