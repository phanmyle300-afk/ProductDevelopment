import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  const env: Record<string, string> = { ...(process.env as Record<string, string>) };

  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf8").split("\n");
    for (const line of lines) {
      const parts = line.split("=");
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join("=").trim().replace(/^["']|["']$/g, "");
        if (key && !env[key]) {
          env[key] = val;
        }
      }
    }
  }

  return env;
}

export const SEED_IDS = {
  recruiterAuthId: "a0000000-0000-0000-0000-000000000001",
  candidateAuthId: "a0000000-0000-0000-0000-000000000002",
  jobId: "d1000000-0000-0000-0000-000000000001",
  candidates: {
    fullMatch: "c0000000-0000-0000-0000-000000000001",
    partialMatch: "c0000000-0000-0000-0000-000000000002",
    noMatch: "c0000000-0000-0000-0000-000000000003",
  },
  resumes: {
    fullMatch: "b0000000-0000-0000-0000-000000000001",
    partialMatch: "b0000000-0000-0000-0000-000000000002",
    noMatch: "b0000000-0000-0000-0000-000000000003",
  },
  applications: {
    fullMatch: "e0000000-0000-0000-0000-000000000001",
    partialMatch: "e0000000-0000-0000-0000-000000000002",
    noMatch: "e0000000-0000-0000-0000-000000000003",
  },
  skills: {
    react: "a1000000-0000-0000-0000-000000000001",
    typescript: "a1000000-0000-0000-0000-000000000002",
    nodejs: "a1000000-0000-0000-0000-000000000003",
    kubernetes: "a1000000-0000-0000-0000-000000000004",
    docker: "a1000000-0000-0000-0000-000000000005",
    graphql: "a1000000-0000-0000-0000-000000000006",
  },
};

async function main() {
  console.log("===============================================================");
  console.log("       TALENTSCOUT ATS - TEST SEED DATA GENERATOR              ");
  console.log("===============================================================\n");

  const env = loadEnv();
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || "https://dmtezrjlwqvxdzwmfwgk.supabase.co";
  const serviceKey = process.argv[2] || env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey) {
    console.log("⚠️  SUPABASE_SERVICE_ROLE_KEY chưa được đặt trong frontend/.env.local.");
    console.log("📌  Do Row Level Security (RLS) đang được kích hoạt an toàn trên Supabase,");
    console.log("    cách chạy seed NHANH và CHUẨN XÁC NHẤT là dùng file SQL có sẵn:\n");
    console.log("    👉 File: supabase/seed.sql\n");
    console.log("    Các bước thực hiện (mất 10 giây):");
    console.log("    1. Truy cập Supabase Dashboard: https://supabase.com/dashboard/project/dmtezrjlwqvxdzwmfwgk");
    console.log("    2. Chọn mục 'SQL Editor' ở thanh bên trái -> Click 'New Query'");
    console.log("    3. Dán toàn bộ nội dung file 'supabase/seed.sql' và bấm 'Run' (Ctrl + Enter)\n");
    console.log("    (Hoặc nếu có service_role key, bạn có thể chạy: npm run seed -- <SERVICE_ROLE_KEY>)\n");
    printSeedSummary();
    return;
  }

  console.log(`🔌 Kết nối Supabase với Service Role Key: ${supabaseUrl}`);
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    console.log("\n1. Tạo/cập nhật 2 tài khoản Auth mẫu qua Supabase Admin API...");
    try {
      await supabase.auth.admin.createUser({
        id: SEED_IDS.recruiterAuthId,
        email: "recruiter@test.com",
        password: "Test123!",
        email_confirm: true,
        user_metadata: { full_name: "Hoàng Minh Tuấn (Recruiter A)", role: "recruiter" },
      });
    } catch {
      // User may already exist, update password/metadata
      await supabase.auth.admin.updateUserById(SEED_IDS.recruiterAuthId, {
        password: "Test123!",
        user_metadata: { full_name: "Hoàng Minh Tuấn (Recruiter A)", role: "recruiter" },
      });
    }

    try {
      await supabase.auth.admin.createUser({
        id: SEED_IDS.candidateAuthId,
        email: "candidate@test.com",
        password: "Test123!",
        email_confirm: true,
        user_metadata: { full_name: "Nguyễn Văn An", role: "candidate" },
      });
    } catch {
      // User may already exist, update password/metadata
      await supabase.auth.admin.updateUserById(SEED_IDS.candidateAuthId, {
        password: "Test123!",
        user_metadata: { full_name: "Nguyễn Văn An", role: "candidate" },
      });
    }

    console.log("3. Tạo hồ sơ nhà tuyển dụng (public.users)...");
    await supabase.from("users").insert({
      id: SEED_IDS.recruiterAuthId,
      email: "recruiter@test.com",
      full_name: "Trần Tuyển Dụng",
      role: "recruiter",
      is_active: true,
    });

    console.log("4. Tạo 3 ứng viên mẫu (public.candidates)...");
    await supabase.from("candidates").insert([
      {
        id: SEED_IDS.candidates.fullMatch,
        user_id: SEED_IDS.candidateAuthId,
        full_name: "Nguyễn Văn An",
        email: "candidate@test.com",
        phone: "0901234567",
        location: "Hà Nội, Việt Nam",
        linkedin_url: "https://linkedin.com/in/nguyenvanan",
      },
      {
        id: SEED_IDS.candidates.partialMatch,
        user_id: null,
        full_name: "Trần Thị Bích",
        email: "bich.tran@test.com",
        phone: "0912345678",
        location: "TP. Hồ Chí Minh, Việt Nam",
        linkedin_url: "https://linkedin.com/in/tranthibich",
      },
      {
        id: SEED_IDS.candidates.noMatch,
        user_id: null,
        full_name: "Lê Hoàng Nam",
        email: "nam.le@test.com",
        phone: "0987654321",
        location: "Đà Nẵng, Việt Nam",
        linkedin_url: "https://linkedin.com/in/lehoangnam",
      },
    ]);

    console.log("5. Tạo tin tuyển dụng mẫu (Senior Frontend Developer)...");
    await supabase.from("jobs").insert({
      id: SEED_IDS.jobId,
      title: "Senior Frontend Developer",
      department: "Engineering",
      location: "Hà Nội (Hybrid)",
      salary_min: 30000000,
      salary_max: 55000000,
      status: "open",
      description: "Tuyển dụng Senior Frontend Developer thành thạo React, TypeScript, Node.js.",
    });

    console.log("6. Cấu hình tiêu chí kỹ năng (job_skills)...");
    await supabase.from("skills").upsert([
      { id: SEED_IDS.skills.react, name: "React", category: "Frontend" },
      { id: SEED_IDS.skills.typescript, name: "TypeScript", category: "Languages" },
      { id: SEED_IDS.skills.nodejs, name: "Node.js", category: "Backend" },
      { id: SEED_IDS.skills.kubernetes, name: "Kubernetes", category: "DevOps" },
      { id: SEED_IDS.skills.docker, name: "Docker", category: "DevOps" },
      { id: SEED_IDS.skills.graphql, name: "GraphQL", category: "API" },
    ]);

    await supabase.from("job_skills").insert([
      { job_id: SEED_IDS.jobId, skill_id: SEED_IDS.skills.react, is_required: true, category: "Frontend", weight: 1.0 },
      { job_id: SEED_IDS.jobId, skill_id: SEED_IDS.skills.typescript, is_required: true, category: "Languages", weight: 1.0 },
      { job_id: SEED_IDS.jobId, skill_id: SEED_IDS.skills.nodejs, is_required: true, category: "Backend", weight: 1.0 },
      { job_id: SEED_IDS.jobId, skill_id: SEED_IDS.skills.kubernetes, is_required: false, category: "DevOps", weight: 0.5 },
      { job_id: SEED_IDS.jobId, skill_id: SEED_IDS.skills.docker, is_required: false, category: "DevOps", weight: 0.5 },
      { job_id: SEED_IDS.jobId, skill_id: SEED_IDS.skills.graphql, is_required: false, category: "API", weight: 0.5 },
    ]);

    console.log("7. Tạo 3 hồ sơ CV mẫu (resumes)...");
    const rawCv1 = `<!-- TS_PARSED_DATA_START -->
{"skills":[{"name":"React","category":"Frontend","confidence":0.98,"evidence":"Xây dựng Single Page App quy mô lớn bằng React và TypeScript với Redux Toolkit"},{"name":"TypeScript","category":"Languages","confidence":0.95,"evidence":"Áp dụng strict type checking TypeScript cho toàn bộ kiến trúc frontend"},{"name":"Node.js","category":"Backend","confidence":0.92,"evidence":"Thiết kế Backend for Frontend (BFF) bằng Node.js và Express kết nối PostgreSQL"},{"name":"PostgreSQL","category":"Database","confidence":0.90,"evidence":"Tối ưu hóa câu truy vấn CSDL PostgreSQL và lập chỉ mục"},{"name":"Docker","category":"DevOps","confidence":0.88,"evidence":"Đóng gói ứng dụng web vào Docker container"},{"name":"GraphQL","category":"API","confidence":0.86,"evidence":"Tích hợp Apollo Client và truy vấn GraphQL API"}]}
<!-- TS_PARSED_DATA_END -->
NGUYỄN VĂN AN - SENIOR FRONTEND DEVELOPER
Kỹ năng: React, TypeScript, Node.js, PostgreSQL, Docker, GraphQL.`;

    const rawCv2 = `<!-- TS_PARSED_DATA_START -->
{"skills":[{"name":"React","category":"Frontend","confidence":0.95,"evidence":"Phát triển giao diện tương tác phức tạp bằng React và Next.js"},{"name":"TypeScript","category":"Languages","confidence":0.90,"evidence":"Xây dựng các component với TypeScript interfaces"},{"name":"Tailwind CSS","category":"Frontend","confidence":0.92,"evidence":"Thiết kế responsive layout sử dụng Tailwind CSS"}]}
<!-- TS_PARSED_DATA_END -->
TRẦN THỊ BÍCH - FRONTEND UI DEVELOPER
Kỹ năng: React, TypeScript, Tailwind CSS, HTML5/CSS3. Chưa có kinh nghiệm Node.js.`;

    const rawCv3 = `<!-- TS_PARSED_DATA_START -->
{"skills":[{"name":"PHP","category":"Backend","confidence":0.96,"evidence":"Lập trình backend bằng PHP 8"},{"name":"Laravel","category":"Backend","confidence":0.94,"evidence":"Xây dựng hệ thống bằng Laravel Framework"},{"name":"MySQL","category":"Database","confidence":0.92,"evidence":"Thiết kế CSDL quan hệ MySQL"}]}
<!-- TS_PARSED_DATA_END -->
LÊ HOÀNG NAM - PHP / LARAVEL DEVELOPER
Kỹ năng: PHP, Laravel, MySQL, WordPress, jQuery. Không có React, TypeScript, Node.js.`;

    await supabase.from("resumes").insert([
      {
        id: SEED_IDS.resumes.fullMatch,
        candidate_id: SEED_IDS.candidates.fullMatch,
        file_name: "Nguyen_Van_An_Senior_Frontend_CV.pdf",
        file_url: "resumes/Nguyen_Van_An_Senior_Frontend_CV.pdf",
        file_type: "pdf",
        file_size: 158420,
        parse_status: "parsed",
        raw_text: rawCv1,
      },
      {
        id: SEED_IDS.resumes.partialMatch,
        candidate_id: SEED_IDS.candidates.partialMatch,
        file_name: "Tran_Thi_Bich_Frontend_UI_CV.pdf",
        file_url: "resumes/Tran_Thi_Bich_Frontend_UI_CV.pdf",
        file_type: "pdf",
        file_size: 142100,
        parse_status: "parsed",
        raw_text: rawCv2,
      },
      {
        id: SEED_IDS.resumes.noMatch,
        candidate_id: SEED_IDS.candidates.noMatch,
        file_name: "Le_Hoang_Nam_PHP_Laravel_CV.pdf",
        file_url: "resumes/Le_Hoang_Nam_PHP_Laravel_CV.pdf",
        file_type: "pdf",
        file_size: 131800,
        parse_status: "parsed",
        raw_text: rawCv3,
      },
    ]);

    console.log("8. Tạo 3 đơn ứng tuyển liên kết (applications)...");
    await supabase.from("applications").insert([
      {
        id: SEED_IDS.applications.fullMatch,
        candidate_id: SEED_IDS.candidates.fullMatch,
        job_id: SEED_IDS.jobId,
        resume_id: SEED_IDS.resumes.fullMatch,
        current_stage: "applied",
        status: "active",
      },
      {
        id: SEED_IDS.applications.partialMatch,
        candidate_id: SEED_IDS.candidates.partialMatch,
        job_id: SEED_IDS.jobId,
        resume_id: SEED_IDS.resumes.partialMatch,
        current_stage: "applied",
        status: "active",
      },
      {
        id: SEED_IDS.applications.noMatch,
        candidate_id: SEED_IDS.candidates.noMatch,
        job_id: SEED_IDS.jobId,
        resume_id: SEED_IDS.resumes.noMatch,
        current_stage: "applied",
        status: "active",
      },
    ]);

    console.log("\n✅ ĐÃ SEED DỮ LIỆU THÀNH CÔNG VÀO SUPABASE!");
    printSeedSummary();
  } catch (err: any) {
    console.error("\n❌ Lỗi khi thực thi seed:", err.message);
  }
}

function printSeedSummary() {
  console.log("===============================================================");
  console.log("            DANH SÁCH ID BẢN GHI ĐÃ TẠO (SEED DATA)            ");
  console.log("===============================================================");
  console.log("\n[1. TÀI KHOẢN ĐĂNG NHẬP]");
  console.log(`- Nhà tuyển dụng (Recruiter):`);
  console.log(`    User ID:  ${SEED_IDS.recruiterAuthId}`);
  console.log(`    Email:    recruiter@test.com`);
  console.log(`    Mật khẩu: Test123!`);
  console.log(`- Ứng viên (Candidate):`);
  console.log(`    User ID:  ${SEED_IDS.candidateAuthId}`);
  console.log(`    Email:    candidate@test.com`);
  console.log(`    Mật khẩu: Test123!`);

  console.log("\n[2. TIN TUYỂN DỤNG (JOB)]");
  console.log(`- Job ID:    ${SEED_IDS.jobId}`);
  console.log(`  Tiêu đề:   Senior Frontend Developer`);
  console.log(`  Bắt buộc:  React, TypeScript, Node.js`);
  console.log(`  Ưu tiên:   Kubernetes, Docker, GraphQL`);

  console.log("\n[3. ỨNG VIÊN & CV MẪU (3 TRƯỜNG HỢP KIỂM THỬ)]");
  console.log(`- CV 1 (Khớp 100% Required Skills: React, TypeScript, Node.js):`);
  console.log(`    Candidate ID:   ${SEED_IDS.candidates.fullMatch}`);
  console.log(`    Resume ID:      ${SEED_IDS.resumes.fullMatch}`);
  console.log(`    Application ID: ${SEED_IDS.applications.fullMatch}`);
  console.log(`    Tên ứng viên:   Nguyễn Văn An (candidate@test.com)`);
  console.log(`- CV 2 (Khớp một phần: có React, TypeScript, THIẾU Node.js):`);
  console.log(`    Candidate ID:   ${SEED_IDS.candidates.partialMatch}`);
  console.log(`    Resume ID:      ${SEED_IDS.resumes.partialMatch}`);
  console.log(`    Application ID: ${SEED_IDS.applications.partialMatch}`);
  console.log(`    Tên ứng viên:   Trần Thị Bích (bich.tran@test.com)`);
  console.log(`- CV 3 (Không khớp: thuần PHP, Laravel, MySQL, WordPress):`);
  console.log(`    Candidate ID:   ${SEED_IDS.candidates.noMatch}`);
  console.log(`    Resume ID:      ${SEED_IDS.resumes.noMatch}`);
  console.log(`    Application ID: ${SEED_IDS.applications.noMatch}`);
  console.log(`    Tên ứng viên:   Lê Hoàng Nam (nam.le@test.com)`);
  console.log("===============================================================\n");
}

main();
