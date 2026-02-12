export type LessonSectionType = 'video' | 'text' | 'chessboard' | 'quiz' | 'gamification';

export interface LessonSectionBase {
  id: string;
  type: LessonSectionType;
  title?: string;
}

export interface VideoSection extends LessonSectionBase {
  type: 'video';
  url: string;
  provider: 'youtube' | 'vimeo' | 'supastorage';
  duration?: number; // seconds
  autoPlay?: boolean;
}

export interface TextSection extends LessonSectionBase {
  type: 'text';
  content: string; // Markdown supported
  imageUrl?: string;
}

export interface ChessboardSection extends LessonSectionBase {
  type: 'chessboard';
  fen: string;
  orientation?: 'white' | 'black';
  interactive: boolean;
  solution?: string[]; // UCI moves (e.g., "e2e4", "e7e5")
  hints?: string[];
  setupArrows?: string[]; // e.g. "G1F3"
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

export interface QuizSection extends LessonSectionBase {
  type: 'quiz';
  questions: QuizQuestion[];
}

export interface GamificationSection extends LessonSectionBase {
  type: 'gamification';
  xpReward: number;
  badgeId?: string;
  congratulationMessage?: string;
}

export type LessonSection = VideoSection | TextSection | ChessboardSection | QuizSection | GamificationSection;

export interface AcademyLessonNewContent {
  sections: LessonSection[];
}
