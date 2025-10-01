export const interviewQuestions = [
  "Tell me about yourself and your background.",
  "What are your greatest strengths?",
  "What is your biggest weakness?",
  "Why do you want to work for our company?",
  "Where do you see yourself in 5 years?",
  "Describe a challenging situation you faced at work and how you handled it.",
  "Why are you leaving your current job?",
  "What makes you unique compared to other candidates?",
  "How do you handle stress and pressure?",
  "Tell me about a time you failed and what you learned from it.",
  "How do you prioritize tasks when managing multiple projects?",
  "Describe your ideal work environment.",
  "What motivates you in your career?",
  "How do you handle conflicts with coworkers?",
  "What are your salary expectations?",
  "Tell me about a time you demonstrated leadership.",
  "How do you stay updated with industry trends?",
  "What questions do you have for us?",
  "Describe a time when you had to work with a difficult team member.",
  "What is your approach to problem-solving?",
];

export function getRandomQuestion(): string {
  const randomIndex = Math.floor(Math.random() * interviewQuestions.length);
  return interviewQuestions[randomIndex];
}
