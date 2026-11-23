import { NextRequest, NextResponse } from "next/server";
import { verifyServerSession } from "@/lib/auth-guard";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Thiếu email ứng viên" }, { status: 400 });
    }

    const { supabase, auth } = await verifyServerSession(req);

    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: "Yêu cầu đăng nhập." }, { status: 401 });
    }

    // If caller is authenticated as candidate, enforce that email matches their account
    if (auth.role === "candidate") {
      if (auth.email && auth.email.toLowerCase() !== email.toLowerCase()) {
        return NextResponse.json(
          { error: "Bạn không có quyền truy cập hồ sơ ứng tuyển của người khác." },
          { status: 403 }
        );
      }
    }

    // Find candidate by email
    const { data: cand } = await supabase
      .from("candidates")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (!cand) {
      return NextResponse.json({ applications: [] });
    }

    // Get applications
    const { data: apps, error } = await supabase
      .from("applications")
      .select(`
        id,
        current_stage,
        applied_at,
        job_id,
        resume_id,
        jobs (
          id,
          title,
          department,
          location,
          status
        )
      `)
      .eq("candidate_id", cand.id)
      .order("applied_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const stageMap: Record<string, { text: string; nextStep: string }> = {
      applied: {
        text: "Hồ sơ đã nộp thành công",
        nextStep: "Hồ sơ của bạn đang được phòng Nhân sự tiếp nhận và phân loại.",
      },
      screened: {
        text: "Đã qua vòng lọc hồ sơ",
        nextStep: "Hồ sơ kỹ thuật đã hoàn thành đánh giá và đang chờ xếp lịch trao đổi.",
      },
      review: {
        text: "Đang được chuyên môn thẩm định",
        nextStep: "Trưởng bộ phận đang xem xét kinh nghiệm và năng lực chuyên môn.",
      },
      interview: {
        text: "Vòng Phỏng vấn",
        nextStep: "Bạn đã được chọn vào vòng phỏng vấn. Vui lòng kiểm tra email để cập nhật lịch hẹn.",
      },
      offer: {
        text: "Thư mời nhận việc (Offer)",
        nextStep: "Chúc mừng bạn! Nhà tuyển dụng đang chuẩn bị thư mời nhận việc chính thức.",
      },
      hired: {
        text: "Tuyển dụng thành công",
        nextStep: "Chào mừng bạn gia nhập đội ngũ. Nhân sự sẽ liên hệ hướng dẫn onboarding.",
      },
      rejected: {
        text: "Chưa phù hợp đợt này",
        nextStep: "Hồ sơ của bạn được lưu trong kho dữ liệu tài năng cho các cơ hội tiếp theo.",
      },
    };

    const formatted = (apps || []).map((app: any) => {
      const stage = app.current_stage || "applied";
      const info = stageMap[stage] || stageMap.applied;
      const job = app.jobs || {};

      return {
        id: app.id,
        code: `TSC-${app.id.slice(0, 4).toUpperCase()}`,
        jobId: app.job_id,
        jobTitle: job.title || "Vị trí tuyển dụng",
        department: job.department || "Chung",
        location: job.location || "Toàn quốc",
        appliedDate: app.applied_at ? new Date(app.applied_at).toLocaleDateString("vi-VN") : "Gần đây",
        lastUpdated: app.applied_at ? new Date(app.applied_at).toLocaleDateString("vi-VN") : "Gần đây",
        status: stage,
        statusText: info.text,
        nextStep: info.nextStep,
      };
    });

    return NextResponse.json({ applications: formatted });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Lỗi nạp danh sách đơn ứng tuyển" }, { status: 500 });
  }
}

