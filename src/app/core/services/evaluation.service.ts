import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ActiveAssessment,
  AssessmentAttemptResult,
  AssessmentDetail,
  PrePostComparisonSummary,
  SaveAttemptAnswersRequest,
  SaveAttemptAnswersResponse,
  StartAttemptResponse
} from '../models/evaluation.models';

@Injectable({ providedIn: 'root' })
export class EvaluationService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl;

  getActivePretests(): Observable<ActiveAssessment[]> {
    return this.http.get<ActiveAssessment[]>(`${this.apiBaseUrl}/evaluations/pretests/active`);
  }

  getActivePosttests(): Observable<ActiveAssessment[]> {
    return this.http.get<ActiveAssessment[]>(`${this.apiBaseUrl}/evaluations/posttests/active`);
  }

  getAssessmentDetail(assessmentId: number): Observable<AssessmentDetail> {
    return this.http.get<AssessmentDetail>(`${this.apiBaseUrl}/evaluations/${assessmentId}`);
  }

  startAttempt(assessmentId: number): Observable<StartAttemptResponse> {
    return this.http.post<StartAttemptResponse>(
      `${this.apiBaseUrl}/evaluations/${assessmentId}/attempts`,
      {}
    );
  }

  saveAnswers(
    attemptId: number,
    payload: SaveAttemptAnswersRequest
  ): Observable<SaveAttemptAnswersResponse> {
    return this.http.post<SaveAttemptAnswersResponse>(
      `${this.apiBaseUrl}/evaluations/attempts/${attemptId}/answers`,
      payload
    );
  }

  finishAttempt(attemptId: number): Observable<AssessmentAttemptResult> {
    return this.http.post<AssessmentAttemptResult>(
      `${this.apiBaseUrl}/evaluations/attempts/${attemptId}/finish`,
      {}
    );
  }

  getAttemptResult(attemptId: number): Observable<AssessmentAttemptResult> {
    return this.http.get<AssessmentAttemptResult>(
      `${this.apiBaseUrl}/evaluations/attempts/${attemptId}/result`
    );
  }

  getLatestPrePostComparison(): Observable<PrePostComparisonSummary> {
    return this.http.get<PrePostComparisonSummary>(
      `${this.apiBaseUrl}/evaluations/pre-post-comparison`
    );
  }
}
