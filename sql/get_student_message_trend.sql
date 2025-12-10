DROP FUNCTION IF EXISTS get_student_message_trend;

CREATE FUNCTION get_student_message_trend(student_uid UUID, days_back INTEGER DEFAULT 30)
RETURNS TABLE (
  date DATE,
  message_count BIGINT
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  WITH date_range AS (
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
    WHERE ch.is_user = true
      AND ch.user_id = student_uid
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
