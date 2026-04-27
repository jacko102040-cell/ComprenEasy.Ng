import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AdaptiveRecommendation } from '../models/adaptive-recommendation.models';

@Injectable({ providedIn: 'root' })
export class AdaptiveRecommendationService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl;

  getLatestRecommendation(): Observable<AdaptiveRecommendation> {
    return this.http.get<AdaptiveRecommendation>(`${this.apiBaseUrl}/adaptive-recommendations/latest`);
  }

  generateRecommendation(attemptId: number): Observable<AdaptiveRecommendation> {
    return this.http.post<AdaptiveRecommendation>(
      `${this.apiBaseUrl}/adaptive-recommendations/attempts/${attemptId}/generate`,
      {}
    );
  }
}
