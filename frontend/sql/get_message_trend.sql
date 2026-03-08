DROP FUNCTION IF EXISTS get_message_trend;

CREATE FUNCTION get_message_trend(teacher_uid UUID, days_back INTEGER DEFAULT 30)
RETURNS TABLE (
  date DATE,
  message_count BIGINT
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
  date_range AS (
    SELECT generate_series(
      CURRENT_DATE - (days_back - 1),
      CURRENT_DATE,
      '1 day'::interval
    )::DATE as date
  ),
  daily_messages AS (
    SELECT 
      DATE(ch.created_at) as date,
      COUNT(*) as message_count
    FROM chat_history ch
    CROSS JOIN is_admin ia
    WHERE ch.is_user = true
      AND (ia.admin_flag = true OR ch.user_id IN (SELECT user_id FROM relevant_students))
      AND ch.created_at >= CURRENT_DATE - (days_back - 1)
      AND ch.created_at < CURRENT_DATE + 1
    GROUP BY DATE(ch.created_at)
  )
  SELECT 
    dr.date,
    COALESCE(dm.message_count, 0) as message_count
  FROM date_range dr
  LEFT JOIN daily_messages dm ON dm.date = dr.date
  ORDER BY dr.date;
$$;

