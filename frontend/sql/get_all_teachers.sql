DROP FUNCTION IF EXISTS get_all_teachers;

CREATE FUNCTION get_all_teachers()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  display_name TEXT,
  role TEXT,
  total_classes BIGINT,
  total_students BIGINT,
  total_conversations BIGINT
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    ur.user_id, 
    au.email, 
    ur.display_name, 
    ur.role,
    COALESCE((
      SELECT COUNT(DISTINCT tc.class_id)
      FROM teacher_classes tc
      WHERE tc.teacher_id = ur.user_id
    ), 0) as total_classes,
    COALESCE((
      SELECT COUNT(DISTINCT ur_students.user_id)
      FROM teacher_classes tc
      JOIN user_roles ur_students ON ur_students.class_id = tc.class_id AND ur_students.role = 'student'
      WHERE tc.teacher_id = ur.user_id
    ), 0) as total_students,
    COALESCE((
      SELECT COUNT(DISTINCT ch.id)
      FROM teacher_classes tc
      JOIN user_roles ur_students ON ur_students.class_id = tc.class_id AND ur_students.role = 'student'
      JOIN chat_history ch ON ch.user_id = ur_students.user_id AND ch.is_user = true
      WHERE tc.teacher_id = ur.user_id
    ), 0) as total_conversations
  FROM user_roles ur
  JOIN auth.users au ON au.id = ur.user_id
  WHERE ur.role = 'teacher'
  ORDER BY total_conversations DESC, ur.display_name ASC, au.email ASC;
$$;

