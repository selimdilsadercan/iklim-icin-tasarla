-- SQL function to get students for a specific class
-- This function returns student information for a given class
-- Includes class name for display purposes

DROP FUNCTION IF EXISTS get_class_students;
CREATE FUNCTION get_class_students(class_id_param UUID)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  display_name TEXT,
  role TEXT,
  class_name TEXT
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    ur.user_id, 
    au.email, 
    ur.display_name, 
    ur.role,
    c.name as class_name
  FROM user_roles ur
  JOIN auth.users au ON au.id = ur.user_id
  JOIN classes c ON c.id = ur.class_id
  WHERE ur.class_id = class_id_param
  AND ur.role = 'student';
$$;
