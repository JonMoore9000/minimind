-- MiniMind Database Schema for Supabase
-- Run this in your Supabase SQL editor to set up all required tables

-- Enable RLS on all tables
ALTER DATABASE postgres SET row_security = on;

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  stripe_customer_id TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'plus')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS and create policies for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (user_id = auth.uid());

-- Create child_profiles table
CREATE TABLE IF NOT EXISTS child_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INTEGER,
  favorites JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on user_id for child_profiles
CREATE INDEX IF NOT EXISTS child_profiles_user_id_idx ON child_profiles(user_id);

-- Enable RLS and create policies for child_profiles
ALTER TABLE child_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own child profiles" ON child_profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own child profiles" ON child_profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own child profiles" ON child_profiles
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own child profiles" ON child_profiles
  FOR DELETE USING (user_id = auth.uid());

-- Create stories table
CREATE TABLE IF NOT EXISTS stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  child_id UUID REFERENCES child_profiles(id) ON DELETE SET NULL,
  title TEXT,
  mode TEXT,
  content TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for stories
CREATE INDEX IF NOT EXISTS stories_user_id_idx ON stories(user_id);
CREATE INDEX IF NOT EXISTS stories_child_id_idx ON stories(child_id);
CREATE INDEX IF NOT EXISTS stories_mode_idx ON stories(mode);

-- Enable RLS and create policies for stories
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own stories" ON stories
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own stories" ON stories
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own stories" ON stories
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own stories" ON stories
  FOR DELETE USING (user_id = auth.uid());

-- Create chat_sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  child_id UUID REFERENCES child_profiles(id) ON DELETE SET NULL,
  mode TEXT,
  messages JSONB DEFAULT '[]',
  token_usage INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for chat_sessions
CREATE INDEX IF NOT EXISTS chat_sessions_user_id_idx ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS chat_sessions_child_id_idx ON chat_sessions(child_id);
CREATE INDEX IF NOT EXISTS chat_sessions_mode_idx ON chat_sessions(mode);

-- Enable RLS and create policies for chat_sessions
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chat sessions" ON chat_sessions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own chat sessions" ON chat_sessions
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Create usage_counters table
CREATE TABLE IF NOT EXISTS usage_counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  chat_count INTEGER DEFAULT 0,
  UNIQUE(user_id, date)
);

-- Enable RLS and create policies for usage_counters
ALTER TABLE usage_counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage counters" ON usage_counters
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own usage counters" ON usage_counters
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own usage counters" ON usage_counters
  FOR UPDATE USING (user_id = auth.uid());

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'plus')),
  status TEXT DEFAULT 'inactive',
  current_period_end TIMESTAMPTZ
);

-- Create indexes for subscriptions
CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS subscriptions_stripe_customer_id_idx ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS subscriptions_stripe_subscription_id_idx ON subscriptions(stripe_subscription_id);

-- Enable RLS and create policies for subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own subscriptions" ON subscriptions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own subscriptions" ON subscriptions
  FOR UPDATE USING (user_id = auth.uid());

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  free_daily_chats_override INTEGER,
  plus_daily_chats_override INTEGER,
  bedtime_voice TEXT,
  language TEXT DEFAULT 'en'
);

-- Enable RLS and create policies for settings
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings" ON settings
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own settings" ON settings
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own settings" ON settings
  FOR UPDATE USING (user_id = auth.uid());

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
