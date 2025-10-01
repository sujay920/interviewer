import { useState, useRef, useEffect } from 'react';
import { Video, Square, Mic, MicOff, VideoOff, Play } from 'lucide-react';

interface InterviewRecorderProps {
  question: string;
  onRecordingComplete: (audioBlob: Blob, videoBlob: Blob, durationSeconds: number) => void;
  onCancel: () => void;
}

export function InterviewRecorder({ question, onRecordingComplete, onCancel }: InterviewRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
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
