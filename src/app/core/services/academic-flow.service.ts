import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AcademicFlowSummary } from '../models/academic-flow.models';

@Injectable({ providedIn: 'root' })
export class AcademicFlowService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl;

  getCurrentSummary(): Observable<AcademicFlowSummary> {
    return this.http.get<AcademicFlowSummary>(`${this.apiBaseUrl}/academic-flow/current`);
  }
}
