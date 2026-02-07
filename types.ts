export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswer: string;
}

export interface VocabularyItem {
  word: string;
  partOfSpeech: string;
  definition: string;
  chinese: string;
  example: string;
}

export interface VocabTestQuestion {
  id: number;
  type: 'multiple_choice' | 'fill_in_the_blank' | 'true_false' | 'unscramble';
  questionText: string;
  options?: string[]; // For MCQ
  correctAnswer: string;
  scrambledWord?: string; // For unscramble
}

export interface LessonData {
  id?: string;
  timestamp?: number;
  level: DifficultyLevel;
  topicTitle: string;
  dialogueScript: Array<{ speaker: string; text: string }>;
  partA: {
    questions: Question[];
  };
  vocabulary: VocabularyItem[];
  vocabTest: VocabTestQuestion[];
  partB: {
    prompts: string[];
  };
  partC: {
    theme: string;
    points: string[];
  };
  partD: {
    textWithErrors: string;
    corrections: Array<{ mistake: string; correction: string }>;
  };
  partE: {
    translationPassage: string; // In Traditional Chinese
    essayPrompt: string; // In Traditional Chinese
    essayPoints: string[]; // In Traditional Chinese
  };
  partF: {
    passage: string;
    questions: Question[];
  };
}

export enum GenerationStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}