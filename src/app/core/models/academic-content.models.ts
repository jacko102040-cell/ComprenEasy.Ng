export interface ContentLookupItem {
  id: number;
  name: string;
}

export interface ContentPhaseLookup {
  phaseId: number;
  code: string;
  displayName: string;
  defaultOrder: number;
}

export interface ContentQuestionLookup {
  questionId: number;
  stem: string;
  dimensionName: string;
}

export interface ContentLookups {
  difficultyLevels: ContentLookupItem[];
  dimensions: ContentLookupItem[];
  phases: ContentPhaseLookup[];
  readings: ContentLookupItem[];
  questions: ContentQuestionLookup[];
}

export interface ContentReadingListItem {
  readingId: number;
  title: string;
  difficultyLevelName: string;
  isActive: boolean;
  enabledPhaseCount: number;
  assessmentCount: number;
}

export interface ContentReadingPhaseEditor {
  phaseId: number;
  code: string;
  displayName: string;
  displayOrder: number;
  isEnabled: boolean;
  isRequired: boolean;
  guidanceText: string | null;
  minQuestionsToUnlockNext: number | null;
}

export interface ContentReadingDetail {
  readingId: number;
  title: string;
  summary: string | null;
  content: string;
  imageUrl: string | null;
  difficultyLevelId: number;
  estimatedMinutes: number | null;
  isActive: boolean;
  phases: ContentReadingPhaseEditor[];
}

export interface SaveContentReadingRequest {
  title: string;
  summary: string | null;
  content: string;
  imageUrl: string | null;
  difficultyLevelId: number;
  estimatedMinutes: number | null;
  isActive: boolean;
  phases: ContentReadingPhaseEditor[];
}

export interface ContentAssessmentListItem {
  assessmentId: number;
  assessmentType: string;
  title: string;
  readingTitle: string | null;
  difficultyLevelId: number | null;
  difficultyLevelName: string | null;
  isActive: boolean;
  questionCount: number;
}

export interface ContentAssessmentQuestionEditor {
  assessmentQuestionId: number | null;
  questionId: number;
  questionStem: string;
  dimensionName: string;
  phaseId: number | null;
  displayOrder: number;
  points: number;
  isActive: boolean;
}

export interface ContentAssessmentDetail {
  assessmentId: number;
  assessmentType: string;
  readingId: number | null;
  title: string;
  description: string | null;
  difficultyLevelId: number | null;
  isActive: boolean;
  questions: ContentAssessmentQuestionEditor[];
}

export interface SaveContentAssessmentRequest {
  assessmentType: string;
  readingId: number | null;
  title: string;
  description: string | null;
  difficultyLevelId: number | null;
  isActive: boolean;
  questions: ContentAssessmentQuestionEditor[];
}

export interface ContentQuestionOptionEditor {
  optionId: number | null;
  optionText: string;
  isCorrect: boolean;
  displayOrder: number;
}

export interface ContentQuestionListItem {
  questionId: number;
  stem: string;
  dimensionName: string;
  questionType: string;
  difficultyLevelName: string | null;
  isActive: boolean;
  optionCount: number;
}

export interface ContentQuestionDetail {
  questionId: number;
  dimensionId: number;
  stem: string;
  questionType: string;
  explanation: string | null;
  difficultyLevelId: number | null;
  isActive: boolean;
  options: ContentQuestionOptionEditor[];
}

export interface SaveContentQuestionRequest {
  dimensionId: number;
  stem: string;
  questionType: string;
  explanation: string | null;
  difficultyLevelId: number | null;
  isActive: boolean;
  options: ContentQuestionOptionEditor[];
}
