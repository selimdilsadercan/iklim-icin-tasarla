DROP FUNCTION IF EXISTS get_class_students;

CREATE FUNCTION get_class_students(
  class_id_param UUID, 
  start_date TIMESTAMPTZ DEFAULT NULL, 
  end_date TIMESTAMPTZ DEFAULT NULL,
  sort_by TEXT DEFAULT 'conversations'
)
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
  damla_conversations BIGINT,
  last_message_date TIMESTAMPTZ
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
    COALESCE(COUNT(DISTINCT CASE WHEN ch.bot_index = 3 THEN ch.id END), 0) as damla_conversations,
    MAX(ch.created_at) as last_message_date
  FROM user_roles ur
  JOIN auth.users au ON au.id = ur.user_id
  JOIN classes c ON c.id = ur.class_id
  LEFT JOIN chat_history ch ON ch.user_id = ur.user_id
    AND (start_date IS NULL OR ch.created_at >= start_date)
    AND (end_date IS NULL OR ch.created_at <= end_date)
  WHERE ur.class_id = class_id_param
  AND ur.role = 'student'
  GROUP BY ur.user_id, au.email, ur.display_name, ur.role, c.name
  ORDER BY 
    CASE 
      WHEN sort_by = 'name' THEN ur.display_name
      ELSE NULL
    END ASC,
    CASE 
      WHEN sort_by = 'date' THEN MAX(ch.created_at)
      ELSE NULL
    END DESC NULLS LAST,
    CASE 
      WHEN sort_by = 'conversations' THEN COALESCE(COUNT(DISTINCT ch.id), 0)
      ELSE NULL
    END DESC;
$$;
