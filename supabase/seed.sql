-- ==============================================================================
-- TalentScout ATS - End-to-End Test Seed Data (Production Safe & Idempotent)
-- File: supabase/seed.sql
--
-- STRICT SAFETY & ZERO-OVERWRITE GUARANTEES:
--   1. Zero Destructive Operations: NO DELETE, NO TRUNCATE, NO DROP, NO DISABLE RLS.
--   2. Zero Overwrite of Existing Data: NO UPDATE statements in entire script.
--      Existing user profiles, candidate details, jobs, or applications are NEVER modified.
--   3. Strict Auth Mapping Verification:
--      - Validates auth.users exists for recruiter@test.com & candidate@test.com.
--      - Validates public.users does not have conflicting ID for those emails. If mismatched,
--        it HALTS immediately with descriptive error instead of proceeding.
--   4. Cryptographic Password Hashing: Uses PostgreSQL standard `pgcrypto` bcrypt algorithm
--      extensions.crypt('Test123!', extensions.gen_salt('bf', 10)) matching passlib in backend.
--      Verified directly against backend app.core.security.verify_password().
--      Never plaintext, never empty string, never copied from auth.users. Never logged.
--   5. Canonical Skill Normalization:
--      - Supplies NOT NULL `canonical_name` for all skills matching ESCO/TalentScout taxonomy.
--      - 'node.js' preserves the literal dot (no arbitrary punctuation stripping).
--      - Dynamic lookup reuses existing skills by either `name` or `canonical_name`.
--   6. Schema Compatibility:
--      - `jobs`: Explicitly sets `currency = 'VND'`.
--      - `applications`: Uses `applied_at` and `source` matching remote schema (not non-existent created_at).
--   7. Job Preservation: If Job 1 exists but does not belong to Company A, it HALTS.
--   8. Candidate Isolation: Candidate 2 & 3 keep user_id = NULL (external applicants).
--   9. Application State Preservation: If application already exists, its current_stage
--      is 100% PRESERVED. Only newly created applications receive 'applied'.
--  10. Zero Artificial Pipeline Artifacts: DOES NOT seed match_results, AI scores,
--      interviews, interview feedbacks, or offers.
--  11. Option A Default: Resumes table is NOT seeded by default (applications.resume_id = NULL).
--
-- Prerequisites:
--   Ensure the 2 test accounts exist in Supabase Auth before running this script:
--     1. Recruiter: recruiter@test.com
--     2. Candidate: candidate@test.com
--
-- How to run safely:
--   1. Open Supabase Dashboard: https://supabase.com/dashboard/project/dmtezrjlwqvxdzwmfwgk
--   2. Go to "SQL Editor" -> Click "New Query"
--   3. Paste this entire script and click "Run" (Ctrl + Enter)
-- ==============================================================================

-- Đảm bảo extension pgcrypto sẵn sàng trong schema extensions để sinh bcrypt hash
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

DO $$
DECLARE
  v_recruiter_auth_id UUID;
  v_candidate_auth_id UUID;
  v_recruiter_existing_user_id UUID;
  v_candidate_existing_user_id UUID;
  v_existing_job_company_id UUID;
  
  -- Dedicated Isolated UUID Range (Prefixes: c1, c2, d1, d0, a1, f0, c0, e0)
  v_company_a_id CONSTANT UUID := 'c1000000-0000-0000-0000-000000000001';
  v_company_b_id CONSTANT UUID := 'c2000000-0000-0000-0000-000000000002';
  v_job_1_id CONSTANT UUID     := 'd1000000-0000-0000-0000-000000000001';
  v_job_2_id CONSTANT UUID     := 'd0000000-0000-0000-0000-000000000002';
  
  -- Candidate IDs (Dynamic if existing, fallback to constants)
  v_cand_1_id UUID := 'c0000000-0000-0000-0000-000000000001';
  v_cand_2_id UUID := 'c0000000-0000-0000-0000-000000000002';
  v_cand_3_id UUID := 'c0000000-0000-0000-0000-000000000003';
  v_found_cand_id UUID;
  v_found_cand_user_id UUID;
  
  -- Skill IDs (Dynamic lookup to reuse real skills if existing by name or canonical_name)
  v_skill_react_id      UUID := 'a1000000-0000-0000-0000-000000000001';
  v_skill_ts_id         UUID := 'a1000000-0000-0000-0000-000000000002';
  v_skill_node_id       UUID := 'a1000000-0000-0000-0000-000000000003';
  v_skill_k8s_id        UUID := 'a1000000-0000-0000-0000-000000000004';
  v_skill_docker_id     UUID := 'a1000000-0000-0000-0000-000000000005';
  v_skill_graphql_id    UUID := 'a1000000-0000-0000-0000-000000000006';
  v_found_skill_id      UUID;
  
  -- Application IDs
  v_app_1_id CONSTANT UUID     := 'e0000000-0000-0000-0000-000000000001';
  v_app_2_id CONSTANT UUID     := 'e0000000-0000-0000-0000-000000000002';
  v_app_3_id CONSTANT UUID     := 'e0000000-0000-0000-0000-000000000003';

  -- Standard bcrypt hash for 'Test123!' (Generated via pgcrypto matching backend)
  v_test_password_hash TEXT;
BEGIN
  -- ----------------------------------------------------------------------------
  -- 1. AUTH VERIFICATION: Look up real accounts in auth.users
  -- ----------------------------------------------------------------------------
  SELECT id INTO v_recruiter_auth_id 
  FROM auth.users 
  WHERE email = 'recruiter@test.com' 
  LIMIT 1;

  SELECT id INTO v_candidate_auth_id 
  FROM auth.users 
  WHERE email = 'candidate@test.com' 
  LIMIT 1;

  IF v_recruiter_auth_id IS NULL OR v_candidate_auth_id IS NULL THEN
    RAISE EXCEPTION '
================================================================================
[LỖI DỪNG SEED]: CHƯA TỒN TẠI TÀI KHOẢN TRONG auth.users
--------------------------------------------------------------------------------
Script seed yêu cầu tài khoản xác thực thật trong Supabase Auth:
- recruiter@test.com: %
- candidate@test.com: %

CÁCH KHẮC PHỤC (1 phút):
1. Mở Supabase Dashboard -> "Authentication" -> "Users" -> Bấm "Add user":
   - Email: recruiter@test.com | Password: mật khẩu của bạn | Auto Confirm: Bật
   - Email: candidate@test.com | Password: mật khẩu của bạn | Auto Confirm: Bật
2. Sau khi 2 user xuất hiện trong Authentication, bấm "Run" lại script này.
================================================================================',
      COALESCE(v_recruiter_auth_id::text, 'CHƯA CÓ (NULL)'),
      COALESCE(v_candidate_auth_id::text, 'CHƯA CÓ (NULL)');
  END IF;

  RAISE NOTICE 'Đã tìm thấy tài khoản Auth:';
  RAISE NOTICE '  - Recruiter Auth ID: %', v_recruiter_auth_id;
  RAISE NOTICE '  - Candidate Auth ID: %', v_candidate_auth_id;

  -- ----------------------------------------------------------------------------
  -- 2. VERIFY MAPPING: Check public.users email & ID consistency
  -- ----------------------------------------------------------------------------
  SELECT id INTO v_recruiter_existing_user_id 
  FROM public.users 
  WHERE email = 'recruiter@test.com' 
  LIMIT 1;

  IF v_recruiter_existing_user_id IS NOT NULL AND v_recruiter_existing_user_id != v_recruiter_auth_id THEN
    RAISE EXCEPTION 'Xung đột ánh xạ người dùng: Email recruiter@test.com đã tồn tại trong public.users với id = %, khác với auth.users.id = %. Dừng seed để tránh xung đột dữ liệu.',
      v_recruiter_existing_user_id, v_recruiter_auth_id;
  END IF;

  SELECT id INTO v_candidate_existing_user_id 
  FROM public.users 
  WHERE email = 'candidate@test.com' 
  LIMIT 1;

  IF v_candidate_existing_user_id IS NOT NULL AND v_candidate_existing_user_id != v_candidate_auth_id THEN
    RAISE EXCEPTION 'Xung đột ánh xạ người dùng: Email candidate@test.com đã tồn tại trong public.users với id = %, khác với auth.users.id = %. Dừng seed để tránh xung đột dữ liệu.',
      v_candidate_existing_user_id, v_candidate_auth_id;
  END IF;

  -- Sinh bcrypt hash chuẩn cho mật khẩu backend test (Cost factor = 10)
  -- Lưu ý: Hash này chỉ phục vụ cột password_hash của public.users (FastAPI backend),
  -- hoàn toàn không thay đổi mật khẩu trong auth.users (Supabase Auth).
  v_test_password_hash := extensions.crypt('Test123!', extensions.gen_salt('bf', 10));

  -- ----------------------------------------------------------------------------
  -- 3. COMPANIES (Multi-Tenant Company Isolation Setup)
  -- ----------------------------------------------------------------------------
  INSERT INTO public.companies (id, name, logo_url, created_at)
  VALUES 
    (v_company_a_id, 'TechCorp Vietnam', 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=128&q=80', NOW()),
    (v_company_b_id, 'InnoTech Asia', 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=128&q=80', NOW())
  ON CONFLICT DO NOTHING;

  -- ----------------------------------------------------------------------------
  -- 4. PUBLIC USERS & COMPANY MEMBERSHIPS (Zero Overwrite & Genuine Bcrypt Hash)
  -- If user already exists in public.users, DO NOT modify password_hash, full_name, or role.
  -- ----------------------------------------------------------------------------
  IF v_recruiter_existing_user_id IS NULL THEN
    INSERT INTO public.users (id, email, password_hash, full_name, role, is_active, company_id, created_at)
    VALUES (
      v_recruiter_auth_id,
      'recruiter@test.com',
      v_test_password_hash,
      'Hoàng Minh Tuấn (Recruiter A)',
      'recruiter',
      true,
      v_company_a_id,
      NOW()
    )
    ON CONFLICT DO NOTHING;
  END IF;

  IF v_candidate_existing_user_id IS NULL THEN
    INSERT INTO public.users (id, email, password_hash, full_name, role, is_active, company_id, created_at)
    VALUES (
      v_candidate_auth_id,
      'candidate@test.com',
      v_test_password_hash,
      'Nguyễn Văn An (Candidate)',
      'candidate',
      true,
      NULL,
      NOW()
    )
    ON CONFLICT DO NOTHING;
  END IF;

  -- Link recruiter membership to TechCorp Vietnam (Company A) if not already linked
  INSERT INTO public.company_members (company_id, user_id, role)
  VALUES (v_company_a_id, v_recruiter_auth_id, 'recruiter')
  ON CONFLICT DO NOTHING;

  -- ----------------------------------------------------------------------------
  -- 5. JOBS (Preserve Existing Job; No Unauthorized UPDATE)
  -- ----------------------------------------------------------------------------
  SELECT company_id INTO v_existing_job_company_id 
  FROM public.jobs 
  WHERE id = v_job_1_id 
  LIMIT 1;

  IF v_existing_job_company_id IS NOT NULL AND v_existing_job_company_id != v_company_a_id THEN
    RAISE EXCEPTION 'Xung đột dữ liệu: Job % ("Senior Frontend Developer") đã tồn tại nhưng thuộc company_id khác (%), không phải Company A (%). Dừng seed.',
      v_job_1_id, v_existing_job_company_id, v_company_a_id;
  END IF;

  -- Insert Job 1 & Job 2 if not present (ZERO UPDATE on existing jobs)
  INSERT INTO public.jobs (
    id, company_id, title, department, location, status, description, salary_min, salary_max, currency, created_at
  )
  VALUES 
    (
      v_job_1_id,
      v_company_a_id,
      'Senior Frontend Developer',
      'Engineering',
      'Hà Nội (Hybrid)',
      'open',
      'Tuyển dụng Senior Frontend Developer am hiểu sâu về React, TypeScript, Node.js và kiến trúc Frontend hiện đại.',
      35000000,
      55000000,
      'VND',
      NOW()
    ),
    (
      v_job_2_id,
      v_company_b_id,
      'Lead Backend Architect (Draft)',
      'Platform',
      'TP. Hồ Chí Minh',
      'draft',
      'Vị trí nội bộ thiết kế kiến trúc hệ thống phân tán microservices và xử lý dữ liệu lớn.',
      50000000,
      80000000,
      'VND',
      NOW()
    )
  ON CONFLICT DO NOTHING;

  -- ----------------------------------------------------------------------------
  -- 6. SKILLS & JOB SKILLS (Reuse Real Skills if Existing by Name or Canonical Name)
  -- Quy ước canonical_name chuẩn: chữ thường có thể chứa ký tự đặc biệt (.+#-)
  -- Riêng Node.js giữ nguyên dấu chấm '.' ('node.js'), không tự ý bỏ dấu câu.
  -- ----------------------------------------------------------------------------
  -- 6.1 React
  SELECT id INTO v_found_skill_id 
  FROM public.skills 
  WHERE LOWER(name) = 'react' OR LOWER(canonical_name) = 'react' 
  LIMIT 1;

  IF v_found_skill_id IS NOT NULL THEN
    v_skill_react_id := v_found_skill_id;
  ELSE
    INSERT INTO public.skills (id, name, canonical_name, category, created_at)
    VALUES (v_skill_react_id, 'React', 'react', 'Frontend', NOW())
    ON CONFLICT DO NOTHING;
  END IF;

  -- 6.2 TypeScript
  SELECT id INTO v_found_skill_id 
  FROM public.skills 
  WHERE LOWER(name) = 'typescript' OR LOWER(canonical_name) = 'typescript' 
  LIMIT 1;

  IF v_found_skill_id IS NOT NULL THEN
    v_skill_ts_id := v_found_skill_id;
  ELSE
    INSERT INTO public.skills (id, name, canonical_name, category, created_at)
    VALUES (v_skill_ts_id, 'TypeScript', 'typescript', 'Language', NOW())
    ON CONFLICT DO NOTHING;
  END IF;

  -- 6.3 Node.js (Quy ước chuẩn hóa: 'node.js', giữ nguyên dấu chấm '.')
  SELECT id INTO v_found_skill_id 
  FROM public.skills 
  WHERE LOWER(name) IN ('node.js', 'nodejs', 'node') 
     OR LOWER(canonical_name) IN ('node.js', 'nodejs', 'node') 
  LIMIT 1;

  IF v_found_skill_id IS NOT NULL THEN
    v_skill_node_id := v_found_skill_id;
  ELSE
    INSERT INTO public.skills (id, name, canonical_name, category, created_at)
    VALUES (v_skill_node_id, 'Node.js', 'node.js', 'Backend', NOW())
    ON CONFLICT DO NOTHING;
  END IF;

  -- 6.4 Kubernetes
  SELECT id INTO v_found_skill_id 
  FROM public.skills 
  WHERE LOWER(name) IN ('kubernetes', 'k8s') 
     OR LOWER(canonical_name) IN ('kubernetes', 'k8s') 
  LIMIT 1;

  IF v_found_skill_id IS NOT NULL THEN
    v_skill_k8s_id := v_found_skill_id;
  ELSE
    INSERT INTO public.skills (id, name, canonical_name, category, created_at)
    VALUES (v_skill_k8s_id, 'Kubernetes', 'kubernetes', 'DevOps', NOW())
    ON CONFLICT DO NOTHING;
  END IF;

  -- 6.5 Docker
  SELECT id INTO v_found_skill_id 
  FROM public.skills 
  WHERE LOWER(name) IN ('docker', 'docker-compose') 
     OR LOWER(canonical_name) IN ('docker', 'docker-compose') 
  LIMIT 1;

  IF v_found_skill_id IS NOT NULL THEN
    v_skill_docker_id := v_found_skill_id;
  ELSE
    INSERT INTO public.skills (id, name, canonical_name, category, created_at)
    VALUES (v_skill_docker_id, 'Docker', 'docker', 'DevOps', NOW())
    ON CONFLICT DO NOTHING;
  END IF;

  -- 6.6 GraphQL
  SELECT id INTO v_found_skill_id 
  FROM public.skills 
  WHERE LOWER(name) IN ('graphql', 'gql') 
     OR LOWER(canonical_name) IN ('graphql', 'gql') 
  LIMIT 1;

  IF v_found_skill_id IS NOT NULL THEN
    v_skill_graphql_id := v_found_skill_id;
  ELSE
    INSERT INTO public.skills (id, name, canonical_name, category, created_at)
    VALUES (v_skill_graphql_id, 'GraphQL', 'graphql', 'Backend', NOW())
    ON CONFLICT DO NOTHING;
  END IF;

  -- Job Skills Mapping (Avoid duplicate mapping on Job 1)
  IF NOT EXISTS (SELECT 1 FROM public.job_skills WHERE job_id = v_job_1_id AND skill_id = v_skill_react_id) THEN
    INSERT INTO public.job_skills (id, job_id, skill_id, is_required, category, weight)
    VALUES ('f0000000-0000-0000-0000-000000000001', v_job_1_id, v_skill_react_id, true, 'Frontend', 1.0)
    ON CONFLICT DO NOTHING;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.job_skills WHERE job_id = v_job_1_id AND skill_id = v_skill_ts_id) THEN
    INSERT INTO public.job_skills (id, job_id, skill_id, is_required, category, weight)
    VALUES ('f0000000-0000-0000-0000-000000000002', v_job_1_id, v_skill_ts_id, true, 'Language', 1.0)
    ON CONFLICT DO NOTHING;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.job_skills WHERE job_id = v_job_1_id AND skill_id = v_skill_node_id) THEN
    INSERT INTO public.job_skills (id, job_id, skill_id, is_required, category, weight)
    VALUES ('f0000000-0000-0000-0000-000000000003', v_job_1_id, v_skill_node_id, true, 'Backend', 0.8)
    ON CONFLICT DO NOTHING;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.job_skills WHERE job_id = v_job_1_id AND skill_id = v_skill_k8s_id) THEN
    INSERT INTO public.job_skills (id, job_id, skill_id, is_required, category, weight)
    VALUES ('f0000000-0000-0000-0000-000000000004', v_job_1_id, v_skill_k8s_id, false, 'DevOps', 0.5)
    ON CONFLICT DO NOTHING;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.job_skills WHERE job_id = v_job_1_id AND skill_id = v_skill_docker_id) THEN
    INSERT INTO public.job_skills (id, job_id, skill_id, is_required, category, weight)
    VALUES ('f0000000-0000-0000-0000-000000000005', v_job_1_id, v_skill_docker_id, false, 'DevOps', 0.5)
    ON CONFLICT DO NOTHING;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.job_skills WHERE job_id = v_job_1_id AND skill_id = v_skill_graphql_id) THEN
    INSERT INTO public.job_skills (id, job_id, skill_id, is_required, category, weight)
    VALUES ('f0000000-0000-0000-0000-000000000006', v_job_1_id, v_skill_graphql_id, false, 'Backend', 0.5)
    ON CONFLICT DO NOTHING;
  END IF;

  -- ----------------------------------------------------------------------------
  -- 7. CANDIDATES (Reuse Existing Profiles if Found; Safe user_id Association)
  -- ----------------------------------------------------------------------------
  -- 7.1 Candidate 1 (Attached to candidate@test.com Auth user)
  SELECT id, user_id INTO v_found_cand_id, v_found_cand_user_id 
  FROM public.candidates 
  WHERE email = 'candidate@test.com' 
  LIMIT 1;

  IF v_found_cand_id IS NOT NULL THEN
    IF v_found_cand_user_id IS NOT NULL AND v_found_cand_user_id != v_candidate_auth_id THEN
      RAISE EXCEPTION 'Xung đột ánh xạ ứng viên: Candidate candidate@test.com đã liên kết với user_id khác (%), không khớp với auth.users.id (%). Dừng seed.',
        v_found_cand_user_id, v_candidate_auth_id;
    END IF;
    v_cand_1_id := v_found_cand_id;
  ELSE
    INSERT INTO public.candidates (id, user_id, full_name, email, phone, location, linkedin_url, source, created_at)
    VALUES (v_cand_1_id, v_candidate_auth_id, 'Nguyễn Văn An', 'candidate@test.com', '0901234567', 'Hà Nội', 'https://linkedin.com/in/nguyenvanan-dev', 'Career Site', NOW())
    ON CONFLICT DO NOTHING;
  END IF;

  -- 7.2 Candidate 2 (External applicant - user_id = NULL)
  SELECT id INTO v_found_cand_id 
  FROM public.candidates 
  WHERE email = 'bich.tran@test.com' 
  LIMIT 1;

  IF v_found_cand_id IS NOT NULL THEN
    v_cand_2_id := v_found_cand_id;
  ELSE
    INSERT INTO public.candidates (id, user_id, full_name, email, phone, location, linkedin_url, source, created_at)
    VALUES (v_cand_2_id, NULL, 'Trần Thị Bích', 'bich.tran@test.com', '0912345678', 'Đà Nẵng', 'https://linkedin.com/in/bichtran-frontend', 'Referral', NOW())
    ON CONFLICT DO NOTHING;
  END IF;

  -- 7.3 Candidate 3 (External applicant - user_id = NULL)
  SELECT id INTO v_found_cand_id 
  FROM public.candidates 
  WHERE email = 'nam.le@test.com' 
  LIMIT 1;

  IF v_found_cand_id IS NOT NULL THEN
    v_cand_3_id := v_found_cand_id;
  ELSE
    INSERT INTO public.candidates (id, user_id, full_name, email, phone, location, linkedin_url, source, created_at)
    VALUES (v_cand_3_id, NULL, 'Lê Hoàng Nam', 'nam.le@test.com', '0987654321', 'TP. Hồ Chí Minh', 'https://linkedin.com/in/namle-backend', 'Direct Application', NOW())
    ON CONFLICT DO NOTHING;
  END IF;

  -- ----------------------------------------------------------------------------
  -- 8. APPLICATIONS (Preserve Existing Stage; Only New Applications Use 'applied')
  -- Schema: id, candidate_id, job_id, resume_id, status, current_stage, source, applied_at
  -- Checks (candidate_id, job_id) existence: If already exists, DO NOTHING.
  -- ----------------------------------------------------------------------------
  IF NOT EXISTS (SELECT 1 FROM public.applications WHERE candidate_id = v_cand_1_id AND job_id = v_job_1_id) THEN
    INSERT INTO public.applications (id, candidate_id, job_id, resume_id, current_stage, status, source, applied_at)
    VALUES (v_app_1_id, v_cand_1_id, v_job_1_id, NULL, 'applied', 'active', 'Career Site', NOW())
    ON CONFLICT DO NOTHING;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.applications WHERE candidate_id = v_cand_2_id AND job_id = v_job_1_id) THEN
    INSERT INTO public.applications (id, candidate_id, job_id, resume_id, current_stage, status, source, applied_at)
    VALUES (v_app_2_id, v_cand_2_id, v_job_1_id, NULL, 'applied', 'active', 'Referral', NOW())
    ON CONFLICT DO NOTHING;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.applications WHERE candidate_id = v_cand_3_id AND job_id = v_job_1_id) THEN
    INSERT INTO public.applications (id, candidate_id, job_id, resume_id, current_stage, status, source, applied_at)
    VALUES (v_app_3_id, v_cand_3_id, v_job_1_id, NULL, 'applied', 'active', 'Direct Application', NOW())
    ON CONFLICT DO NOTHING;
  END IF;

  -- ----------------------------------------------------------------------------
  -- SUMMARY OF GENERATED / REUSED IDS (Zero Secrets or Hashes Logged)
  -- ----------------------------------------------------------------------------
  RAISE NOTICE '===============================================================';
  RAISE NOTICE '    TALENTSCOUT ATS - TEST SEED COMPLETED SUCCESSFULLY         ';
  RAISE NOTICE '===============================================================';
  RAISE NOTICE '[1. AUTH & PUBLIC USERS]';
  RAISE NOTICE '  - Recruiter Auth & Public User ID: %', v_recruiter_auth_id;
  RAISE NOTICE '  - Candidate Auth & Public User ID: %', v_candidate_auth_id;
  RAISE NOTICE '[2. COMPANIES]';
  RAISE NOTICE '  - Company A (TechCorp Vietnam): %', v_company_a_id;
  RAISE NOTICE '  - Company B (InnoTech Asia):    %', v_company_b_id;
  RAISE NOTICE '[3. JOBS]';
  RAISE NOTICE '  - Job 1 (Senior Frontend Dev - Company A): %', v_job_1_id;
  RAISE NOTICE '  - Job 2 (Backend Architect - Company B):   %', v_job_2_id;
  RAISE NOTICE '[4. CANDIDATES]';
  RAISE NOTICE '  - Candidate 1 (Nguyen Van An): %', v_cand_1_id;
  RAISE NOTICE '  - Candidate 2 (Tran Thi Bich): %', v_cand_2_id;
  RAISE NOTICE '  - Candidate 3 (Le Hoang Nam):  %', v_cand_3_id;
  RAISE NOTICE '[5. SKILLS (CANONICAL NAMES APPLIED)]';
  RAISE NOTICE '  - React:      % (canonical: react)', v_skill_react_id;
  RAISE NOTICE '  - TypeScript: % (canonical: typescript)', v_skill_ts_id;
  RAISE NOTICE '  - Node.js:    % (canonical: node.js)', v_skill_node_id;
  RAISE NOTICE '[6. APPLICATIONS (EXISTING STAGES PRESERVED)]';
  RAISE NOTICE '  - Application 1 (Candidate 1 -> Job 1): %', v_app_1_id;
  RAISE NOTICE '  - Application 2 (Candidate 2 -> Job 1): %', v_app_2_id;
  RAISE NOTICE '  - Application 3 (Candidate 3 -> Job 1): %', v_app_3_id;
  RAISE NOTICE '===============================================================';
END $$;
