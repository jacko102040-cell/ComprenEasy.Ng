export interface ActiveReading {
  readingId: number;
  title: string;
  summary: string | null;
  imageUrl: string | null;
  difficultyLevelId: number;
  difficultyLevelName: string;
  estimatedMinutes: number | null;
  activePhaseCount: number;
}

export interface ReadingDetail {
  readingId: number;
  title: string;
  summary: string | null;
  content: string;
  imageUrl: string | null;
  difficultyLevelId: number;
  difficultyLevelName: string;
  estimatedMinutes: number | null;
}

export interface ReadingPhase {
  phaseId: number;
  code: string;
  displayName: string;
  displayOrder: number;
  isEnabled: boolean;
  isRequired: boolean;
  guidanceText: string | null;
  minQuestionsToUnlockNext: number | null;
}

export interface ReadingPhaseQuestionOption {
  optionId: number;
  optionText: string;
  displayOrder: number;
}

export interface ReadingPhaseQuestion {
  questionId: number;
  displayOrder: number;
  dimensionId: number;
  dimensionName: string;
  stem: string;
  points: number;
  selectedOptionId: number | null;
  isCorrect: boolean | null;
  scoreObtained: number | null;
  answerTimeSeconds: number | null;
  options: ReadingPhaseQuestionOption[];
}

export interface PhaseProgress {
  phaseId: number;
  code: string;
  displayName: string;
  sequenceOrder?: number | null;
  displayOrder?: number | null;
  isRequired: boolean;
  minQuestionsToUnlockNext: number | null;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  timeSpentSeconds: number;
  guidanceText: string | null;
  answeredQuestions: number;
  totalQuestions: number;
  questions: ReadingPhaseQuestion[];
}

export interface ReadingSessionProgress {
  attemptId: number;
  readingId: number;
  assessmentId: number;
  readingTitle: string;
  sessionStatus: string;
  attemptNumber: number;
  startedAt: string;
  finishedAt: string | null;
  completionPercentage: number;
  totalScore: number | null;
  literalScore: number | null;
  inferentialScore: number | null;
  criticalScore: number | null;
  totalCorrect: number | null;
  totalErrors: number | null;
  totalTimeSeconds: number;
  currentPhaseId: number | null;
  currentPhaseCode: string | null;
  phases: PhaseProgress[];
}

export interface SaveReadingPhaseAnswerItem {
  questionId: number;
  selectedOptionId: number;
  answerTimeSeconds: number;
}

export interface SaveReadingPhaseProgressRequest {
  timeSpentSeconds: number;
  progressNote: string | null;
  answers: SaveReadingPhaseAnswerItem[];
}
