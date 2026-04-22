-- Analiz grupları tablosu
CREATE TABLE IF NOT EXISTS public.analysis_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    job_ids UUID[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS Politikaları
ALTER TABLE public.analysis_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for now" ON public.analysis_groups
    FOR ALL
    USING (true)
    WITH CHECK (true);
