-- Alternative function that returns JSON format (similar to existing get_bot_message_counts)
-- This version avoids RLS policy issues by using a simpler approach
DROP FUNCTION IF EXISTS get_user_bot_stats_json;
CREATE FUNCTION get_user_bot_stats_json(user_id_param UUID)
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
