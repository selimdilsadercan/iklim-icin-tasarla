-- SQL function to get students for a specific class
-- This function returns student information for a given class
-- Includes class name and conversation counts with chat bots

DROP FUNCTION IF EXISTS get_class_students;
CREATE FUNCTION get_class_students(class_id_param UUID)
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
    c.name as class_name,
    COALESCE(COUNT(DISTINCT ch.id), 0) as total_conversations,
    COALESCE(COUNT(DISTINCT CASE WHEN ch.bot_index = 0 THEN ch.id END), 0) as yaprak_conversations,
    COALESCE(COUNT(DISTINCT CASE WHEN ch.bot_index = 1 THEN ch.id END), 0) as robi_conversations,
    COALESCE(COUNT(DISTINCT CASE WHEN ch.bot_index = 2 THEN ch.id END), 0) as bugday_conversations,
    COALESCE(COUNT(DISTINCT CASE WHEN ch.bot_index = 3 THEN ch.id END), 0) as damla_conversations
  FROM user_roles ur
  JOIN auth.users au ON au.id = ur.user_id
  JOIN classes c ON c.id = ur.class_id
  LEFT JOIN chat_history ch ON ch.user_id = ur.user_id
  WHERE ur.class_id = class_id_param
  AND ur.role = 'student'
  GROUP BY ur.user_id, au.email, ur.display_name, ur.role, c.name;
$$;
