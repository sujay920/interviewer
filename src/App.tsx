import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { InterviewRecorder } from './components/InterviewRecorder';
import { FeedbackDisplay } from './components/FeedbackDisplay';
import { Header } from './components/Header';
import { getRandomQuestion } from './data/questions';
import { supabase, AIFeedback } from './lib/supabase';

type View = 'dashboard' | 'session' | 'feedback';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [currentFeedback, setCurrentFeedback] = useState<AIFeedback | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      setCurrentView('dashboard');
    }
  }, [user, loading]);

  const handleStartNewSession = () => {
    setCurrentQuestion(getRandomQuestion());
    setCurrentView('session');
  };

  const handleRecordingComplete = async (audioBlob: Blob, videoBlob: Blob, durationSeconds: number) => {
    setIsProcessing(true);

    try {
      const sessionId = crypto.randomUUID();

      const { data: sessionData, error: sessionError } = await supabase
        .from('interview_sessions')
        .insert({
          id: sessionId,
          user_id: user!.id,
          question: currentQuestion,
          duration_seconds: durationSeconds,
          status: 'processing',
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      const mockFeedback: AIFeedback = {
        id: crypto.randomUUID(),
        session_id: sessionId,
        overall_score: Math.floor(Math.random() * 30) + 70,
        clarity_score: Math.floor(Math.random() * 30) + 70,
        filler_word_count: Math.floor(Math.random() * 15),
        structure_score: Math.floor(Math.random() * 30) + 70,
        pace_score: Math.floor(Math.random() * 30) + 70,
        feedback_text: `Great job on your response! Your answer demonstrated good understanding of the question.

You maintained consistent eye contact and spoke with confidence. Your pacing was generally appropriate, though there were a few moments where you could slow down slightly to emphasize key points.

Consider structuring your responses using the STAR method (Situation, Task, Action, Result) for behavioral questions to provide more concrete examples.`,
        strengths: [
          'Clear and confident delivery',
          'Good understanding of the question',
          'Maintained professional demeanor',
          'Provided specific examples',
        ],
        improvements: [
          'Reduce use of filler words',
          'Add more quantifiable results',
          'Improve response structure with frameworks',
          'Practice smoother transitions between points',
        ],
        created_at: new Date().toISOString(),
      };

      const { error: feedbackError } = await supabase
        .from('ai_feedback')
        .insert(mockFeedback);

      if (feedbackError) throw feedbackError;

      await supabase
        .from('interview_sessions')
        .update({ status: 'completed' })
        .eq('id', sessionId);

      await supabase
        .from('progress_metrics')
        .insert({
          user_id: user!.id,
          session_id: sessionId,
          metric_date: new Date().toISOString().split('T')[0],
          average_score: mockFeedback.overall_score,
          sessions_count: 1,
        });

      setCurrentFeedback(mockFeedback);
      setCurrentView('feedback');
    } catch (error) {
      console.error('Error processing recording:', error);
      alert('Failed to process recording. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelRecording = () => {
    setCurrentView('dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Processing Your Response</h2>
          <p className="text-gray-600">AI is analyzing your interview performance...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currentView={currentView} onViewChange={setCurrentView} />

      <main className="py-8 px-4 sm:px-6 lg:px-8">
        {currentView === 'dashboard' && (
          <Dashboard onNewSession={handleStartNewSession} />
        )}

        {currentView === 'session' && (
          <div className="max-w-4xl mx-auto">
            <InterviewRecorder
              question={currentQuestion}
              onRecordingComplete={handleRecordingComplete}
              onCancel={handleCancelRecording}
            />
          </div>
        )}

        {currentView === 'feedback' && currentFeedback && (
          <FeedbackDisplay
            feedback={currentFeedback}
            onNewSession={handleStartNewSession}
          />
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
