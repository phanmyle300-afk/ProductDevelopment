import { NextRequest, NextResponse } from "next/server";
import { verifyServerSession, applyBlindScreening, sanitizeRawTextPII } from "@/lib/auth-guard";

// Helper to extract JSON from raw_text fallback marker
function extractParsedDataFromRawText(rawText: string | null): { cleanText: string; parsedData: any | null } {
  if (!rawText) return { cleanText: "", parsedData: null };

  const startMarker = "<!-- TS_PARSED_DATA_START -->";
  const endMarker = "<!-- TS_PARSED_DATA_END -->";

  const startIndex = rawText.indexOf(startMarker);
  const endIndex = rawText.indexOf(endMarker);

  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    const jsonStr = rawText.substring(startIndex + startMarker.length, endIndex).trim();
    const cleanText = (rawText.substring(0, startIndex) + rawText.substring(endIndex + endMarker.length)).trim();
    try {
      const parsedData = JSON.parse(jsonStr);
      return { cleanText, parsedData };
    } catch {
      return { cleanText: rawText, parsedData: null };
    }
  }

  return { cleanText: rawText, parsedData: null };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const targetId = params?.id;
    if (!targetId) {
      return NextResponse.json({ error: "Thiếu ID ứng viên" }, { status: 400 });
    }

    // 1. Verify server session
    const { supabase, auth } = await verifyServerSession(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json(
        { error: "Yêu cầu đăng nhập để truy cập thông tin ứng viên." },
        { status: 401 }
      );
    }

    // 2. Find candidate by ID or check if it's an application ID
    let candidateId = targetId;
    let { data: candidate, error: candErr } = await supabase
      .from("candidates")
      .select("*")
      .eq("id", targetId)
      .maybeSingle();

    if (!candidate) {
      const { data: appData } = await supabase
        .from("applications")
        .select("candidate_id")
        .eq("id", targetId)
        .maybeSingle();

      if (appData?.candidate_id) {
        candidateId = appData.candidate_id;
        const { data: c2 } = await supabase
          .from("candidates")
          .select("*")
          .eq("id", candidateId)
          .maybeSingle();
        candidate = c2;
      }
    }

    if (!candidate) {
      return NextResponse.json({ error: "Không tìm thấy hồ sơ ứng viên này." }, { status: 404 });
    }

    // 3. IDOR Check: Candidates can only access their own profile
    if (auth.role === "candidate") {
      if (auth.userId && candidate.user_id && candidate.user_id !== auth.userId) {
        return NextResponse.json({ error: "Bạn không có quyền truy cập hồ sơ này." }, { status: 403 });
      }
      if (auth.email && candidate.email && candidate.email !== auth.email) {
        return NextResponse.json({ error: "Bạn không có quyền truy cập hồ sơ này." }, { status: 403 });
      }
    }

    // 4. Fetch applications for this candidate
    const { data: applications, error: appErr } = await supabase
      .from("applications")
      .select("id, job_id, resume_id, current_stage, applied_at")
      .eq("candidate_id", candidateId)
      .order("applied_at", { ascending: false });

    if (appErr) {
      console.error("Lỗi nạp đơn ứng tuyển của candidate:", appErr);
    }

    const latestApp = applications && applications.length > 0 ? applications[0] : null;

    // 5. Fetch Job details if job_id exists
    let job = null;
    if (latestApp?.job_id) {
      const { data: jobData } = await supabase
        .from("jobs")
        .select("id, title, department, location")
        .eq("id", latestApp.job_id)
        .maybeSingle();
      job = jobData;
    }

    // 6. Fetch Resume details if resume_id exists
    let resume = null;
    if (latestApp?.resume_id) {
      const { data: resumeData } = await supabase
        .from("resumes")
        .select("*")
        .eq("id", latestApp.resume_id)
        .maybeSingle();
      resume = resumeData;
    }

    if (!resume || resume.parse_status !== "parsed") {
      const { data: r2 } = await supabase
        .from("resumes")
        .select("*")
        .eq("candidate_id", candidateId)
        .order("id", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (r2) {
        resume = r2;
      }
    }

    // Extract parsed data
    let parsedData = (resume as any)?.parsed_data || null;
    let cleanRawText = resume?.raw_text || "";

    if (!parsedData && cleanRawText) {
      const extracted = extractParsedDataFromRawText(cleanRawText);
      parsedData = extracted.parsedData;
      cleanRawText = extracted.cleanText;
    }

    // 7. Blind Screening Handling
    const isBlindQuery = request.nextUrl.searchParams.get("blind");
    const isBlindMode = isBlindQuery !== null ? isBlindQuery === "true" : false;

    let candidatePayload = {
      id: candidate.id,
      fullName: candidate.full_name,
      email: candidate.email,
      phone: candidate.phone || null,
      linkedinUrl: candidate.linkedin_url || null,
      createdAt: candidate.created_at || null,
    };

    if (isBlindMode) {
      candidatePayload = applyBlindScreening(candidatePayload, true);
      if (cleanRawText) {
        cleanRawText = sanitizeRawTextPII(cleanRawText, true);
      }
      if (parsedData?.contact_info) {
        parsedData = {
          ...parsedData,
          contact_info: {
            ...parsedData.contact_info,
            name: candidatePayload.fullName,
            email: "[ĐÃ ẨN DANH / BLIND MODE]",
            phone: "[ĐÃ ẨN DANH / BLIND MODE]",
          },
        };
      }
    }

    return NextResponse.json({
      candidate: candidatePayload,
      application: latestApp
        ? {
            id: latestApp.id,
            currentStage: latestApp.current_stage || "applied",
            jobId: latestApp.job_id,
            resumeId: latestApp.resume_id,
          }
        : null,
      job: job || null,
      resume: resume
        ? {
            id: resume.id,
            fileName: resume.file_name,
            fileType: resume.file_type,
            fileSize: resume.file_size,
            parseStatus: resume.parse_status || "uploaded",
            rawText: cleanRawText,
            parsedData: parsedData,
          }
        : null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Lỗi truy vấn hồ sơ ứng viên" },
      { status: 500 }
    );
  }
}
