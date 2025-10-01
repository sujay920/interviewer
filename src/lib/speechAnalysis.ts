export interface SpeechAnalysisResult {
  transcription: string;
  wordCount: number;
  fillerWordCount: number;
  speakingRate: number; // words per minute
  pauseCount: number;
  averagePauseLength: number;
  confidenceScore: number;
}

export interface AudioMetrics {
  duration: number;
  averageVolume: number;
  volumeVariation: number;
  silencePercentage: number;
}

// Common filler words to detect
const FILLER_WORDS = [
  'um', 'uh', 'like', 'you know', 'so', 'actually', 'basically', 
  'literally', 'right', 'okay', 'well', 'i mean', 'sort of', 'kind of'
];

export class SpeechAnalyzer {
  private recognition: SpeechRecognition | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;

  constructor() {
    // Initialize Web Speech API
    if ('webkitSpeechRecognition' in window) {
      this.recognition = new (window as any).webkitSpeechRecognition();
    } else if ('SpeechRecognition' in window) {
      this.recognition = new (window as any).SpeechRecognition();
    }

    if (this.recognition) {
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
    }
  }

  async analyzeAudioBlob(audioBlob: Blob, duration: number): Promise<SpeechAnalysisResult> {
    const transcription = await this.transcribeAudio(audioBlob);
    const audioMetrics = await this.analyzeAudioMetrics(audioBlob);
    
    return this.processTranscription(transcription, duration, audioMetrics);
  }

  private async transcribeAudio(audioBlob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error('Speech recognition not supported'));
        return;
      }

      let finalTranscript = '';
      let interimTranscript = '';

      this.recognition.onresult = (event) => {
        interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
      };

      this.recognition.onend = () => {
        resolve(finalTranscript.trim());
      };

      this.recognition.onerror = (event) => {
        reject(new Error(`Speech recognition error: ${event.error}`));
      };

      // Convert blob to audio URL and play it for recognition
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onloadeddata = () => {
        this.recognition!.start();
        audio.play();
      };

      audio.onended = () => {
        setTimeout(() => {
          if (this.recognition) {
            this.recognition.stop();
          }
        }, 1000);
      };
    });
  }

  private async analyzeAudioMetrics(audioBlob: Blob): Promise<AudioMetrics> {
    return new Promise((resolve, reject) => {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const fileReader = new FileReader();

      fileReader.onload = async () => {
        try {
          const arrayBuffer = fileReader.result as ArrayBuffer;
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          
          const channelData = audioBuffer.getChannelData(0);
          const sampleRate = audioBuffer.sampleRate;
          const duration = audioBuffer.duration;

          // Calculate volume metrics
          let totalVolume = 0;
          let silentSamples = 0;
          const volumes: number[] = [];
          const silenceThreshold = 0.01;

          for (let i = 0; i < channelData.length; i++) {
            const volume = Math.abs(channelData[i]);
            totalVolume += volume;
            volumes.push(volume);
            
            if (volume < silenceThreshold) {
              silentSamples++;
            }
          }

          const averageVolume = totalVolume / channelData.length;
          const silencePercentage = (silentSamples / channelData.length) * 100;

          // Calculate volume variation (standard deviation)
          const volumeVariance = volumes.reduce((acc, vol) => {
            return acc + Math.pow(vol - averageVolume, 2);
          }, 0) / volumes.length;
          const volumeVariation = Math.sqrt(volumeVariance);

          resolve({
            duration,
            averageVolume,
            volumeVariation,
            silencePercentage
          });
        } catch (error) {
          reject(error);
        }
      };

      fileReader.onerror = () => reject(new Error('Failed to read audio file'));
      fileReader.readAsArrayBuffer(audioBlob);
    });
  }

  private processTranscription(
    transcription: string, 
    duration: number, 
    audioMetrics: AudioMetrics
  ): SpeechAnalysisResult {
    const words = transcription.toLowerCase().split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;
    
    // Count filler words
    let fillerWordCount = 0;
    const fillerWordsFound: string[] = [];
    
    FILLER_WORDS.forEach(fillerWord => {
      const regex = new RegExp(`\\b${fillerWord}\\b`, 'gi');
      const matches = transcription.match(regex);
      if (matches) {
        fillerWordCount += matches.length;
        fillerWordsFound.push(...matches);
      }
    });

    // Calculate speaking rate (words per minute)
    const speakingRate = (wordCount / duration) * 60;

    // Estimate pauses based on silence percentage and audio analysis
    const pauseCount = Math.floor((audioMetrics.silencePercentage / 100) * duration * 2);
    const averagePauseLength = (audioMetrics.silencePercentage / 100) * duration / Math.max(pauseCount, 1);

    // Calculate confidence score based on various factors
    const confidenceScore = this.calculateConfidenceScore({
      fillerWordCount,
      wordCount,
      speakingRate,
      volumeVariation: audioMetrics.volumeVariation,
      silencePercentage: audioMetrics.silencePercentage
    });

    return {
      transcription,
      wordCount,
      fillerWordCount,
      speakingRate,
      pauseCount,
      averagePauseLength,
      confidenceScore
    };
  }

  private calculateConfidenceScore(metrics: {
    fillerWordCount: number;
    wordCount: number;
    speakingRate: number;
    volumeVariation: number;
    silencePercentage: number;
  }): number {
    let score = 100;

    // Penalize excessive filler words
    const fillerRatio = metrics.fillerWordCount / Math.max(metrics.wordCount, 1);
    score -= fillerRatio * 100;

    // Penalize speaking too fast or too slow
    const idealRate = 150; // words per minute
    const rateDeviation = Math.abs(metrics.speakingRate - idealRate) / idealRate;
    score -= rateDeviation * 30;

    // Penalize excessive silence
    if (metrics.silencePercentage > 30) {
      score -= (metrics.silencePercentage - 30) * 2;
    }

    // Penalize very low volume variation (monotone)
    if (metrics.volumeVariation < 0.1) {
      score -= 20;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  // Real-time analysis during recording
  startRealTimeAnalysis(stream: MediaStream, onUpdate: (metrics: Partial<SpeechAnalysisResult>) => void) {
    if (!this.recognition) return;

    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const source = this.audioContext.createMediaStreamSource(stream);
    this.analyser = this.audioContext.createAnalyser();
    
    this.analyser.fftSize = 256;
    const bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(bufferLength);
    
    source.connect(this.analyser);

    let interimTranscript = '';
    let fillerCount = 0;

    this.recognition.continuous = true;
    this.recognition.interimResults = true;

    this.recognition.onresult = (event) => {
      interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        interimTranscript += transcript;
      }

      // Count filler words in real-time
      const currentFillerCount = this.countFillerWords(interimTranscript);
      
      onUpdate({
        transcription: interimTranscript,
        fillerWordCount: currentFillerCount
      });
    };

    this.recognition.start();

    // Start volume analysis
    this.analyzeVolumeRealTime(onUpdate);
  }

  private analyzeVolumeRealTime(onUpdate: (metrics: Partial<SpeechAnalysisResult>) => void) {
    if (!this.analyser || !this.dataArray) return;

    const analyze = () => {
      this.analyser!.getByteFrequencyData(this.dataArray!);
      
      let sum = 0;
      for (let i = 0; i < this.dataArray!.length; i++) {
        sum += this.dataArray![i];
      }
      const average = sum / this.dataArray!.length;
      
      // This could be used to provide real-time volume feedback
      requestAnimationFrame(analyze);
    };

    analyze();
  }

  private countFillerWords(text: string): number {
    let count = 0;
    FILLER_WORDS.forEach(fillerWord => {
      const regex = new RegExp(`\\b${fillerWord}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) {
        count += matches.length;
      }
    });
    return count;
  }

  stopRealTimeAnalysis() {
    if (this.recognition) {
      this.recognition.stop();
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}

// Utility function to create speech analyzer instance
export const createSpeechAnalyzer = () => new SpeechAnalyzer();