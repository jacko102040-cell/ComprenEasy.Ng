import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdaptiveRecommendation } from '../../../../core/models/adaptive-recommendation.models';
import { ReadingSessionProgress } from '../../../../core/models/reading.models';
import { AdaptiveRecommendationService } from '../../../../core/services/adaptive-recommendation.service';
import { ReadingService } from '../../../../core/services/reading.service';

@Component({
  selector: 'app-reading-session-result-page',
  imports: [CommonModule, RouterLink],
  templateUrl: './reading-session-result-page.component.html',
  styleUrl: './reading-session-result-page.component.css'
})
export class ReadingSessionResultPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly readingService = inject(ReadingService);
  private readonly adaptiveRecommendationService = inject(AdaptiveRecommendationService);

  protected session: ReadingSessionProgress | null = null;
  protected loading = true;
  protected errorMessage = '';
  protected recommendation: AdaptiveRecommendation | null = null;
  protected recommendationLoading = false;
  protected recommendationError = '';
  protected recommendationEmpty = false;

  constructor() {
    const attemptId = Number(this.route.snapshot.paramMap.get('attemptId'));

    this.readingService.getReadingSession(attemptId).subscribe({
      next: (session) => {
        this.session = session;
        this.loading = false;

        if (session.sessionStatus === 'Completed') {
          this.loadRecommendation(session.attemptId);
        } else {
          this.recommendationEmpty = true;
        }
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error?.error?.message ?? 'No se pudo cargar el resumen de la sesión.';
      }
    });
  }

  protected completedPhasesCount(): number {
    return this.session?.phases.filter((phase) => phase.status === 'Completed').length ?? 0;
  }

  protected requiredPhasesCount(): number {
    return this.session?.phases.filter((phase) => phase.isRequired).length ?? 0;
  }

  protected completedRequiredPhasesCount(): number {
    return (
      this.session?.phases.filter((phase) => phase.isRequired && phase.status === 'Completed').length ?? 0
    );
  }

  protected phaseOrder(sequenceOrder?: number | null, displayOrder?: number | null): number {
    return sequenceOrder ?? displayOrder ?? 0;
  }

  protected scoreLabel(score: number | null): string {
    return score === null ? 'Sin puntaje' : `${score}%`;
  }

  protected countLabel(value: number | null): string {
    return value === null ? '-' : `${value}`;
  }

  protected recommendationHint(): string {
    switch (this.recommendation?.predictedAction) {
      case 'Avanzar':
        return 'El motor sugiere subir el reto después de esta lectura.';
      case 'AvanzarConApoyo':
        return 'Se sugiere continuar, pero con apoyo guiado en la siguiente actividad.';
      case 'Reforzar':
        return 'Antes de avanzar, conviene reforzar comprensión y ritmo lector.';
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
