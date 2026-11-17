import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();

    const { data: offers, error } = await supabase
      .from("offers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: `Lỗi truy vấn thư mời nhận việc: ${error.message}`, offers: [] },
        { status: 500 }
      );
    }

    if (!offers || offers.length === 0) {
      return NextResponse.json({ offers: [] });
    }

    const candidateIds = Array.from(new Set(offers.map((o: any) => o.candidate_id).filter(Boolean)));
    const jobIds = Array.from(new Set(offers.map((o: any) => o.job_id).filter(Boolean)));

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

    const formatted = offers.map((item: any) => ({
      ...item,
      candidates: candMap.get(item.candidate_id) || null,
      jobs: jobMap.get(item.job_id) || null,
    }));

    return NextResponse.json({ offers: formatted });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Lỗi truy vấn thư mời nhận việc", offers: [] },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const body = await req.json();

    const { applicationId, candidateId, jobId, salary, signOnBonus, startDate, status } = body;

    if (!applicationId || !candidateId || !jobId) {
      return NextResponse.json(
        { error: "Thiếu thông tin application_id, candidate_id hoặc job_id" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("offers")
      .insert({
        id: crypto.randomUUID(),
        application_id: applicationId,
        candidate_id: candidateId,
        job_id: jobId,
        salary: salary || "Thỏa thuận",
        sign_on_bonus: signOnBonus || null,
        start_date: startDate || null,
        status: status || "pending_approval",
        approved: false,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update application stage to 'offer'
    await supabase
      .from("applications")
      .update({ current_stage: "offer" })
      .eq("id", applicationId);

    return NextResponse.json({ success: true, offer: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Lỗi tạo đề nghị việc làm" },
      { status: 500 }
    );
  }
}
