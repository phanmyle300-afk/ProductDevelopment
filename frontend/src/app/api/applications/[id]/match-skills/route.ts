import { NextRequest, NextResponse } from "next/server";
import { verifyServerSession, canAccessApplication } from "@/lib/auth-guard";
import {
  performSkillMatch,
  SkillCriterion,
  SkillMatchResultSnapshot,
} from "@/lib/skill-matcher";

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

// GET: Retrieve latest skill matching result for an application
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const applicationId = params?.id;
    if (!applicationId) {
      return NextResponse.json({ error: "Thiếu applicationId" }, { status: 400 });
    }

    const { supabase, auth } = await verifyServerSession(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: "Yêu cầu đăng nhập." }, { status: 401 });
    }

    // STRICT GUARD: Candidates must NEVER access internal AI match results
    if (auth.role === "candidate") {
      return NextResponse.json(
        { error: "Ứng viên không được phép truy cập kết quả đánh giá kỹ năng nội bộ." },
        { status: 403 }
      );
    }

    // Company isolation check
    const accessCheck = await canAccessApplication(supabase, auth, applicationId);
    if (!accessCheck.allowed) {
      return NextResponse.json(
        { error: accessCheck.reason || "Bạn không có quyền truy cập hồ sơ của công ty khác." },
        { status: 403 }
      );
    }

    // 1. Fetch application info
    const { data: app, error: appErr } = await supabase
      .from("applications")
      .select("id, candidate_id, job_id, resume_id, applied_at")
      .eq("id", applicationId)
      .single();

    if (appErr || !app) {
      return NextResponse.json({ error: "Không tìm thấy hồ sơ ứng tuyển." }, { status: 404 });
    }

    // 2. Fetch match_results for this application
    const { data: matchRecords, error: matchErr } = await supabase
      .from("match_results")
      .select("*")
      .eq("application_id", applicationId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (matchErr || !matchRecords || matchRecords.length === 0) {
      return NextResponse.json({
        has_match: false,
        message: "Chưa thực hiện so khớp kỹ năng cho đơn ứng tuyển này.",
      });
    }

    const latest = matchRecords[0];

    // Parse snapshot if stored inside recommendation fallback
    let snapshotData: any = null;
    if ((latest as any).skill_matches && Array.isArray((latest as any).skill_matches)) {
      snapshotData = {
        application_id: applicationId,
        resume_id: (latest as any).resume_id || app.resume_id,
        skills_score: latest.skills_score,
        criteria_snapshot: (latest as any).criteria_snapshot || {},
        matching_version: (latest as any).matching_version || "v1.0-deterministic",
        matched_at: latest.created_at,
        all_matches: (latest as any).skill_matches,
        required_matches: (latest as any).skill_matches.filter((m: any) => m.is_required),
        preferred_matches: (latest as any).skill_matches.filter((m: any) => !m.is_required),
      };
    } else if (latest.recommendation && latest.recommendation.startsWith("{")) {
      try {
        snapshotData = JSON.parse(latest.recommendation);
      } catch {}
    }

    // Deterministic snapshot rebuild for UI consistency
    if (!snapshotData && app.job_id) {
      try {
        let resumeId = app.resume_id;
        let resume = null;
        if (resumeId) {
          const { data: r } = await supabase
            .from("resumes")
            .select("id, parse_status, raw_text, file_name")
            .eq("id", resumeId)
            .maybeSingle();
          resume = r;
        }
        if (!resume || resume.parse_status !== "parsed") {
          const { data: pr } = await supabase
            .from("resumes")
            .select("id, parse_status, raw_text, file_name")
            .eq("candidate_id", app.candidate_id)
            .eq("parse_status", "parsed")
            .order("id", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (pr) resume = pr;
        }

        if (resume) {
          let parsedData = (resume as any).parsed_data || null;
          let cleanRawText = resume.raw_text || "";
          if (!parsedData && cleanRawText) {
            const extracted = extractParsedDataFromRawText(cleanRawText);
            parsedData = extracted.parsedData;
            cleanRawText = extracted.cleanText;
          }
          const candidateSkills = parsedData?.skills || [];
          const { data: jobSkillsData } = await supabase
            .from("job_skills")
            .select("id, skill_id, is_required, category, skills(id, name)")
            .eq("job_id", app.job_id);

          const criteriaList: SkillCriterion[] = [];
          if (jobSkillsData) {
            for (const item of jobSkillsData) {
              const name = (item.skills as any)?.name || item.category;
              if (name) {
                criteriaList.push({
                  name,
                  is_required: item.is_required !== false,
                  category: item.category || "Technical",
                });
              }
            }
          }

          const { data: aliasesData } = await supabase
            .from("skill_aliases")
            .select("alias, skill_id, skills(name)");

          const dbAliases: Record<string, string> = {};
          if (aliasesData) {
            for (const a of aliasesData) {
              const canonical = (a.skills as any)?.name;
              if (canonical && a.alias) {
                dbAliases[a.alias.toLowerCase().trim()] = canonical.toLowerCase().trim();
              }
            }
          }

          snapshotData = performSkillMatch({
            applicationId,
            resumeId: resume.id,
            jobId: app.job_id,
            jobCriteria: criteriaList,
            candidateSkills,
            rawCvText: cleanRawText,
            dbAliases,
          });
        }
      } catch (e) {
        console.error("Lỗi dựng snapshot chi tiết:", e);
      }
    }

    return NextResponse.json({
      has_match: true,
      match_id: latest.id,
      skills_score: latest.skills_score,
      created_at: latest.created_at,
      snapshot: snapshotData,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Lỗi truy vấn kết quả so khớp" },
      { status: 500 }
    );
  }
}

// POST: Execute real skill matching between CV and Job criteria
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const applicationId = params?.id;
    if (!applicationId) {
      return NextResponse.json({ error: "Thiếu applicationId" }, { status: 400 });
    }

    // 1. Session check
    const { supabase, auth } = await verifyServerSession(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: "Yêu cầu đăng nhập." }, { status: 401 });
    }

    // STRICT GUARD: Candidates must NEVER access internal AI match results
    if (auth.role === "candidate") {
      return NextResponse.json(
        { error: "Ứng viên không được phép truy cập kết quả đánh giá kỹ năng nội bộ." },
        { status: 403 }
      );
    }

    // Company isolation check
    const accessCheck = await canAccessApplication(supabase, auth, applicationId);
    if (!accessCheck.allowed) {
      return NextResponse.json(
        { error: accessCheck.reason || "Bạn không có quyền truy cập hồ sơ của công ty khác." },
        { status: 403 }
      );
    }

    // 2. Fetch Application record
    const { data: application, error: appErr } = await supabase
      .from("applications")
      .select("id, candidate_id, job_id, resume_id")
      .eq("id", applicationId)
      .single();

    if (appErr || !application) {
      return NextResponse.json({ error: "Đơn ứng tuyển không tồn tại." }, { status: 404 });
    }

    let { job_id: jobId, resume_id: resumeId, candidate_id: candidateId } = application;

    // 3. Fetch Resume and verify parsing status with smart fallback
    let resume: any = null;

    if (resumeId) {
      const { data: resData } = await supabase
        .from("resumes")
        .select("id, parse_status, raw_text, file_name")
        .eq("id", resumeId)
        .maybeSingle();
      resume = resData;
    }

    // Smart Fallback: If application has no resume or resume is unparsed,
    // look for a parsed resume from this candidate
    if (!resume || resume.parse_status !== "parsed") {
      const { data: parsedResume } = await supabase
        .from("resumes")
        .select("id, parse_status, raw_text, file_name")
        .eq("candidate_id", candidateId)
        .eq("parse_status", "parsed")
        .order("id", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (parsedResume) {
        resume = parsedResume;
        resumeId = parsedResume.id;
        // Auto-link this parsed resume to the application
        await supabase
          .from("applications")
          .update({ resume_id: parsedResume.id })
          .eq("id", applicationId);
      }
    }

    if (!resume) {
      return NextResponse.json(
        { error: "Đơn ứng tuyển này chưa có tệp CV được đính kèm." },
        { status: 400 }
      );
    }

    if (resume.parse_status !== "parsed") {
      return NextResponse.json(
        {
          error: "Hồ sơ CV chưa được bóc tách nội dung. Vui lòng bấm 'Bắt Đầu Bóc Tách CV' trước khi so khớp kỹ năng.",
          parse_status: resume.parse_status || "uploaded",
        },
        { status: 400 }
      );
    }

    // Extract parsed skills and clean raw text
    let parsedData = (resume as any).parsed_data || null;
    let cleanRawText = resume.raw_text || "";

    if (!parsedData && cleanRawText) {
      const extracted = extractParsedDataFromRawText(cleanRawText);
      parsedData = extracted.parsedData;
      cleanRawText = extracted.cleanText;
    }

    const candidateSkills: Array<{ name: string; evidence?: string | null; confidence?: number }> =
      parsedData?.skills || [];

    // 4. Fetch Job Criteria from `job_skills`
    const { data: jobSkillsData } = await supabase
      .from("job_skills")
      .select("id, skill_id, is_required, category, skills(id, name)")
      .eq("job_id", jobId);

    const criteriaList: SkillCriterion[] = [];

    if (jobSkillsData && jobSkillsData.length > 0) {
      for (const item of jobSkillsData) {
        const name = (item.skills as any)?.name || item.category;
        if (name) {
          criteriaList.push({
            name,
            is_required: item.is_required !== false,
            category: item.category || "Technical",
          });
        }
      }
    }

    // If job_skills has no rows yet, check Job description or require recruiter criteria
    if (criteriaList.length === 0) {
      return NextResponse.json(
        {
          error: "Tin tuyển dụng này chưa được cấu hình tiêu chí kỹ năng (Required/Preferred). Vui lòng thiết lập tiêu chí cho vị trí tuyển dụng trước.",
          total_criteria: 0,
        },
        { status: 400 }
      );
    }

    // 5. Fetch custom DB aliases if available
    const { data: aliasesData } = await supabase
      .from("skill_aliases")
      .select("alias, skill_id, skills(name)");

    const dbAliases: Record<string, string> = {};
    if (aliasesData) {
      for (const a of aliasesData) {
        const canonical = (a.skills as any)?.name;
        if (canonical && a.alias) {
          dbAliases[a.alias.toLowerCase().trim()] = canonical.toLowerCase().trim();
        }
      }
    }

    // 6. Execute Deterministic Real Skill Match
    const matchSnapshot: SkillMatchResultSnapshot = performSkillMatch({
      applicationId,
      resumeId,
      jobId,
      jobCriteria: criteriaList,
      candidateSkills,
      rawCvText: cleanRawText,
      dbAliases,
    });

    // 7. Persist Snapshot into Supabase `match_results`
    // Recommendation must comply with CHECK constraint: 'strong_match', 'shortlist', 'review', 'low_match'
    const validRec =
      matchSnapshot.skills_score >= 80
        ? "strong_match"
        : matchSnapshot.skills_score >= 60
        ? "shortlist"
        : matchSnapshot.skills_score >= 40
        ? "review"
        : "low_match";

    const newRecordId = crypto.randomUUID();

    // Check if match_result already exists for this application
    const { data: existingMatch } = await supabase
      .from("match_results")
      .select("id")
      .eq("application_id", applicationId)
      .maybeSingle();

    if (existingMatch) {
      // Update existing record
      await supabase
        .from("match_results")
        .update({
          skills_score: matchSnapshot.skills_score,
          total_score: matchSnapshot.skills_score,
          recommendation: validRec,
        })
        .eq("id", existingMatch.id);
    } else {
      // Insert new record
      await supabase
        .from("match_results")
        .insert({
          id: newRecordId,
          application_id: applicationId,
          skills_score: matchSnapshot.skills_score,
          total_score: matchSnapshot.skills_score,
          recommendation: validRec,
        });
    }

    return NextResponse.json({
      success: true,
      snapshot: matchSnapshot,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Lỗi xử lý so khớp kỹ năng" },
      { status: 500 }
    );
  }
}

