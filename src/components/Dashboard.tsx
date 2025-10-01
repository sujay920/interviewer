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
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {profile?.full_name || 'User'}
            </h1>
            <p className="text-blue-100">Track your progress and improve your interview skills</p>
          </div>
          {isPremium && (
            <div className="bg-yellow-400 text-gray-900 px-4 py-2 rounded-full flex items-center gap-2 font-semibold">
              <Crown className="w-5 h-5" />
              Premium
            </div>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 font-medium">Total Sessions</span>
            <BarChart3 className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.totalSessions}</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 font-medium">Average Score</span>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-bold text-gray-900">{stats.averageScore}</p>
            <span className="text-gray-400 text-lg mb-1">/100</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 font-medium">Best Score</span>
            <Award className="w-5 h-5 text-yellow-600" />
          </div>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-bold text-gray-900">{stats.bestScore}</p>
            <span className="text-gray-400 text-lg mb-1">/100</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 font-medium">Improvement</span>
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex items-end gap-2">
            <p className={`text-3xl font-bold ${stats.improvement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.improvement > 0 ? '+' : ''}{stats.improvement}%
            </p>
          </div>
        </div>
      </div>

      {!isPremium && (
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">
                <Crown className="w-7 h-7" />
                Upgrade to Premium
              </h3>
              <p className="text-yellow-50 mb-4">
                Get unlimited AI feedback, advanced analytics, and priority support
              </p>
              <button className="bg-white text-orange-600 font-semibold px-6 py-3 rounded-lg hover:bg-gray-100 transition">
                Upgrade Now
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Recent Sessions</h2>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading sessions...</div>
        ) : sessions.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-600 mb-4">No practice sessions yet</p>
            <button
              onClick={onNewSession}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition"
            >
              Start Your First Session
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {sessions.map((session) => (
              <div key={session.id} className="p-6 hover:bg-gray-50 transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-gray-900 font-medium mb-1">{session.question}</p>
                    <p className="text-sm text-gray-500">{formatDate(session.created_at)}</p>
                  </div>
                  {session.feedback && (
                    <div className="ml-4">
                      <div className={`text-2xl font-bold ${
                        session.feedback.overall_score >= 80 ? 'text-green-600' :
                        session.feedback.overall_score >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {session.feedback.overall_score}
                      </div>
                      <div className="text-xs text-gray-500 text-center">score</div>
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
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-xl transition shadow-lg hover:shadow-xl"
        >
          Start New Practice Session
        </button>
      </div>
    </div>
  );
}
