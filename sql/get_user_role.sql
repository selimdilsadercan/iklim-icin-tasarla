-- SQL function to get user role by user ID
-- This function returns the role of a specific user
-- Returns NULL if user has no role assigned

DROP FUNCTION IF EXISTS get_user_role;
CREATE FUNCTION get_user_role(user_id_param UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT role
  FROM user_roles
  WHERE user_id = user_id_param
  LIMIT 1;
$$;
