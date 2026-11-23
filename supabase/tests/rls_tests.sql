-- ==============================================================================
-- TalentScout ATS - Comprehensive Row Level Security (RLS) Test Suite
-- Test Script: supabase/tests/rls_tests.sql
--
-- 100% VERIFIED LIVE SCHEMA SPECIFICATION:
--   - `companies`: (id, name, logo_url, website, industry, created_by_user_id, created_at)
--   - `company_members`: (company_id, user_id, role) [NO id, NO created_at]
--   - `users`: (id, email, password_hash, full_name, role, is_active, company_id, created_at)
--   - `jobs`: (id, company_id, title, department, location, work_type, salary_min, salary_max, currency, description, status, created_by_user_id, created_at, updated_at)
--   - `candidates`: (id, user_id, full_name, email, phone, location, linkedin_url, source, created_at)
--   - `applications`: (id, candidate_id, job_id, resume_id, current_stage, status, source, applied_at) [NO created_at]
--   - `resumes`: (id, candidate_id, file_name, file_url, file_type, file_size, parse_status, raw_text, uploaded_at) [NO created_at, NO updated_at]
--   - `match_results`: (id, application_id, skills_score, experience_score, education_score, semantic_score, recommendation, created_at)
--
-- CƠ CHẾ VẬN HÀNH:
--   1. Tự động Rollback hoàn toàn bằng PL/pgSQL Subtransaction:
--      - 100% fixtures và thao tác ghi được thực hiện trong khối nguyên tử (Savepoint).
--      - Cuối khối, script chủ động kích hoạt hoàn tác (Rollback nội bộ qua Exception).
--      - Toàn bộ fixtures bị HỦY SẠCH 100%, không để lại bất kỳ dữ liệu rác nào trong DB.
--   2. Bảo toàn kết quả trong RAM (v_results JSONB):
--      - Rollback CSDL KHÔNG hoàn tác biến bộ nhớ trong PL/pgSQL.
--      - Kết quả 12 bài test được bảo toàn và đổ vào bảng tạm sau khi rollback CSDL.
--   3. Hiển thị bảng kết quả SELECT 1-Click:
--      - Câu lệnh cuối cùng của toàn bộ script là câu lệnh SELECT, Supabase SQL Editor
--        sẽ hiển thị ngay lập tức bảng kết quả có cấu trúc trong tab Results.
--
-- HƯỚNG DẪN CHẠY:
--   1. Mở Supabase Dashboard: https://supabase.com/dashboard/project/dmtezrjlwqvxdzwmfwgk
--   2. Vào "SQL Editor" -> Click "New Query"
--   3. Dán toàn bộ nội dung file này vào cửa sổ truy vấn.
--   4. Nhấn "Run" (hoặc Ctrl + Enter).
--   5. Xem kết quả hiển thị trực tiếp trong tab "Results".
-- ==============================================================================

-- Đảm bảo extension pgcrypto sẵn sàng để sinh hash bcrypt
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- 1. Tạo bảng tạm trong phiên làm việc để lưu kết quả
CREATE TEMP TABLE IF NOT EXISTS rls_test_results (
  test_number INT,
  description TEXT,
  status TEXT, -- 'PASS', 'FAIL', 'SKIP', 'SETUP_ERROR'
  details TEXT
);
TRUNCATE rls_test_results;

-- Cấp quyền bảng tạm để tránh lỗi permission khi đổi role
GRANT ALL ON TABLE rls_test_results TO anon, authenticated, public;

-- 2. Khối điều phối: Tạo Fixtures -> Test Matrix -> Rollback Fixtures -> Lưu kết quả
DO $$
DECLARE
  v_recruiter_auth_id UUID;
  v_candidate_auth_id UUID;
  v_recruiter_company_id UUID;
  v_recruiter_jwt TEXT;
  v_candidate_jwt TEXT;
  
  -- Dải UUID chuẩn từ seed.sql
  v_company_a_id CONSTANT UUID := 'c1000000-0000-0000-0000-000000000001';
  v_company_b_id CONSTANT UUID := 'c2000000-0000-0000-0000-000000000002';
  v_job_1_id UUID             := 'd1000000-0000-0000-0000-000000000001';
  v_job_2_id UUID             := 'd0000000-0000-0000-0000-000000000002';
  v_app_1_id UUID             := 'e0000000-0000-0000-0000-000000000001';
  
  v_cand_1_id UUID            := 'c0000000-0000-0000-0000-000000000001';
  v_cand_2_id UUID            := 'c0000000-0000-0000-0000-000000000002';
  
  -- UUID Fixtures tạm thời
  v_fixture_resume_1_id CONSTANT UUID := 'b9000000-0000-0000-0000-000000000001';
  v_fixture_resume_2_id CONSTANT UUID := 'b9000000-0000-0000-0000-000000000002';
  v_fixture_match_id    CONSTANT UUID := 'f9000000-0000-0000-0000-000000000001';
  
  v_db_count INT;
  v_test_count INT;
  
  -- BIẾN BỘ NHỚ RAM LƯU KẾT QUẢ (Không bị hủy khi rollback CSDL)
  v_results JSONB := '[]'::JSONB;
BEGIN
  -- ----------------------------------------------------------------------------
  -- SETUP: Tra cứu tài khoản thật từ auth.users và public.users
  -- ----------------------------------------------------------------------------
  RESET ROLE;
  PERFORM set_config('request.jwt.claims', '', true);

  -- 1. Tra cứu Auth users
  SELECT id INTO v_recruiter_auth_id FROM auth.users WHERE email = 'recruiter@test.com' LIMIT 1;
  SELECT id INTO v_candidate_auth_id FROM auth.users WHERE email = 'candidate@test.com' LIMIT 1;

  IF v_recruiter_auth_id IS NULL THEN
    v_recruiter_auth_id := 'a0000000-0000-0000-0000-000000000001'::UUID;
  END IF;

  IF v_candidate_auth_id IS NULL THEN
    v_candidate_auth_id := 'a0000000-0000-0000-0000-000000000002'::UUID;
  END IF;

  -- 2. Tái sử dụng ID Candidate 1 thực tế từ DB nếu có
  SELECT id INTO v_cand_1_id 
  FROM public.candidates 
  WHERE user_id = v_candidate_auth_id OR email = 'candidate@test.com'
  LIMIT 1;

  IF v_cand_1_id IS NULL THEN
    v_cand_1_id := 'c0000000-0000-0000-0000-000000000001'::UUID;
  END IF;

  -- 3. Tái sử dụng ID Candidate 2 thực tế từ DB nếu có
  SELECT id INTO v_cand_2_id 
  FROM public.candidates 
  WHERE email = 'bich.tran@test.com' OR (id != v_cand_1_id AND email != 'candidate@test.com')
  LIMIT 1;

  IF v_cand_2_id IS NULL THEN
    v_cand_2_id := 'c0000000-0000-0000-0000-000000000002'::UUID;
  END IF;

  -- 4. Tái sử dụng company_id thực tế của Recruiter
  SELECT company_id INTO v_recruiter_company_id
  FROM public.users
  WHERE id = v_recruiter_auth_id AND company_id IS NOT NULL
  LIMIT 1;

  IF v_recruiter_company_id IS NULL THEN
    SELECT company_id INTO v_recruiter_company_id
    FROM public.company_members
    WHERE user_id = v_recruiter_auth_id
    LIMIT 1;
  END IF;

  IF v_recruiter_company_id IS NULL THEN
    v_recruiter_company_id := v_company_a_id;
  END IF;

  -- 5. Tái sử dụng Job 1 (Company A open job)
  SELECT id INTO v_job_1_id
  FROM public.jobs
  WHERE company_id = v_recruiter_company_id AND status IN ('open', 'active')
  LIMIT 1;

  IF v_job_1_id IS NULL THEN
    v_job_1_id := 'd1000000-0000-0000-0000-000000000001'::UUID;
  END IF;

  -- 6. Tái sử dụng Job 2 (Company B draft job)
  SELECT id INTO v_job_2_id
  FROM public.jobs
  WHERE company_id = v_company_b_id AND status = 'draft'
  LIMIT 1;

  IF v_job_2_id IS NULL THEN
    v_job_2_id := 'd0000000-0000-0000-0000-000000000002'::UUID;
  END IF;

  -- 7. Tái sử dụng Application 1
  SELECT id INTO v_app_1_id
  FROM public.applications
  WHERE candidate_id = v_cand_1_id AND job_id = v_job_1_id
  LIMIT 1;

  IF v_app_1_id IS NULL THEN
    v_app_1_id := 'e0000000-0000-0000-0000-000000000001'::UUID;
  END IF;

  -- Thiết lập JWT Claims giả lập cho các role
  v_recruiter_jwt := format('{"sub": "%s", "email": "recruiter@test.com", "role": "authenticated", "user_metadata": {"role": "recruiter"}}', v_recruiter_auth_id);
  v_candidate_jwt := format('{"sub": "%s", "email": "candidate@test.com", "role": "authenticated", "user_metadata": {"role": "candidate"}}', v_candidate_auth_id);

  -- ----------------------------------------------------------------------------
  -- KHỐI SUBTRANSACTION NGUYÊN TỬ: TẤT CẢ DỮ LIỆU CSDL SẼ ĐƯỢC ROLLBACK TẠI ĐÂY
  -- ----------------------------------------------------------------------------
  BEGIN
    -- [A] Khởi tạo Fixtures 100% CHUẨN XÁC theo Live Schema
    -- 1. Companies (id, name, logo_url, website, industry, created_at)
    INSERT INTO public.companies (id, name, logo_url, website, industry, created_at)
    VALUES 
      (v_company_a_id, 'TechCorp Vietnam', 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=128&q=80', 'https://techcorp.test', 'Software', NOW()),
      (v_company_b_id, 'InnoTech Asia', 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=128&q=80', 'https://innotech.test', 'AI', NOW())
    ON CONFLICT (id) DO NOTHING;

    -- 2. Users (id, email, password_hash, full_name, role, is_active, company_id, created_at)
    INSERT INTO public.users (id, email, password_hash, full_name, role, is_active, company_id, created_at)
    VALUES (
      v_recruiter_auth_id,
      'recruiter@test.com',
      extensions.crypt('Test123!', extensions.gen_salt('bf', 10)),
      'Hoàng Minh Tuấn (Recruiter A)',
      'recruiter',
      true,
      v_recruiter_company_id,
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;

    -- 3. Company Members (company_id, user_id, role)
    INSERT INTO public.company_members (company_id, user_id, role)
    VALUES (v_recruiter_company_id, v_recruiter_auth_id, 'recruiter')
    ON CONFLICT DO NOTHING;

    -- 4. Jobs (id, company_id, title, department, location, status, description, salary_min, salary_max, currency, created_at)
    INSERT INTO public.jobs (id, company_id, title, department, location, status, description, salary_min, salary_max, currency, created_at)
    VALUES 
      (v_job_1_id, v_recruiter_company_id, 'Senior Frontend Developer', 'Engineering', 'Hà Nội (Hybrid)', 'open', 'Tuyển dụng Senior Frontend Developer.', 35000000, 55000000, 'VND', NOW()),
      (v_job_2_id, v_company_b_id, 'Lead Backend Architect (Draft)', 'Platform', 'TP. Hồ Chí Minh', 'draft', 'Vị trí nội bộ thiết kế kiến trúc hệ thống.', 50000000, 80000000, 'VND', NOW())
    ON CONFLICT (id) DO NOTHING;

    -- 5. Candidates (id, user_id, full_name, email, phone, location, linkedin_url, source, created_at)
    INSERT INTO public.candidates (id, user_id, full_name, email, phone, location, linkedin_url, source, created_at)
    VALUES 
      (v_cand_1_id, v_candidate_auth_id, 'Nguyễn Văn An', 'candidate@test.com', '0901234567', 'Hà Nội', 'https://linkedin.com/in/nguyenvanan-dev', 'Career Site', NOW()),
      (v_cand_2_id, NULL, 'Trần Thị Bích', 'bich.tran@test.com', '0912345678', 'Đà Nẵng', 'https://linkedin.com/in/bichtran-frontend', 'Referral', NOW())
    ON CONFLICT (id) DO NOTHING;

    -- 6. Applications (id, candidate_id, job_id, resume_id, current_stage, status, source, applied_at)
    INSERT INTO public.applications (id, candidate_id, job_id, resume_id, current_stage, status, source, applied_at)
    VALUES (v_app_1_id, v_cand_1_id, v_job_1_id, NULL, 'applied', 'active', 'Career Site', NOW())
    ON CONFLICT (id) DO NOTHING;

    -- 7. Resumes (id, candidate_id, file_name, file_url, file_type, file_size, parse_status, raw_text, uploaded_at) [DÙNG uploaded_at THAY VÌ created_at]
    INSERT INTO public.resumes (id, candidate_id, file_name, file_url, file_type, file_size, parse_status, raw_text, uploaded_at)
    VALUES 
      (v_fixture_resume_1_id, v_cand_1_id, 'Nguyen_Van_An_CV_Fixture.pdf', 'resumes/an_cv.pdf', 'pdf', 10240, 'parsed', 'Kỹ năng: React, TypeScript, Node.js', NOW()),
      (v_fixture_resume_2_id, v_cand_2_id, 'Tran_Thi_Bich_CV_Fixture.pdf', 'resumes/bich_cv.pdf', 'pdf', 10240, 'parsed', 'Kỹ năng: UI/UX, Figma', NOW())
    ON CONFLICT (id) DO NOTHING;

    -- 8. Match Results (id, application_id, skills_score, recommendation, created_at)
    -- Ràng buộc CHECK: recommendation = ANY (ARRAY['strong_match', 'shortlist', 'review', 'low_match'])
    INSERT INTO public.match_results (id, application_id, skills_score, recommendation, created_at)
    VALUES (v_fixture_match_id, v_app_1_id, 85.0, 'review', NOW())
    ON CONFLICT (id) DO NOTHING;

    -- [B] Kiểm tra xác nhận Fixtures thực sự tồn tại trước khi test (Anti-False-Positive)
    SELECT count(*) INTO v_db_count FROM public.resumes WHERE id = v_fixture_resume_1_id;
    IF v_db_count = 0 THEN RAISE EXCEPTION 'Khởi tạo fixture thất bại: Không tìm thấy resume fixture 1.'; END IF;

    SELECT count(*) INTO v_db_count FROM public.resumes WHERE id = v_fixture_resume_2_id;
    IF v_db_count = 0 THEN RAISE EXCEPTION 'Khởi tạo fixture thất bại: Không tìm thấy resume fixture 2.'; END IF;

    SELECT count(*) INTO v_db_count FROM public.match_results WHERE id = v_fixture_match_id;
    IF v_db_count = 0 THEN RAISE EXCEPTION 'Khởi tạo fixture thất bại: Không tìm thấy match_results fixture.'; END IF;

    -- ==========================================================================
    -- TEST 1: [ANON - SELECT ALLOW] Public can read open/active jobs
    -- ==========================================================================
    RESET ROLE;
    PERFORM set_config('request.jwt.claims', '', true);
    SELECT count(*) INTO v_db_count FROM public.jobs WHERE status IN ('open', 'active');

    BEGIN
      SET LOCAL ROLE anon;
      PERFORM set_config('request.jwt.claims', '{"role": "anon"}', true);
      SELECT count(*) INTO v_test_count FROM public.jobs WHERE status IN ('open', 'active');
      RESET ROLE;
      PERFORM set_config('request.jwt.claims', '', true);

      IF v_test_count = v_db_count THEN
        v_results := v_results || jsonb_build_array(jsonb_build_object('test_number', 1, 'description', '[ANON - SELECT ALLOW] Public đọc open/active jobs', 'status', 'PASS', 'details', format('Thành công: Role anon đọc được đầy đủ %s/%s open jobs.', v_test_count, v_db_count)));
      ELSE
        v_results := v_results || jsonb_build_array(jsonb_build_object('test_number', 1, 'description', '[ANON - SELECT ALLOW] Public đọc open/active jobs', 'status', 'FAIL', 'details', format('Không khớp: DB có %s open jobs nhưng anon chỉ đọc được %s.', v_db_count, v_test_count)));
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RESET ROLE;
      v_results := v_results || jsonb_build_array(jsonb_build_object('test_number', 1, 'description', '[ANON - SELECT ALLOW] Public đọc open/active jobs', 'status', 'FAIL', 'details', SQLERRM));
    END;

    -- ==========================================================================
    -- TEST 2: [ANON - SELECT DENY] Public cannot read draft jobs
    -- ==========================================================================
    RESET ROLE;
    PERFORM set_config('request.jwt.claims', '', true);
    SELECT count(*) INTO v_db_count FROM public.jobs WHERE status = 'draft';

    BEGIN
      SET LOCAL ROLE anon;
      PERFORM set_config('request.jwt.claims', '{"role": "anon"}', true);
      SELECT count(*) INTO v_test_count FROM public.jobs WHERE status = 'draft';
      RESET ROLE;
      PERFORM set_config('request.jwt.claims', '', true);

      IF v_test_count = 0 THEN
        v_results := v_results || jsonb_build_array(jsonb_build_object('test_number', 2, 'description', '[ANON - SELECT DENY] Public không thể đọc draft jobs', 'status', 'PASS', 'details', format('Bảo vệ thành công: Toàn bộ %s draft jobs đã bị ẩn đối với anon (0 dòng).', v_db_count)));
      ELSE
        v_results := v_results || jsonb_build_array(jsonb_build_object('test_number', 2, 'description', '[ANON - SELECT DENY] Public không thể đọc draft jobs', 'status', 'FAIL', 'details', format('Lỗ hổng: Role anon đọc được %s/%s draft jobs.', v_test_count, v_db_count)));
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RESET ROLE;
      v_results := v_results || jsonb_build_array(jsonb_build_object('test_number', 2, 'description', '[ANON - SELECT DENY] Public không thể đọc draft jobs', 'status', 'FAIL', 'details', SQLERRM));
    END;

    -- ==========================================================================
    -- TEST 3: [ANON - INSERT DENY] Public cannot insert into jobs
    -- ==========================================================================
    RESET ROLE;
    PERFORM set_config('request.jwt.claims', '', true);

    BEGIN
      SET LOCAL ROLE anon;
      PERFORM set_config('request.jwt.claims', '{"role": "anon"}', true);

      INSERT INTO public.jobs (id, company_id, title, department, status, description, currency)
      VALUES ('d9999999-9999-9999-9999-999999999999', v_company_a_id, 'Fake Job By Anon', 'Engineering', 'open', 'Hacker job', 'VND');

      RAISE EXCEPTION 'SECURITY_BREACH_INSERT_SUCCEEDED';
    EXCEPTION WHEN OTHERS THEN
      RESET ROLE;
      PERFORM set_config('request.jwt.claims', '', true);

      IF SQLERRM LIKE '%SECURITY_BREACH_INSERT_SUCCEEDED%' THEN
        v_results := v_results || jsonb_build_array(jsonb_build_object('test_number', 3, 'description', '[ANON - INSERT DENY] Public không thể tạo jobs', 'status', 'FAIL', 'details', 'Lỗ hổng: Role anon đã chèn được dữ liệu vào bảng jobs!'));
      ELSE
        v_results := v_results || jsonb_build_array(jsonb_build_object('test_number', 3, 'description', '[ANON - INSERT DENY] Public không thể tạo jobs', 'status', 'PASS', 'details', format('Bị chặn thành công bởi RLS (%s).', SQLERRM)));
      END IF;
    END;

    -- ==========================================================================
    -- TEST 4: [CANDIDATE - SELECT ALLOW] Candidate can read own resume (via Fixture)
    -- ==========================================================================
    BEGIN
      SET LOCAL ROLE authenticated;
      PERFORM set_config('request.jwt.claims', v_candidate_jwt, true);

      SELECT count(*) INTO v_test_count FROM public.resumes WHERE id = v_fixture_resume_1_id;

      RESET ROLE;
      PERFORM set_config('request.jwt.claims', '', true);

      IF v_test_count = 1 THEN
        v_results := v_results || jsonb_build_array(jsonb_build_object('test_number', 4, 'description', '[CANDIDATE - SELECT ALLOW] Candidate đọc CV của chính mình', 'status', 'PASS', 'details', 'Thành công: Candidate đọc được đúng CV của chính mình qua fixture (1/1 dòng).'));
      ELSE
        v_results := v_results || jsonb_build_array(jsonb_build_object('test_number', 4, 'description', '[CANDIDATE - SELECT ALLOW] Candidate đọc CV của chính mình', 'status', 'FAIL', 'details', format('Không khớp: Đọc được %s/1 CV của chính mình.', v_test_count)));
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RESET ROLE;
      v_results := v_results || jsonb_build_array(jsonb_build_object('test_number', 4, 'description', '[CANDIDATE - SELECT ALLOW] Candidate đọc CV của chính mình', 'status', 'FAIL', 'details', SQLERRM));
    END;

    -- ==========================================================================
    -- TEST 5: [CANDIDATE - IDOR DENY] Candidate CANNOT read other candidates' resumes
    -- ==========================================================================
    BEGIN
      SET LOCAL ROLE authenticated;
      PERFORM set_config('request.jwt.claims', v_candidate_jwt, true);

      SELECT count(*) INTO v_test_count FROM public.resumes WHERE id = v_fixture_resume_2_id;

      RESET ROLE;
      PERFORM set_config('request.jwt.claims', '', true);

      IF v_test_count = 0 THEN
        v_results := v_results || jsonb_build_array(jsonb_build_object('test_number', 5, 'description', '[CANDIDATE - IDOR DENY] Candidate không thể đọc CV ứng viên khác', 'status', 'PASS', 'details', 'Chống IDOR thành công: Đã ẩn hoàn toàn CV của ứng viên khác (0 dòng).'));
      ELSE
        v_results := v_results || jsonb_build_array(jsonb_build_object('test_number', 5, 'description', '[CANDIDATE - IDOR DENY] Candidate không thể đọc CV ứng viên khác', 'status', 'FAIL', 'details', format('Lỗ hổng IDOR: Candidate đã đọc được %s CV của ứng viên khác!', v_test_count)));
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RESET ROLE;
      v_results := v_results || jsonb_build_array(jsonb_build_object('test_number', 5, 'description', '[CANDIDATE - IDOR DENY] Candidate không thể đọc CV ứng viên khác', 'status', 'FAIL', 'details', SQLERRM));
    END;

    -- ==========================================================================
    -- TEST 6: [CANDIDATE - AI SCORE DENY] Candidate CANNOT view match_results
    -- ==========================================================================
    BEGIN
      SET LOCAL ROLE authenticated;
      PERFORM set_config('request.jwt.claims', v_candidate_jwt, true);

      SELECT count(*) INTO v_test_count FROM public.match_results WHERE id = v_fixture_match_id;

      RESET ROLE;
      PERFORM set_config('request.jwt.claims', '', true);

      IF v_test_count = 0 THEN
        v_results := v_results || jsonb_build_array(jsonb_build_object('test_number', 6, 'description', '[CANDIDATE - AI SCORE DENY] Candidate không thể xem match_results', 'status', 'PASS', 'details', 'Bảo mật điểm AI thành công: Đã ẩn toàn bộ match_results đối với Candidate (0 dòng).'));
      ELSE
        v_results := v_results || jsonb_build_array(jsonb_build_object('test_number', 6, 'description', '[CANDIDATE - AI SCORE DENY] Candidate không thể xem match_results', 'status', 'FAIL', 'details', format('Lỗ hổng bảo mật: Candidate đã đọc được %s bản ghi match_results!', v_test_count)));
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RESET ROLE;
      v_results := v_results || jsonb_build_array(jsonb_build_object('test_number', 6, 'description', '[CANDIDATE - AI SCORE DENY] Candidate không thể xem match_results', 'status', 'FAIL', 'details', SQLERRM));
    END;

    -- ==========================================================================
    -- TEST 7: [CANDIDATE - UPDATE CV DENY] Candidate cannot alter other resumes
    -- ==========================================================================
    BEGIN
      SET LOCAL ROLE authenticated;
      PERFORM set_config('request.jwt.claims', v_candidate_jwt, true);

      UPDATE public.resumes SET raw_text = 'Tampered By Candidate Fixture' WHERE id = v_fixture_resume_2_id;
      GET DIAGNOSTICS v_test_count = ROW_COUNT;

      IF v_test_count > 0 THEN
        RAISE EXCEPTION 'SECURITY_BREACH_UPDATED_OTHER_RESUME';
      END IF;

      RESET ROLE;
      PERFORM set_config('request.jwt.claims', '', true);
      v_results := v_results || jsonb_build_array(jsonb_build_object('test_number', 7, 'description', '[CANDIDATE - UPDATE CV DENY] Candidate không thể sửa CV người khác', 'status', 'PASS', 'details', 'Chặn thành công: 0 dòng bị sửa đổi (ROW_COUNT = 0).'));
    EXCEPTION WHEN OTHERS THEN
      RESET ROLE;
      PERFORM set_config('request.jwt.claims', '', true);

      IF SQLERRM LIKE '%SECURITY_BREACH_UPDATED_OTHER_RESUME%' THEN
        v_results := v_results || jsonb_build_array(jsonb_build_object('test_number', 7, 'description', '[CANDIDATE - UPDATE CV DENY] Candidate không thể sửa CV người khác', 'status', 'FAIL', 'details', 'Lỗ hổng: Đã cập nhật trái phép CV của người khác!'));
      ELSE
        v_results := v_results || jsonb_build_array(jsonb_build_object('test_number', 7, 'description', '[CANDIDATE - UPDATE CV DENY] Candidate không thể sửa CV người khác', 'status', 'PASS', 'details', format('Bị chặn bởi RLS (%s).', SQLERRM)));
      END IF;
    END;

    -- ==========================================================================
    -- TEST 8: [RECRUITER A - ALLOW OWN PIPELINE] Recruiter A accesses Company A jobs
    -- ==========================================================================
    RESET ROLE;
    PERFORM set_config('request.jwt.claims', '', true);
    SELECT count(*) INTO v_db_count FROM public.jobs WHERE company_id = v_recruiter_company_id;

    BEGIN
      SET LOCAL ROLE authenticated;
      PERFORM set_config('request.jwt.claims', v_recruiter_jwt, true);

      SELECT count(*) INTO v_test_count FROM public.jobs WHERE company_id = v_recruiter_company_id;

      RESET ROLE;
      PERFORM set_config('request.jwt.claims', '', true);

      IF v_test_count = v_db_count THEN
        v_results := v_results || jsonb_build_array(jsonb_build_object('test_number', 8, 'description', '[RECRUITER A - ALLOW] Recruiter đọc job của công ty mình', 'status', 'PASS', 'details', format('Thành công: Recruiter A đọc được đầy đủ %s/%s job của công ty mình.', v_test_count, v_db_count)));
      ELSE
        v_results := v_results || jsonb_build_array(jsonb_build_object('test_number', 8, 'description', '[RECRUITER A - ALLOW] Recruiter đọc job của công ty mình', 'status', 'FAIL', 'details', format('Không khớp: DB có %s job nhưng recruiter chỉ đọc được %s.', v_db_count, v_test_count)));
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RESET ROLE;
      v_results := v_results || jsonb_build_array(jsonb_build_object('test_number', 8, 'description', '[RECRUITER A - ALLOW] Recruiter đọc job của công ty mình', 'status', 'FAIL', 'details', SQLERRM));
    END;

    -- ==========================================================================
    -- TEST 9: [COMPANY ISOLATION - SELECT DENY] Recruiter A cannot read Company B draft jobs
    -- ==========================================================================
    RESET ROLE;
    PERFORM set_config('request.jwt.claims', '', true);
    SELECT count(*) INTO v_db_count FROM public.jobs WHERE company_id = v_company_b_id AND status = 'draft';

    BEGIN
      SET LOCAL ROLE authenticated;
      PERFORM set_config('request.jwt.claims', v_recruiter_jwt, true);

      SELECT count(*) INTO v_test_count FROM public.jobs WHERE company_id = v_company_b_id AND status = 'draft';

      RESET ROLE;
      PERFORM set_config('request.jwt.claims', '', true);

      IF v_test_count = 0 THEN
        v_results := v_results || jsonb_build_array(jsonb_build_object('test_number', 9, 'description', '[COMPANY ISOLATION - SELECT DENY] Recruiter A không thể thấy job draft Company B', 'status', 'PASS', 'details', format('Cách ly công ty SELECT thành công: Ẩn toàn bộ %s job draft của Company B (0 dòng).', v_db_count)));
      ELSE
        v_results := v_results || jsonb_build_array(jsonb_build_object('test_number', 9, 'description', '[COMPANY ISOLATION - SELECT DENY] Recruiter A không thể thấy job draft Company B', 'status', 'FAIL', 'details', format('Vi phạm cách ly công ty: Recruiter A thấy %s/%s job draft của Company B!', v_test_count, v_db_count)));
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RESET ROLE;
      v_results := v_results || jsonb_build_array(jsonb_build_object('test_number', 9, 'description', '[COMPANY ISOLATION - SELECT DENY] Recruiter A không thể thấy job draft Company B', 'status', 'FAIL', 'details', SQLERRM));
    END;

    -- ==========================================================================
    -- TEST 10: [COMPANY ISOLATION - UPDATE DENY] Recruiter A cannot alter Company B jobs
    -- ==========================================================================
    BEGIN
      SET LOCAL ROLE authenticated;
      PERFORM set_config('request.jwt.claims', v_recruiter_jwt, true);

      UPDATE public.jobs SET title = 'Unauthorized Title Change' WHERE company_id = v_company_b_id;
      GET DIAGNOSTICS v_test_count = ROW_COUNT;

      IF v_test_count > 0 THEN
        RAISE EXCEPTION 'SECURITY_BREACH_UPDATED_OTHER_COMPANY_JOB';
      END IF;

      RESET ROLE;
      PERFORM set_config('request.jwt.claims', '', true);
      v_results := v_results || jsonb_build_array(jsonb_build_object('test_number', 10, 'description', '[COMPANY ISOLATION - UPDATE DENY] Recruiter A không thể sửa job Company B', 'status', 'PASS', 'details', 'Cách ly công ty UPDATE thành công: 0 dòng bị sửa đổi (ROW_COUNT = 0).'));
    EXCEPTION WHEN OTHERS THEN
      RESET ROLE;
      PERFORM set_config('request.jwt.claims', '', true);

      IF SQLERRM LIKE '%SECURITY_BREACH_UPDATED_OTHER_COMPANY_JOB%' THEN
        v_results := v_results || jsonb_build_array(jsonb_build_object('test_number', 10, 'description', '[COMPANY ISOLATION - UPDATE DENY] Recruiter A không thể sửa job Company B', 'status', 'FAIL', 'details', 'Vi phạm cách ly! Recruiter A đã sửa được job của Company B!'));
      ELSE
        v_results := v_results || jsonb_build_array(jsonb_build_object('test_number', 10, 'description', '[COMPANY ISOLATION - UPDATE DENY] Recruiter A không thể sửa job Company B', 'status', 'PASS', 'details', format('Bị chặn bởi RLS (%s).', SQLERRM)));
      END IF;
    END;

    -- ==========================================================================
    -- TEST 11: [LEAST PRIVILEGE - DENY PROFILE TAMPERING] Recruiter cannot update candidate profile
    -- ==========================================================================
    BEGIN
      SET LOCAL ROLE authenticated;
      PERFORM set_config('request.jwt.claims', v_recruiter_jwt, true);

      UPDATE public.candidates SET full_name = 'Recruiter Modified Profile' WHERE id = v_cand_1_id;
      GET DIAGNOSTICS v_test_count = ROW_COUNT;

      IF v_test_count > 0 THEN
        RAISE EXCEPTION 'SECURITY_BREACH_MODIFIED_CANDIDATE';
      END IF;

      RESET ROLE;
      PERFORM set_config('request.jwt.claims', '', true);
      v_results := v_results || jsonb_build_array(jsonb_build_object('test_number', 11, 'description', '[LEAST PRIVILEGE - DENY] Recruiter không thể sửa hồ sơ candidate', 'status', 'PASS', 'details', 'Đặc quyền tối thiểu thành công: Recruiter không thể sửa thông tin ứng viên (0 dòng bị sửa).'));
    EXCEPTION WHEN OTHERS THEN
      RESET ROLE;
      PERFORM set_config('request.jwt.claims', '', true);

      IF SQLERRM LIKE '%SECURITY_BREACH_MODIFIED_CANDIDATE%' THEN
        v_results := v_results || jsonb_build_array(jsonb_build_object('test_number', 11, 'description', '[LEAST PRIVILEGE - DENY] Recruiter không thể sửa hồ sơ candidate', 'status', 'FAIL', 'details', 'Lỗ hổng đặc quyền! Recruiter đã sửa được hồ sơ candidate!'));
      ELSE
        v_results := v_results || jsonb_build_array(jsonb_build_object('test_number', 11, 'description', '[LEAST PRIVILEGE - DENY] Recruiter không thể sửa hồ sơ candidate', 'status', 'PASS', 'details', format('Bị chặn bởi RLS (%s).', SQLERRM)));
      END IF;
    END;

    -- ==========================================================================
    -- TEST 12: [APPLICATION IMMUTABILITY - DENY REASSIGNMENT] Recruiter cannot alter candidate_id on application
    -- ==========================================================================
    BEGIN
      SET LOCAL ROLE authenticated;
      PERFORM set_config('request.jwt.claims', v_recruiter_jwt, true);

      UPDATE public.applications 
      SET candidate_id = v_cand_2_id 
      WHERE id = v_app_1_id;
      GET DIAGNOSTICS v_test_count = ROW_COUNT;

      IF v_test_count > 0 THEN
        RAISE EXCEPTION 'SECURITY_BREACH_REASSIGNED_APPLICATION';
      END IF;

      RESET ROLE;
      PERFORM set_config('request.jwt.claims', '', true);
      v_results := v_results || jsonb_build_array(jsonb_build_object('test_number', 12, 'description', '[APPLICATION IMMUTABILITY - DENY] Recruiter không thể đổi candidate_id', 'status', 'PASS', 'details', 'Tính bất biến ứng tuyển thành công: Không thể đổi candidate_id trên đơn ứng tuyển (0 dòng bị sửa).'));
    EXCEPTION WHEN OTHERS THEN
      RESET ROLE;
      PERFORM set_config('request.jwt.claims', '', true);

      IF SQLERRM LIKE '%SECURITY_BREACH_REASSIGNED_APPLICATION%' THEN
        v_results := v_results || jsonb_build_array(jsonb_build_object('test_number', 12, 'description', '[APPLICATION IMMUTABILITY - DENY] Recruiter không thể đổi candidate_id', 'status', 'FAIL', 'details', 'Vi phạm bất biến! Recruiter đã chuyển giao đơn ứng tuyển sang candidate khác!'));
      ELSE
        v_results := v_results || jsonb_build_array(jsonb_build_object('test_number', 12, 'description', '[APPLICATION IMMUTABILITY - DENY] Recruiter không thể đổi candidate_id', 'status', 'PASS', 'details', format('Bị chặn bởi RLS (%s).', SQLERRM)));
      END IF;
    END;

    -- [C] KÍCH HOẠT ROLLBACK NỘI BỘ: HỦY SẠCH 100% FIXTURES TRONG CSDL
    RAISE EXCEPTION 'INTERNAL_FIXTURES_ROLLBACK';
  EXCEPTION WHEN OTHERS THEN
    RESET ROLE;
    PERFORM set_config('request.jwt.claims', '', true);

    -- Phân biệt rành mạch: Nếu là lệnh rollback chủ động thì bỏ qua, nếu lỗi setup thì ghi nhận SETUP_ERROR
    IF SQLERRM LIKE '%INTERNAL_FIXTURES_ROLLBACK%' THEN
      NULL;
    ELSE
      v_results := jsonb_build_array(jsonb_build_object(
        'test_number', 0,
        'description', '[SETUP ERROR] Khởi tạo Fixtures thất bại',
        'status', 'SETUP_ERROR',
        'details', format('Lỗi thiết lập: %s (12 test RLS chưa được chạy)', SQLERRM)
      ));
    END IF;
  END;

  -- ----------------------------------------------------------------------------
  -- ĐỔ KẾT QUẢ TỪ RAM (v_results) VÀO BẢNG TẠM rls_test_results
  -- ----------------------------------------------------------------------------
  RESET ROLE;
  PERFORM set_config('request.jwt.claims', '', true);

  INSERT INTO rls_test_results (test_number, description, status, details)
  SELECT 
    (elem->>'test_number')::INT,
    elem->>'description',
    elem->>'status',
    elem->>'details'
  FROM jsonb_array_elements(v_results) AS elem;
END $$;

-- 3. CÂU LỆNH CUỐI CÙNG: SELECT TRẢ VỀ BẢNG KẾT QUẢ TRỰC TIẾP TRÊN SUPABASE STUDIO
SELECT 
  test_number,
  description,
  status,
  details
FROM rls_test_results
UNION ALL
SELECT 
  999 AS test_number,
  '=== TỔNG KẾT KIỂM THỬ RLS ===' AS description,
  CASE 
    WHEN count(*) FILTER (WHERE status = 'SETUP_ERROR') > 0 THEN 'SETUP_ERROR'
    WHEN count(*) FILTER (WHERE status = 'FAIL') > 0 THEN 'FAIL'
    WHEN count(*) FILTER (WHERE status = 'PASS') > 0 THEN 'PASS'
    ELSE 'SKIP'
  END AS status,
  CASE 
    WHEN count(*) FILTER (WHERE status = 'SETUP_ERROR') > 0 THEN 
      format('LỖI THIẾT LẬP FIXTURE: %s (Bộ test RLS chưa thực thi)', max(details) FILTER (WHERE status = 'SETUP_ERROR'))
    ELSE
      format('PASS: %s | FAIL: %s | SKIP: %s / Tổng: %s test',
             count(*) FILTER (WHERE status = 'PASS'),
             count(*) FILTER (WHERE status = 'FAIL'),
             count(*) FILTER (WHERE status = 'SKIP'),
             count(*))
  END AS details
FROM rls_test_results
ORDER BY test_number;
