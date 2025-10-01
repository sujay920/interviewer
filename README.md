# AI Interview Coach

An intelligent interview practice platform that uses AI to analyze your speaking performance and provide detailed feedback for improvement.

## Features

### 🎥 Recording & Analysis
- **Video/Audio Recording**: Record your interview responses with camera and microphone
- **Real-time Transcription**: Audio is automatically transcribed for analysis
- **Speech Analysis**: Advanced metrics including:
  - Words per minute (WPM)
  - Filler word detection (um, uh, like, you know, etc.)
  - Pause analysis
  - Vocabulary richness
  - Sentence structure evaluation

### 📊 AI-Powered Feedback
The system evaluates your interview performance across multiple dimensions:

#### Overall Score (0-100)
Weighted combination of all metrics to give you a comprehensive performance rating.

#### Clarity Score
- Analyzes speech clarity based on filler word usage
- Evaluates confidence in word transcription
- Penalizes excessive pauses or hesitations

#### Structure Score
- Evaluates answer organization and coherence
- Checks sentence length and variety
- Assesses vocabulary richness and diversity
- Ensures appropriate response length

#### Pace Score
- Ideal speaking rate: 130-170 words per minute
- Analyzes pause consistency
- Detects rushed or overly slow delivery

#### Content Analysis
- Checks for concrete examples and specifics
- Identifies use of structured frameworks (STAR method)
- Evaluates confidence in language
- Looks for quantifiable results and metrics

### 💡 Personalized Recommendations

After each session, you receive:
- **Strengths**: What you did well
- **Improvements**: Specific areas to work on
- **Detailed Feedback**: Comprehensive analysis of your performance
- **Score Breakdown**: Visual representation of all metrics

### 📈 Progress Tracking
- View your interview history
- Track improvement over time
- See average scores and best performances
- Monitor trends in your speaking skills

## Technical Architecture

### Audio Processing (`/src/lib/audioProcessing.ts`)
- `transcribeAudio()`: Converts audio to text with timing data
- `analyzeSpeechMetrics()`: Extracts speaking patterns and metrics
- `calculateClarityScore()`: Evaluates speech clarity
- `calculateStructureScore()`: Assesses answer organization
- `calculatePaceScore()`: Analyzes speaking speed and rhythm

### AI Analysis (`/src/lib/aiAnalysis.ts`)
- `analyzeResponseContent()`: Evaluates content quality and relevance
- `generateAIFeedback()`: Creates comprehensive feedback with scores
- Advanced pattern matching for:
  - Examples and concrete details
  - Structured responses (STAR method indicators)
  - Confident vs. hedging language
  - Quantifiable results

### Key Metrics Tracked

1. **Filler Words Detected**:
   - um, uh, like, you know, sort of, kind of, i mean
   - basically, actually, literally, just, so, well, right
   - okay, alright, anyway, hmm, er, ah

2. **Speech Quality Indicators**:
   - Average pause duration
   - Long pause frequency
   - Word-to-sentence ratio
   - Vocabulary diversity
   - Speaking rate consistency

3. **Content Quality Markers**:
   - Use of examples and experiences
   - Structured approach indicators
   - Confidence language
   - Quantifiable outcomes

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account (for backend)
- Modern browser with camera/microphone access

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd workspace
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file with:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:
```bash
npm run dev
```

5. Build for production:
```bash
npm run build
```

### Database Setup

The application requires the following Supabase tables:
- `profiles`: User profiles and subscription data
- `interview_sessions`: Recording sessions and transcriptions
- `ai_feedback`: AI-generated feedback and scores
- `progress_metrics`: Historical performance data

## How It Works

1. **Start a Session**: Click "Start New Practice Session" to get a random interview question
2. **Record Your Answer**: Grant camera/microphone permissions and record your response
3. **AI Processing**: The system:
   - Transcribes your audio
   - Analyzes speech patterns
   - Evaluates content quality
   - Generates detailed feedback
4. **Review Feedback**: See your scores, strengths, and areas for improvement
5. **Track Progress**: View your improvement over time on the dashboard

## Interview Questions

The platform includes 20+ common interview questions:
- Tell me about yourself
- What are your strengths/weaknesses?
- Behavioral questions (STAR format)
- Career goals and motivations
- Problem-solving scenarios
- And more...

## Scoring System

### Overall Score Calculation
```
Overall Score = (Clarity × 30%) + (Structure × 25%) + (Pace × 25%) + (Content × 20%)
```

### Rating Levels
- **80-100**: Excellent - Strong performance across all areas
- **60-79**: Good - Solid performance with room for improvement
- **0-59**: Needs Work - Focus on key areas for significant improvement

## Future Enhancements

### Potential Integrations
The codebase includes commented code for:
- **OpenAI GPT-4**: Advanced content analysis with natural language understanding
- **Professional Speech-to-Text APIs**: Higher accuracy transcription (Whisper, Google, AssemblyAI)
- **Video Analysis**: Facial expressions, eye contact, body language

### Roadmap
- Industry-specific question sets
- Custom question creation
- Detailed analytics dashboard
- Peer comparison and benchmarking
- Export feedback as PDF reports
- Mobile app support

## Development

### Type Checking
```bash
npm run typecheck
```

### Linting
```bash
npm run lint
```

### Build
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## Technologies Used

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Media**: WebRTC APIs (MediaRecorder, getUserMedia)
- **AI/ML**: Custom speech analysis algorithms

## Browser Compatibility

- Chrome 90+ (recommended)
- Firefox 88+
- Safari 14+
- Edge 90+

*Note: Camera and microphone access required*

## License

This project is private and proprietary.

## Support

For issues or questions, please contact the development team.

---

Built with ❤️ for better interview preparation
