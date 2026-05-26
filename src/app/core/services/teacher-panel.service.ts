import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateTeacherCommentRequest,
  ResetStudentPasswordResult,
  TeacherCommentTag,
  TeacherStudentComment,
  TeacherStudentDetail,
  TeacherStudentListItem
} from '../models/teacher-panel.models';

@Injectable({ providedIn: 'root' })
export class TeacherPanelService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl;

  getStudents(): Observable<TeacherStudentListItem[]> {
    return this.http.get<TeacherStudentListItem[]>(`${this.apiBaseUrl}/teacher-panel/students`);
  }

  getStudentDetail(studentId: number): Observable<TeacherStudentDetail> {
    return this.http.get<TeacherStudentDetail>(`${this.apiBaseUrl}/teacher-panel/students/${studentId}`);
  }

  getCommentTags(): Observable<TeacherCommentTag[]> {
    return this.http.get<TeacherCommentTag[]>(`${this.apiBaseUrl}/teacher-panel/comment-tags`);
  }

  exportPosttestReadings(): Observable<Blob> {
    return this.http.get(`${this.apiBaseUrl}/teacher-panel/exports/posttest-readings.xlsx`, {
      responseType: 'blob'
    });
  }

  resetStudentPassword(studentId: number): Observable<ResetStudentPasswordResult> {
    return this.http.post<ResetStudentPasswordResult>(
      `${this.apiBaseUrl}/teacher-panel/students/${studentId}/reset-password`,
      {}
    );
  }

  addComment(
    studentId: number,
    payload: CreateTeacherCommentRequest
  ): Observable<TeacherStudentComment> {
    return this.http.post<TeacherStudentComment>(
      `${this.apiBaseUrl}/teacher-panel/students/${studentId}/comments`,
      payload
    );
  }
}
