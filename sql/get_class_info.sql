-- SQL function to get class information by ID
-- This function returns class details for a given class ID

DROP FUNCTION IF EXISTS get_class_info;
CREATE FUNCTION get_class_info(class_id_param UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  created_at TIMESTAMPTZ,
  student_count BIGINT
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    c.id, 
    c.name, 
    c.created_at,
    COALESCE(COUNT(ur.user_id), 0) as student_count
  FROM classes c
  LEFT JOIN user_roles ur ON ur.class_id = c.id AND ur.role = 'student'
  WHERE c.id = class_id_param
  GROUP BY c.id, c.name, c.created_at;
$$;
