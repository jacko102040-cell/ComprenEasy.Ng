import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ContentAssessmentDetail,
  ContentAssessmentListItem,
  ContentLookups,
  ContentQuestionDetail,
  ContentQuestionListItem,
  ContentReadingDetail,
  ContentReadingListItem,
  SaveContentAssessmentRequest,
  SaveContentQuestionRequest,
  SaveContentReadingRequest
} from '../models/academic-content.models';

@Injectable({ providedIn: 'root' })
export class AcademicContentService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl;

  getLookups(): Observable<ContentLookups> {
    return this.http.get<ContentLookups>(`${this.apiBaseUrl}/academic-content/lookups`);
  }

  getReadings(): Observable<ContentReadingListItem[]> {
    return this.http.get<ContentReadingListItem[]>(`${this.apiBaseUrl}/academic-content/readings`);
  }

  getReading(readingId: number): Observable<ContentReadingDetail> {
    return this.http.get<ContentReadingDetail>(`${this.apiBaseUrl}/academic-content/readings/${readingId}`);
  }

  createReading(payload: SaveContentReadingRequest): Observable<ContentReadingDetail> {
    return this.http.post<ContentReadingDetail>(`${this.apiBaseUrl}/academic-content/readings`, payload);
  }

  updateReading(readingId: number, payload: SaveContentReadingRequest): Observable<ContentReadingDetail> {
    return this.http.put<ContentReadingDetail>(
      `${this.apiBaseUrl}/academic-content/readings/${readingId}`,
      payload
    );
  }

  archiveReading(readingId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiBaseUrl}/academic-content/readings/${readingId}`);
  }

  getAssessments(): Observable<ContentAssessmentListItem[]> {
    return this.http.get<ContentAssessmentListItem[]>(`${this.apiBaseUrl}/academic-content/assessments`);
  }

  getAssessment(assessmentId: number): Observable<ContentAssessmentDetail> {
    return this.http.get<ContentAssessmentDetail>(
      `${this.apiBaseUrl}/academic-content/assessments/${assessmentId}`
    );
  }

  createAssessment(payload: SaveContentAssessmentRequest): Observable<ContentAssessmentDetail> {
    return this.http.post<ContentAssessmentDetail>(
      `${this.apiBaseUrl}/academic-content/assessments`,
      payload
    );
  }

  updateAssessment(
    assessmentId: number,
    payload: SaveContentAssessmentRequest
  ): Observable<ContentAssessmentDetail> {
    return this.http.put<ContentAssessmentDetail>(
      `${this.apiBaseUrl}/academic-content/assessments/${assessmentId}`,
      payload
    );
  }

  archiveAssessment(assessmentId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.apiBaseUrl}/academic-content/assessments/${assessmentId}`
    );
  }

  getQuestions(): Observable<ContentQuestionListItem[]> {
    return this.http.get<ContentQuestionListItem[]>(`${this.apiBaseUrl}/academic-content/questions`);
  }

  getQuestion(questionId: number): Observable<ContentQuestionDetail> {
    return this.http.get<ContentQuestionDetail>(`${this.apiBaseUrl}/academic-content/questions/${questionId}`);
  }

  createQuestion(payload: SaveContentQuestionRequest): Observable<ContentQuestionDetail> {
    return this.http.post<ContentQuestionDetail>(`${this.apiBaseUrl}/academic-content/questions`, payload);
  }

  updateQuestion(questionId: number, payload: SaveContentQuestionRequest): Observable<ContentQuestionDetail> {
    return this.http.put<ContentQuestionDetail>(
      `${this.apiBaseUrl}/academic-content/questions/${questionId}`,
      payload
    );
  }

  archiveQuestion(questionId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.apiBaseUrl}/academic-content/questions/${questionId}`
    );
  }
}
