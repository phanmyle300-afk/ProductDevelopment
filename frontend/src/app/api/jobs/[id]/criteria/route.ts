import { NextRequest, NextResponse } from "next/server";
import { verifyServerSession } from "@/lib/auth-guard";

// GET: Retrieve real job skill criteria (Required vs Preferred)
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

    // 1. Fetch Job
    const { data: job, error: jobErr } = await supabase
      .from("jobs")
      .select("id, title, department, description")
      .eq("id", jobId)
      .single();

    if (jobErr || !job) {
      return NextResponse.json({ error: "Không tìm thấy tin tuyển dụng này." }, { status: 404 });
    }

    // 2. Fetch Job Skills from job_skills joined with skills
    const { data: jobSkills, error: jsErr } = await supabase
      .from("job_skills")
      .select("id, skill_id, is_required, category, weight, skills(id, name, category)")
      .eq("job_id", jobId);

    const requiredSkills: Array<{ id: string; name: string; category?: string }> = [];
    const preferredSkills: Array<{ id: string; name: string; category?: string }> = [];

    if (jobSkills && jobSkills.length > 0) {
      for (const js of jobSkills) {
        const skillName = (js.skills as any)?.name || js.category || "Skill";
        const item = {
          id: js.id,
          skillId: js.skill_id,
          name: skillName,
          category: (js.skills as any)?.category || js.category || "General",
          is_required: js.is_required,
        };

        if (js.is_required) {
          requiredSkills.push(item);
        } else {
          preferredSkills.push(item);
        }
      }
    }

    return NextResponse.json({
      job_id: jobId,
      title: job.title,
      required_skills: requiredSkills,
      preferred_skills: preferredSkills,
      total_criteria: requiredSkills.length + preferredSkills.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Lỗi nạp tiêu chí tin tuyển dụng" },
      { status: 500 }
    );
  }
}

// POST: Add or update criteria for a job (Recruiter action)
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
    if (!auth.isAuthenticated || auth.role === "candidate") {
      return NextResponse.json(
        { error: "Chỉ nhà tuyển dụng mới có quyền cấu hình tiêu chí tuyển dụng." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { required_skills = [], preferred_skills = [] } = body;

    // 1. Verify Job exists
    const { data: job, error: jobErr } = await supabase
      .from("jobs")
      .select("id")
      .eq("id", jobId)
      .single();

    if (jobErr || !job) {
      return NextResponse.json({ error: "Tin tuyển dụng không tồn tại." }, { status: 404 });
    }

    // 2. Remove old criteria for this job to replace with new set
    await supabase.from("job_skills").delete().eq("job_id", jobId);

    const insertedList: any[] = [];

    // Helper to ensure skill exists in `skills` table
    const ensureSkill = async (skillName: string, category: string = "Technical"): Promise<string> => {
      const cleanName = skillName.trim();
      const { data: existing } = await supabase
        .from("skills")
        .select("id")
        .ilike("name", cleanName)
        .limit(1)
        .maybeSingle();

      if (existing) return existing.id;

      const newId = crypto.randomUUID();
      const { data: created, error } = await supabase
        .from("skills")
        .insert({
          id: newId,
          name: cleanName,
          category,
        })
        .select("id")
        .single();

      if (error || !created) {
        throw new Error(`Không thể khởi tạo kỹ năng ${cleanName}: ${error?.message}`);
      }

      return created.id;
    };

    // Insert required skills
    for (const item of required_skills) {
      const name = typeof item === "string" ? item : item.name;
      if (!name || !name.trim()) continue;
      const skillId = await ensureSkill(name);
      const newJsId = crypto.randomUUID();
      const { data: jsRecord } = await supabase
        .from("job_skills")
        .insert({
          id: newJsId,
          job_id: jobId,
          skill_id: skillId,
          is_required: true,
          category: typeof item === "object" ? item.category || "Technical" : "Technical",
        })
        .select()
        .single();

      if (jsRecord) insertedList.push({ name, is_required: true });
    }

    // Insert preferred skills
    for (const item of preferred_skills) {
      const name = typeof item === "string" ? item : item.name;
      if (!name || !name.trim()) continue;
      const skillId = await ensureSkill(name);
      const newJsId = crypto.randomUUID();
      const { data: jsRecord } = await supabase
        .from("job_skills")
        .insert({
          id: newJsId,
          job_id: jobId,
          skill_id: skillId,
          is_required: false,
          category: typeof item === "object" ? item.category || "Technical" : "Technical",
        })
        .select()
        .single();

      if (jsRecord) insertedList.push({ name, is_required: false });
    }

    return NextResponse.json({
      success: true,
      job_id: jobId,
      updated_count: insertedList.length,
      criteria: insertedList,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Lỗi cập nhật tiêu chí kỹ năng" },
      { status: 500 }
    );
  }
}

