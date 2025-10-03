-- SQL function to get students for a specific class
-- This function returns student information for a given class, with teacher authorization check

DROP FUNCTION IF EXISTS get_class_students;
CREATE FUNCTION get_class_students(class_id_param UUID)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  display_name TEXT,
  role TEXT
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT ur.user_id, au.email, ur.display_name, ur.role
  FROM user_roles ur
  JOIN auth.users au ON au.id = ur.user_id
  WHERE ur.class_id = class_id_param
  AND ur.role = 'student'
  AND EXISTS (
    SELECT 1
    FROM teacher_classes tc
    WHERE tc.class_id = class_id_param
    AND tc.teacher_id = current_setting('jwt.claims.sub', true)::uuid
  );
$$;
