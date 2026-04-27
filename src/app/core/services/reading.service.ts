import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ActiveReading,
  ReadingDetail,
  ReadingPhase,
  ReadingSessionProgress,
  SaveReadingPhaseProgressRequest
} from '../models/reading.models';

@Injectable({ providedIn: 'root' })
export class ReadingService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl;

  getActiveReadings(): Observable<ActiveReading[]> {
    return this.http.get<ActiveReading[]>(`${this.apiBaseUrl}/readings`);
  }

  getReadingDetail(readingId: number): Observable<ReadingDetail> {
    return this.http.get<ReadingDetail>(`${this.apiBaseUrl}/readings/${readingId}`);
  }

  getReadingPhases(readingId: number): Observable<ReadingPhase[]> {
    return this.http.get<ReadingPhase[]>(`${this.apiBaseUrl}/readings/${readingId}/phases`);
  }

  startReadingSession(readingId: number): Observable<ReadingSessionProgress> {
    return this.http.post<ReadingSessionProgress>(`${this.apiBaseUrl}/readings/${readingId}/sessions`, {});
  }

  savePhaseProgress(
    attemptId: number,
    phaseId: number,
    payload: SaveReadingPhaseProgressRequest
  ): Observable<ReadingSessionProgress> {
    return this.http.put<ReadingSessionProgress>(
      `${this.apiBaseUrl}/readings/sessions/${attemptId}/phases/${phaseId}/progress`,
      payload
    );
  }

  completePhase(
    attemptId: number,
    phaseId: number,
    payload: SaveReadingPhaseProgressRequest
  ): Observable<ReadingSessionProgress> {
    return this.http.post<ReadingSessionProgress>(
      `${this.apiBaseUrl}/readings/sessions/${attemptId}/phases/${phaseId}/complete`,
      payload
    );
  }

  getReadingSession(attemptId: number): Observable<ReadingSessionProgress> {
    return this.http.get<ReadingSessionProgress>(`${this.apiBaseUrl}/readings/sessions/${attemptId}`);
  }

  finishReadingSession(attemptId: number): Observable<ReadingSessionProgress> {
    return this.http.post<ReadingSessionProgress>(
      `${this.apiBaseUrl}/readings/sessions/${attemptId}/finish`,
      {}
    );
  }
}
