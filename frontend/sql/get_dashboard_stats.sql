DROP FUNCTION IF EXISTS get_dashboard_stats;

CREATE FUNCTION get_dashboard_stats(teacher_uid UUID)
RETURNS TABLE (
  total_classes BIGINT,
  total_students BIGINT,
  total_conversations BIGINT
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
  )
  SELECT 
    (SELECT COUNT(*) FROM relevant_classes) as total_classes,
    (SELECT COUNT(*) FROM relevant_students) as total_students,
    (SELECT COUNT(*) 
     FROM chat_history ch
     CROSS JOIN is_admin ia
     WHERE ch.is_user = true
     AND (ia.admin_flag = true OR ch.user_id IN (SELECT user_id FROM relevant_students))
    ) as total_conversations;
$$;

