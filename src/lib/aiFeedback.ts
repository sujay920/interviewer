import { SpeechAnalysisResult } from './speechAnalysis';
import { AIFeedback } from './supabase';

export interface FeedbackCriteria {
  transcription: string;
  question: string;
  speechAnalysis: SpeechAnalysisResult;
  duration: number;
}

export class AIFeedbackGenerator {
  private readonly OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
  private readonly API_URL = 'https://api.openai.com/v1/chat/completions';

  async generateFeedback(criteria: FeedbackCriteria): Promise<AIFeedback> {
    try {
      // If OpenAI API is not configured, use enhanced mock feedback
      if (!this.OPENAI_API_KEY) {
        return this.generateEnhancedMockFeedback(criteria);
      }

      const prompt = this.buildPrompt(criteria);
      const response = await this.callOpenAI(prompt);
      
      return this.parseFeedbackResponse(response, criteria);
    } catch (error) {
      console.error('Error generating AI feedback:', error);
      // Fallback to enhanced mock feedback
      return this.generateEnhancedMockFeedback(criteria);
    }
  }

  private buildPrompt(criteria: FeedbackCriteria): string {
    const { transcription, question, speechAnalysis, duration } = criteria;
    
    return `You are an expert interview coach analyzing a candidate's response. Please provide detailed feedback based on the following data:

INTERVIEW QUESTION: "${question}"

CANDIDATE'S RESPONSE: "${transcription}"

SPEECH ANALYSIS METRICS:
- Duration: ${duration} seconds
- Word count: ${speechAnalysis.wordCount}
- Speaking rate: ${speechAnalysis.speakingRate.toFixed(1)} words per minute
- Filler words: ${speechAnalysis.fillerWordCount}
- Confidence score: ${speechAnalysis.confidenceScore}%
- Pause count: ${speechAnalysis.pauseCount}
- Average pause length: ${speechAnalysis.averagePauseLength.toFixed(1)} seconds

Please provide:
1. Overall score (0-100)
2. Clarity score (0-100) - based on articulation, word choice, and coherence
3. Structure score (0-100) - based on organization, flow, and logical progression
4. Pace score (0-100) - based on speaking rate, pauses, and rhythm
5. Detailed feedback text (2-3 paragraphs)
6. 3-4 specific strengths
7. 3-4 specific areas for improvement

Consider these factors:
- Content relevance and depth
- Communication clarity and confidence
- Professional presentation
- Use of specific examples
- Logical structure and flow
- Speaking pace and rhythm
- Minimal use of filler words
- Appropriate pauses and emphasis

Format your response as JSON with this structure:
{
  "overall_score": number,
  "clarity_score": number,
  "structure_score": number,
  "pace_score": number,
  "feedback_text": "string",
  "strengths": ["string1", "string2", "string3"],
  "improvements": ["string1", "string2", "string3"]
}`;
  }

  private async callOpenAI(prompt: string): Promise<any> {
    const response = await fetch(this.API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert interview coach with years of experience in evaluating candidate responses. Provide constructive, specific, and actionable feedback.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  }

  private parseFeedbackResponse(response: any, criteria: FeedbackCriteria): AIFeedback {
    return {
      id: crypto.randomUUID(),
      session_id: '', // Will be set by caller
      overall_score: Math.max(0, Math.min(100, response.overall_score || 75)),
      clarity_score: Math.max(0, Math.min(100, response.clarity_score || 75)),
      structure_score: Math.max(0, Math.min(100, response.structure_score || 75)),
      pace_score: Math.max(0, Math.min(100, response.pace_score || 75)),
      filler_word_count: criteria.speechAnalysis.fillerWordCount,
      feedback_text: response.feedback_text || 'Good effort on your response!',
      strengths: Array.isArray(response.strengths) ? response.strengths : [
        'Clear communication',
        'Professional demeanor',
        'Good understanding of the question'
      ],
      improvements: Array.isArray(response.improvements) ? response.improvements : [
        'Add more specific examples',
        'Improve response structure',
        'Reduce filler words'
      ],
      created_at: new Date().toISOString(),
    };
  }

  private generateEnhancedMockFeedback(criteria: FeedbackCriteria): AIFeedback {
    const { transcription, question, speechAnalysis, duration } = criteria;
    
    // Calculate scores based on actual speech analysis
    const clarityScore = this.calculateClarityScore(speechAnalysis, transcription);
    const structureScore = this.calculateStructureScore(transcription, duration);
    const paceScore = this.calculatePaceScore(speechAnalysis);
    const overallScore = Math.round((clarityScore + structureScore + paceScore) / 3);

    const feedback = this.generateContextualFeedback(criteria, {
      overall: overallScore,
      clarity: clarityScore,
      structure: structureScore,
      pace: paceScore
    });

    return {
      id: crypto.randomUUID(),
      session_id: '', // Will be set by caller
      overall_score: overallScore,
      clarity_score: clarityScore,
      structure_score: structureScore,
      pace_score: paceScore,
      filler_word_count: speechAnalysis.fillerWordCount,
      feedback_text: feedback.text,
      strengths: feedback.strengths,
      improvements: feedback.improvements,
      created_at: new Date().toISOString(),
    };
  }

  private calculateClarityScore(speechAnalysis: SpeechAnalysisResult, transcription: string): number {
    let score = 100;

    // Penalize excessive filler words
    const fillerRatio = speechAnalysis.fillerWordCount / Math.max(speechAnalysis.wordCount, 1);
    score -= fillerRatio * 150; // Heavy penalty for filler words

    // Reward good word count (not too short, not too long)
    if (speechAnalysis.wordCount < 30) {
      score -= 20; // Too brief
    } else if (speechAnalysis.wordCount > 300) {
      score -= 10; // Too verbose
    }

    // Check for clear articulation indicators in transcription
    const hasGoodVocabulary = this.checkVocabularyQuality(transcription);
    if (hasGoodVocabulary) score += 10;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private calculateStructureScore(transcription: string, duration: number): number {
    let score = 70; // Base score

    // Check for structure indicators
    const hasIntroduction = this.hasIntroductoryPhrase(transcription);
    const hasConclusion = this.hasConclusivePhrase(transcription);
    const hasTransitions = this.hasTransitionWords(transcription);
    const hasExamples = this.hasSpecificExamples(transcription);

    if (hasIntroduction) score += 10;
    if (hasConclusion) score += 10;
    if (hasTransitions) score += 10;
    if (hasExamples) score += 15;

    // Penalize if too short for the question complexity
    if (duration < 30) score -= 15;
    if (duration > 180) score -= 10; // Too long

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private calculatePaceScore(speechAnalysis: SpeechAnalysisResult): number {
    let score = 100;

    // Ideal speaking rate is 140-160 words per minute
    const idealRate = 150;
    const rateDeviation = Math.abs(speechAnalysis.speakingRate - idealRate);
    
    if (rateDeviation > 50) score -= 30;
    else if (rateDeviation > 30) score -= 20;
    else if (rateDeviation > 15) score -= 10;

    // Consider pause patterns
    if (speechAnalysis.averagePauseLength > 3) score -= 15; // Too long pauses
    if (speechAnalysis.averagePauseLength < 0.5) score -= 10; // Too few pauses

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private generateContextualFeedback(criteria: FeedbackCriteria, scores: any) {
    const { transcription, question, speechAnalysis } = criteria;
    
    let feedbackText = '';
    const strengths: string[] = [];
    const improvements: string[] = [];

    // Generate contextual feedback based on performance
    if (scores.overall >= 80) {
      feedbackText = `Excellent response! You demonstrated strong communication skills and provided a well-structured answer to the question. `;
    } else if (scores.overall >= 60) {
      feedbackText = `Good response overall. You showed understanding of the question and communicated your thoughts clearly. `;
    } else {
      feedbackText = `There's room for improvement in your response. Focus on structuring your answer more clearly and reducing hesitation. `;
    }

    // Add specific feedback based on speech analysis
    if (speechAnalysis.speakingRate < 120) {
      feedbackText += `Consider speaking a bit faster to maintain engagement. `;
      improvements.push('Increase speaking pace slightly to maintain listener engagement');
    } else if (speechAnalysis.speakingRate > 180) {
      feedbackText += `Try to slow down slightly to ensure clarity. `;
      improvements.push('Slow down your speaking pace for better clarity');
    } else {
      strengths.push('Maintained an appropriate speaking pace throughout');
    }

    if (speechAnalysis.fillerWordCount <= 2) {
      strengths.push('Minimal use of filler words - very professional');
    } else if (speechAnalysis.fillerWordCount <= 5) {
      improvements.push('Reduce filler words like "um" and "uh" for more polished delivery');
    } else {
      improvements.push('Significantly reduce filler words to sound more confident');
    }

    if (speechAnalysis.wordCount >= 50) {
      strengths.push('Provided comprehensive response with good detail');
    } else {
      improvements.push('Expand your answers with more specific examples and details');
    }

    // Add structure-based feedback
    if (this.hasSpecificExamples(transcription)) {
      strengths.push('Used specific examples to support your points');
    } else {
      improvements.push('Include specific examples to make your responses more compelling');
    }

    if (this.hasTransitionWords(transcription)) {
      strengths.push('Good use of transitions to connect ideas');
    } else {
      improvements.push('Use transition words to better connect your ideas');
    }

    // Ensure we have enough items
    while (strengths.length < 3) {
      const additionalStrengths = [
        'Maintained professional tone throughout',
        'Showed confidence in your delivery',
        'Addressed the question directly',
        'Demonstrated good preparation'
      ];
      const randomStrength = additionalStrengths[Math.floor(Math.random() * additionalStrengths.length)];
      if (!strengths.includes(randomStrength)) {
        strengths.push(randomStrength);
      }
    }

    while (improvements.length < 3) {
      const additionalImprovements = [
        'Practice the STAR method for behavioral questions',
        'Work on maintaining eye contact with the interviewer',
        'Prepare more quantifiable achievements to share',
        'Practice concluding answers with a strong summary'
      ];
      const randomImprovement = additionalImprovements[Math.floor(Math.random() * additionalImprovements.length)];
      if (!improvements.includes(randomImprovement)) {
        improvements.push(randomImprovement);
      }
    }

    feedbackText += `\n\nYour confidence score of ${speechAnalysis.confidenceScore}% reflects your overall delivery quality. Keep practicing to build even more confidence in your responses.`;

    return {
      text: feedbackText,
      strengths: strengths.slice(0, 4),
      improvements: improvements.slice(0, 4)
    };
  }

  private checkVocabularyQuality(transcription: string): boolean {
    const professionalWords = ['experience', 'achieve', 'develop', 'manage', 'implement', 'collaborate', 'analyze', 'strategic', 'innovative', 'effective'];
    const wordCount = professionalWords.filter(word => 
      transcription.toLowerCase().includes(word)
    ).length;
    return wordCount >= 2;
  }

  private hasIntroductoryPhrase(transcription: string): boolean {
    const introPatterns = ['let me start', 'first', 'to begin', 'initially', 'well,'];
    return introPatterns.some(pattern => 
      transcription.toLowerCase().includes(pattern)
    );
  }

  private hasConclusivePhrase(transcription: string): boolean {
    const conclusionPatterns = ['in conclusion', 'to summarize', 'overall', 'finally', 'in summary'];
    return conclusionPatterns.some(pattern => 
      transcription.toLowerCase().includes(pattern)
    );
  }

  private hasTransitionWords(transcription: string): boolean {
    const transitions = ['however', 'additionally', 'furthermore', 'moreover', 'therefore', 'consequently', 'for example', 'specifically'];
    return transitions.some(transition => 
      transcription.toLowerCase().includes(transition)
    );
  }

  private hasSpecificExamples(transcription: string): boolean {
    const examplePatterns = ['for example', 'for instance', 'specifically', 'in my previous role', 'at my last job', 'when I worked'];
    return examplePatterns.some(pattern => 
      transcription.toLowerCase().includes(pattern)
    );
  }
}

export const createAIFeedbackGenerator = () => new AIFeedbackGenerator();