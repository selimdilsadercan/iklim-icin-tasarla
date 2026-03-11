-- Supabase SQL RPC Fonksiyonu: Belirli bir batch işinin mesajlarını getirir.
-- Bu scripti Supabase SQL Editor'da çalıştırarak fonksiyonu oluşturabilirsiniz.

CREATE OR REPLACE FUNCTION get_job_messages(p_job_id TEXT)
RETURNS TABLE (
    id UUID,
    student_id UUID,
    message TEXT,
    is_user BOOLEAN,
    created_at TIMESTAMPTZ,
    display_name TEXT
) AS $$
DECLARE
    v_config JSONB;
    v_student_ids UUID[];
    v_job_id UUID;
BEGIN
    v_job_id := p_job_id::UUID;

    -- 1. İş konfigürasyonunu al
    SELECT config INTO v_config FROM public.batch_jobs WHERE id = v_job_id;
    
    IF v_config IS NULL THEN
        RETURN;
    END IF;

    -- 2. Student ID listesini UUID dizisine çevir (Her birini UUID'ye cast et)
    v_student_ids := ARRAY(
        SELECT (x::TEXT)::UUID FROM jsonb_array_elements_text(v_config->'student_ids') AS x
    );

    -- 3. Mesajları getir (student_chat_messages_view üzerinden)
    RETURN QUERY
    SELECT 
        m.id::UUID,
        m.student_id::UUID,
        m.message,
        m.is_user,
        m.created_at,
        m.display_name::TEXT
    FROM public.student_chat_messages_view m
    WHERE m.student_id = ANY(v_student_ids)
      AND m.created_at >= (v_config->>'start_date')::TIMESTAMPTZ
      AND m.created_at <= (v_config->>'end_date')::TIMESTAMPTZ
    ORDER BY m.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
