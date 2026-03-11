-- Öğrencinin genel raporlarını getiren RPC fonksiyonu
-- Supabase SQL Editor'da çalıştırın.

DROP FUNCTION IF EXISTS get_student_reports(text);

CREATE OR REPLACE FUNCTION get_student_reports(p_student_id TEXT)
RETURNS TABLE (
    report_id UUID,
    job_id UUID,
    student_name TEXT,
    overall_score NUMERIC,
    stats JSONB,
    llm_evaluation JSONB,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sr.id AS report_id,
        sr.job_id,
        sr.student_name,
        sr.overall_score,
        sr.stats,
        sr.llm_evaluation,
        sr.created_at
    FROM public.student_reports sr
    WHERE sr.student_id = p_student_id::UUID
    ORDER BY sr.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
