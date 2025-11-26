DROP FUNCTION IF EXISTS get_other_students_stats;

CREATE FUNCTION get_other_students_stats()
RETURNS TABLE (
  student_count BIGINT,
  conversation_count BIGINT
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    COALESCE(COUNT(DISTINCT ur.user_id), 0) as student_count,
    COALESCE(COUNT(DISTINCT CASE WHEN ch.is_user = true THEN ch.id END), 0) as conversation_count
  FROM user_roles ur
  LEFT JOIN chat_history ch ON ch.user_id = ur.user_id
  WHERE ur.role = 'student'
    AND ur.class_id IS NULL;
$$;

