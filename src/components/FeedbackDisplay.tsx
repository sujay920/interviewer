import { TrendingUp, TrendingDown, AlertCircle, CheckCircle2, Target, LucideIcon } from 'lucide-react';
import { AIFeedback } from '../lib/supabase';

interface FeedbackDisplayProps {
  feedback: AIFeedback;
  onNewSession: () => void;
}

export function FeedbackDisplay({ feedback, onNewSession }: FeedbackDisplayProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const ScoreCard = ({ label, score, icon: Icon }: { label: string; score: number; icon: LucideIcon }) => (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <span className="text-gray-600 font-medium">{label}</span>
        <Icon className="w-5 h-5 text-gray-400" />
      </div>
      <div className="flex items-end gap-2">
        <span className={`text-4xl font-bold ${getScoreColor(score)}`}>{score}</span>
        <span className="text-gray-400 text-lg mb-1">/100</span>
      </div>
      <div className="mt-3 bg-gray-100 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${
            score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
          }`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white">
        <h2 className="text-3xl font-bold mb-2">Your Performance Analysis</h2>
        <p className="text-blue-100">AI-powered insights on your interview response</p>
      </div>

      <div className={`${getScoreBgColor(feedback.overall_score)} rounded-2xl p-8 border-2 border-current`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-1">Overall Score</h3>
            <p className={`text-6xl font-bold ${getScoreColor(feedback.overall_score)}`}>
              {feedback.overall_score}
            </p>
          </div>
          <div className="text-right">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
              feedback.overall_score >= 80
                ? 'bg-green-600 text-white'
                : feedback.overall_score >= 60
                ? 'bg-yellow-600 text-white'
                : 'bg-red-600 text-white'
            }`}>
              {feedback.overall_score >= 80 ? (
                <>
                  <TrendingUp className="w-5 h-5" />
                  <span className="font-semibold">Excellent</span>
                </>
              ) : feedback.overall_score >= 60 ? (
                <>
                  <Target className="w-5 h-5" />
                  <span className="font-semibold">Good</span>
                </>
              ) : (
                <>
                  <TrendingDown className="w-5 h-5" />
                  <span className="font-semibold">Needs Work</span>
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
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-600 font-medium">Filler Words</span>
            <AlertCircle className="w-5 h-5 text-gray-400" />
          </div>
          <div className="flex items-end gap-2">
            <span className={`text-4xl font-bold ${
              feedback.filler_word_count <= 3 ? 'text-green-600' :
              feedback.filler_word_count <= 8 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {feedback.filler_word_count}
            </span>
          </div>
          <p className="text-gray-500 text-sm mt-2">um, uh, like, you know</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4">AI Feedback</h3>
        <p className="text-gray-700 leading-relaxed whitespace-pre-line">{feedback.feedback_text}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-green-50 rounded-xl p-6 border border-green-200">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            <h3 className="text-lg font-bold text-green-900">Strengths</h3>
          </div>
          <ul className="space-y-2">
            {feedback.strengths.map((strength, index) => (
              <li key={index} className="flex items-start gap-2 text-green-800">
                <span className="text-green-600 mt-1">•</span>
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-bold text-blue-900">Areas to Improve</h3>
          </div>
          <ul className="space-y-2">
            {feedback.improvements.map((improvement, index) => (
              <li key={index} className="flex items-start gap-2 text-blue-800">
                <span className="text-blue-600 mt-1">•</span>
                <span>{improvement}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex justify-center pt-4">
        <button
          onClick={onNewSession}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-xl transition shadow-lg hover:shadow-xl"
        >
          Practice Another Question
        </button>
      </div>
    </div>
  );
}
