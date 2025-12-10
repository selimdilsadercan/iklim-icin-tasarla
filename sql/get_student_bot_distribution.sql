DROP FUNCTION IF EXISTS get_student_bot_distribution;

CREATE FUNCTION get_student_bot_distribution(student_uid UUID)
RETURNS TABLE (
  bot_index INTEGER,
  bot_name TEXT,
  conversation_count BIGINT,
  percentage NUMERIC
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  WITH bot_conversations AS (
    SELECT 
      ch.bot_index,
      CASE 
        WHEN ch.bot_index = 0 THEN 'Yaprak'
        WHEN ch.bot_index = 1 THEN 'Robi'
        WHEN ch.bot_index = 2 THEN 'Buğday'
        WHEN ch.bot_index = 3 THEN 'Damla'
        ELSE 'Bilinmeyen'
      END as bot_name,
      COUNT(DISTINCT ch.id) as conversation_count
    FROM chat_history ch
    WHERE ch.is_user = true
      AND ch.user_id = student_uid
    GROUP BY ch.bot_index
  ),
  total_conversations AS (
    SELECT SUM(conversation_count) as total
    FROM bot_conversations
  )
  SELECT 
    bc.bot_index,
    bc.bot_name,
    bc.conversation_count,
    CASE 
      WHEN tc.total > 0 THEN ROUND((bc.conversation_count::NUMERIC / tc.total::NUMERIC) * 100, 2)
      ELSE 0
    END as percentage
  FROM bot_conversations bc
  CROSS JOIN total_conversations tc
  ORDER BY bc.bot_index;
$$;
