-- Function: get_student_details_by_uid
-- Description: Get student display name for a specific user ID
-- Parameters: user_id_param (uuid) - The user ID to get details for
-- Returns: A record with display_name

DROP FUNCTION IF EXISTS get_student_details_by_uid;
CREATE FUNCTION get_student_details_by_uid(user_id_param uuid)
RETURNS TABLE (
  display_name text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    ur.display_name
  FROM auth.users au
  JOIN user_roles ur ON au.id = ur.user_id
  WHERE au.id = user_id_param;
$$;
