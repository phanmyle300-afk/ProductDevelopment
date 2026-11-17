import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();

    // 1. Fetch interviews
    const { data: interviews, error } = await supabase
      .from("interviews")
      .select("*");

    if (error) {
      return NextResponse.json(
        { error: `Lỗi truy vấn lịch phỏng vấn: ${error.message}`, interviews: [] },
        { status: 500 }
      );
    }

    if (!interviews || interviews.length === 0) {
      return NextResponse.json({ interviews: [] });
    }

    // 2. Fetch candidates & jobs for mapping
    const candidateIds = Array.from(new Set(interviews.map((i: any) => i.candidate_id).filter(Boolean)));
    const jobIds = Array.from(new Set(interviews.map((i: any) => i.job_id).filter(Boolean)));

    const [candRes, jobRes] = await Promise.all([
      candidateIds.length > 0
        ? supabase.from("candidates").select("id, full_name, email, phone").in("id", candidateIds)
        : Promise.resolve({ data: [] }),
      jobIds.length > 0
        ? supabase.from("jobs").select("id, title, department").in("id", jobIds)
        : Promise.resolve({ data: [] }),
    ]);

    const candMap = new Map((candRes.data || []).map((c: any) => [c.id, c]));
    const jobMap = new Map((jobRes.data || []).map((j: any) => [j.id, j]));

    const formatted = interviews.map((item: any) => ({
      ...item,
      candidates: candMap.get(item.candidate_id) || null,
      jobs: jobMap.get(item.job_id) || null,
    }));

    return NextResponse.json({ interviews: formatted });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Lỗi truy vấn lịch phỏng vấn", interviews: [] },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const body = await req.json();

    const { applicationId, candidateId, jobId, interviewerName, scheduledAt, meetingLink, notes } = body;

    if (!applicationId || !candidateId || !jobId) {
      return NextResponse.json(
        { error: "Thiếu thông tin application_id, candidate_id hoặc job_id" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("interviews")
      .insert({
        id: crypto.randomUUID(),
        application_id: applicationId,
        candidate_id: candidateId,
        job_id: jobId,
        interviewer_name: interviewerName?.trim() || "Ban Kỹ Thuật",
        scheduled_at: scheduledAt || new Date().toISOString(),
        meeting_link: meetingLink || "",
        status: "scheduled",
        feedback: notes || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update application stage to 'interview'
    await supabase
      .from("applications")
      .update({ current_stage: "interview" })
      .eq("id", applicationId);

    return NextResponse.json({ success: true, interview: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Lỗi tạo lịch phỏng vấn" },
      { status: 500 }
    );
  }
}
