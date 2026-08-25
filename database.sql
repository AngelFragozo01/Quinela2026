-- 1. Create a custom enum type for roles
CREATE TYPE public.user_role AS ENUM ('user', 'admin');

-- 2. Create the profiles table extending auth.users
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users on delete cascade not null primary key,
  email text,
  username text,
  role user_role DEFAULT 'user'::user_role,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Set up Row Level Security (RLS) for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone."
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile."
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile."
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 4. Create a trigger to automatically create a profile for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'username');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. Create matches table
CREATE TABLE public.matches (
  id uuid DEFAULT gen_random_uuid() primary key,
  home_team_id text not null,
  away_team_id text not null,
  match_date timestamp with time zone not null,
  week integer default 1,
  is_finished boolean default false,
  is_locked boolean default false,
  home_score integer default 0,
  away_score integer default 0,
  winner_team_id text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Si la tabla ya existe, agregar las columnas necesarias:
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS week integer DEFAULT 1;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS is_locked boolean DEFAULT false;

-- RLS for matches
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Matches are viewable by everyone"
  ON public.matches FOR SELECT USING (true);

CREATE POLICY "Only admins can insert matches"
  ON public.matches FOR INSERT 
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Only admins can update matches"
  ON public.matches FOR UPDATE 
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 6. Create predictions table
CREATE TABLE public.predictions (
  id uuid DEFAULT gen_random_uuid() primary key,
  user_id uuid REFERENCES public.profiles on delete cascade not null,
  match_id uuid REFERENCES public.matches on delete cascade not null,
  predicted_winner_id text not null,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, match_id) -- One prediction per match per user
);

-- RLS for predictions
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Predictions are viewable by everyone"
  ON public.predictions FOR SELECT USING (true);

CREATE POLICY "Users can insert their own predictions"
  ON public.predictions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own predictions"
  ON public.predictions FOR UPDATE USING (auth.uid() = user_id);
