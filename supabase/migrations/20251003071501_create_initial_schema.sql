/*
  # Create AI Interview Coach Schema

  ## Overview
  This migration creates the complete database schema for the AI Interview Coach application, 
  including user profiles, interview sessions, AI feedback, and progress tracking.

  ## New Tables

  ### 1. profiles
  - `id` (uuid, primary key, references auth.users)
  - `email` (text, not null)
  - `full_name` (text)
  - `subscription_tier` (text, default 'free')
  - `subscription_expires_at` (timestamptz)
  - `created_at` (timestamptz, default now())
  
  Stores user profile information and subscription status.

  ### 2. interview_sessions
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles, not null)
  - `question` (text, not null)
  - `audio_url` (text)
  - `video_url` (text)
  - `transcription` (text)
  - `duration_seconds` (integer, not null)
  - `status` (text, default 'recording')
  - `created_at` (timestamptz, default now())
  
  Tracks individual interview practice sessions.

  ### 3. ai_feedback
  - `id` (uuid, primary key)
  - `session_id` (uuid, references interview_sessions, unique, not null)
  - `overall_score` (integer, not null)
  - `clarity_score` (integer, not null)
  - `filler_word_count` (integer, default 0)
  - `structure_score` (integer, not null)
  - `pace_score` (integer, not null)
  - `feedback_text` (text, not null)
  - `strengths` (text[], not null)
  - `improvements` (text[], not null)
  - `created_at` (timestamptz, default now())
  
  Stores AI-generated feedback for each session.

  ### 4. progress_metrics
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles, not null)
  - `session_id` (uuid, references interview_sessions, not null)
  - `metric_date` (date, not null)
  - `average_score` (integer, not null)
  - `sessions_count` (integer, default 1)
  - `created_at` (timestamptz, default now())
  
  Aggregates user progress metrics over time.

  ## Security

  - Enables Row Level Security (RLS) on all tables
  - Users can only access their own data
  - Profiles are auto-created on user signup via trigger
  - All tables have appropriate indexes for performance

  ## Policies

  ### profiles
  - Users can read their own profile
  - Users can update their own profile
  - Auto-insert on user creation

  ### interview_sessions
  - Users can view their own sessions
  - Users can create new sessions
  - Users can update their own sessions

  ### ai_feedback
  - Users can view feedback for their sessions
  - System can insert feedback (via service role)

  ### progress_metrics
  - Users can view their own metrics
  - System can insert metrics (via service role)
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  subscription_tier text NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium')),
  subscription_expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create interview_sessions table
CREATE TABLE IF NOT EXISTS interview_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question text NOT NULL,
  audio_url text,
  video_url text,
  transcription text,
  duration_seconds integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'recording' CHECK (status IN ('recording', 'processing', 'completed', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create ai_feedback table
CREATE TABLE IF NOT EXISTS ai_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL UNIQUE REFERENCES interview_sessions(id) ON DELETE CASCADE,
  overall_score integer NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  clarity_score integer NOT NULL CHECK (clarity_score >= 0 AND clarity_score <= 100),
  filler_word_count integer NOT NULL DEFAULT 0,
  structure_score integer NOT NULL CHECK (structure_score >= 0 AND structure_score <= 100),
  pace_score integer NOT NULL CHECK (pace_score >= 0 AND pace_score <= 100),
  feedback_text text NOT NULL,
  strengths text[] NOT NULL DEFAULT '{}',
  improvements text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create progress_metrics table
CREATE TABLE IF NOT EXISTS progress_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
  metric_date date NOT NULL DEFAULT CURRENT_DATE,
  average_score integer NOT NULL CHECK (average_score >= 0 AND average_score <= 100),
  sessions_count integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_interview_sessions_user_id ON interview_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_created_at ON interview_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_session_id ON ai_feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_progress_metrics_user_id ON progress_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_metrics_date ON progress_metrics(metric_date DESC);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_metrics ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Interview sessions policies
CREATE POLICY "Users can view own sessions"
  ON interview_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions"
  ON interview_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON interview_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
  ON interview_sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- AI feedback policies
CREATE POLICY "Users can view feedback for own sessions"
  ON ai_feedback FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM interview_sessions
      WHERE interview_sessions.id = ai_feedback.session_id
      AND interview_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert feedback for own sessions"
  ON ai_feedback FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM interview_sessions
      WHERE interview_sessions.id = ai_feedback.session_id
      AND interview_sessions.user_id = auth.uid()
    )
  );

-- Progress metrics policies
CREATE POLICY "Users can view own metrics"
  ON progress_metrics FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own metrics"
  ON progress_metrics FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();