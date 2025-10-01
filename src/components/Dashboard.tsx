import { useState, useEffect } from 'react';
import { TrendingUp, Calendar, Award, BarChart3, Crown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, InterviewSession, AIFeedback } from '../lib/supabase';

interface SessionWithFeedback extends InterviewSession {
  feedback?: AIFeedback;
}

interface DashboardProps {
  onNewSession: () => void;
}

export function Dashboard({ onNewSession }: DashboardProps) {
  const { profile } = useAuth();
  const [sessions, setSessions] = useState<SessionWithFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSessions: 0,
    averageScore: 0,
    bestScore: 0,
    improvement: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('interview_sessions')
        .select('*')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(10);

      if (sessionsError) throw sessionsError;

      if (sessionsData) {
        const sessionsWithFeedback = await Promise.all(
          sessionsData.map(async (session) => {
            const { data: feedbackData } = await supabase
              .from('ai_feedback')
              .select('*')
              .eq('session_id', session.id)
              .maybeSingle();

            return { ...session, feedback: feedbackData || undefined };
          })
        );

        setSessions(sessionsWithFeedback);

        const scores = sessionsWithFeedback
          .filter((s) => s.feedback)
          .map((s) => s.feedback!.overall_score);

        if (scores.length > 0) {
          const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
          const bestScore = Math.max(...scores);

          const recentScores = scores.slice(0, 3);
          const olderScores = scores.slice(3, 6);
          const recentAvg = recentScores.length > 0
            ? recentScores.reduce((a, b) => a + b, 0) / recentScores.length
            : 0;
          const olderAvg = olderScores.length > 0
            ? olderScores.reduce((a, b) => a + b, 0) / olderScores.length
            : 0;
          const improvement = olderAvg > 0 ? Math.round(((recentAvg - olderAvg) / olderAvg) * 100) : 0;

          setStats({
            totalSessions: scores.length,
            averageScore: avgScore,
            bestScore,
            improvement,
          });
        }
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isPremium = profile?.subscription_tier === 'premium';

  return (
    <div className="max-w-7xl mx-auto space-y-6 relative">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -z-10"></div>
      
      <div className="glass-strong rounded-3xl p-8 border-glow glow-blue shimmer">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              <span className="text-gradient-blue">Welcome back, {profile?.full_name || 'User'}</span>
            </h1>
            <p className="text-gray-400">Track your progress and improve your interview skills</p>
          </div>
          {isPremium && (
            <div className="glass bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/30 px-4 py-2 rounded-full flex items-center gap-2 font-semibold glow-orange float">
              <Crown className="w-5 h-5 text-yellow-400" />
              <span className="text-yellow-400">Premium</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass rounded-2xl p-6 glow-blue hover:glow-pulse transition-all duration-300 group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-300 font-medium">Total Sessions</span>
            <div className="w-10 h-10 glass rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <BarChart3 className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <p className="text-4xl font-bold text-gradient-blue">{stats.totalSessions}</p>
        </div>

        <div className="glass rounded-2xl p-6 glow-green hover:glow-pulse transition-all duration-300 group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-300 font-medium">Average Score</span>
            <div className="w-10 h-10 glass rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <p className="text-4xl font-bold text-gradient-cyan">{stats.averageScore}</p>
            <span className="text-gray-500 text-lg mb-1">/100</span>
          </div>
        </div>

        <div className="glass rounded-2xl p-6 glow-orange hover:glow-pulse transition-all duration-300 group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-300 font-medium">Best Score</span>
            <div className="w-10 h-10 glass rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Award className="w-5 h-5 text-yellow-400" />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <p className="text-4xl font-bold text-yellow-400">{stats.bestScore}</p>
            <span className="text-gray-500 text-lg mb-1">/100</span>
          </div>
        </div>

        <div className="glass rounded-2xl p-6 glow-purple hover:glow-pulse transition-all duration-300 group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-300 font-medium">Improvement</span>
            <div className="w-10 h-10 glass rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Calendar className="w-5 h-5 text-purple-400" />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <p className={`text-4xl font-bold ${stats.improvement >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stats.improvement > 0 ? '+' : ''}{stats.improvement}%
            </p>
          </div>
        </div>
      </div>

      {!isPremium && (
        <div className="glass-strong rounded-3xl p-8 glow-orange border-glow shimmer overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-3xl font-bold mb-3 flex items-center gap-3">
                  <div className="w-12 h-12 glass rounded-2xl flex items-center justify-center float">
                    <Crown className="w-7 h-7 text-yellow-400" />
                  </div>
                  <span className="text-gradient-purple">Upgrade to Premium</span>
                </h3>
                <p className="text-gray-400 mb-6">
                  Get unlimited AI feedback, advanced analytics, and priority support
                </p>
                <button className="btn-glass bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold px-8 py-3 rounded-xl hover:scale-105 transition-transform duration-300 glow-orange">
                  Upgrade Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="glass-strong rounded-3xl overflow-hidden border-glow">
        <div className="p-6 border-b border-white/10 bg-white/5">
          <h2 className="text-2xl font-bold text-gradient-cyan">Recent Sessions</h2>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading sessions...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400 mb-6">No practice sessions yet</p>
            <button
              onClick={onNewSession}
              className="btn-glass bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold px-8 py-3 rounded-xl transition-all duration-300 glow-blue shimmer"
            >
              Start Your First Session
            </button>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {sessions.map((session) => (
              <div key={session.id} className="p-6 hover:bg-white/5 transition-all duration-300 group">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-gray-200 font-medium mb-2 group-hover:text-blue-400 transition-colors">{session.question}</p>
                    <p className="text-sm text-gray-500">{formatDate(session.created_at)}</p>
                  </div>
                  {session.feedback && (
                    <div className="ml-4">
                      <div className={`glass rounded-xl px-4 py-2 ${
                        session.feedback.overall_score >= 80 ? 'glow-green' :
                        session.feedback.overall_score >= 60 ? 'glow-orange' : 'glow-purple'
                      }`}>
                        <div className={`text-3xl font-bold ${
                          session.feedback.overall_score >= 80 ? 'text-green-400' :
                          session.feedback.overall_score >= 60 ? 'text-yellow-400' : 'text-purple-400'
                        }`}>
                          {session.feedback.overall_score}
                        </div>
                        <div className="text-xs text-gray-500 text-center">score</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-center pb-8">
        <button
          onClick={onNewSession}
          className="btn-glass bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold px-12 py-4 rounded-2xl transition-all duration-300 glow-blue shimmer text-lg hover:scale-105"
        >
          Start New Practice Session
        </button>
      </div>
    </div>
  );
}
