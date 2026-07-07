
CREATE OR REPLACE FUNCTION public.gen_friend_code() RETURNS TEXT LANGUAGE plpgsql SET search_path = public AS $$
DECLARE code TEXT;
BEGIN
  LOOP
    code := upper(substring(encode(gen_random_bytes(6), 'base64') from 1 for 8));
    code := regexp_replace(code, '[^A-Z0-9]', 'X', 'g');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE friend_code = code);
  END LOOP;
  RETURN code;
END; $$;

REVOKE EXECUTE ON FUNCTION public.gen_friend_code() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.find_profile_by_code(TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.friend_weekly_summary(UUID[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.find_profile_by_code(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.friend_weekly_summary(UUID[]) TO authenticated;
