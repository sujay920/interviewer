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

  const handleRecordingComplete = async (audioBlob: Blob, _videoBlob: Blob, durationSeconds: number) => {
    setIsProcessing(true);

    try {
      const sessionId = crypto.randomUUID();

      // Create session record
      const { error: sessionError } = await supabase
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

      // Import the processing functions dynamically
      const { 
        transcribeAudio, 
        analyzeSpeechMetrics,
        calculateClarityScore,
        calculateStructureScore,
        calculatePaceScore 
      } = await import('./lib/audioProcessing');
      
      const { generateAIFeedback } = await import('./lib/aiAnalysis');

      // Step 1: Transcribe audio
      const transcription = await transcribeAudio(audioBlob);
      
      // Step 2: Analyze speech metrics
      const metrics = analyzeSpeechMetrics(transcription);
      
      // Step 3: Calculate scores
      const clarityScore = calculateClarityScore(metrics, transcription);
      const structureScore = calculateStructureScore(metrics);
      const paceScore = calculatePaceScore(metrics);
      
      // Step 4: Generate AI feedback
      const feedback = generateAIFeedback(
        {
          question: currentQuestion,
          transcription,
          metrics,
          clarityScore,
          structureScore,
          paceScore,
        },
        sessionId
      );

      // Step 5: Store transcription in session
      await supabase
        .from('interview_sessions')
        .update({ 
          transcription: transcription.text,
          status: 'completed' 
        })
        .eq('id', sessionId);

      // Step 6: Store AI feedback
      const { error: feedbackError } = await supabase
        .from('ai_feedback')
        .insert(feedback);

      if (feedbackError) throw feedbackError;

      // Step 7: Update progress metrics
      await supabase
        .from('progress_metrics')
        .insert({
          user_id: user!.id,
          session_id: sessionId,
          metric_date: new Date().toISOString().split('T')[0],
          average_score: feedback.overall_score,
          sessions_count: 1,
        });

      setCurrentFeedback(feedback);
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
