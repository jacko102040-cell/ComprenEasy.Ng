export interface ActiveAssessment {
  assessmentId: number;
  assessmentType: string;
  title: string;
  description: string | null;
  difficultyLevelId: number | null;
  questionCount: number;
}

export interface AssessmentOption {
  optionId: number;
  optionText: string;
  displayOrder: number;
}

export interface AssessmentQuestion {
  questionId: number;
  displayOrder: number;
  dimensionId: number;
  dimensionName: string;
  stem: string;
  points: number;
  options: AssessmentOption[];
}

export interface AssessmentDetail {
  assessmentId: number;
  assessmentType: string;
  title: string;
  description: string | null;
  difficultyLevelId: number | null;
  readingTitle?: string | null;
  supportText?: string | null;
  readingContent?: string | null;
  content?: string | null;
  questions: AssessmentQuestion[];
}

export interface StartAttemptResponse {
  attemptId: number;
  assessmentId: number;
  attemptNumber: number;
  status: string;
  startedAt: string;
}

export interface SaveAttemptAnswerItem {
  questionId: number;
  selectedOptionId: number;
  answerTimeSeconds: number;
}

export interface SaveAttemptAnswersRequest {
  answers: SaveAttemptAnswerItem[];
}

export interface SaveAttemptAnswersResponse {
  attemptId: number;
  savedAnswers: number;
  answeredQuestions: number;
  totalQuestions: number;
  completionPercentage: number;
}

export interface AttemptAnswerResult {
  questionId: number;
  stem: string;
  dimensionName: string;
  selectedOptionId: number | null;
  isCorrect: boolean | null;
  scoreObtained: number;
  answerTimeSeconds: number;
}

export interface AssessmentAttemptResult {
  attemptId: number;
  assessmentId: number;
  assessmentType: string;
  assessmentTitle: string;
  status: string;
  startedAt: string;
  finishedAt: string | null;
  totalScore: number;
  literalScore: number;
  inferentialScore: number;
  criticalScore: number;
  totalCorrect: number;
  totalErrors: number;
  totalTimeSeconds: number;
  completionPercentage: number;
  answers: AttemptAnswerResult[];
}

export interface PrePostComparisonSummary {
  isAvailable: boolean;
  message: string;
  pretestFinishedAt: string | null;
  posttestFinishedAt: string | null;
  pretestTotalScore: number | null;
  posttestTotalScore: number | null;
  improvementTotalScore: number | null;
  pretestLiteralScore: number | null;
  posttestLiteralScore: number | null;
  improvementLiteralScore: number | null;
  pretestInferentialScore: number | null;
  posttestInferentialScore: number | null;
  improvementInferentialScore: number | null;
  pretestCriticalScore: number | null;
  posttestCriticalScore: number | null;
  improvementCriticalScore: number | null;
}
