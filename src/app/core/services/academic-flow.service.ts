import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AcademicFlowSummary } from '../models/academic-flow.models';

@Injectable({ providedIn: 'root' })
export class AcademicFlowService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl;
  private readonly currentSummaryState = signal<AcademicFlowSummary | null>(null);

  readonly currentSummary = this.currentSummaryState.asReadonly();

  getCurrentSummary(): Observable<AcademicFlowSummary> {
    return this.http.get<AcademicFlowSummary>(`${this.apiBaseUrl}/academic-flow/current`).pipe(
      tap((summary) => {
        this.currentSummaryState.set(summary);
      })
    );
  }
}
