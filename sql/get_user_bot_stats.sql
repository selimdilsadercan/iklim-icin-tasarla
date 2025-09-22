-- SQL function to get bot statistics for a specific user
-- This function returns conversation counts and last activity for each bot for a given user

CREATE OR REPLACE FUNCTION get_user_bot_stats(user_id_param UUID)
RETURNS TABLE (
  bot_index INTEGER,
  bot_name TEXT,
  total_conversations BIGINT,
  last_active TIMESTAMPTZ,
  last_active_text TEXT
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH bot_names AS (
    SELECT 0 as bot_idx, 'yaprak' as name
    UNION ALL SELECT 1, 'robi'
    UNION ALL SELECT 2, 'bugday'
    UNION ALL SELECT 3, 'damla'
  ),
  user_bot_stats AS (
    SELECT 
      ch.bot_index,
      COUNT(CASE WHEN ch.is_user = true THEN 1 END) as conversation_count,
      MAX(ch.created_at) as last_message_time
    FROM chat_history ch
    WHERE ch.user_id = user_id_param
    GROUP BY ch.bot_index
  )
  SELECT 
    bn.bot_idx::INTEGER,
    bn.name::TEXT,
    COALESCE(ubs.conversation_count, 0)::BIGINT,
    ubs.last_message_time,
    CASE 
      WHEN ubs.last_message_time IS NULL THEN 'Hiç aktif değil'
      WHEN ubs.last_message_time > NOW() - INTERVAL '1 minute' THEN 'Şimdi'
      WHEN ubs.last_message_time > NOW() - INTERVAL '1 hour' THEN 
        EXTRACT(MINUTE FROM (NOW() - ubs.last_message_time))::INTEGER || ' dakika önce'
      WHEN ubs.last_message_time > NOW() - INTERVAL '1 day' THEN 
        EXTRACT(HOUR FROM (NOW() - ubs.last_message_time))::INTEGER || ' saat önce'
      WHEN ubs.last_message_time > NOW() - INTERVAL '7 days' THEN 
        EXTRACT(DAY FROM (NOW() - ubs.last_message_time))::INTEGER || ' gün önce'
      ELSE TO_CHAR(ubs.last_message_time, 'DD FMMonth YYYY')
    END::TEXT as last_active_text
  FROM bot_names bn
  LEFT JOIN user_bot_stats ubs ON bn.bot_idx = ubs.bot_index
  ORDER BY bn.bot_idx;
END;
$$;

-- Alternative function that returns JSON format (similar to existing get_bot_message_counts)
-- This version avoids RLS policy issues by using a simpler approach
CREATE OR REPLACE FUNCTION get_user_bot_stats_json(user_id_param UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  yaprak_conversations INTEGER := 0;
  yaprak_last_active TEXT := 'Hiç aktif değil';
  robi_conversations INTEGER := 0;
  robi_last_active TEXT := 'Hiç aktif değil';
  bugday_conversations INTEGER := 0;
  bugday_last_active TEXT := 'Hiç aktif değil';
  damla_conversations INTEGER := 0;
  damla_last_active TEXT := 'Hiç aktif değil';
  last_time TIMESTAMPTZ;
BEGIN
  -- Get Yaprak stats (bot_index = 0)
  SELECT 
    COUNT(CASE WHEN is_user = true THEN 1 END),
    MAX(created_at)
  INTO yaprak_conversations, last_time
  FROM chat_history 
  WHERE user_id = user_id_param AND bot_index = 0;
  
  IF last_time IS NOT NULL THEN
    yaprak_last_active := CASE 
      WHEN last_time > NOW() - INTERVAL '1 minute' THEN 'Şimdi'
      WHEN last_time > NOW() - INTERVAL '1 hour' THEN 
        EXTRACT(MINUTE FROM (NOW() - last_time))::INTEGER || ' dakika önce'
      WHEN last_time > NOW() - INTERVAL '1 day' THEN 
        EXTRACT(HOUR FROM (NOW() - last_time))::INTEGER || ' saat önce'
      WHEN last_time > NOW() - INTERVAL '7 days' THEN 
        EXTRACT(DAY FROM (NOW() - last_time))::INTEGER || ' gün önce'
      ELSE TO_CHAR(last_time, 'DD FMMonth YYYY')
    END;
  END IF;

  -- Get Robi stats (bot_index = 1)
  SELECT 
    COUNT(CASE WHEN is_user = true THEN 1 END),
    MAX(created_at)
  INTO robi_conversations, last_time
  FROM chat_history 
  WHERE user_id = user_id_param AND bot_index = 1;
  
  IF last_time IS NOT NULL THEN
    robi_last_active := CASE 
      WHEN last_time > NOW() - INTERVAL '1 minute' THEN 'Şimdi'
      WHEN last_time > NOW() - INTERVAL '1 hour' THEN 
        EXTRACT(MINUTE FROM (NOW() - last_time))::INTEGER || ' dakika önce'
      WHEN last_time > NOW() - INTERVAL '1 day' THEN 
        EXTRACT(HOUR FROM (NOW() - last_time))::INTEGER || ' saat önce'
      WHEN last_time > NOW() - INTERVAL '7 days' THEN 
        EXTRACT(DAY FROM (NOW() - last_time))::INTEGER || ' gün önce'
      ELSE TO_CHAR(last_time, 'DD FMMonth YYYY')
    END;
  END IF;

  -- Get Buğday stats (bot_index = 2)
  SELECT 
    COUNT(CASE WHEN is_user = true THEN 1 END),
    MAX(created_at)
  INTO bugday_conversations, last_time
  FROM chat_history 
  WHERE user_id = user_id_param AND bot_index = 2;
  
  IF last_time IS NOT NULL THEN
    bugday_last_active := CASE 
      WHEN last_time > NOW() - INTERVAL '1 minute' THEN 'Şimdi'
      WHEN last_time > NOW() - INTERVAL '1 hour' THEN 
        EXTRACT(MINUTE FROM (NOW() - last_time))::INTEGER || ' dakika önce'
      WHEN last_time > NOW() - INTERVAL '1 day' THEN 
        EXTRACT(HOUR FROM (NOW() - last_time))::INTEGER || ' saat önce'
      WHEN last_time > NOW() - INTERVAL '7 days' THEN 
        EXTRACT(DAY FROM (NOW() - last_time))::INTEGER || ' gün önce'
      ELSE TO_CHAR(last_time, 'DD FMMonth YYYY')
    END;
  END IF;

  -- Get Damla stats (bot_index = 3)
  SELECT 
    COUNT(CASE WHEN is_user = true THEN 1 END),
    MAX(created_at)
  INTO damla_conversations, last_time
  FROM chat_history 
  WHERE user_id = user_id_param AND bot_index = 3;
  
  IF last_time IS NOT NULL THEN
    damla_last_active := CASE 
      WHEN last_time > NOW() - INTERVAL '1 minute' THEN 'Şimdi'
      WHEN last_time > NOW() - INTERVAL '1 hour' THEN 
        EXTRACT(MINUTE FROM (NOW() - last_time))::INTEGER || ' dakika önce'
      WHEN last_time > NOW() - INTERVAL '1 day' THEN 
        EXTRACT(HOUR FROM (NOW() - last_time))::INTEGER || ' saat önce'
      WHEN last_time > NOW() - INTERVAL '7 days' THEN 
        EXTRACT(DAY FROM (NOW() - last_time))::INTEGER || ' gün önce'
      ELSE TO_CHAR(last_time, 'DD FMMonth YYYY')
    END;
  END IF;

  -- Build the JSON result
  result := json_build_object(
    'yaprak', json_build_object(
      'total_conversations', yaprak_conversations,
      'last_active', yaprak_last_active
    ),
    'robi', json_build_object(
      'total_conversations', robi_conversations,
      'last_active', robi_last_active
    ),
    'bugday', json_build_object(
      'total_conversations', bugday_conversations,
      'last_active', bugday_last_active
    ),
    'damla', json_build_object(
      'total_conversations', damla_conversations,
      'last_active', damla_last_active
    )
  );
  
  RETURN result;
END;
$$;

-- Function to get overall user statistics
CREATE OR REPLACE FUNCTION get_user_overall_stats(user_id_param UUID)
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
