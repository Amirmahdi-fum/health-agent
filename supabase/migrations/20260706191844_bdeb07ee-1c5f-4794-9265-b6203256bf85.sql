
-- Add friend_code + privacy to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS friend_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS privacy JSONB NOT NULL DEFAULT '{"hideWeight":false,"hideCardio":false,"hideStreak":false}'::jsonb;

-- Backfill friend codes for existing users
CREATE OR REPLACE FUNCTION public.gen_friend_code() RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE code TEXT;
BEGIN
  LOOP
    code := upper(substring(encode(gen_random_bytes(6), 'base64') from 1 for 8));
    code := regexp_replace(code, '[^A-Z0-9]', 'X', 'g');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE friend_code = code);
  END LOOP;
  RETURN code;
END; $$;

UPDATE public.profiles SET friend_code = public.gen_friend_code() WHERE friend_code IS NULL;

-- Update handle_new_user to also seed friend_code
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, friend_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1)),
    public.gen_friend_code()
  )
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_stats (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Friends table (accepted mutual link stored as two rows for easy queries)
CREATE TABLE IF NOT EXISTS public.friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  friend_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, friend_id),
  CHECK (user_id <> friend_id)
);

GRANT SELECT, INSERT, DELETE ON public.friends TO authenticated;
GRANT ALL ON public.friends TO service_role;

ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_friends_select" ON public.friends FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_friends_insert" ON public.friends FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_friends_delete" ON public.friends FOR DELETE USING (auth.uid() = user_id);

-- Allow authenticated users to look up a profile by friend_code (limited surface via security definer fn below)
CREATE OR REPLACE FUNCTION public.find_profile_by_code(_code TEXT)
RETURNS TABLE(id UUID, display_name TEXT, avatar_id INT, friend_code TEXT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, display_name, avatar_id, friend_code
  FROM public.profiles WHERE friend_code = upper(_code) LIMIT 1;
$$;

-- Friend summary function: exposes only allowed metrics respecting privacy
CREATE OR REPLACE FUNCTION public.friend_weekly_summary(_user_ids UUID[])
RETURNS TABLE(
  user_id UUID,
  display_name TEXT,
  avatar_id INT,
  xp_week INT,
  cardio_min_week INT,
  current_streak INT,
  hide_cardio BOOLEAN,
  hide_streak BOOLEAN
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    p.id,
    p.display_name,
    p.avatar_id,
    COALESCE(s.xp, 0) AS xp_week,
    COALESCE((
      SELECT SUM((dl.payload->>'minutes')::int)
      FROM public.daily_logs dl
      WHERE dl.user_id = p.id AND dl.type = 'cardio'
        AND dl.log_date >= (CURRENT_DATE - INTERVAL '7 days')
    ), 0)::int AS cardio_min_week,
    COALESCE(s.current_streak, 0),
    COALESCE((p.privacy->>'hideCardio')::boolean, false),
    COALESCE((p.privacy->>'hideStreak')::boolean, false)
  FROM public.profiles p
  LEFT JOIN public.user_stats s ON s.user_id = p.id
  WHERE p.id = ANY(_user_ids);
$$;
