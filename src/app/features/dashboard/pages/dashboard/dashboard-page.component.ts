import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { AcademicFlowSummary } from '../../../../core/models/academic-flow.models';
import { AdaptiveRecommendation } from '../../../../core/models/adaptive-recommendation.models';
import { AcademicFlowService } from '../../../../core/services/academic-flow.service';
import { AdaptiveRecommendationService } from '../../../../core/services/adaptive-recommendation.service';
import { AuthService } from '../../../../core/services/auth.service';
import { EvaluationService } from '../../../../core/services/evaluation.service';
import { ReadingService } from '../../../../core/services/reading.service';

@Component({
  selector: 'app-dashboard-page',
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.css'
})
export class DashboardPageComponent {
  protected readonly authService = inject(AuthService);
  private readonly academicFlowService = inject(AcademicFlowService);
  private readonly adaptiveRecommendationService = inject(AdaptiveRecommendationService);
  private readonly evaluationService = inject(EvaluationService);
  private readonly readingService = inject(ReadingService);

  protected recommendation: AdaptiveRecommendation | null = null;
  protected recommendationLoading = true;
  protected recommendationError = '';
  protected recommendationEmpty = false;
  protected flowLoading = true;
  protected availablePretests = 0;
  protected availablePosttests = 0;
  protected availableReadings = 0;
  protected summary: AcademicFlowSummary | null = null;
  protected flowError = '';

  constructor() {
    this.adaptiveRecommendationService.getLatestRecommendation().subscribe({
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

    forkJoin({
      pretests: this.evaluationService.getActivePretests().pipe(catchError(() => of([]))),
      posttests: this.evaluationService.getActivePosttests().pipe(catchError(() => of([]))),
      readings: this.readingService.getActiveReadings().pipe(catchError(() => of([]))),
      summary: this.academicFlowService
        .getCurrentSummary()
        .pipe(catchError(() => of<AcademicFlowSummary | null>(null)))
    }).subscribe({
      next: ({ pretests, posttests, readings, summary }) => {
        this.availablePretests = pretests.length;
        this.availablePosttests = posttests.length;
        this.availableReadings = readings.length;
        this.summary = summary;
        this.flowLoading = false;
      },
      error: () => {
        this.flowLoading = false;
        this.flowError = 'No se pudo cargar el estado general de tu ruta de aprendizaje.';
      }
    });
  }

  protected recommendationHint(): string {
    switch (this.recommendation?.predictedAction) {
      case 'Avanzar':
        return 'Tu rendimiento reciente permite seguir con un reto mayor.';
      case 'AvanzarConApoyo':
        return 'Puedes avanzar, pero con apoyo adicional y seguimiento.';
      case 'Reforzar':
        return 'Conviene reforzar la base antes de subir la dificultad.';
      default:
        return '';
    }
  }

  protected hasCompletedPretest(): boolean {
    return this.summary?.hasCompletedPretest ?? false;
  }

  protected hasCompletedPosttest(): boolean {
    return this.summary?.hasCompletedPosttest ?? false;
  }

  protected pretestStatus(): string {
    return this.hasCompletedPretest() ? 'Completado' : 'Pendiente';
  }

  protected pretestHint(): string {
    if (this.hasCompletedPretest()) {
      return 'Tu diagnóstico inicial ya está registrado.';
    }

    return this.availablePretests > 0
      ? 'Completa el pretest para activar mejor tu ruta de trabajo.'
      : 'No hay pretests activos en este momento.';
  }

  protected readingsStatus(): string {
    if (!this.summary) {
      return 'Sin datos';
    }

    if (!this.summary.hasCompletedPretest) {
      return 'Bloqueadas';
    }

    if (this.summary.hasCompletedPosttest) {
      return 'Cerradas';
    }

    if (this.summary.hasCompletedMinimumReadingIntervention) {
      return 'Mínimo cumplido';
    }

    return this.summary.completedReadingSessions > 0 ? 'En progreso' : 'Disponibles';
  }

  protected readingsHint(): string {
    if (!this.summary) {
      return 'No se pudo determinar el estado actual de lecturas.';
    }

    if (!this.summary.hasCompletedPretest) {
      return 'Las lecturas se habilitan después de completar el pretest.';
    }

    if (this.summary.hasCompletedPosttest) {
      return 'La intervención principal ya terminó y el cierre está en la comparación final.';
    }

    return `${this.summary.completedReadingSessions}/${this.summary.minimumReadingSessionsRequired} sesión(es) completas para habilitar el posttest. ${this.availableReadings} lectura(s) activa(s) disponibles.`;
  }

  protected posttestStatus(): string {
    if (this.hasCompletedPosttest()) {
      return 'Completado';
    }

    if (this.summary?.canAccessPosttest) {
      return 'Disponible';
    }

    return 'Pendiente';
  }

  protected posttestHint(): string {
    if (this.hasCompletedPosttest()) {
      return 'Tu evaluación final ya está registrada.';
    }

    if (this.summary?.canAccessPosttest) {
      return 'Ya puedes medir tu avance final con un posttest.';
    }

    return 'Se habilita después de avanzar por lecturas y práctica.';
  }

  protected nextActivityLabel(): string {
    switch (this.summary?.currentStage) {
      case 'Pretest':
        return 'Comenzar pretest';
      case 'Readings':
        return 'Continuar con lecturas';
      case 'Posttest':
        return 'Ir al posttest';
      case 'Completed':
        return 'Ver comparación final';
      default:
        return 'Ir al siguiente paso';
    }
  }

  protected nextActivityRoute(): string | unknown[] {
    return this.summary?.recommendedRoute ?? '/dashboard';
  }

  protected recommendationActivityLabel(): string {
    if (!this.recommendation) {
      return 'Sin actividad directa';
    }

    return this.recommendation.recommendedActivityType
      ?? this.recommendation.recommendedAssessmentTitle
      ?? 'Sin actividad directa';
  }

  protected recommendationPrimaryRoute(): string | unknown[] {
    if (this.recommendation?.recommendedRoute) {
      return this.recommendation.recommendedRoute;
    }

    if (this.recommendation?.recommendedAssessmentId) {
      return ['/evaluations', this.recommendation.recommendedAssessmentId];
    }

    return this.nextActivityRoute();
  }

  protected hasRecommendationPrimaryRoute(): boolean {
    return !!(this.recommendation?.recommendedRoute || this.recommendation?.recommendedAssessmentId);
  }

  protected readingProgressPercent(): number {
    if (!this.summary?.minimumReadingSessionsRequired) {
      return 0;
    }

    return Math.min(
      100,
      Math.round((this.summary.completedReadingSessions / this.summary.minimumReadingSessionsRequired) * 100)
    );
  }

  protected flowStepClass(stage: AcademicFlowSummary['currentStage']): string {
    if (!this.summary) {
      return 'pending';
    }

    const order: AcademicFlowSummary['currentStage'][] = ['Pretest', 'Readings', 'Posttest', 'Completed'];
    const currentIndex = order.indexOf(this.summary.currentStage);
    const stepIndex = order.indexOf(stage);

    if (stepIndex < currentIndex || this.summary.currentStage === 'Completed') {
      return 'done';
    }

    return stepIndex === currentIndex ? 'current' : 'pending';
  }
}
