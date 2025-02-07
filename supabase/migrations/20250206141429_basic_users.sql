CREATE TABLE public.profiles (
  id uuid NOT NULL,
  handle VARCHAR(15) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX profiles_handle_key ON public.profiles USING btree (handle);
CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

ALTER TABLE public.profiles ADD CONSTRAINT "profiles_pkey" PRIMARY KEY USING INDEX "profiles_pkey";
ALTER TABLE public.profiles ADD CONSTRAINT "profiles_handle_key" UNIQUE USING INDEX "profiles_handle_key";
ALTER TABLE public.profiles ADD CONSTRAINT "profiles_handle_format" CHECK (handle ~ '^[A-Za-z0-9]+$');
ALTER TABLE public.profiles ADD CONSTRAINT "profiles_handle_length_check" CHECK (char_length(handle) >= 3);
ALTER TABLE public.profiles ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE NOT valid;
ALTER TABLE public.profiles VALIDATE CONSTRAINT "profiles_id_fkey";

COMMENT ON TABLE public.profiles IS 'Profile data for each user.';
COMMENT ON COLUMN public.profiles.id IS 'References the internal Supabase Auth user.';

CREATE POLICY "Allow logged-in read access" ON public.profiles FOR SELECT USING ( (SELECT auth.role()) = 'authenticated' );
CREATE POLICY "Allow individual insert access" ON public.profiles FOR INSERT WITH CHECK ( auth.uid() = id );
CREATE POLICY "Allow individual update access" ON public.profiles FOR UPDATE USING ( (SELECT auth.uid()) = id ) WITH CHECK (handle = profiles.handle);;

CREATE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, handle)
  VALUES (new.id, new.raw_user_meta_data ->> 'handle');
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR each ROW EXECUTE PROCEDURE public.handle_new_user();
