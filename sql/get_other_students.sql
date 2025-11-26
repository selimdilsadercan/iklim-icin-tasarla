DROP FUNCTION IF EXISTS get_other_students;

CREATE FUNCTION get_other_students()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  display_name TEXT,
  role TEXT,
  class_name TEXT,
  total_conversations BIGINT,
  yaprak_conversations BIGINT,
  robi_conversations BIGINT,
  bugday_conversations BIGINT,
  damla_conversations BIGINT
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    ur.user_id, 
    au.email, 
    ur.display_name, 
    ur.role,
    'Diğer Öğrenciler' as class_name,
    COALESCE(COUNT(DISTINCT CASE WHEN ch.is_user = true THEN ch.id END), 0) as total_conversations,
    COALESCE(COUNT(DISTINCT CASE WHEN ch.bot_index = 0 AND ch.is_user = true THEN ch.id END), 0) as yaprak_conversations,
    COALESCE(COUNT(DISTINCT CASE WHEN ch.bot_index = 1 AND ch.is_user = true THEN ch.id END), 0) as robi_conversations,
    COALESCE(COUNT(DISTINCT CASE WHEN ch.bot_index = 2 AND ch.is_user = true THEN ch.id END), 0) as bugday_conversations,
    COALESCE(COUNT(DISTINCT CASE WHEN ch.bot_index = 3 AND ch.is_user = true THEN ch.id END), 0) as damla_conversations
  FROM user_roles ur
  JOIN auth.users au ON au.id = ur.user_id
  LEFT JOIN chat_history ch ON ch.user_id = ur.user_id
  WHERE ur.role = 'student'
    AND ur.class_id IS NULL
  GROUP BY ur.user_id, au.email, ur.display_name, ur.role
  ORDER BY total_conversations DESC;
$$;

