import { useState, useRef, useEffect } from 'react';
import { Video, Square, Mic, MicOff, VideoOff, Play, AlertCircle } from 'lucide-react';
import { createSpeechAnalyzer, SpeechAnalysisResult } from '../lib/speechAnalysis';

interface InterviewRecorderProps {
  question: string;
  onRecordingComplete: (audioBlob: Blob, videoBlob: Blob, durationSeconds: number, speechAnalysis?: SpeechAnalysisResult) => void;
  onCancel: () => void;
}

export function InterviewRecorder({ question, onRecordingComplete, onCancel }: InterviewRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [realTimeTranscript, setRealTimeTranscript] = useState('');
  const [fillerWordCount, setFillerWordCount] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const speechAnalyzerRef = useRef(createSpeechAnalyzer());

  useEffect(() => {
    initializeMedia();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      speechAnalyzerRef.current.stopRealTimeAnalysis();
    };
  }, []);

  const initializeMedia = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing media devices:', error);
      alert('Unable to access camera and microphone. Please grant permissions.');
    }
  };

  const toggleCamera = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      videoTrack.enabled = !videoTrack.enabled;
      setIsCameraOn(videoTrack.enabled);
    }
  };

  const toggleMic = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setIsMicOn(audioTrack.enabled);
    }
  };

  const startRecording = () => {
    if (!stream) return;

    chunksRef.current = [];
    setRealTimeTranscript('');
    setFillerWordCount(0);
    
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp8,opus',
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = async () => {
      setIsAnalyzing(true);
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
      
      try {
        // Analyze the complete recording
        const speechAnalysis = await speechAnalyzerRef.current.analyzeAudioBlob(audioBlob, recordingTime);
        onRecordingComplete(audioBlob, blob, recordingTime, speechAnalysis);
      } catch (error) {
        console.error('Speech analysis failed:', error);
        onRecordingComplete(audioBlob, blob, recordingTime);
      } finally {
        setIsAnalyzing(false);
      }
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start(100);
    setIsRecording(true);
    startTimeRef.current = Date.now() - recordingTime * 1000;

    // Start real-time speech analysis
    speechAnalyzerRef.current.startRealTimeAnalysis(stream, (metrics) => {
      if (metrics.transcription) {
        setRealTimeTranscript(metrics.transcription);
      }
      if (metrics.fillerWordCount !== undefined) {
        setFillerWordCount(metrics.fillerWordCount);
      }
    });

    timerRef.current = window.setInterval(() => {
      setRecordingTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      speechAnalyzerRef.current.stopRealTimeAnalysis();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
        <h2 className="text-2xl font-bold mb-2">Interview Question</h2>
        <p className="text-blue-100 text-lg leading-relaxed">{question}</p>
      </div>

      <div className="relative bg-gray-900 aspect-video">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
        />

        {isRecording && (
          <div className="absolute top-4 left-4 bg-red-600 text-white px-4 py-2 rounded-full flex items-center gap-2 animate-pulse">
            <div className="w-3 h-3 bg-white rounded-full"></div>
            <span className="font-semibold">Recording</span>
          </div>
        )}

        <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white px-4 py-2 rounded-full font-mono text-lg">
          {formatTime(recordingTime)}
        </div>

        {!isCameraOn && (
          <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
            <VideoOff className="w-24 h-24 text-gray-600" />
          </div>
        )}
      </div>

      {/* Real-time feedback panel */}
      {isRecording && (
        <div className="bg-blue-50 border-t border-blue-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-blue-900">Live Analysis</h3>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <AlertCircle className="w-4 h-4 text-orange-600" />
                <span className="text-orange-700">Filler words: {fillerWordCount}</span>
              </div>
            </div>
          </div>
          {realTimeTranscript && (
            <div className="bg-white rounded-lg p-3 border border-blue-200">
              <p className="text-sm text-gray-600 mb-1">What you're saying:</p>
              <p className="text-sm text-gray-900 italic">"{realTimeTranscript}"</p>
            </div>
          )}
        </div>
      )}

      {isAnalyzing && (
        <div className="bg-yellow-50 border-t border-yellow-200 p-4">
          <div className="flex items-center justify-center gap-3">
            <div className="w-5 h-5 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-yellow-800 font-medium">Analyzing your speech...</span>
          </div>
        </div>
      )}

      <div className="p-6 bg-gray-50">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={toggleCamera}
            className={`p-4 rounded-full transition ${
              isCameraOn
                ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                : 'bg-red-100 hover:bg-red-200 text-red-700'
            }`}
            title={isCameraOn ? 'Turn off camera' : 'Turn on camera'}
          >
            {isCameraOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          </button>

          <button
            onClick={toggleMic}
            className={`p-4 rounded-full transition ${
              isMicOn
                ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                : 'bg-red-100 hover:bg-red-200 text-red-700'
            }`}
            title={isMicOn ? 'Mute microphone' : 'Unmute microphone'}
          >
            {isMicOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </button>

          {!isRecording ? (
            <button
              onClick={startRecording}
              disabled={!stream}
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-full font-semibold text-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
            >
              <Play className="w-6 h-6" />
              Start Recording
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="bg-gray-800 hover:bg-gray-900 text-white px-8 py-4 rounded-full font-semibold text-lg transition flex items-center gap-3"
            >
              <Square className="w-6 h-6" />
              Stop & Submit
            </button>
          )}

          <button
            onClick={onCancel}
            className="px-6 py-4 text-gray-600 hover:text-gray-800 font-medium transition"
          >
            Cancel
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Take your time to answer the question thoroughly.</p>
          <p className="mt-1">AI will analyze your response for clarity, structure, and delivery.</p>
        </div>
      </div>
    </div>
  );
}
