// AI-powered interview response analysis
import { TranscriptionResult, SpeechMetrics } from './audioProcessing';
import { AIFeedback } from './supabase';

interface AnalysisInput {
  question: string;
  transcription: TranscriptionResult;
  metrics: SpeechMetrics;
  clarityScore: number;
  structureScore: number;
  paceScore: number;
}

/**
 * Analyzes the interview response content for quality and relevance
 */
export function analyzeResponseContent(
  question: string,
  transcription: TranscriptionResult,
  metrics: SpeechMetrics
): {
  contentScore: number;
  strengths: string[];
  improvements: string[];
  feedbackText: string;
} {
  const text = transcription.text.toLowerCase();
  const strengths: string[] = [];
  const improvements: string[] = [];
  
  // Analyze response length
  const isAppropriateLength = metrics.wordCount >= 50 && metrics.wordCount <= 300;
  if (isAppropriateLength) {
    strengths.push('Provided a well-balanced response length');
  } else if (metrics.wordCount < 50) {
    improvements.push('Expand your answers with more details and examples');
  } else {
    improvements.push('Try to be more concise and focus on key points');
  }
  
  // Check for examples
  const hasExamples = /\b(example|instance|time when|situation|experience)\b/.test(text);
  if (hasExamples) {
    strengths.push('Included concrete examples to support your points');
  } else {
    improvements.push('Add specific examples from your experience');
  }
  
  // Check for structured approach (STAR method indicators)
  const hasStructure = /\b(first|second|then|next|finally|result|outcome|achieved)\b/.test(text);
  if (hasStructure) {
    strengths.push('Used a structured approach to organize your response');
  } else {
    improvements.push('Use frameworks like STAR (Situation, Task, Action, Result) for better structure');
  }
  
  // Check for confidence indicators
  const hasConfidence = /\b(I will|I can|I have|I am confident|successfully|achieved|delivered)\b/.test(text);
  const hasHedging = /\b(maybe|might|possibly|I think|I guess|probably|kind of|sort of)\b/.test(text);
  
  if (hasConfidence && !hasHedging) {
    strengths.push('Demonstrated confidence in your abilities');
  } else if (hasHedging) {
    improvements.push('Use more confident language and reduce hedging words');
  }
  
  // Check for quantifiable results
  const hasNumbers = /\b\d+\s*(percent|%|people|users|customers|dollars|weeks|months|years)\b/.test(text);
  if (hasNumbers) {
    strengths.push('Provided quantifiable results and metrics');
  } else {
    improvements.push('Include specific numbers and measurable outcomes when possible');
  }
  
  // Calculate content score
  let contentScore = 70; // Base score
  
  if (isAppropriateLength) contentScore += 10;
  if (hasExamples) contentScore += 10;
  if (hasStructure) contentScore += 10;
  if (hasConfidence && !hasHedging) contentScore += 5;
  if (hasNumbers) contentScore += 5;
  
  // Penalize for poor vocabulary
  if (metrics.vocabularyRichness < 0.4) {
    contentScore -= 10;
    improvements.push('Expand your vocabulary to avoid repetitive language');
  }
  
  contentScore = Math.min(100, Math.max(0, contentScore));
  
  // Generate feedback text
  const feedbackText = generateFeedbackText(question, transcription, metrics);
  
  return {
    contentScore,
    strengths,
    improvements,
    feedbackText,
  };
}

/**
 * Generates comprehensive AI feedback text
 */
function generateFeedbackText(
  _question: string,
  _transcription: TranscriptionResult,
  metrics: SpeechMetrics
): string {
  const parts: string[] = [];
  
  // Opening
  parts.push('Thank you for your response to this interview question. Here\'s a detailed analysis of your performance:\n');
  
  // Speaking pace analysis
  if (metrics.wordsPerMinute < 120) {
    parts.push(`\nYour speaking pace was ${metrics.wordsPerMinute} words per minute, which is slower than ideal. Try to speak a bit faster while maintaining clarity. Practice will help you find a comfortable, confident pace.`);
  } else if (metrics.wordsPerMinute > 180) {
    parts.push(`\nYour speaking pace was ${metrics.wordsPerMinute} words per minute, which is quite fast. Slow down to ensure the interviewer can follow your points easily. Remember to breathe and pause between ideas.`);
  } else {
    parts.push(`\nYour speaking pace of ${metrics.wordsPerMinute} words per minute was well-balanced, making it easy for the interviewer to follow your response.`);
  }
  
  // Filler words analysis
  if (metrics.fillerWordCount > 5) {
    parts.push(`\nYou used ${metrics.fillerWordCount} filler words (such as "um," "uh," "like," "you know"). While some filler words are natural, reducing them will make you sound more confident and articulate. Try pausing instead of using fillers.`);
  } else if (metrics.fillerWordCount > 0) {
    parts.push(`\nYou used ${metrics.fillerWordCount} filler words, which is quite good. With a bit more practice, you can eliminate these entirely.`);
  } else {
    parts.push(`\nExcellent! You avoided filler words entirely, which demonstrates strong communication skills and confidence.`);
  }
  
  // Structure analysis
  const avgWordsPerSentence = Math.round(metrics.wordCount / metrics.sentenceCount);
  if (avgWordsPerSentence > 25) {
    parts.push(`\nYour sentences averaged ${avgWordsPerSentence} words, which is quite long. Breaking down complex ideas into shorter sentences will improve clarity and make your response easier to follow.`);
  } else if (avgWordsPerSentence < 12) {
    parts.push(`\nYour sentences were quite short, averaging ${avgWordsPerSentence} words. While clarity is important, connecting related ideas into more complete sentences will make your response flow better.`);
  }
  
  // Vocabulary analysis
  if (metrics.vocabularyRichness > 0.6) {
    parts.push(`\nYou demonstrated strong vocabulary diversity, using ${metrics.uniqueWordCount} unique words. This shows good communication skills and helps keep the interviewer engaged.`);
  } else if (metrics.vocabularyRichness < 0.4) {
    parts.push(`\nConsider expanding your vocabulary to avoid repetitive language. This will make your responses more engaging and professional.`);
  }
  
  // Closing advice
  parts.push(`\nOverall, continue practicing with various interview questions. Record yourself, review your responses, and focus on the areas highlighted above. Each practice session will build your confidence and improve your interview skills.`);
  
  return parts.join('');
}

/**
 * Generates additional context-specific strengths and improvements
 */
function generateDetailedFeedback(metrics: SpeechMetrics): {
  additionalStrengths: string[];
  additionalImprovements: string[];
} {
  const additionalStrengths: string[] = [];
  const additionalImprovements: string[] = [];
  
  // Delivery strengths
  if (metrics.wordsPerMinute >= 130 && metrics.wordsPerMinute <= 170) {
    additionalStrengths.push('Maintained an ideal speaking pace throughout your response');
  }
  
  if (metrics.fillerWordCount <= 3) {
    additionalStrengths.push('Spoke clearly with minimal filler words');
  }
  
  if (metrics.vocabularyRichness > 0.6) {
    additionalStrengths.push('Demonstrated strong vocabulary and varied word choice');
  }
  
  if (metrics.averagePauseDuration > 0.3 && metrics.averagePauseDuration < 1.0) {
    additionalStrengths.push('Used pauses effectively for emphasis and clarity');
  }
  
  // Delivery improvements
  if (metrics.fillerWordCount > 8) {
    additionalImprovements.push('Significantly reduce filler words like "um," "uh," and "like"');
  }
  
  if (metrics.averagePauseDuration > 1.5) {
    additionalImprovements.push('Reduce long pauses to maintain engagement and flow');
  }
  
  if (metrics.wordsPerMinute < 110) {
    additionalImprovements.push('Increase your speaking pace to sound more confident');
  }
  
  if (metrics.sentenceCount < 3) {
    additionalImprovements.push('Develop your answers with multiple well-structured sentences');
  }
  
  return {
    additionalStrengths,
    additionalImprovements,
  };
}

/**
 * Main function to generate complete AI feedback
 */
export function generateAIFeedback(input: AnalysisInput, sessionId: string): AIFeedback {
  // Analyze response content
  const contentAnalysis = analyzeResponseContent(
    input.question,
    input.transcription,
    input.metrics
  );
  
  // Get additional feedback
  const detailedFeedback = generateDetailedFeedback(input.metrics);
  
  // Combine all strengths and improvements
  const allStrengths = [
    ...contentAnalysis.strengths,
    ...detailedFeedback.additionalStrengths,
  ];
  
  const allImprovements = [
    ...contentAnalysis.improvements,
    ...detailedFeedback.additionalImprovements,
  ];
  
  // Ensure we have at least some strengths and improvements
  if (allStrengths.length === 0) {
    allStrengths.push('Completed the interview question');
    allStrengths.push('Provided a response within a reasonable timeframe');
  }
  
  if (allImprovements.length === 0) {
    allImprovements.push('Continue practicing to refine your delivery');
    allImprovements.push('Consider recording yourself to identify areas for improvement');
  }
  
  // Limit to top 4 strengths and improvements
  const topStrengths = allStrengths.slice(0, 4);
  const topImprovements = allImprovements.slice(0, 4);
  
  // Calculate overall score (weighted average)
  const overallScore = Math.round(
    input.clarityScore * 0.3 +
    input.structureScore * 0.25 +
    input.paceScore * 0.25 +
    contentAnalysis.contentScore * 0.2
  );
  
  return {
    id: crypto.randomUUID(),
    session_id: sessionId,
    overall_score: overallScore,
    clarity_score: input.clarityScore,
    structure_score: input.structureScore,
    pace_score: input.paceScore,
    filler_word_count: input.metrics.fillerWordCount,
    feedback_text: contentAnalysis.feedbackText,
    strengths: topStrengths,
    improvements: topImprovements,
    created_at: new Date().toISOString(),
  };
}

/**
 * For production: Integration with OpenAI GPT-4 for advanced analysis
 * Uncomment and configure when ready to use actual API
 */
/*
export async function generateAIFeedbackWithGPT(
  input: AnalysisInput,
  sessionId: string,
  apiKey: string
): Promise<AIFeedback> {
  const prompt = `
You are an expert interview coach analyzing a candidate's response to an interview question.

Question: "${input.question}"

Transcript: "${input.transcription.text}"

Speech Metrics:
- Words per minute: ${input.metrics.wordsPerMinute}
- Filler words: ${input.metrics.fillerWordCount}
- Word count: ${input.metrics.wordCount}
- Vocabulary richness: ${(input.metrics.vocabularyRichness * 100).toFixed(1)}%

Provide detailed feedback in JSON format:
{
  "overall_score": <number 0-100>,
  "feedback_text": "<detailed paragraph feedback>",
  "strengths": ["<strength 1>", "<strength 2>", ...],
  "improvements": ["<improvement 1>", "<improvement 2>", ...]
}

Focus on: content relevance, communication clarity, answer structure, and delivery.
`;

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
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
    }),
  });

  const data = await response.json();
  const analysis = JSON.parse(data.choices[0].message.content);

  return {
    id: crypto.randomUUID(),
    session_id: sessionId,
    overall_score: analysis.overall_score,
    clarity_score: input.clarityScore,
    structure_score: input.structureScore,
    pace_score: input.paceScore,
    filler_word_count: input.metrics.fillerWordCount,
    feedback_text: analysis.feedback_text,
    strengths: analysis.strengths,
    improvements: analysis.improvements,
    created_at: new Date().toISOString(),
  };
}
*/
