-- Öğrenci raporları tablosu
-- Bu scripti Supabase SQL Editor'da çalıştırın.

CREATE TABLE IF NOT EXISTS public.student_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID NOT NULL REFERENCES public.batch_jobs(id) ON DELETE CASCADE,
    student_id UUID NOT NULL,
    student_name TEXT,
    overall_score NUMERIC(3,1),
    stats JSONB DEFAULT '{}'::jsonb,
    llm_evaluation JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Performans için indeksler
CREATE INDEX IF NOT EXISTS idx_student_reports_job_id ON public.student_reports(job_id);
CREATE INDEX IF NOT EXISTS idx_student_reports_student_id ON public.student_reports(student_id);

-- RLS (Row Level Security) - servis rolü her şeye erişebilir
ALTER TABLE public.student_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on student_reports"
    ON public.student_reports
    FOR ALL
    USING (true)
    WITH CHECK (true);
