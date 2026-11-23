-- ==============================================================================
-- TalentScout ATS - Email Outbox Migration (Idempotent & Multi-Tenant Safe)
-- Migration: 20261119_create_email_outbox.sql
--
-- STRICT POLICIES:
-- 1. Blind Screening: Does NOT store recipient_name or recipient_email in email_outbox.
--    Stores candidate_id and a strictly unique blind_code per company:
--    CONSTRAINT uq_email_outbox_company_blind_code UNIQUE (company_id, blind_code).
-- 2. Partial Unique Index: Only ONE active draft allowed per (application_id, stage):
--    CREATE UNIQUE INDEX idx_email_outbox_active_draft ON public.email_outbox (application_id, stage) WHERE status = 'draft';
-- 3. Strict Stage & Email Type Matching:
--    stage = 'interview' => email_type = 'interview_invitation'
--    stage = 'rejected'  => email_type = 'rejection'
-- 4. Status Constraint:
--    CHECK (status IN ('draft', 'approved', 'archived'))
-- 5. Row Level Security:
--    - Recruiter/Admin: SELECT, INSERT, UPDATE on their company's email outbox.
--    - Admin only: DELETE on their company's email outbox.
--    - Candidates & Interviewers: 100% BLOCKED (Zero access).
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. CREATE TABLE public.email_outbox
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.email_outbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
    blind_code VARCHAR(50) NOT NULL,
    stage VARCHAR(30) NOT NULL CHECK (stage IN ('interview', 'rejected')),
    email_type VARCHAR(50) NOT NULL CHECK (email_type IN ('interview_invitation', 'rejection')),
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'archived')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

    -- Uniqueness constraint: Two candidates in the same company must never have the same blind code
    CONSTRAINT uq_email_outbox_company_blind_code UNIQUE (company_id, blind_code),

    -- Type and Stage consistency constraint
    CONSTRAINT chk_email_outbox_type_stage CHECK (
        (stage = 'interview' AND email_type = 'interview_invitation') OR
        (stage = 'rejected'  AND email_type = 'rejection')
    )
);

-- ------------------------------------------------------------------------------
-- 2. CREATE PERFORMANCE & INTEGRITY INDEXES
-- ------------------------------------------------------------------------------

-- Partial Unique Index: Exactly one active draft per application per stage
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_outbox_active_draft
    ON public.email_outbox (application_id, stage)
    WHERE status = 'draft';

-- Lookup by company and status
CREATE INDEX IF NOT EXISTS idx_email_outbox_company_status
    ON public.email_outbox (company_id, status);

-- Lookup by candidate
CREATE INDEX IF NOT EXISTS idx_email_outbox_candidate
    ON public.email_outbox (candidate_id);

-- Lookup by application
CREATE INDEX IF NOT EXISTS idx_email_outbox_application
    ON public.email_outbox (application_id);

-- ------------------------------------------------------------------------------
-- 3. TRIGGER TO AUTO-UPDATE updated_at
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_email_outbox_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_email_outbox_updated_at ON public.email_outbox;
CREATE TRIGGER trg_email_outbox_updated_at
    BEFORE UPDATE ON public.email_outbox
    FOR EACH ROW
    EXECUTE FUNCTION public.set_email_outbox_updated_at();

-- ------------------------------------------------------------------------------
-- 4. ENABLE ROW LEVEL SECURITY (RLS)
-- ------------------------------------------------------------------------------
ALTER TABLE public.email_outbox ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 5. RLS POLICIES FOR public.email_outbox
-- ------------------------------------------------------------------------------

-- Drop existing policies if any to ensure idempotency
DROP POLICY IF EXISTS "company_members_select_email_outbox" ON public.email_outbox;
DROP POLICY IF EXISTS "company_members_insert_email_outbox" ON public.email_outbox;
DROP POLICY IF EXISTS "company_members_update_email_outbox" ON public.email_outbox;
DROP POLICY IF EXISTS "company_admins_delete_email_outbox" ON public.email_outbox;

-- Policy 1: SELECT - Recruiters and Admins of the company can read email outbox
CREATE POLICY "company_members_select_email_outbox"
    ON public.email_outbox
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.company_members cm
            WHERE cm.company_id = email_outbox.company_id
              AND cm.user_id = auth.uid()
              AND cm.role IN ('recruiter', 'admin')
        )
    );

-- Policy 2: INSERT - Recruiters and Admins of the company can create email drafts
CREATE POLICY "company_members_insert_email_outbox"
    ON public.email_outbox
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.company_members cm
            WHERE cm.company_id = email_outbox.company_id
              AND cm.user_id = auth.uid()
              AND cm.role IN ('recruiter', 'admin')
        )
    );

-- Policy 3: UPDATE - Recruiters and Admins of the company can update drafts (subject, body, status)
CREATE POLICY "company_members_update_email_outbox"
    ON public.email_outbox
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.company_members cm
            WHERE cm.company_id = email_outbox.company_id
              AND cm.user_id = auth.uid()
              AND cm.role IN ('recruiter', 'admin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.company_members cm
            WHERE cm.company_id = email_outbox.company_id
              AND cm.user_id = auth.uid()
              AND cm.role IN ('recruiter', 'admin')
        )
    );

-- Policy 4: DELETE - Only Company Admins can delete drafts
CREATE POLICY "company_admins_delete_email_outbox"
    ON public.email_outbox
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.company_members cm
            WHERE cm.company_id = email_outbox.company_id
              AND cm.user_id = auth.uid()
              AND cm.role = 'admin'
        )
    );

COMMIT;
