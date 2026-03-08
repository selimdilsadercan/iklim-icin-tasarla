DROP FUNCTION IF EXISTS get_bot_distribution;

CREATE FUNCTION get_bot_distribution(teacher_uid UUID)
RETURNS TABLE (
  bot_index INTEGER,
  bot_name TEXT,
  conversation_count BIGINT,
  percentage NUMERIC
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  WITH is_admin AS (
    SELECT EXISTS (
      SELECT 1 
      FROM user_roles admin_check 
      WHERE admin_check.user_id = teacher_uid 
      AND admin_check.role = 'admin'
    ) as admin_flag
  ),
  relevant_classes AS (
    SELECT DISTINCT c.id
    FROM classes c
    LEFT JOIN teacher_classes tc ON tc.class_id = c.id
    CROSS JOIN is_admin ia
    WHERE ia.admin_flag = true
       OR tc.teacher_id = teacher_uid
  ),
  relevant_students AS (
    SELECT DISTINCT ur.user_id
    FROM user_roles ur
    JOIN relevant_classes rc ON rc.id = ur.class_id
    WHERE ur.role = 'student'
  ),
  bot_conversations AS (
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
    CROSS JOIN is_admin ia
    WHERE ch.is_user = true
      AND (ia.admin_flag = true OR ch.user_id IN (SELECT user_id FROM relevant_students))
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

