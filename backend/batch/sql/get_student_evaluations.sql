-- Öğrencinin mesaj değerlendirmelerini getiren RPC fonksiyonu
-- Supabase SQL Editor'da çalıştırın.

DROP FUNCTION IF EXISTS get_student_evaluations(text);

CREATE OR REPLACE FUNCTION get_student_evaluations(p_student_id TEXT)
RETURNS TABLE (
    message_id UUID,
    scores JSONB,
    feedback TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        me.message_id,
        me.scores,
        me.feedback,
        ch.created_at
    FROM public.message_evaluations me
    INNER JOIN public.chat_history ch ON ch.id = me.message_id
    WHERE ch.user_id = p_student_id::UUID
    ORDER BY ch.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
