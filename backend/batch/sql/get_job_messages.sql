-- Supabase SQL RPC Fonksiyonu: Belirli bir batch işinin mesajlarını getirir.
-- Bu scripti Supabase SQL Editor'da çalıştırarak fonksiyonu oluşturabilirsiniz.

DROP FUNCTION IF EXISTS get_job_messages(text);

CREATE OR REPLACE FUNCTION get_job_messages(p_job_id TEXT)
RETURNS TABLE (
    msg_id UUID,
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
    SELECT bj.config INTO v_config 
    FROM public.batch_jobs bj 
    WHERE bj.id = v_job_id;
    
    IF v_config IS NULL THEN
        RETURN;
    END IF;

    -- 2. Student ID listesini UUID dizisine çevir
    v_student_ids := ARRAY(
        SELECT (x::TEXT)::UUID FROM jsonb_array_elements_text(v_config->'student_ids') AS x
    );

    -- 3. Mesajları getir (chat_history + user_roles JOIN)
    RETURN QUERY
    SELECT 
        ch.id AS msg_id,
        ch.user_id AS student_id,
        ch.message,
        ch.is_user,
        ch.created_at,
        COALESCE(ur.display_name, 'Bilinmeyen Öğrenci')::TEXT AS display_name
    FROM public.chat_history ch
    LEFT JOIN public.user_roles ur ON ur.user_id = ch.user_id
    WHERE ch.user_id = ANY(v_student_ids)
      AND ch.created_at >= (v_config->>'start_date')::TIMESTAMPTZ
      AND ch.created_at <= (v_config->>'end_date')::TIMESTAMPTZ
    ORDER BY ch.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
