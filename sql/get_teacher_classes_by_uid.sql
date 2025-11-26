DROP FUNCTION IF EXISTS get_teacher_classes_by_uid;

CREATE FUNCTION get_teacher_classes_by_uid(
  teacher_uid UUID,
  sort_by TEXT DEFAULT 'conversations'
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  created_at TIMESTAMPTZ,
  is_active BOOLEAN,
  student_count BIGINT,
  conversation_count BIGINT,
  last_message_date TIMESTAMPTZ
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    c.id, 
    c.name, 
    c.created_at,
    c.is_active,
    COALESCE(COUNT(DISTINCT ur.user_id), 0) as student_count,
    COALESCE(COUNT(DISTINCT ch.id), 0) as conversation_count,
    MAX(ch.created_at) as last_message_date
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
  GROUP BY c.id, c.name, c.created_at, c.is_active
  ORDER BY 
    CASE 
      WHEN sort_by = 'name' THEN c.name
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
