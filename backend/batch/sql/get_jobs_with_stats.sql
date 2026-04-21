-- Supabase SQL RPC Fonksiyonu: Batch işlerini detaylı istatistikleriyle birlikte getirir.
DROP FUNCTION IF EXISTS get_jobs_with_stats(integer);

CREATE OR REPLACE FUNCTION get_jobs_with_stats(p_limit INTEGER DEFAULT 100)
RETURNS TABLE (
    id UUID,
    status TEXT,
    config JSONB,
    error_message TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    processed_count BIGINT,
    total_count BIGINT,
    eligible_count BIGINT,
    total_messages BIGINT,
    processed_messages BIGINT,
    current_student_name TEXT,
    class_name TEXT,
    teacher_name TEXT,
    avg_overall_score NUMERIC,
    avg_content_score NUMERIC,
    avg_discussion_score NUMERIC,
    participants JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bj.id,
        bj.status,
        bj.config,
        bj.error_message,
        bj.created_at,
        bj.updated_at,
        -- Tamamlanan rapor sayısı
        (SELECT count(*) FROM public.student_reports sr WHERE sr.job_id = bj.id),
        -- Konfigürasyondaki toplam öğrenci sayısı
        jsonb_array_length(bj.config->'student_ids')::BIGINT,
         -- O tarih aralığında en az bir ÖĞRENCİ mesajı olan benzersiz öğrenci sayısı
        (
            SELECT count(DISTINCT ch.user_id)
            FROM public.chat_history ch
            WHERE ch.user_id = ANY(ARRAY(
                SELECT (x::TEXT)::UUID 
                FROM jsonb_array_elements_text(bj.config->'student_ids') AS x
            ))
            AND ch.is_user = true
            AND ch.created_at >= (bj.config->>'start_date')::TIMESTAMPTZ
            AND ch.created_at <= (bj.config->>'end_date')::TIMESTAMPTZ
        ),
        -- Toplam ÖĞRENCİ mesajı sayısı
        (
            SELECT count(*)
            FROM public.chat_history ch
            WHERE ch.user_id = ANY(ARRAY(
                SELECT (x::TEXT)::UUID 
                FROM jsonb_array_elements_text(bj.config->'student_ids') AS x
            ))
            AND ch.is_user = true
            AND ch.created_at >= (bj.config->>'start_date')::TIMESTAMPTZ
            AND ch.created_at <= (bj.config->>'end_date')::TIMESTAMPTZ
        ),
        -- Tamamlanan mesaj analizi sayısı
        (SELECT count(*) FROM public.message_evaluations me WHERE me.job_id = bj.id),
        -- Şu an analiz edilen öğrenci (canlı gösterim için)
        (
            SELECT ur.display_name 
            FROM public.message_evaluations me
            JOIN public.chat_history ch ON ch.id = me.message_id
            JOIN public.user_roles ur ON ur.user_id = ch.user_id
            WHERE me.job_id = bj.id
            ORDER BY me.evaluated_at DESC NULLS LAST
            LIMIT 1
        ),
        -- SINIF İSMİ
        COALESCE(
            -- 1. Seçenek: Config içindeki class_id üzerinden
            (SELECT c.name FROM public.classes c WHERE c.id::text = bj.config->>'class_id' LIMIT 1),
            -- 2. Seçenek: Öğrenciler üzerinden (Eski işler için fallback)
            (
                SELECT c.name 
                FROM public.classes c
                JOIN public.user_roles ur ON ur.class_id = c.id
                WHERE ur.user_id = ANY(ARRAY(
                    SELECT (x::TEXT)::UUID 
                    FROM jsonb_array_elements_text(bj.config->'student_ids') AS x
                ))
                LIMIT 1
            ), 
            'Bilinmeyen Sınıf'
        ),
        -- ÖĞRETMEN İSMİ
        COALESCE(
            -- 1. Seçenek: Config içindeki class_id üzerinden teacher_classes tablosuyla
            (
                SELECT urT.display_name
                FROM public.teacher_classes tc
                JOIN public.user_roles urT ON urT.user_id = tc.teacher_id
                WHERE tc.class_id::text = bj.config->>'class_id'
                LIMIT 1
            ),
            -- 2. Seçenek: Eski işler için öğrencinin sınıfından teacher_classes tablosuna git
            (
                SELECT urT2.display_name
                FROM public.teacher_classes tc2
                JOIN public.user_roles urT2 ON urT2.user_id = tc2.teacher_id
                WHERE tc2.class_id = (
                    SELECT ur3.class_id 
                    FROM public.user_roles ur3
                    WHERE ur3.user_id = ANY(ARRAY(
                        SELECT (x::TEXT)::UUID 
                        FROM jsonb_array_elements_text(bj.config->'student_ids') AS x
                    ))
                    LIMIT 1
                )
                LIMIT 1
            ),
            -- 3. Seçenek: Fallback olarak user_roles'ta teacher rolü olan biri
             (
                SELECT ur4.display_name
                FROM public.user_roles ur4
                WHERE ur4.class_id = (
                    SELECT ur5.class_id 
                    FROM public.user_roles ur5
                    WHERE ur5.user_id = ANY(ARRAY(
                        SELECT (x::TEXT)::UUID 
                        FROM jsonb_array_elements_text(bj.config->'student_ids') AS x
                    ))
                    LIMIT 1
                )
                AND LOWER(ur4.role) = 'teacher'
                LIMIT 1
            ),
            'Sistem'
        ),
        -- ORTALAMA SKORLAR
        (SELECT AVG(sr.overall_score) FROM public.student_reports sr WHERE sr.job_id = bj.id),
        (SELECT AVG((sr.stats->>'avg_content_score')::numeric) FROM public.student_reports sr WHERE sr.job_id = bj.id),
        (SELECT AVG((sr.stats->>'avg_discussion_score')::numeric) FROM public.student_reports sr WHERE sr.job_id = bj.id),
        -- TÜM KATILIMCILAR (Mesaj sayısına göre sıralı)
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'user_id', ur.user_id,
                    'name', ur.display_name,
                    'count', p.msg_count,
                    'score', sr.overall_score
                )
                ORDER BY p.msg_count DESC
            )
            FROM (
                SELECT ch.user_id, count(*) as msg_count
                FROM public.message_evaluations me
                JOIN public.chat_history ch ON ch.id = me.message_id
                WHERE me.job_id = bj.id
                GROUP BY ch.user_id
            ) p
            JOIN public.user_roles ur ON ur.user_id = p.user_id
            LEFT JOIN public.student_reports sr ON sr.job_id = bj.id AND sr.student_id = p.user_id
        )
    FROM public.batch_jobs bj
    ORDER BY bj.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
