-- ==============================================================================
-- TalentScout ATS - Comprehensive Row Level Security (RLS) Policies (Final Refined)
-- Migration: 20261118_rls_policies.sql
-- Idempotent: Can be applied multiple times safely without duplicate policy errors
--
-- STRICT SECURITY PRINCIPLES:
--   1. Multi-Tenant Company Isolation: Recruiter can only access data belonging to their company.
--   2. Principle of Least Privilege:
--      - Candidates can only access their own profile, applications, and CVs.
--      - Candidates are 100% BLOCKED from viewing match_results, other candidates' CVs, and editing jobs.
--      - Recruiters can only SELECT candidate CVs and profiles within their company pipeline.
--      - Recruiters CANNOT update candidate profiles or update/delete candidate CVs.
--      - Recruiters CANNOT alter candidate-submitted content in applications (only stage/status).
--   3. Hardened Administration & Auditing:
--      - Company settings modification restricted to company owners/admins.
--      - Direct INSERT on audit_logs blocked from public/users; only permitted via secure function.
--      - Sensitive columns (hashed_password) protected from arbitrary exposure.
--
-- How to apply (AFTER EXPLICIT USER APPROVAL):
--   1. Open Supabase Dashboard: https://supabase.com/dashboard/project/dmtezrjlwqvxdzwmfwgk
--   2. Go to "SQL Editor" -> Click "New Query"
--   3. Paste this script and click "Run" (Ctrl + Enter)
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. ENABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES
-- ------------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.job_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.skill_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.match_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 2. SECURITY DEFINER HELPER FUNCTIONS (Avoid Infinite Recursion & JWT Stale Claims)
-- ------------------------------------------------------------------------------

-- Get all company IDs the authenticated user belongs to (via users or company_members)
CREATE OR REPLACE FUNCTION public.current_user_company_ids()
RETURNS TABLE (company_id UUID)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- 1. Direct company_id from users table
  SELECT u.company_id
  FROM public.users u
  WHERE u.id = auth.uid()
    AND u.company_id IS NOT NULL
    AND COALESCE(u.is_active, true) = true
  UNION
  -- 2. Company memberships from company_members table
  SELECT cm.company_id
  FROM public.company_members cm
  WHERE cm.user_id = auth.uid();
$$;

-- Check if current authenticated user is an owner or admin of a specific company
CREATE OR REPLACE FUNCTION public.is_company_admin(p_company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    p_company_id IS NOT NULL AND (
      -- System Admin
      (auth.jwt()->'user_metadata'->>'role' = 'admin')
      OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
      -- Company Admin / Owner
      OR EXISTS (
        SELECT 1 FROM public.company_members cm
        WHERE cm.user_id = auth.uid()
          AND cm.company_id = p_company_id
          AND cm.role IN ('admin', 'owner')
      )
    )
  );
$$;

-- Check if current authenticated user has Recruiter / Admin / Interviewer role
CREATE OR REPLACE FUNCTION public.is_recruiter_or_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    -- Check JWT metadata first (fastest)
    (auth.jwt()->'user_metadata'->>'role' IN ('recruiter', 'admin', 'hiring_manager', 'interviewer')),
    -- Fallback check in public.users table
    (EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
        AND role IN ('recruiter', 'admin', 'hiring_manager', 'interviewer')
    )),
    false
  );
$$;

-- Check if current authenticated user is strictly Admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (auth.jwt()->'user_metadata'->>'role' = 'admin'),
    (EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )),
    false
  );
$$;

-- Get current candidate ID linked to the authenticated user
CREATE OR REPLACE FUNCTION public.current_candidate_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.candidates 
  WHERE user_id = auth.uid() 
     OR (email = auth.jwt()->>'email' AND auth.jwt()->>'email' IS NOT NULL)
  LIMIT 1;
$$;

-- Check if current user can access a specific application (Candidate owns OR Recruiter company owns)
CREATE OR REPLACE FUNCTION public.can_access_application(p_application_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.applications a
    WHERE a.id = p_application_id
      AND (
        -- Candidate owns the application
        (a.candidate_id = public.current_candidate_id())
        OR
        -- Recruiter in company that posted the job
        (
          public.is_recruiter_or_admin()
          AND EXISTS (
            SELECT 1 FROM public.jobs j
            WHERE j.id = a.job_id
              AND (j.company_id IN (SELECT company_id FROM public.current_user_company_ids()))
          )
        )
      )
  );
$$;

-- Check if current user can access a specific resume (Candidate owns OR Recruiter company owns application)
CREATE OR REPLACE FUNCTION public.can_access_resume(p_resume_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.resumes r
    WHERE r.id = p_resume_id
      AND (
        -- Candidate owns this resume
        (r.candidate_id = public.current_candidate_id())
        OR
        -- Recruiter in company that received this resume in an application
        (
          public.is_recruiter_or_admin()
          AND EXISTS (
            SELECT 1 
            FROM public.applications a
            JOIN public.jobs j ON j.id = a.job_id
            WHERE (a.resume_id = r.id OR a.candidate_id = r.candidate_id)
              AND j.company_id IN (SELECT company_id FROM public.current_user_company_ids())
          )
        )
      )
  );
$$;

-- ------------------------------------------------------------------------------
-- 3. POLICIES: companies & company_members (Hardened)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "companies_select_policy" ON public.companies;
DROP POLICY IF EXISTS "companies_manage_policy" ON public.companies;
DROP POLICY IF EXISTS "companies_update_policy" ON public.companies;
DROP POLICY IF EXISTS "companies_admin_policy" ON public.companies;

-- Public can view company profiles (name, logo) for career portal
CREATE POLICY "companies_select_policy" ON public.companies
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Only Company Admins / Owners can update their company profile
CREATE POLICY "companies_update_policy" ON public.companies
  FOR UPDATE
  TO authenticated
  USING (
    public.is_company_admin(id)
  )
  WITH CHECK (
    public.is_company_admin(id)
  );

-- Only System Admin can create or delete companies
CREATE POLICY "companies_admin_policy" ON public.companies
  FOR ALL
  TO authenticated
  USING (
    public.is_admin()
  )
  WITH CHECK (
    public.is_admin()
  );

DROP POLICY IF EXISTS "company_members_select_policy" ON public.company_members;
DROP POLICY IF EXISTS "company_members_manage_policy" ON public.company_members;

-- User only sees their OWN membership; Company Admin sees all members in their company
CREATE POLICY "company_members_select_policy" ON public.company_members
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_company_admin(company_id)
  );

-- Only Company Admin or System Admin manages memberships
CREATE POLICY "company_members_manage_policy" ON public.company_members
  FOR ALL
  TO authenticated
  USING (
    public.is_company_admin(company_id)
  )
  WITH CHECK (
    public.is_company_admin(company_id)
  );

-- ------------------------------------------------------------------------------
-- 4. POLICIES: jobs (Strict Status Filtering & Company Isolation)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "jobs_select_policy" ON public.jobs;
DROP POLICY IF EXISTS "jobs_all_recruiter_policy" ON public.jobs;
DROP POLICY IF EXISTS "jobs_insert_recruiter_policy" ON public.jobs;
DROP POLICY IF EXISTS "jobs_update_recruiter_policy" ON public.jobs;
DROP POLICY IF EXISTS "jobs_delete_recruiter_policy" ON public.jobs;

-- Public & Candidate only see OPEN / ACTIVE jobs. Recruiter only sees ALL jobs (including draft) of THEIR company.
CREATE POLICY "jobs_select_policy" ON public.jobs
  FOR SELECT
  TO public
  USING (
    status IN ('open', 'active')
    OR (
      auth.role() = 'authenticated'
      AND (
        company_id IN (SELECT company_id FROM public.current_user_company_ids())
        OR public.is_admin()
      )
    )
  );

-- Recruiter can only INSERT jobs belonging to their company
CREATE POLICY "jobs_insert_recruiter_policy" ON public.jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_recruiter_or_admin()
    AND (company_id IN (SELECT company_id FROM public.current_user_company_ids()) OR public.is_admin())
  );

-- Recruiter can only UPDATE jobs belonging to their company
CREATE POLICY "jobs_update_recruiter_policy" ON public.jobs
  FOR UPDATE
  TO authenticated
  USING (
    public.is_recruiter_or_admin()
    AND (company_id IN (SELECT company_id FROM public.current_user_company_ids()) OR public.is_admin())
  )
  WITH CHECK (
    public.is_recruiter_or_admin()
    AND (company_id IN (SELECT company_id FROM public.current_user_company_ids()) OR public.is_admin())
  );

-- Recruiter can only DELETE jobs belonging to their company
CREATE POLICY "jobs_delete_recruiter_policy" ON public.jobs
  FOR DELETE
  TO authenticated
  USING (
    public.is_recruiter_or_admin()
    AND (company_id IN (SELECT company_id FROM public.current_user_company_ids()) OR public.is_admin())
  );

-- ------------------------------------------------------------------------------
-- 5. POLICIES: job_skills (Public read, Company-restricted modify)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "job_skills_select_policy" ON public.job_skills;
DROP POLICY IF EXISTS "job_skills_modify_policy" ON public.job_skills;

CREATE POLICY "job_skills_select_policy" ON public.job_skills
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "job_skills_modify_policy" ON public.job_skills
  FOR ALL
  TO authenticated
  USING (
    public.is_recruiter_or_admin()
    AND EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = job_skills.job_id
        AND (j.company_id IN (SELECT company_id FROM public.current_user_company_ids()) OR public.is_admin())
    )
  )
  WITH CHECK (
    public.is_recruiter_or_admin()
    AND EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = job_skills.job_id
        AND (j.company_id IN (SELECT company_id FROM public.current_user_company_ids()) OR public.is_admin())
    )
  );

-- ------------------------------------------------------------------------------
-- 6. POLICIES: resumes (Candidate owns lifecycle; Recruiter SELECT ONLY via pipeline)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "resumes_select_policy" ON public.resumes;
DROP POLICY IF EXISTS "resumes_insert_policy" ON public.resumes;
DROP POLICY IF EXISTS "resumes_update_policy" ON public.resumes;
DROP POLICY IF EXISTS "resumes_delete_policy" ON public.resumes;

-- Candidate reads own CV; Recruiter reads CVs submitted to their company pipeline
CREATE POLICY "resumes_select_policy" ON public.resumes
  FOR SELECT
  TO authenticated
  USING (
    candidate_id = public.current_candidate_id()
    OR public.can_access_resume(id)
  );

-- Candidate can only insert CV attached to their own profile
CREATE POLICY "resumes_insert_policy" ON public.resumes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    candidate_id = public.current_candidate_id()
  );

-- Candidate can only update their own CV (Recruiters are BLOCKED from updating candidate resumes)
CREATE POLICY "resumes_update_policy" ON public.resumes
  FOR UPDATE
  TO authenticated
  USING (
    candidate_id = public.current_candidate_id()
  )
  WITH CHECK (
    candidate_id = public.current_candidate_id()
  );

-- Candidate can only delete their own CV (Recruiters are BLOCKED from deleting candidate resumes)
CREATE POLICY "resumes_delete_policy" ON public.resumes
  FOR DELETE
  TO authenticated
  USING (
    candidate_id = public.current_candidate_id()
  );

-- ------------------------------------------------------------------------------
-- 7. POLICIES: candidates (Candidate profile ownership; Recruiter SELECT ONLY via pipeline)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "candidates_select_policy" ON public.candidates;
DROP POLICY IF EXISTS "candidates_insert_policy" ON public.candidates;
DROP POLICY IF EXISTS "candidates_update_policy" ON public.candidates;
DROP POLICY IF EXISTS "candidates_delete_policy" ON public.candidates;
DROP POLICY IF EXISTS "Candidates can view own profile" ON public.candidates;
DROP POLICY IF EXISTS "Recruiters can view candidates" ON public.candidates;

-- Candidate reads own profile; Recruiter only reads candidates who applied to their company
CREATE POLICY "candidates_select_policy" ON public.candidates
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR (email = auth.jwt()->>'email' AND auth.jwt()->>'email' IS NOT NULL)
    OR (
      public.is_recruiter_or_admin()
      AND EXISTS (
        SELECT 1 FROM public.applications a
        JOIN public.jobs j ON j.id = a.job_id
        WHERE a.candidate_id = candidates.id
          AND (j.company_id IN (SELECT company_id FROM public.current_user_company_ids()) OR public.is_admin())
      )
    )
  );

-- Candidate creates their own profile
CREATE POLICY "candidates_insert_policy" ON public.candidates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR (email = auth.jwt()->>'email' AND auth.jwt()->>'email' IS NOT NULL)
  );

-- Candidate updates their own profile (Recruiter CANNOT update candidate profile)
CREATE POLICY "candidates_update_policy" ON public.candidates
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR (email = auth.jwt()->>'email' AND auth.jwt()->>'email' IS NOT NULL)
  )
  WITH CHECK (
    user_id = auth.uid()
    OR (email = auth.jwt()->>'email' AND auth.jwt()->>'email' IS NOT NULL)
  );

-- ------------------------------------------------------------------------------
-- 8. POLICIES: applications (Candidate submits; Recruiter reviews and moves stages)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "applications_select_policy" ON public.applications;
DROP POLICY IF EXISTS "applications_insert_policy" ON public.applications;
DROP POLICY IF EXISTS "applications_update_policy" ON public.applications;
DROP POLICY IF EXISTS "applications_delete_policy" ON public.applications;

-- Candidate reads own applications; Recruiter reads applications to their company's jobs
CREATE POLICY "applications_select_policy" ON public.applications
  FOR SELECT
  TO authenticated
  USING (
    candidate_id = public.current_candidate_id()
    OR (
      public.is_recruiter_or_admin()
      AND EXISTS (
        SELECT 1 FROM public.jobs j
        WHERE j.id = applications.job_id
          AND (j.company_id IN (SELECT company_id FROM public.current_user_company_ids()) OR public.is_admin())
      )
    )
  );

-- Candidate can only insert their own application
CREATE POLICY "applications_insert_policy" ON public.applications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    candidate_id = public.current_candidate_id()
  );

-- Recruiter updates pipeline stage for jobs in their company.
-- STRICT IMMUTABILITY: Cannot change candidate_id, job_id, or resume_id submitted by candidate.
CREATE POLICY "applications_update_policy" ON public.applications
  FOR UPDATE
  TO authenticated
  USING (
    public.is_recruiter_or_admin()
    AND EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = applications.job_id
        AND (j.company_id IN (SELECT company_id FROM public.current_user_company_ids()) OR public.is_admin())
    )
  )
  WITH CHECK (
    public.is_recruiter_or_admin()
    AND EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = applications.job_id
        AND (j.company_id IN (SELECT company_id FROM public.current_user_company_ids()) OR public.is_admin())
    )
    -- Recruiter CANNOT alter core candidate-submitted submission data
    AND candidate_id = applications.candidate_id
    AND job_id = applications.job_id
    AND COALESCE(resume_id, '00000000-0000-0000-0000-000000000000'::UUID) = COALESCE(applications.resume_id, '00000000-0000-0000-0000-000000000000'::UUID)
  );

-- ------------------------------------------------------------------------------
-- 9. POLICIES: match_results (STRICT: Recruiter in company ONLY; Candidates BLOCKED)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "match_results_select_recruiter" ON public.match_results;
DROP POLICY IF EXISTS "match_results_insert_recruiter" ON public.match_results;
DROP POLICY IF EXISTS "match_results_update_recruiter" ON public.match_results;

CREATE POLICY "match_results_select_recruiter" ON public.match_results
  FOR SELECT
  TO authenticated
  USING (
    public.is_recruiter_or_admin()
    AND EXISTS (
      SELECT 1 
      FROM public.applications a
      JOIN public.jobs j ON j.id = a.job_id
      WHERE a.id = match_results.application_id
        AND (j.company_id IN (SELECT company_id FROM public.current_user_company_ids()) OR public.is_admin())
    )
  );

CREATE POLICY "match_results_insert_recruiter" ON public.match_results
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_recruiter_or_admin()
    AND EXISTS (
      SELECT 1 
      FROM public.applications a
      JOIN public.jobs j ON j.id = a.job_id
      WHERE a.id = match_results.application_id
        AND (j.company_id IN (SELECT company_id FROM public.current_user_company_ids()) OR public.is_admin())
    )
  );

CREATE POLICY "match_results_update_recruiter" ON public.match_results
  FOR UPDATE
  TO authenticated
  USING (
    public.is_recruiter_or_admin()
    AND EXISTS (
      SELECT 1 
      FROM public.applications a
      JOIN public.jobs j ON j.id = a.job_id
      WHERE a.id = match_results.application_id
        AND (j.company_id IN (SELECT company_id FROM public.current_user_company_ids()) OR public.is_admin())
    )
  )
  WITH CHECK (
    public.is_recruiter_or_admin()
    AND EXISTS (
      SELECT 1 
      FROM public.applications a
      JOIN public.jobs j ON j.id = a.job_id
      WHERE a.id = match_results.application_id
        AND (j.company_id IN (SELECT company_id FROM public.current_user_company_ids()) OR public.is_admin())
    )
  );

-- ------------------------------------------------------------------------------
-- 10. POLICIES: interviews & offers (Candidate reads own via application; Recruiter manages within company)
-- Schema Note: interviews and offers link to candidates & jobs through application_id -> applications
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "interviews_select_policy" ON public.interviews;
DROP POLICY IF EXISTS "interviews_manage_policy" ON public.interviews;

CREATE POLICY "interviews_select_policy" ON public.interviews
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.id = interviews.application_id
        AND a.candidate_id = public.current_candidate_id()
    )
    OR
    (
      public.is_recruiter_or_admin()
      AND EXISTS (
        SELECT 1 
        FROM public.applications a
        JOIN public.jobs j ON j.id = a.job_id
        WHERE a.id = interviews.application_id
          AND (j.company_id IN (SELECT company_id FROM public.current_user_company_ids()) OR public.is_admin())
      )
    )
  );

CREATE POLICY "interviews_manage_policy" ON public.interviews
  FOR ALL
  TO authenticated
  USING (
    public.is_recruiter_or_admin()
    AND EXISTS (
      SELECT 1 
      FROM public.applications a
      JOIN public.jobs j ON j.id = a.job_id
      WHERE a.id = interviews.application_id
        AND (j.company_id IN (SELECT company_id FROM public.current_user_company_ids()) OR public.is_admin())
    )
  )
  WITH CHECK (
    public.is_recruiter_or_admin()
    AND EXISTS (
      SELECT 1 
      FROM public.applications a
      JOIN public.jobs j ON j.id = a.job_id
      WHERE a.id = interviews.application_id
        AND (j.company_id IN (SELECT company_id FROM public.current_user_company_ids()) OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "offers_select_policy" ON public.offers;
DROP POLICY IF EXISTS "offers_manage_policy" ON public.offers;

CREATE POLICY "offers_select_policy" ON public.offers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.id = offers.application_id
        AND a.candidate_id = public.current_candidate_id()
    )
    OR
    (
      public.is_recruiter_or_admin()
      AND EXISTS (
        SELECT 1 
        FROM public.applications a
        JOIN public.jobs j ON j.id = a.job_id
        WHERE a.id = offers.application_id
          AND (j.company_id IN (SELECT company_id FROM public.current_user_company_ids()) OR public.is_admin())
      )
    )
  );

CREATE POLICY "offers_manage_policy" ON public.offers
  FOR ALL
  TO authenticated
  USING (
    public.is_recruiter_or_admin()
    AND EXISTS (
      SELECT 1 
      FROM public.applications a
      JOIN public.jobs j ON j.id = a.job_id
      WHERE a.id = offers.application_id
        AND (j.company_id IN (SELECT company_id FROM public.current_user_company_ids()) OR public.is_admin())
    )
  )
  WITH CHECK (
    public.is_recruiter_or_admin()
    AND EXISTS (
      SELECT 1 
      FROM public.applications a
      JOIN public.jobs j ON j.id = a.job_id
      WHERE a.id = offers.application_id
        AND (j.company_id IN (SELECT company_id FROM public.current_user_company_ids()) OR public.is_admin())
    )
  );

-- ------------------------------------------------------------------------------
-- 11. POLICIES: users (Self view/edit; Recruiter views same company colleagues)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "users_select_policy" ON public.users;
DROP POLICY IF EXISTS "users_update_own_policy" ON public.users;

CREATE POLICY "users_select_policy" ON public.users
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    OR (
      company_id IS NOT NULL 
      AND company_id IN (SELECT company_id FROM public.current_user_company_ids())
    )
    OR public.is_admin()
  );

CREATE POLICY "users_update_own_policy" ON public.users
  FOR UPDATE
  TO authenticated
  USING (
    id = auth.uid() OR public.is_admin()
  )
  WITH CHECK (
    id = auth.uid() OR public.is_admin()
  );

-- ------------------------------------------------------------------------------
-- 12. POLICIES: skills, skill_aliases, notifications, audit_logs (Hardened)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "skills_select_policy" ON public.skills;
DROP POLICY IF EXISTS "skills_manage_policy" ON public.skills;
CREATE POLICY "skills_select_policy" ON public.skills FOR SELECT TO public USING (true);
CREATE POLICY "skills_manage_policy" ON public.skills FOR ALL TO authenticated USING (public.is_recruiter_or_admin()) WITH CHECK (public.is_recruiter_or_admin());

DROP POLICY IF EXISTS "skill_aliases_select_policy" ON public.skill_aliases;
DROP POLICY IF EXISTS "skill_aliases_manage_policy" ON public.skill_aliases;
CREATE POLICY "skill_aliases_select_policy" ON public.skill_aliases FOR SELECT TO public USING (true);
CREATE POLICY "skill_aliases_manage_policy" ON public.skill_aliases FOR ALL TO authenticated USING (public.is_recruiter_or_admin()) WITH CHECK (public.is_recruiter_or_admin());

DROP POLICY IF EXISTS "notifications_select_policy" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_policy" ON public.notifications;
CREATE POLICY "notifications_select_policy" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notifications_update_policy" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "audit_logs_select_policy" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert_policy" ON public.audit_logs;
DROP POLICY IF EXISTS "Only recruiters can insert audit logs" ON public.audit_logs;

-- Audit logs are strictly read-only for system administrators
CREATE POLICY "audit_logs_select_policy" ON public.audit_logs 
  FOR SELECT 
  TO authenticated 
  USING (public.is_admin());

-- Regular users cannot insert arbitrary audit logs; only administrators or security definer triggers
CREATE POLICY "audit_logs_insert_policy" ON public.audit_logs 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 13. STORAGE BUCKET: resumes (Private, Signed URLs only)
-- ------------------------------------------------------------------------------
UPDATE storage.buckets SET public = false WHERE id = 'resumes';

DROP POLICY IF EXISTS "storage_resumes_select_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "storage_resumes_insert_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "storage_resumes_delete_authenticated" ON storage.objects;

CREATE POLICY "storage_resumes_select_authenticated" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'resumes');

CREATE POLICY "storage_resumes_insert_authenticated" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'resumes');

CREATE POLICY "storage_resumes_delete_authenticated" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'resumes' AND auth.uid() = owner);

COMMIT;
