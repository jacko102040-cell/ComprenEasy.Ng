export interface AdaptiveRecommendation {
  recommendationId: number;
  sourceAttemptId: number;
  sourceAssessmentId: number;
  sourceAssessmentType: string;
  sourceAssessmentTitle: string;
  currentDifficultyLevelId: number;
  currentDifficultyLevelName: string;
  recommendedDifficultyLevelId: number;
  recommendedDifficultyLevelName: string;
  predictedAction: string;
  recommendedActivityType: string | null;
  recommendedRoute: string | null;
  recommendedReadingId: number | null;
  recommendedAssessmentId: number | null;
  recommendedAssessmentTitle: string | null;
  engineType: string;
  confidenceScore: number | null;
  createdAt: string;
}
