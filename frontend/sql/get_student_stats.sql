DROP FUNCTION IF EXISTS get_student_stats;

CREATE FUNCTION get_student_stats(student_uid UUID)
RETURNS TABLE (
  total_messages BIGINT,
  total_bot_interactions BIGINT,
  first_message_date TIMESTAMP WITH TIME ZONE,
  last_message_date TIMESTAMP WITH TIME ZONE
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    COUNT(*) FILTER (WHERE is_user = true) as total_messages,
    COUNT(DISTINCT bot_index) as total_bot_interactions,
    MIN(created_at) as first_message_date,
    MAX(created_at) as last_message_date
  FROM chat_history
  WHERE user_id = student_uid;
$$;
