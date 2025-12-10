-- Function: get_chat_history_by_uid_with_date_filter
-- Description: Get chat history for a specific bot and user ID with optional date filtering
-- Parameters: 
--   bot_idx (integer) - The bot index to get chat history for
--   user_id_param (uuid) - The user ID to get chat history for
--   start_date (timestamptz) - Optional start date for filtering (NULL for no filter)
--   end_date (timestamptz) - Optional end date for filtering (NULL for no filter)
-- Returns: All chat history records for the specified user and bot within the date range

DROP FUNCTION IF EXISTS get_chat_history_by_uid_with_date_filter;
CREATE FUNCTION get_chat_history_by_uid_with_date_filter(
  bot_idx integer, 
  user_id_param uuid,
  start_date timestamptz DEFAULT NULL,
  end_date timestamptz DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  bot_index integer,
  message text,
  is_user boolean,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    id,
    user_id,
    bot_index,
    message,
    is_user,
    created_at
  FROM chat_history
  WHERE user_id = user_id_param 
    AND bot_index = bot_idx
    AND (start_date IS NULL OR created_at >= start_date)
    AND (end_date IS NULL OR created_at <= end_date)
  ORDER BY created_at ASC;
$$;
