import { TrendingUp, TrendingDown, AlertCircle, CheckCircle2, Target, LucideIcon } from 'lucide-react';
import { AIFeedback } from '../lib/supabase';

interface FeedbackDisplayProps {
  feedback: AIFeedback;
  onNewSession: () => void;
}

export function FeedbackDisplay({ feedback, onNewSession }: FeedbackDisplayProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-purple-400';
  };

  const getScoreGlow = (score: number) => {
    if (score >= 80) return 'glow-green';
    if (score >= 60) return 'glow-orange';
    return 'glow-purple';
  };

  const ScoreCard = ({ label, score, icon: Icon }: { label: string; score: number; icon: LucideIcon }) => (
    <div className={`glass rounded-2xl p-6 hover:scale-105 transition-all duration-300 ${getScoreGlow(score)}`}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-gray-300 font-medium">{label}</span>
        <div className="w-10 h-10 glass rounded-xl flex items-center justify-center">
          <Icon className={`w-5 h-5 ${getScoreColor(score)}`} />
        </div>
      </div>
      <div className="flex items-end gap-2">
        <span className={`text-5xl font-bold ${getScoreColor(score)}`}>{score}</span>
        <span className="text-gray-500 text-xl mb-2">/100</span>
      </div>
      <div className="mt-4 glass-subtle rounded-full h-3 overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${
            score >= 80 ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 
            score >= 60 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' : 
            'bg-gradient-to-r from-purple-500 to-pink-500'
          }`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 relative">
      {/* Background effects */}
      <div className="absolute top-0 left-1/3 w-96 h-96 bg-green-500/10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -z-10"></div>
      
      <div className="glass-strong rounded-3xl p-8 border-glow glow-blue shimmer">
        <h2 className="text-4xl font-bold mb-3">
          <span className="text-gradient-cyan">Your Performance Analysis</span>
        </h2>
        <p className="text-gray-400">AI-powered insights on your interview response</p>
      </div>

      <div className={`glass-strong rounded-3xl p-10 border-glow ${getScoreGlow(feedback.overall_score)} shimmer`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-400 mb-3">Overall Score</h3>
            <p className={`text-8xl font-bold ${getScoreColor(feedback.overall_score)}`}>
              {feedback.overall_score}
            </p>
          </div>
          <div className="text-right">
            <div className={`glass px-6 py-3 rounded-2xl inline-flex items-center gap-3 ${
              feedback.overall_score >= 80
                ? 'glow-green border-green-500/30'
                : feedback.overall_score >= 60
                ? 'glow-orange border-yellow-500/30'
                : 'glow-purple border-purple-500/30'
            }`}>
              {feedback.overall_score >= 80 ? (
                <>
                  <TrendingUp className="w-6 h-6 text-green-400" />
                  <span className="font-semibold text-green-400 text-lg">Excellent</span>
                </>
              ) : feedback.overall_score >= 60 ? (
                <>
                  <Target className="w-6 h-6 text-yellow-400" />
                  <span className="font-semibold text-yellow-400 text-lg">Good</span>
                </>
              ) : (
                <>
                  <TrendingDown className="w-6 h-6 text-purple-400" />
                  <span className="font-semibold text-purple-400 text-lg">Needs Work</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ScoreCard label="Clarity" score={feedback.clarity_score} icon={CheckCircle2} />
        <ScoreCard label="Structure" score={feedback.structure_score} icon={Target} />
        <ScoreCard label="Pace" score={feedback.pace_score} icon={TrendingUp} />
        <div className={`glass rounded-2xl p-6 hover:scale-105 transition-all duration-300 ${
          feedback.filler_word_count <= 3 ? 'glow-green' :
          feedback.filler_word_count <= 8 ? 'glow-orange' : 'glow-purple'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-300 font-medium">Filler Words</span>
            <div className="w-10 h-10 glass rounded-xl flex items-center justify-center">
              <AlertCircle className={`w-5 h-5 ${
                feedback.filler_word_count <= 3 ? 'text-green-400' :
                feedback.filler_word_count <= 8 ? 'text-yellow-400' : 'text-purple-400'
              }`} />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <span className={`text-5xl font-bold ${
              feedback.filler_word_count <= 3 ? 'text-green-400' :
              feedback.filler_word_count <= 8 ? 'text-yellow-400' : 'text-purple-400'
            }`}>
              {feedback.filler_word_count}
            </span>
          </div>
          <p className="text-gray-500 text-sm mt-3">um, uh, like, you know</p>
        </div>
      </div>

      <div className="glass-strong rounded-3xl p-8 border-glow glow-cyan">
        <h3 className="text-2xl font-bold text-gradient-purple mb-6">AI Feedback</h3>
        <p className="text-gray-300 leading-relaxed whitespace-pre-line text-lg">{feedback.feedback_text}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass-strong rounded-3xl p-8 border-green-500/20 glow-green">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 glass rounded-2xl flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="text-2xl font-bold text-green-400">Strengths</h3>
          </div>
          <ul className="space-y-3">
            {feedback.strengths.map((strength, index) => (
              <li key={index} className="flex items-start gap-3 text-gray-300">
                <span className="text-green-400 mt-1 text-xl">•</span>
                <span className="leading-relaxed">{strength}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="glass-strong rounded-3xl p-8 border-blue-500/20 glow-blue">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 glass rounded-2xl flex items-center justify-center">
              <Target className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-2xl font-bold text-blue-400">Areas to Improve</h3>
          </div>
          <ul className="space-y-3">
            {feedback.improvements.map((improvement, index) => (
              <li key={index} className="flex items-start gap-3 text-gray-300">
                <span className="text-blue-400 mt-1 text-xl">•</span>
                <span className="leading-relaxed">{improvement}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex justify-center pt-4">
        <button
          onClick={onNewSession}
          className="btn-glass bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold px-12 py-4 rounded-2xl transition-all duration-300 glow-blue shimmer text-lg hover:scale-105"
        >
          Practice Another Question
        </button>
      </div>
    </div>
  );
}
