# AI-Powered Interview Practice Platform

A modern React application that helps users practice interview skills with real-time speech analysis and AI-powered feedback.

## Features

### 🎤 Real-Time Speech Analysis
- **Live Transcription**: See what you're saying in real-time using Web Speech API
- **Filler Word Detection**: Track "um", "uh", "like" and other filler words as you speak
- **Speaking Pace Analysis**: Monitor your words per minute for optimal delivery
- **Audio Quality Metrics**: Analyze volume, pauses, and speech patterns

### 🤖 AI-Powered Feedback
- **Comprehensive Scoring**: Get scores for clarity, structure, pace, and overall performance
- **Detailed Analysis**: Receive specific feedback on your response quality
- **Strengths & Improvements**: Identify what you did well and areas to work on
- **Contextual Feedback**: AI considers the specific interview question and your response

### 📊 Performance Tracking
- **Progress Dashboard**: Track your improvement over time
- **Session History**: Review past interview sessions and feedback
- **Performance Metrics**: Monitor average scores, best performances, and trends

### 🎥 Professional Recording
- **Video & Audio Recording**: Practice with full video recording capabilities
- **Camera & Microphone Controls**: Toggle video and audio as needed
- **Professional Interface**: Clean, interview-like environment

## Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Database**: Supabase
- **Authentication**: Supabase Auth
- **Speech Analysis**: Web Speech API + Custom Audio Analysis
- **AI Feedback**: OpenAI GPT-4 (optional) + Intelligent Mock Feedback
- **Icons**: Lucide React

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account (for database and auth)
- OpenAI API key (optional, for enhanced AI feedback)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd interview-practice-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Fill in your environment variables:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_OPENAI_API_KEY=your_openai_api_key  # Optional
   ```

4. **Set up Supabase Database**
   
   Create the following tables in your Supabase database:

   ```sql
   -- Profiles table
   CREATE TABLE profiles (
     id UUID REFERENCES auth.users ON DELETE CASCADE,
     email TEXT,
     full_name TEXT,
     subscription_tier TEXT DEFAULT 'free',
     subscription_expires_at TIMESTAMP,
     created_at TIMESTAMP DEFAULT NOW(),
     PRIMARY KEY (id)
   );

   -- Interview sessions table
   CREATE TABLE interview_sessions (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
     question TEXT NOT NULL,
     audio_url TEXT,
     video_url TEXT,
     transcription TEXT,
     duration_seconds INTEGER NOT NULL,
     status TEXT DEFAULT 'recording',
     created_at TIMESTAMP DEFAULT NOW()
   );

   -- AI feedback table
   CREATE TABLE ai_feedback (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     session_id UUID REFERENCES interview_sessions(id) ON DELETE CASCADE,
     overall_score INTEGER NOT NULL,
     clarity_score INTEGER NOT NULL,
     filler_word_count INTEGER NOT NULL,
     structure_score INTEGER NOT NULL,
     pace_score INTEGER NOT NULL,
     feedback_text TEXT NOT NULL,
     strengths TEXT[] NOT NULL,
     improvements TEXT[] NOT NULL,
     created_at TIMESTAMP DEFAULT NOW()
   );

   -- Progress metrics table
   CREATE TABLE progress_metrics (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
     session_id UUID REFERENCES interview_sessions(id) ON DELETE CASCADE,
     metric_date DATE NOT NULL,
     average_score DECIMAL NOT NULL,
     sessions_count INTEGER NOT NULL,
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

## How It Works

### Speech Analysis Pipeline

1. **Recording**: User records their interview response with video and audio
2. **Real-time Analysis**: Web Speech API provides live transcription and filler word counting
3. **Audio Processing**: Custom algorithms analyze speaking pace, volume, and pause patterns
4. **AI Feedback Generation**: Either OpenAI GPT-4 or intelligent mock feedback analyzes the response
5. **Scoring**: Comprehensive scoring algorithm evaluates clarity, structure, pace, and overall performance

### Scoring Algorithm

The app evaluates responses across multiple dimensions:

- **Clarity Score (0-100)**: Based on articulation, vocabulary, and filler word usage
- **Structure Score (0-100)**: Evaluates organization, flow, and use of examples
- **Pace Score (0-100)**: Analyzes speaking rate and pause patterns
- **Overall Score**: Weighted average of all components

### AI Feedback Features

- **Contextual Analysis**: Considers the specific interview question
- **Speech Pattern Recognition**: Identifies speaking habits and patterns
- **Constructive Feedback**: Provides specific, actionable improvement suggestions
- **Professional Insights**: Mimics feedback from experienced interview coaches

## Browser Compatibility

- **Chrome/Edge**: Full support for Web Speech API
- **Firefox**: Limited speech recognition support
- **Safari**: Partial support on macOS/iOS

For best results, use Chrome or Edge browsers.

## Configuration Options

### OpenAI Integration
If you provide an OpenAI API key, the app will use GPT-4 for enhanced feedback. Without it, the app uses intelligent mock feedback based on speech analysis metrics.

### Supabase Setup
The app requires Supabase for user authentication and data storage. Make sure to set up the database schema as described above.

## Development

### Project Structure
```
src/
├── components/          # React components
├── contexts/           # React contexts (Auth)
├── data/              # Static data (interview questions)
├── lib/               # Utility libraries
│   ├── speechAnalysis.ts    # Speech processing logic
│   ├── aiFeedback.ts       # AI feedback generation
│   └── supabase.ts         # Database client
└── main.tsx           # App entry point
```

### Key Components
- `InterviewRecorder`: Handles recording and real-time analysis
- `FeedbackDisplay`: Shows AI feedback and scores
- `Dashboard`: User progress and session history
- `SpeechAnalyzer`: Core speech analysis functionality
- `AIFeedbackGenerator`: Generates intelligent feedback

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details