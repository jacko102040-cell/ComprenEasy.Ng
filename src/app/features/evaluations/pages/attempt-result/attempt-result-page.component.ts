import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdaptiveRecommendation } from '../../../../core/models/adaptive-recommendation.models';
import { AdaptiveRecommendationService } from '../../../../core/services/adaptive-recommendation.service';
import { EvaluationService } from '../../../../core/services/evaluation.service';
import { AssessmentAttemptResult } from '../../../../core/models/evaluation.models';

@Component({
  selector: 'app-attempt-result-page',
  imports: [CommonModule, RouterLink, DatePipe, DecimalPipe],
  templateUrl: './attempt-result-page.component.html',
  styleUrl: './attempt-result-page.component.css'
})
export class AttemptResultPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly evaluationService = inject(EvaluationService);
  private readonly adaptiveRecommendationService = inject(AdaptiveRecommendationService);

  protected result: AssessmentAttemptResult | null = null;
  protected loading = true;
  protected errorMessage = '';
  protected recommendation: AdaptiveRecommendation | null = null;
  protected recommendationLoading = false;
  protected recommendationError = '';
  protected recommendationEmpty = false;

  constructor() {
    const attemptId = Number(this.route.snapshot.paramMap.get('attemptId'));

    this.evaluationService.getAttemptResult(attemptId).subscribe({
      next: (result) => {
        this.result = result;
        this.loading = false;

        if (result.status === 'Completed') {
          this.loadRecommendation(result.attemptId);
        } else {
          this.recommendationEmpty = true;
        }
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error?.error?.message ?? 'No se pudo cargar el resultado.';
      }
    });
  }

  protected recommendationHint(): string {
    switch (this.recommendation?.predictedAction) {
      case 'Avanzar':
        return 'Tu desempeño permite continuar con una actividad más desafiante.';
      case 'AvanzarConApoyo':
        return 'La sugerencia es avanzar con acompañamiento y refuerzo puntual.';
      case 'Reforzar':
        return 'Se recomienda reforzar antes de avanzar al siguiente nivel.';
      default:
        return '';
    }
  }

  protected recommendationActivityLabel(): string {
    if (!this.recommendation) {
      return 'Sin actividad directa';
    }

    return this.recommendation.recommendedActivityType
      ?? this.recommendation.recommendedAssessmentTitle
      ?? 'Sin actividad directa';
  }

  protected recommendationPrimaryRoute(): string | unknown[] | null {
    if (this.recommendation?.recommendedRoute) {
      return this.recommendation.recommendedRoute;
    }

    if (this.recommendation?.recommendedAssessmentId) {
      return ['/evaluations', this.recommendation.recommendedAssessmentId];
    }

    return null;
  }

  private loadRecommendation(attemptId: number): void {
    this.recommendationLoading = true;
    this.recommendationError = '';
    this.recommendationEmpty = false;

    this.adaptiveRecommendationService.getLatestRecommendation().subscribe({
      next: (recommendation) => {
        if (recommendation.sourceAttemptId === attemptId) {
          this.recommendation = recommendation;
          this.recommendationLoading = false;
          return;
        }

        this.generateRecommendation(attemptId);
      },
      error: () => {
        this.generateRecommendation(attemptId);
      }
    });
  }

  private generateRecommendation(attemptId: number): void {
    this.adaptiveRecommendationService.generateRecommendation(attemptId).subscribe({
      next: (recommendation) => {
        this.recommendation = recommendation;
        this.recommendationLoading = false;
      },
      error: (error) => {
        this.recommendationLoading = false;

        if (error?.status === 404) {
          this.recommendationEmpty = true;
          return;
        }

        this.recommendationError =
          error?.error?.message ?? 'No se pudo cargar la recomendación adaptativa.';
      }
    });
  }
}
