// TalentScout - Core Mock Data & Scoring Knowledge Base
// Phục vụ ATS Studio & LLM Screening Engine

const JOB_REQUISITION = {
  job_id: "JOB-FS-2026",
  title: "Senior Fullstack Engineer (Python + React)",
  department: "Core Product Engineering",
  level: "Senior Level",
  location: "TP. Hồ Chí Minh (Hybrid / Remote-friendly)",
  salary_range: "2,500$ - 3,500$ / month",
  min_experience_years: 4.0,
  min_education: "Cử nhân (Bachelor of CS/SE)",
  mandatory_skills: ["Python", "FastAPI", "React", "Docker"],
  preferred_skills: ["PostgreSQL", "Redis", "TypeScript", "AWS", "Kubernetes", "GraphQL"],
  weights: {
    skills: 40,
    experience: 30,
    education: 15,
    semantic: 15
  },
  description: "TalentScout đang tìm kiếm Kỹ sư Fullstack Cấp cao dẫn dắt kiến trúc sản phẩm AI ATS thế hệ mới, tối ưu hóa các pipeline xử lý bất đồng bộ, tích hợp mô hình LLM và xây dựng giao diện người dùng thời gian thực mượt mà."
};

const INITIAL_CANDIDATES = [
  {
    id: "cand-001",
    blind_id: "Candidate #TSC-9481",
    name: "Trần Bảo Nam",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80",
    email: "baonam.tran@email.com",
    phone: "0912.345.678",
    university: "Đại học Bách Khoa TP.HCM",
    degree: "Cử nhân Khoa học Máy tính",
    experience_years: 4.5,
    stage: "screened",
    overall_score: 92,
    category: "STRONG_HIRE",
    applied_date: "2026-09-12",
    summary: "Kỹ sư Fullstack với 4.5 năm kinh nghiệm xây dựng hệ thống FinTech xử lý giao dịch cao bằng FastAPI và React. Dày dặn kinh nghiệm triển khai Docker và kiến trúc Microservices.",
    skills: ["Python", "FastAPI", "React", "Docker", "PostgreSQL", "Redis", "Git", "Linux", "TypeScript"],
    score_breakdown: {
      skills: 95,
      experience: 100,
      education: 85,
      semantic: 92
    },
    matched_skills: ["Python", "FastAPI", "React", "Docker", "PostgreSQL", "Redis", "TypeScript"],
    missing_mandatory: [],
    missing_preferred: ["AWS", "Kubernetes"],
    strengths: [
      "Có 4.5 năm kinh nghiệm thực tế với FastAPI và React, vượt mốc yêu cầu tối thiểu (4.0 năm).",
      "Đáp ứng 100% kỹ năng bắt buộc (Python, FastAPI, React, Docker) mà không bị phạt điểm.",
      "Kinh nghiệm sâu về cache Redis và thiết kế CSDL quan hệ PostgreSQL chịu tải cao.",
      "Vector ngữ nghĩa tương đồng 92% với mục tiêu phát triển hệ thống của TalentScout."
    ],
    skill_gaps: [
      "Chưa có kinh nghiệm thực chiến với Kubernetes ở quy mô production.",
      "Kiến thức điện toán đám mây AWS ở mức cơ bản, cần trau dồi thêm."
    ],
    interview_questions: [
      "Bạn đã từng tối ưu hóa hiệu năng FastAPI khi xử lý hàng ngàn request bất đồng bộ đồng thời như thế nào?",
      "Hãy chia sẻ về cấu trúc State Management trong ứng dụng React lớn nhất bạn từng xây dựng.",
      "Cách bạn thiết kế cơ chế rate-limiting hoặc caching bằng Redis để chống quá tải hệ thống?"
    ]
  },
  {
    id: "cand-002",
    blind_id: "Candidate #TSC-7723",
    name: "Nguyễn Thị Mai",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=160&q=80",
    email: "mai.nguyen.frontend@email.com",
    phone: "0988.765.432",
    university: "Đại học Khoa học Tự nhiên",
    degree: "Cử nhân Kỹ thuật Phần mềm",
    experience_years: 3.2,
    stage: "applied",
    overall_score: 68,
    category: "CONSIDER",
    applied_date: "2026-09-14",
    summary: "Frontend Developer 3.2 năm kinh nghiệm chuyên sâu về React, TypeScript và tối ưu hóa trải nghiệm UI/UX. Đang học hỏi thêm về Python backend.",
    skills: ["React", "TypeScript", "HTML/CSS", "Redux", "Node.js", "PostgreSQL", "TailwindCSS"],
    score_breakdown: {
      skills: 55,
      experience: 80,
      education: 85,
      semantic: 72
    },
    matched_skills: ["React", "TypeScript", "PostgreSQL"],
    missing_mandatory: ["Python", "FastAPI", "Docker"],
    missing_preferred: ["Redis", "AWS", "Kubernetes"],
    strengths: [
      "Thế mạnh vượt trội về kiến trúc Frontend, React, TypeScript và quản lý trạng thái phức tạp.",
      "Tư duy thiết kế UI/UX hiện đại, nhạy bén với trải nghiệm người dùng cuối.",
      "Nền tảng học vấn vững chắc từ trường Đại học Khoa học Tự nhiên."
    ],
    skill_gaps: [
      "Thiếu các kỹ năng backend cốt lõi: Python, FastAPI và công cụ container Docker (bị áp dụng quy tắc phạt 25% điểm kỹ năng).",
      "Kinh nghiệm 3.2 năm (chưa đạt mốc 4.0 năm yêu cầu cho vị trí Senior)."
    ],
    interview_questions: [
      "Với định hướng trở thành Fullstack, bạn đã từng tự xây dựng API bằng Python hoặc FastAPI chưa?",
      "Nếu được tuyển dụng, kế hoạch để bạn làm chủ Docker và triển khai backend trong 30 ngày đầu sẽ như thế nào?",
      "Bạn tối ưu Web Vitals (FCP, LCP, CLS) trên ứng dụng React bằng những phương pháp cụ thể nào?"
    ]
  },
  {
    id: "cand-003",
    blind_id: "Candidate #TSC-4129",
    name: "Lê Hoàng Long",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80",
    email: "long.le.dev@email.com",
    phone: "0903.112.233",
    university: "Đại học Bách Khoa Hà Nội",
    degree: "Thạc sĩ Khoa học Dữ liệu",
    experience_years: 5.0,
    stage: "interview",
    overall_score: 88,
    category: "STRONG_HIRE",
    applied_date: "2026-09-10",
    summary: "Senior Backend / Cloud Engineer 5 năm kinh nghiệm với Python, kiến trúc phân tán FastAPI, Docker và Kubernetes trên AWS.",
    skills: ["Python", "FastAPI", "Docker", "AWS", "Kubernetes", "PostgreSQL", "Redis", "Kafka"],
    score_breakdown: {
      skills: 85,
      experience: 100,
      education: 95,
      semantic: 86
    },
    matched_skills: ["Python", "FastAPI", "Docker", "AWS", "Kubernetes", "PostgreSQL", "Redis"],
    missing_mandatory: ["React"],
    missing_preferred: ["TypeScript"],
    strengths: [
      "Kinh nghiệm 5 năm dày dặn, vượt yêu cầu vị trí; bằng Thạc sĩ Khoa học Dữ liệu.",
      "Cực mạnh về Backend Python, FastAPI, kiến trúc chịu tải phân tán, Docker, K8s và AWS.",
      "Điểm ngữ nghĩa kỹ thuật rất cao (86%), phù hợp làm Core Engineering."
    ],
    skill_gaps: [
      "Thiếu kỹ năng React trong phần bắt buộc, chủ yếu mạnh về Backend API và hạ tầng Cloud."
    ],
    interview_questions: [
      "Vị trí này đòi hỏi Fullstack làm cả giao diện React, kinh nghiệm làm việc của bạn với các nhóm Frontend như thế nào?",
      "Bạn đã từng thiết kế kiến trúc CI/CD với Docker và Kubernetes trên AWS cho hệ thống microservices ra sao?",
      "Chiến lược giám sát độ trễ (latency) và observability của bạn cho các FastAPI backend?"
    ]
  },
  {
    id: "cand-004",
    blind_id: "Candidate #TSC-3512",
    name: "Phạm Thảo Vy",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=160&q=80",
    email: "thaovy.pham@techfirm.vn",
    phone: "0971.998.877",
    university: "Đại học FPT",
    degree: "Kỹ sư Kỹ thuật Phần mềm",
    experience_years: 4.0,
    stage: "offer",
    overall_score: 86,
    category: "STRONG_HIRE",
    applied_date: "2026-09-08",
    summary: "Fullstack Developer 4 năm kinh nghiệm với Python/Django/FastAPI và React/TypeScript. Đã dẫn dắt phát triển hệ thống quản lý tuyển dụng nội bộ.",
    skills: ["Python", "FastAPI", "React", "Docker", "TypeScript", "PostgreSQL", "Git", "CI/CD"],
    score_breakdown: {
      skills: 90,
      experience: 100,
      education: 80,
      semantic: 88
    },
    matched_skills: ["Python", "FastAPI", "React", "Docker", "TypeScript", "PostgreSQL"],
    missing_mandatory: [],
    missing_preferred: ["Redis", "Kubernetes", "AWS"],
    strengths: [
      "Đạt trọn vẹn 100% mandatory skills và đã từng xây dựng giải pháp ATS nội bộ tương tự.",
      "Kinh nghiệm 4 năm vững vàng, cân bằng cả Frontend (React/TS) và Backend (FastAPI).",
      "Văn hóa làm việc chủ động, kỹ năng giao tiếp và thuyết trình kỹ thuật xuất sắc."
    ],
    skill_gaps: [
      "Chưa có nhiều kinh nghiệm với AWS cloud dịch vụ sâu."
    ],
    interview_questions: [
      "Dự án ATS nội bộ trước đây của bạn gặp khó khăn lớn nhất ở bước nào và bạn giải quyết ra sao?",
      "Cách bạn xử lý xung đột kéo thả dữ liệu thời gian thực trên Kanban board khi nhiều user cùng chỉnh sửa?"
    ]
  },
  {
    id: "cand-005",
    blind_id: "Candidate #TSC-1804",
    name: "Vũ Quốc Anh",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80",
    email: "quocanh.vu@personal.me",
    phone: "0934.567.890",
    university: "Đại học Công nghệ - ĐHQGHN",
    degree: "Cử nhân CNTT",
    experience_years: 1.5,
    stage: "rejected",
    overall_score: 42,
    category: "NOT_MATCH",
    applied_date: "2026-09-13",
    summary: "Junior Developer 1.5 năm kinh nghiệm, yêu thích công nghệ mới, đã làm quen với Python cơ bản và HTML/CSS.",
    skills: ["Python", "HTML/CSS", "JavaScript", "MySQL", "Git"],
    score_breakdown: {
      skills: 35,
      experience: 37,
      education: 80,
      semantic: 48
    },
    matched_skills: ["Python"],
    missing_mandatory: ["FastAPI", "React", "Docker"],
    missing_preferred: ["PostgreSQL", "Redis", "TypeScript", "AWS", "Kubernetes"],
    strengths: [
      "Nền tảng tư duy toán và giải thuật tốt từ Đại học Công nghệ.",
      "Tinh thần ham học hỏi, đã hoàn thành các khóa học lập trình trực tuyến."
    ],
    skill_gaps: [
      "Kinh nghiệm thực tế chỉ đạt 1.5 năm, quá thấp so với tiêu chuẩn vị trí Senior (4.0 năm).",
      "Thiếu hầu hết kỹ năng sản phẩm bắt buộc: FastAPI, React, Docker.",
      "Chưa có kinh nghiệm với các hệ thống phân tán chịu tải lớn."
    ],
    interview_questions: [
      "Hiện tại trình độ phù hợp với bậc Junior/Fresher, bạn có sẵn sàng ứng tuyển vị trí thực tập sinh hoặc Junior Backend không?"
    ]
  },
  {
    id: "cand-006",
    blind_id: "Candidate #TSC-6650",
    name: "Đỗ Gia Hưng",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=160&q=80",
    email: "giahung.do@devlab.io",
    phone: "0963.221.144",
    university: "Đại học Sư phạm Kỹ thuật",
    degree: "Kỹ sư Công nghệ Thông tin",
    experience_years: 4.2,
    stage: "screened",
    overall_score: 79,
    category: "INTERVIEW",
    applied_date: "2026-09-11",
    summary: "Fullstack Web Developer 4.2 năm kinh nghiệm làm việc với Python, React, PostgreSQL và Docker trong các dự án thương mại điện tử.",
    skills: ["Python", "Django", "FastAPI", "React", "Docker", "PostgreSQL", "Bootstrap"],
    score_breakdown: {
      skills: 80,
      experience: 100,
      education: 80,
      semantic: 76
    },
    matched_skills: ["Python", "FastAPI", "React", "Docker", "PostgreSQL"],
    missing_mandatory: [],
    missing_preferred: ["Redis", "TypeScript", "AWS", "Kubernetes"],
    strengths: [
      "Đạt đủ cả 4 kỹ năng bắt buộc: Python, FastAPI, React, Docker.",
      "Kinh nghiệm 4.2 năm làm sản phẩm E-commerce thực tế, xử lý thanh toán và đơn hàng.",
      "Khả năng thích ứng nhanh và làm việc độc lập tốt."
    ],
    skill_gaps: [
      "Chưa sử dụng TypeScript trong React, chủ yếu code JavaScript thuần.",
      "Chưa có kinh nghiệm về Redis caching và Cloud AWS."
    ],
    interview_questions: [
      "Khi chuyển từ JavaScript sang TypeScript trên một codebase React sẵn có, chiến lược của bạn là gì?",
      "Bạn đã từng tối ưu hóa câu truy vấn phức tạp trên PostgreSQL trong dự án E-commerce như thế nào?"
    ]
  }
];

// Preset sample files for quick 1-click test in Resume Upload modal
const SAMPLE_PRESETS = [
  {
    name: "Lê Minh Khoa - Senior AI & Python Specialist",
    filename: "Le_Minh_Khoa_Resume.pdf",
    filesize: "1.4 MB",
    exp: 5.5,
    skills: ["Python", "FastAPI", "React", "Docker", "PostgreSQL", "Redis", "TypeScript", "AWS", "PyTorch"],
    score: 95,
    category: "STRONG_HIRE",
    summary: "Lead Fullstack & AI Engineer với 5.5 năm kinh nghiệm, tích hợp LLM vào ứng dụng SaaS thực tế.",
    university: "Đại học Bách Khoa TP.HCM"
  },
  {
    name: "Phan Yến Nhi - Frontend React Specialist",
    filename: "Phan_Yen_Nhi_CV.docx",
    filesize: "890 KB",
    exp: 3.5,
    skills: ["React", "TypeScript", "Redux", "TailwindCSS", "Next.js", "Docker"],
    score: 72,
    category: "INTERVIEW",
    summary: "Frontend Engineer 3.5 năm kinh nghiệm chuyên sâu về React/Next.js, đam mê thiết kế UI/UX.",
    university: "Đại học Công nghệ Thông tin - ĐHQG TP.HCM"
  },
  {
    name: "Hoàng Văn Tuấn - Fresher Backend Developer",
    filename: "Hoang_Van_Tuan_CV.pdf",
    filesize: "650 KB",
    exp: 0.8,
    skills: ["Python", "Flask", "SQLite", "Git"],
    score: 38,
    category: "NOT_MATCH",
    summary: "Sinh viên mới tốt nghiệp ngành CNTT, nắm vững kiến thức lập trình cơ bản và Python.",
    university: "Đại học Giao Thông Vận Tải"
  }
];
