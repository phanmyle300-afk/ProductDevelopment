import { NextRequest, NextResponse } from "next/server";
import { verifyServerSession, getUserCompanyIds } from "@/lib/auth-guard";
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

// GET: Check batch screening overview for a job
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params?.id;
    if (!jobId) {
      return NextResponse.json({ error: "Thiếu jobId" }, { status: 400 });
    }

    const { supabase, auth } = await verifyServerSession(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: "Yêu cầu đăng nhập." }, { status: 401 });
    }

    if (auth.role === "candidate") {
      return NextResponse.json(
        { error: "Ứng viên không có quyền truy cập tính năng sàng lọc." },
        { status: 403 }
      );
    }

    // 1. Verify Job ownership & company isolation
    const { data: job, error: jobErr } = await supabase
      .from("jobs")
      .select("id, title, company_id, status")
      .eq("id", jobId)
      .maybeSingle();

    if (jobErr || !job) {
      return NextResponse.json({ error: "Không tìm thấy tin tuyển dụng này." }, { status: 404 });
    }

    if (auth.role !== "admin") {
      const companyIds = await getUserCompanyIds(supabase, auth.userId);
      if (job.company_id && !companyIds.includes(job.company_id)) {
        return NextResponse.json(
          { error: "Bạn không có quyền xem thông tin tuyển dụng của công ty khác." },
          { status: 403 }
        );
      }
    }

    // 2. Fetch applications count for this job
    const { data: applications, error: appErr } = await supabase
      .from("applications")
      .select("id, candidate_id, resume_id, current_stage")
      .eq("job_id", jobId);

    if (appErr) {
      return NextResponse.json({ error: appErr.message }, { status: 500 });
    }

    const appList = applications || [];
    const appIds = appList.map((a) => a.id);

    // 3. Fetch existing match_results
    let screenedAppIds = new Set<string>();
    if (appIds.length > 0) {
      const { data: matchRecords } = await supabase
        .from("match_results")
        .select("application_id")
        .in("application_id", appIds);

      screenedAppIds = new Set((matchRecords || []).map((m: any) => m.application_id));
    }

    // 4. Fetch job criteria
    const { data: jobSkillsData } = await supabase
      .from("job_skills")
      .select("id, skill_id, is_required, category, skills(id, name)")
      .eq("job_id", jobId);

    const criteriaCount = (jobSkillsData || []).length;

    return NextResponse.json({
      jobId,
      jobTitle: job.title,
      totalApplicants: appList.length,
      screenedCount: screenedAppIds.size,
      pendingCount: appList.length - screenedAppIds.size,
      hasCriteria: criteriaCount > 0,
      criteriaCount,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Lỗi nạp trạng thái sàng lọc" },
      { status: 500 }
    );
  }
}

// POST: Execute Batch AI Screening for all eligible applications of a job
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params?.id;
    if (!jobId) {
      return NextResponse.json({ error: "Thiếu jobId" }, { status: 400 });
    }

    const { supabase, auth } = await verifyServerSession(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: "Yêu cầu đăng nhập." }, { status: 401 });
    }

    if (auth.role === "candidate") {
      return NextResponse.json(
        { error: "Ứng viên không có quyền chạy sàng lọc." },
        { status: 403 }
      );
    }

    // 1. Verify Job ownership & company isolation
    const { data: job, error: jobErr } = await supabase
      .from("jobs")
      .select("id, title, company_id, status")
      .eq("id", jobId)
      .maybeSingle();

    if (jobErr || !job) {
      return NextResponse.json({ error: "Không tìm thấy tin tuyển dụng này." }, { status: 404 });
    }

    if (auth.role !== "admin") {
      const companyIds = await getUserCompanyIds(supabase, auth.userId);
      if (job.company_id && !companyIds.includes(job.company_id)) {
        return NextResponse.json(
          { error: "Bạn không có quyền thực hiện sàng lọc cho tin tuyển dụng của công ty khác." },
          { status: 403 }
        );
      }
    }

    // 2. Fetch Job Criteria from `job_skills`
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

    if (criteriaList.length === 0) {
      return NextResponse.json(
        {
          error: "Vị trí tuyển dụng này chưa được cấu hình tiêu chí kỹ năng (Required/Preferred). Vui lòng cấu hình tiêu chí tuyển dụng trước khi sàng lọc.",
          total_criteria: 0,
        },
        { status: 400 }
      );
    }

    // 3. Fetch custom DB aliases once
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

    // 4. Fetch all applications for this job
    const body = await request.json().catch(() => ({}));
    const forceRescreen = body.forceRescreen === true;

    const { data: applications, error: appErr } = await supabase
      .from("applications")
      .select("id, candidate_id, resume_id, current_stage")
      .eq("job_id", jobId);

    if (appErr) {
      return NextResponse.json({ error: appErr.message }, { status: 500 });
    }

    const allApps = applications || [];
    if (allApps.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Chưa có ứng viên nào nộp hồ sơ vào vị trí này.",
        total: 0,
        targeted: 0,
        processed: 0,
        skipped: 0,
        failed: 0,
        results: [],
      });
    }

    // 5. Determine targeted applications
    const allAppIds = allApps.map((a) => a.id);
    const { data: existingMatches } = await supabase
      .from("match_results")
      .select("application_id")
      .in("application_id", allAppIds);

    const screenedAppIds = new Set((existingMatches || []).map((m: any) => m.application_id));

    const targetApps = forceRescreen
      ? allApps
      : allApps.filter((app) => !screenedAppIds.has(app.id));

    if (targetApps.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Toàn bộ ứng viên đã được sàng lọc trước đó. Bật 'Chạy lại toàn bộ' nếu muốn đánh giá lại.",
        total: allApps.length,
        targeted: 0,
        processed: 0,
        skipped: 0,
        failed: 0,
        allAlreadyScreened: true,
        results: [],
      });
    }

    // 6. Bulk fetch candidate resumes for target applications
    const targetCandidateIds = Array.from(new Set(targetApps.map((a) => a.candidate_id)));
    const targetResumeIds = Array.from(new Set(targetApps.map((a) => a.resume_id).filter(Boolean)));

    const [directResumesRes, allCandidateResumesRes] = await Promise.all([
      targetResumeIds.length > 0
        ? supabase
            .from("resumes")
            .select("id, candidate_id, parse_status, raw_text, file_name")
            .in("id", targetResumeIds)
        : Promise.resolve({ data: [] }),
      targetCandidateIds.length > 0
        ? supabase
            .from("resumes")
            .select("id, candidate_id, parse_status, raw_text, file_name")
            .in("candidate_id", targetCandidateIds)
            .order("id", { ascending: false })
        : Promise.resolve({ data: [] }),
    ]);

    const directResumeMap = new Map((directResumesRes.data || []).map((r: any) => [r.id, r]));

    const candidateLatestParsedMap = new Map<string, any>();
    for (const r of allCandidateResumesRes.data || []) {
      if (r.parse_status === "parsed" && !candidateLatestParsedMap.has(r.candidate_id)) {
        candidateLatestParsedMap.set(r.candidate_id, r);
      }
    }

    // 7. Process each targeted application sequentially & reliably
    let processedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    const results: Array<{
      applicationId: string;
      candidateId: string;
      score: number | null;
      recommendation: string | null;
      status: "success" | "skipped" | "failed";
      reason?: string;
    }> = [];

    for (const app of targetApps) {
      try {
        let resume: any = app.resume_id ? directResumeMap.get(app.resume_id) : null;

        // Smart fallback: if resume is missing or unparsed, check if candidate has a parsed resume
        if (!resume || resume.parse_status !== "parsed") {
          const fallbackResume = candidateLatestParsedMap.get(app.candidate_id);
          if (fallbackResume) {
            resume = fallbackResume;
            // Update application with the valid parsed resume_id
            await supabase
              .from("applications")
              .update({ resume_id: fallbackResume.id })
              .eq("id", app.id);
          }
        }

        // If candidate still has no parsed resume, skip safely (never invent fake score)
        if (!resume || resume.parse_status !== "parsed") {
          skippedCount++;
          results.push({
            applicationId: app.id,
            candidateId: app.candidate_id,
            score: null,
            recommendation: null,
            status: "skipped",
            reason: "Hồ sơ CV chưa được bóc tách nội dung.",
          });
          continue;
        }

        // Extract parsed skills & clean raw text
        let parsedData = (resume as any).parsed_data || null;
        let cleanRawText = resume.raw_text || "";

        if (!parsedData && cleanRawText) {
          const extracted = extractParsedDataFromRawText(cleanRawText);
          parsedData = extracted.parsedData;
          cleanRawText = extracted.cleanText;
        }

        const candidateSkills: Array<{ name: string; evidence?: string | null; confidence?: number }> =
          parsedData?.skills || [];

        // Execute deterministic real skill match
        const matchSnapshot: SkillMatchResultSnapshot = performSkillMatch({
          applicationId: app.id,
          resumeId: resume.id,
          jobId,
          jobCriteria: criteriaList,
          candidateSkills,
          rawCvText: cleanRawText,
          dbAliases,
        });

        // Recommendation compliant with CHECK constraint: 'strong_match', 'shortlist', 'review', 'low_match'
        const validRec =
          matchSnapshot.skills_score >= 80
            ? "strong_match"
            : matchSnapshot.skills_score >= 60
            ? "shortlist"
            : matchSnapshot.skills_score >= 40
            ? "review"
            : "low_match";

        // Persist to match_results (Upsert)
        const { data: existingRecord } = await supabase
          .from("match_results")
          .select("id")
          .eq("application_id", app.id)
          .maybeSingle();

        if (existingRecord) {
          await supabase
            .from("match_results")
            .update({
              skills_score: matchSnapshot.skills_score,
              total_score: matchSnapshot.skills_score,
              recommendation: validRec,
            })
            .eq("id", existingRecord.id);
        } else {
          await supabase
            .from("match_results")
            .insert({
              id: crypto.randomUUID(),
              application_id: app.id,
              skills_score: matchSnapshot.skills_score,
              total_score: matchSnapshot.skills_score,
              recommendation: validRec,
            });
        }

        // If current stage is 'applied', advance to 'ai_screened' (satisfies applications_current_stage_check constraint)
        if (app.current_stage === "applied") {
          await supabase
            .from("applications")
            .update({ current_stage: "ai_screened" })
            .eq("id", app.id);
        }

        processedCount++;
        results.push({
          applicationId: app.id,
          candidateId: app.candidate_id,
          score: matchSnapshot.skills_score,
          recommendation: validRec,
          status: "success",
        });
      } catch (itemErr: any) {
        failedCount++;
        results.push({
          applicationId: app.id,
          candidateId: app.candidate_id,
          score: null,
          recommendation: null,
          status: "failed",
          reason: itemErr?.message || "Lỗi xử lý so khớp",
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Đã hoàn tất sàng lọc AI cho ${processedCount}/${targetApps.length} hồ sơ.`,
      jobId,
      total: allApps.length,
      targeted: targetApps.length,
      processed: processedCount,
      skipped: skippedCount,
      failed: failedCount,
      results,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Đã xảy ra lỗi trong quá trình chạy sàng lọc hàng loạt." },
      { status: 500 }
    );
  }
}
