export interface AcademicFlowSummary {
  hasCompletedPretest: boolean;
  latestPretestFinishedAt: string | null;
  completedReadingSessions: number;
  minimumReadingSessionsRequired: number;
  hasCompletedMinimumReadingIntervention: boolean;
  latestReadingFinishedAt: string | null;
  canAccessReadings: boolean;
  canAccessPosttest: boolean;
  hasCompletedPosttest: boolean;
  latestPosttestFinishedAt: string | null;
  canAccessFinalComparison: boolean;
  currentStage: 'Pretest' | 'Readings' | 'Posttest' | 'Completed';
  recommendedRoute: string;
  recommendedMessage: string;
}
