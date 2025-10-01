import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  subscription_tier: 'free' | 'premium';
  subscription_expires_at?: string;
  created_at: string;
}

export interface InterviewSession {
  id: string;
  user_id: string;
  question: string;
  audio_url?: string;
  video_url?: string;
  transcription?: string;
  duration_seconds: number;
  status: 'recording' | 'processing' | 'completed' | 'failed';
  created_at: string;
}

export interface AIFeedback {
  id: string;
  session_id: string;
  overall_score: number;
  clarity_score: number;
  filler_word_count: number;
  structure_score: number;
  pace_score: number;
  feedback_text: string;
  strengths: string[];
  improvements: string[];
  created_at: string;
}

export interface ProgressMetric {
  id: string;
  user_id: string;
  session_id: string;
  metric_date: string;
  average_score: number;
  sessions_count: number;
  created_at: string;
}
