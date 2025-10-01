# Developer Notes: Audio Processing & AI Rating System

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interface (React)                   │
│  InterviewRecorder → App.tsx → FeedbackDisplay              │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   Processing Pipeline                        │
│  1. Audio Blob Capture                                       │
│  2. Transcription (audioProcessing.ts)                       │
│  3. Metrics Analysis (audioProcessing.ts)                    │
│  4. Score Calculation (audioProcessing.ts)                   │
│  5. AI Feedback Generation (aiAnalysis.ts)                   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Data Persistence                          │
│  Supabase: sessions, transcriptions, feedback, metrics       │
└─────────────────────────────────────────────────────────────┘
```

## Code Organization

### `/src/lib/audioProcessing.ts`
**Purpose**: Low-level audio analysis and transcription

**Key Functions**:
- `transcribeAudio(audioBlob)` → TranscriptionResult
  - Converts audio to text with word timing
  - Currently uses mock data with realistic patterns
  - Ready for API integration (Whisper, Google STT, etc.)

- `analyzeSpeechMetrics(transcription)` → SpeechMetrics
  - Calculates WPM, filler words, pauses, vocabulary
  - Pure function, no side effects

- `calculateClarityScore(metrics, transcription)` → number (0-100)
  - Filler word penalty
  - Confidence score from transcription
  - Pause pattern analysis

- `calculateStructureScore(metrics)` → number (0-100)
  - Sentence length evaluation
  - Vocabulary richness
  - Response completeness

- `calculatePaceScore(metrics)` → number (0-100)
  - Speaking speed (ideal: 130-170 WPM)
  - Pause consistency
  - Rhythm analysis

**Data Structures**:
```typescript
interface TranscriptionResult {
  text: string;
  words: Array<{
    word: string;
    start: number;    // seconds
    end: number;      // seconds
    confidence: number; // 0-1
  }>;
  duration: number;   // seconds
}

interface SpeechMetrics {
  wordsPerMinute: number;
  fillerWords: string[];
  fillerWordCount: number;
  pauseDurations: number[];
  averagePauseDuration: number;
  sentenceCount: number;
  wordCount: number;
  uniqueWordCount: number;
  vocabularyRichness: number; // 0-1
}
```

### `/src/lib/aiAnalysis.ts`
**Purpose**: High-level content analysis and feedback generation

**Key Functions**:
- `analyzeResponseContent(question, transcription, metrics)`
  - Pattern matching for content quality
  - Detects examples, structure, confidence, numbers
  - Returns content score + strengths + improvements

- `generateAIFeedback(input, sessionId)` → AIFeedback
  - Main entry point for feedback generation
  - Combines all scores with weights
  - Creates comprehensive feedback object

- `generateFeedbackText(metrics)` → string
  - Human-readable detailed feedback
  - Contextual advice based on metrics
  - Encouraging and constructive tone

**Scoring Weights**:
```typescript
Overall = Clarity(30%) + Structure(25%) + Pace(25%) + Content(20%)
```

**Content Analysis Patterns**:
```typescript
// Examples detection
/\b(example|instance|time when|situation|experience)\b/

// Structure indicators
/\b(first|second|then|next|finally|result|outcome)\b/

// Confidence language
/\b(I will|I can|I have|successfully|achieved)\b/

// Hedging language (negative)
/\b(maybe|might|possibly|I think|I guess|probably)\b/

// Quantifiable results
/\b\d+\s*(percent|%|people|users|customers|dollars)\b/
```

## Integration Points

### Current (Mock) Transcription
```typescript
// In audioProcessing.ts
export async function transcribeAudio(audioBlob: Blob) {
  // Uses sophisticated mock based on audio duration
  // Generates realistic transcription with timing
}
```

### Future (Real API) Transcription Options

#### Option 1: OpenAI Whisper
```typescript
export async function transcribeAudio(audioBlob: Blob) {
  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.webm');
  formData.append('model', 'whisper-1');
  
  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: formData,
  });
  
  const data = await response.json();
  return processWhisperResponse(data);
}
```

#### Option 2: Google Speech-to-Text
```typescript
export async function transcribeAudio(audioBlob: Blob) {
  const base64Audio = await convertBlobToBase64(audioBlob);
  
  const response = await fetch(
    `https://speech.googleapis.com/v1/speech:recognize?key=${GOOGLE_API_KEY}`,
    {
      method: 'POST',
      body: JSON.stringify({
        config: {
          encoding: 'WEBM_OPUS',
          sampleRateHertz: 48000,
          languageCode: 'en-US',
          enableWordTimeOffsets: true,
        },
        audio: { content: base64Audio },
      }),
    }
  );
  
  const data = await response.json();
  return processGoogleResponse(data);
}
```

#### Option 3: AssemblyAI
```typescript
export async function transcribeAudio(audioBlob: Blob) {
  // 1. Upload audio
  const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
    method: 'POST',
    headers: {
      'authorization': ASSEMBLYAI_API_KEY,
    },
    body: audioBlob,
  });
  const { upload_url } = await uploadResponse.json();
  
  // 2. Request transcription
  const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
    method: 'POST',
    headers: {
      'authorization': ASSEMBLYAI_API_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      audio_url: upload_url,
      word_boost: FILLER_WORDS,
    }),
  });
  const { id } = await transcriptResponse.json();
  
  // 3. Poll for result
  return pollForTranscript(id);
}
```

### Enhanced AI Feedback with GPT-4
```typescript
// See commented code in aiAnalysis.ts
export async function generateAIFeedbackWithGPT(input, sessionId, apiKey) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are an expert interview coach.' },
        { role: 'user', content: buildPrompt(input) }
      ],
    }),
  });
  
  const data = await response.json();
  return parseGPTResponse(data);
}
```

## Performance Considerations

### Current Performance
- **Transcription**: ~50-200ms (mock)
- **Analysis**: ~10-30ms (computation)
- **Total Processing**: <1 second

### With Real APIs
- **OpenAI Whisper**: 2-5 seconds
- **Google STT**: 1-3 seconds
- **AssemblyAI**: 3-8 seconds (async polling)
- **GPT-4 Analysis**: 2-4 seconds

### Optimization Strategies
1. **Parallel Processing**: Run transcription + video upload simultaneously
2. **WebSockets**: Real-time feedback during recording
3. **Edge Functions**: Run analysis closer to users
4. **Caching**: Cache common question responses
5. **Batch Processing**: Queue multiple recordings

## Error Handling

### Graceful Degradation
```typescript
try {
  const transcription = await transcribeAudio(audioBlob);
  const metrics = analyzeSpeechMetrics(transcription);
  const feedback = generateAIFeedback(input, sessionId);
} catch (error) {
  // Fallback to basic feedback
  return generateBasicFeedback(audioBlob.duration);
}
```

### User Experience
- Show progress indicators during processing
- Provide informative error messages
- Allow retry without re-recording
- Save recordings for later processing if API fails

## Testing Strategy

### Unit Tests (Recommended)
```typescript
describe('audioProcessing', () => {
  test('calculateClarityScore penalizes filler words', () => {
    const metrics = { fillerWordCount: 10, wordCount: 100, ... };
    const score = calculateClarityScore(metrics, mockTranscription);
    expect(score).toBeLessThan(70);
  });
  
  test('calculatePaceScore optimal for 150 WPM', () => {
    const metrics = { wordsPerMinute: 150, ... };
    const score = calculatePaceScore(metrics);
    expect(score).toBeGreaterThan(90);
  });
});

describe('aiAnalysis', () => {
  test('detects STAR method usage', () => {
    const transcription = { text: 'First, I analyzed the situation...' };
    const result = analyzeResponseContent(question, transcription, metrics);
    expect(result.strengths).toContain('structured approach');
  });
});
```

### Integration Tests
```typescript
test('full pipeline produces valid feedback', async () => {
  const audioBlob = await loadTestAudio('sample.webm');
  const transcription = await transcribeAudio(audioBlob);
  const metrics = analyzeSpeechMetrics(transcription);
  const feedback = generateAIFeedback({ ... }, sessionId);
  
  expect(feedback.overall_score).toBeGreaterThanOrEqual(0);
  expect(feedback.overall_score).toBeLessThanOrEqual(100);
  expect(feedback.strengths.length).toBeGreaterThan(0);
  expect(feedback.improvements.length).toBeGreaterThan(0);
});
```

## Configuration

### Scoring Thresholds
```typescript
// audioProcessing.ts
const IDEAL_WPM_MIN = 130;
const IDEAL_WPM_MAX = 170;
const MAX_FILLER_RATIO = 0.033; // 1 per 30 words
const MIN_CONFIDENCE = 0.9;
const LONG_PAUSE_THRESHOLD = 2.0; // seconds

// aiAnalysis.ts
const MIN_WORD_COUNT = 50;
const MAX_WORD_COUNT = 300;
const IDEAL_SENTENCE_LENGTH_MIN = 10;
const IDEAL_SENTENCE_LENGTH_MAX = 30;
const MIN_VOCABULARY_RICHNESS = 0.4;
```

### Filler Words List
```typescript
const FILLER_WORDS = [
  'um', 'uh', 'like', 'you know', 'sort of', 'kind of',
  'i mean', 'basically', 'actually', 'literally', 'just',
  'so', 'well', 'right', 'okay', 'alright', 'anyway',
  'hmm', 'er', 'ah'
];
```

## Deployment Checklist

- [ ] Set up Supabase environment variables
- [ ] Configure API keys for transcription service
- [ ] Set up error logging (Sentry, LogRocket, etc.)
- [ ] Enable HTTPS for media capture
- [ ] Test on target browsers (Chrome, Firefox, Safari, Edge)
- [ ] Set up CDN for static assets
- [ ] Configure CORS for API calls
- [ ] Set up rate limiting for API endpoints
- [ ] Add analytics tracking
- [ ] Create privacy policy for data handling

## Future Enhancements

### Video Analysis
- Eye contact detection (face tracking)
- Facial expression analysis
- Posture and body language
- Hand gesture tracking

### Advanced Analytics
- Trend analysis over time
- Peer comparison/benchmarking
- Industry-specific scoring
- Custom rubrics per question type

### User Features
- Custom question creation
- Question sets by role/industry
- Export feedback as PDF
- Share feedback with mentors
- Practice with friends (multiplayer)

## Resources

- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)
- [OpenAI Whisper API](https://platform.openai.com/docs/guides/speech-to-text)
- [Google Speech-to-Text](https://cloud.google.com/speech-to-text/docs)
- [AssemblyAI Docs](https://www.assemblyai.com/docs)

---

Last Updated: 2025-10-01
Maintainer: Development Team
