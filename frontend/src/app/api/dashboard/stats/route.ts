import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  try {
    const supabase = createClient();

    // 1. Fetch counts
    const [jobsRes, candRes, appsRes] = await Promise.all([
      supabase.from("jobs").select("id, title, department, location, status, created_at").order("created_at", { ascending: false }),
      supabase.from("candidates").select("id", { count: "exact", head: true }),
      supabase.from("applications").select("id, current_stage, applied_at, candidate_id, job_id, candidates(full_name), jobs(title)").order("applied_at", { ascending: false }),
    ]);

    const jobs = jobsRes.data || [];
    const totalJobs = jobs.length;
    const totalCandidates = candRes.count || 0;
    const applications = appsRes.data || [];

    // Stage counts
    let appliedCount = 0;
    let screenedCount = 0;
    let reviewCount = 0;
    let interviewCount = 0;
    let offerCount = 0;
    let hiredCount = 0;

    applications.forEach((app: any) => {
      const stage = app.current_stage || "applied";
      if (stage === "applied") appliedCount++;
      else if (stage === "screened") screenedCount++;
      else if (stage === "review") reviewCount++;
      else if (stage === "interview") interviewCount++;
      else if (stage === "offer") offerCount++;
      else if (stage === "hired") hiredCount++;
    });

    const totalApplications = applications.length;

    // Funnel stages with calculated percentages
    const funnelStages = [
      {
        label: "Ứng tuyển",
        count: totalApplications,
        percent: totalApplications > 0 ? "100%" : "0%",
        color: "bg-[#E5E5E0]",
      },
      {
        label: "AI Sàng lọc",
        count: screenedCount,
        percent: totalApplications > 0 ? `${Math.round((screenedCount / totalApplications) * 100)}%` : "0%",
        color: "bg-[#CCFBF1]",
      },
      {
        label: "HR Duyệt",
        count: reviewCount,
        percent: totalApplications > 0 ? `${Math.round((reviewCount / totalApplications) * 100)}%` : "0%",
        color: "bg-[#99F6E4]",
      },
      {
        label: "Phỏng vấn",
        count: interviewCount,
        percent: totalApplications > 0 ? `${Math.round((interviewCount / totalApplications) * 100)}%` : "0%",
        color: "bg-[#5EEAD4]",
      },
      {
        label: "Offer",
        count: offerCount,
        percent: totalApplications > 0 ? `${Math.round((offerCount / totalApplications) * 100)}%` : "0%",
        color: "bg-[#2DD4BF]",
      },
      {
        label: "Đã tuyển",
        count: hiredCount,
        percent: totalApplications > 0 ? `${Math.round((hiredCount / totalApplications) * 100)}%` : "0%",
        color: "bg-[#0F766E]",
      },
    ];

    // Recent activities from applications
    const recentActivities = applications.slice(0, 5).map((app: any) => {
      const candName = app.candidates?.full_name || "Ứng viên mới";
      const jobTitle = app.jobs?.title || "Vị trí tuyển dụng";
      const createdDate = app.created_at ? new Date(app.created_at).toLocaleDateString("vi-VN") : "Gần đây";

      return {
        id: app.id,
        type: "application",
        text: `Hồ sơ ${candName} đã được nộp vào vị trí ${jobTitle}.`,
        time: createdDate,
        badge: app.current_stage === "interview" ? "Phỏng vấn" : "Ứng tuyển",
        badgeVariant: app.current_stage === "interview" ? "info" : "neutral",
      };
    });

    return NextResponse.json({
      kpis: {
        totalApplications,
        totalJobs,
        totalInterviews: interviewCount,
        totalOffers: offerCount,
        avgTimeToHire: totalApplications > 0 ? "14 ngày" : "--",
        successRate: totalApplications > 0 && hiredCount > 0 ? `${Math.round((hiredCount / totalApplications) * 100)}%` : "--",
      },
      funnelStages,
      activeJobs: jobs.slice(0, 4).map((j: any) => ({
        id: j.id,
        title: j.title,
        department: j.department || "Chung",
        location: j.location || "Toàn quốc",
        status: j.status === "open" ? "Đang mở" : "Đã đóng",
        priority: "Tiêu chuẩn",
        applicants: applications.filter((a: any) => a.job_id === j.id).length,
        screened: applications.filter((a: any) => a.job_id === j.id && a.current_stage !== "applied").length,
      })),
      recentActivities,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: err?.message || "Lỗi nạp dữ liệu bảng điều khiển",
        kpis: {
          totalApplications: 0,
          totalJobs: 0,
          totalInterviews: 0,
          totalOffers: 0,
          avgTimeToHire: "--",
          successRate: "--",
        },
        funnelStages: [],
        activeJobs: [],
        recentActivities: [],
      },
      { status: 500 }
    );
  }
}

