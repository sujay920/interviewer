import { useState, useRef, useEffect } from 'react';
import { Video, Square, Mic, MicOff, VideoOff, Play } from 'lucide-react';

interface InterviewRecorderProps {
  question: string;
  onRecordingComplete: (audioBlob: Blob, videoBlob: Blob, durationSeconds: number) => void;
  onCancel: () => void;
}

export function InterviewRecorder({ question, onRecordingComplete, onCancel }: InterviewRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    initializeMedia();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
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
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp8,opus',
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
      onRecordingComplete(audioBlob, blob, recordingTime);
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start(100);
    setIsRecording(true);
    startTimeRef.current = Date.now() - recordingTime * 1000;

    timerRef.current = window.setInterval(() => {
      setRecordingTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
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
    <div className="glass-strong rounded-3xl overflow-hidden border-glow glow-blue">
      <div className="glass-strong p-8 border-b border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-3">
            <span className="text-gradient-blue">Interview Question</span>
          </h2>
          <p className="text-gray-300 text-lg leading-relaxed">{question}</p>
        </div>
      </div>

      <div className="relative bg-black aspect-video overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
        />

        {isRecording && (
          <div className="absolute top-4 left-4 glass-strong border-red-500/30 px-5 py-3 rounded-2xl flex items-center gap-3 glow-pulse">
            <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
            <span className="font-semibold text-red-400">Recording</span>
          </div>
        )}

        <div className="absolute top-4 right-4 glass-strong px-6 py-3 rounded-2xl font-mono text-xl text-cyan-400 glow-cyan">
          {formatTime(recordingTime)}
        </div>

        {!isCameraOn && (
          <div className="absolute inset-0 glass-strong flex items-center justify-center">
            <VideoOff className="w-24 h-24 text-gray-600" />
          </div>
        )}
      </div>

      <div className="p-8 glass">
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <button
            onClick={toggleCamera}
            className={`p-4 rounded-2xl transition-all duration-300 ${
              isCameraOn
                ? 'glass glow-cyan hover:scale-110'
                : 'glass-strong border-red-500/30 glow-orange'
            }`}
            title={isCameraOn ? 'Turn off camera' : 'Turn on camera'}
          >
            {isCameraOn ? 
              <Video className="w-6 h-6 text-cyan-400" /> : 
              <VideoOff className="w-6 h-6 text-red-400" />
            }
          </button>

          <button
            onClick={toggleMic}
            className={`p-4 rounded-2xl transition-all duration-300 ${
              isMicOn
                ? 'glass glow-purple hover:scale-110'
                : 'glass-strong border-red-500/30 glow-orange'
            }`}
            title={isMicOn ? 'Mute microphone' : 'Unmute microphone'}
          >
            {isMicOn ? 
              <Mic className="w-6 h-6 text-purple-400" /> : 
              <MicOff className="w-6 h-6 text-red-400" />
            }
          </button>

          {!isRecording ? (
            <button
              onClick={startRecording}
              disabled={!stream}
              className="btn-glass bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white px-10 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 glow-orange shimmer hover:scale-105"
            >
              <Play className="w-6 h-6" />
              Start Recording
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="btn-glass bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-10 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 flex items-center gap-3 glow-blue shimmer hover:scale-105"
            >
              <Square className="w-6 h-6" />
              Stop & Submit
            </button>
          )}

          <button
            onClick={onCancel}
            className="px-8 py-4 glass hover:glow-purple text-gray-400 hover:text-purple-400 font-medium transition-all duration-300 rounded-2xl"
          >
            Cancel
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-gray-400">Take your time to answer the question thoroughly.</p>
          <p className="mt-2 text-gray-500 text-sm">AI will analyze your response for clarity, structure, and delivery.</p>
        </div>
      </div>
    </div>
  );
}
