
CREATE TABLE public.user_stats (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  xp integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  last_activity_date date,
  unlocked_badges jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_stats TO authenticated;
GRANT ALL ON public.user_stats TO service_role;

ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY own_stats_select ON public.user_stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY own_stats_insert ON public.user_stats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY own_stats_update ON public.user_stats FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER user_stats_updated
BEFORE UPDATE ON public.user_stats
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Extend the new-user handler to also seed stats
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1)))
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_stats (user_id) VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$function$;

-- Add persona preference column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS coach_persona text NOT NULL DEFAULT 'spartan';
