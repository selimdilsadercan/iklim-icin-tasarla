-- SQL function to get classes for a specific teacher by UID
-- This function takes a teacher UID as parameter and returns all classes associated with that teacher
-- If the user's role is "admin", returns all classes
-- Includes student count and total conversation count for each class

DROP FUNCTION IF EXISTS get_teacher_classes_by_uid;
CREATE FUNCTION get_teacher_classes_by_uid(teacher_uid UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  created_at TIMESTAMPTZ,
  student_count BIGINT,
  conversation_count BIGINT
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    c.id, 
    c.name, 
    c.created_at,
    COALESCE(COUNT(DISTINCT ur.user_id), 0) as student_count,
    COALESCE(COUNT(DISTINCT ch.id), 0) as conversation_count
  FROM classes c
  LEFT JOIN teacher_classes tc ON tc.class_id = c.id
  LEFT JOIN user_roles ur ON ur.class_id = c.id AND ur.role = 'student'
  LEFT JOIN chat_history ch ON ch.user_id = ur.user_id
  WHERE tc.teacher_id = teacher_uid 
     OR EXISTS (
       SELECT 1 
       FROM user_roles admin_check 
       WHERE admin_check.user_id = teacher_uid 
       AND admin_check.role = 'admin'
     )
  GROUP BY c.id, c.name, c.created_at
  ORDER BY c.created_at;
$$;
