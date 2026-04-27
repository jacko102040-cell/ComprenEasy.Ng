import { AdaptiveRecommendation } from './adaptive-recommendation.models';

export interface TeacherStudentListItem {
  studentId: number;
  fullName: string;
  username: string;
  grade: number;
  section: string | null;
  isEnabledForTest: boolean;
  isActive: boolean;
  lastActivityAt: string | null;
  latestScore: number | null;
  latestRecommendationAction: string | null;
}

export interface TeacherStudentProgressSummary {
  completedEvaluationAttempts: number;
  completedReadingSessions: number;
  latestCompletedScore: number | null;
  latestRecommendationAction: string | null;
  lastActivityAt: string | null;
}

export interface TeacherStudentAssessmentAttempt {
  attemptId: number;
  assessmentId: number;
  assessmentTitle: string;
  assessmentType: string;
  status: string;
  startedAt: string;
  finishedAt: string | null;
  totalScore: number | null;
  completionPercentage: number | null;
  totalTimeSeconds: number | null;
}

export interface TeacherStudentReadingSession {
  attemptId: number;
  assessmentId: number;
  readingId: number | null;
  readingTitle: string;
  status: string;
  startedAt: string;
  finishedAt: string | null;
  completionPercentage: number | null;
  totalTimeSeconds: number | null;
}

export interface TeacherCommentTag {
  commentTagId: number;
  name: string;
}

export interface TeacherStudentComment {
  teacherCommentId: number;
  teacherName: string;
  commentTagId: number;
  commentTagName: string;
  attemptId: number | null;
  commentText: string;
  createdAt: string;
}

export interface TeacherStudentDetail {
  studentId: number;
  fullName: string;
  username: string;
  grade: number;
  section: string | null;
  isEnabledForTest: boolean;
  isActive: boolean;
  progressSummary: TeacherStudentProgressSummary;
  evaluationAttempts: TeacherStudentAssessmentAttempt[];
  readingSessions: TeacherStudentReadingSession[];
  recentRecommendations: AdaptiveRecommendation[];
  comments: TeacherStudentComment[];
  availableCommentTags: TeacherCommentTag[];
}

export interface ResetStudentPasswordResult {
  studentId: number;
  studentFullName: string;
  temporaryPassword: string;
  resetAt: string;
}

export interface CreateTeacherCommentRequest {
  attemptId: number | null;
  commentTagId: number;
  commentText: string;
}
