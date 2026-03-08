-- Function: get_chat_history_by_uid
-- Description: Get chat history for a specific bot and user ID
-- Parameters: 
--   bot_idx (integer) - The bot index to get chat history for
--   user_id_param (uuid) - The user ID to get chat history for
-- Returns: All chat history records for the specified user and bot

DROP FUNCTION IF EXISTS get_chat_history_by_uid;   
CREATE FUNCTION get_chat_history_by_uid(bot_idx integer, user_id_param uuid)
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
  ORDER BY created_at ASC;
$$;