-- SQL function to get bot statistics for a specific user
-- This function returns conversation counts and last activity for each bot for a given user

DROP FUNCTION IF EXISTS get_user_bot_stats;
CREATE FUNCTION get_user_bot_stats(user_id_param UUID)
RETURNS TABLE (
  bot_index INTEGER,
  bot_name TEXT,
  total_conversations BIGINT,
  last_active TIMESTAMPTZ,
  last_active_text TEXT
) 
LANGUAGE plpgsql
CREATE OR REPLACE FUNCTION get_teacher_classes()
AS $$
BEGIN
  RETURN QUERY
  WITH bot_names AS (
    SELECT 0 as bot_idx, 'yaprak' as name
    UNION ALL SELECT 1, 'robi'
    UNION ALL SELECT 2, 'bugday'
    UNION ALL SELECT 3, 'damla'
  ),
  user_bot_stats AS (
    SELECT 
      ch.bot_index,
      COUNT(CASE WHEN ch.is_user = true THEN 1 END) as conversation_count,
      MAX(ch.created_at) as last_message_time
    FROM chat_history ch
    WHERE ch.user_id = user_id_param
    GROUP BY ch.bot_index
  )
  SELECT 
    bn.bot_idx::INTEGER,
    bn.name::TEXT,
    COALESCE(ubs.conversation_count, 0)::BIGINT,
    ubs.last_message_time,
    CASE 
      WHEN ubs.last_message_time IS NULL THEN 'Hiç aktif değil'
      WHEN ubs.last_message_time > NOW() - INTERVAL '1 minute' THEN 'Şimdi'
      WHEN ubs.last_message_time > NOW() - INTERVAL '1 hour' THEN 
        EXTRACT(MINUTE FROM (NOW() - ubs.last_message_time))::INTEGER || ' dakika önce'
      WHEN ubs.last_message_time > NOW() - INTERVAL '1 day' THEN 
        EXTRACT(HOUR FROM (NOW() - ubs.last_message_time))::INTEGER || ' saat önce'
      WHEN ubs.last_message_time > NOW() - INTERVAL '7 days' THEN 
        EXTRACT(DAY FROM (NOW() - ubs.last_message_time))::INTEGER || ' gün önce'
      ELSE TO_CHAR(ubs.last_message_time, 'DD FMMonth YYYY')
    END::TEXT as last_active_text
  FROM bot_names bn
  LEFT JOIN user_bot_stats ubs ON bn.bot_idx = ubs.bot_index
  ORDER BY bn.bot_idx;
END;
$$;