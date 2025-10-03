-- Function to get overall user statistics
DROP FUNCTION IF EXISTS get_user_overall_stats;
CREATE FUNCTION get_user_overall_stats(user_id_param UUID)
RETURNS TABLE (
  total_conversations BIGINT,
  total_messages BIGINT,
  first_chat_date TIMESTAMPTZ,
  last_chat_date TIMESTAMPTZ,
  most_used_bot TEXT,
  most_used_bot_conversations BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH user_stats AS (
    SELECT 
      COUNT(CASE WHEN is_user = true THEN 1 END) as user_messages,
      COUNT(*) as total_messages,
      MIN(created_at) as first_message,
      MAX(created_at) as last_message
    FROM chat_history 
    WHERE user_id = user_id_param
  ),
  bot_usage AS (
    SELECT 
      bot_index,
      COUNT(CASE WHEN is_user = true THEN 1 END) as conversations
    FROM chat_history 
    WHERE user_id = user_id_param
    GROUP BY bot_index
    ORDER BY conversations DESC
    LIMIT 1
  ),
  bot_names AS (
    SELECT 0 as bot_idx, 'yaprak' as name
    UNION ALL SELECT 1, 'robi'
    UNION ALL SELECT 2, 'bugday'
    UNION ALL SELECT 3, 'damla'
  )
  SELECT 
    us.user_messages,
    us.total_messages,
    us.first_message,
    us.last_message,
    bn.name,
    bu.conversations
  FROM user_stats us
  LEFT JOIN bot_usage bu ON true
  LEFT JOIN bot_names bn ON bu.bot_index = bn.bot_idx;
END;
$$;
