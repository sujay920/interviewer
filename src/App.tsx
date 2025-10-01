import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { InterviewRecorder } from './components/InterviewRecorder';
import { FeedbackDisplay } from './components/FeedbackDisplay';
import { Header } from './components/Header';
import { getRandomQuestion } from './data/questions';
import { supabase, AIFeedback } from './lib/supabase';
import { SpeechAnalysisResult } from './lib/speechAnalysis';
import { createAIFeedbackGenerator } from './lib/aiFeedback';

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

  const handleRecordingComplete = async (
    audioBlob: Blob, 
    videoBlob: Blob, 
    durationSeconds: number, 
    speechAnalysis?: SpeechAnalysisResult
  ) => {
    setIsProcessing(true);

    try {
      const sessionId = crypto.randomUUID();

      // Create session record
      const { data: sessionData, error: sessionError } = await supabase
        .from('interview_sessions')
        .insert({
          id: sessionId,
          user_id: user!.id,
          question: currentQuestion,
          duration_seconds: durationSeconds,
          status: 'processing',
          transcription: speechAnalysis?.transcription || '',
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Generate AI feedback using the speech analysis
      const feedbackGenerator = createAIFeedbackGenerator();
      let aiFeedback: AIFeedback;

      if (speechAnalysis) {
        aiFeedback = await feedbackGenerator.generateFeedback({
          transcription: speechAnalysis.transcription,
          question: currentQuestion,
          speechAnalysis,
          duration: durationSeconds
        });
      } else {
        // Fallback to basic mock feedback if speech analysis failed
        aiFeedback = {
          id: crypto.randomUUID(),
          session_id: sessionId,
          overall_score: 75,
          clarity_score: 75,
          filler_word_count: 5,
          structure_score: 75,
          pace_score: 75,
          feedback_text: 'Unable to analyze speech. Please ensure microphone permissions are granted and try again.',
          strengths: ['Completed the recording', 'Attempted the question'],
          improvements: ['Enable speech analysis for detailed feedback', 'Check microphone settings'],
          created_at: new Date().toISOString(),
        };
      }

      // Set the session ID for the feedback
      aiFeedback.session_id = sessionId;

      // Store feedback in database
      const { error: feedbackError } = await supabase
        .from('ai_feedback')
        .insert(aiFeedback);

      if (feedbackError) throw feedbackError;

      // Update session status
      await supabase
        .from('interview_sessions')
        .update({ status: 'completed' })
        .eq('id', sessionId);

      // Store progress metrics
      await supabase
        .from('progress_metrics')
        .insert({
          user_id: user!.id,
          session_id: sessionId,
          metric_date: new Date().toISOString().split('T')[0],
          average_score: aiFeedback.overall_score,
          sessions_count: 1,
        });

      setCurrentFeedback(aiFeedback);
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
