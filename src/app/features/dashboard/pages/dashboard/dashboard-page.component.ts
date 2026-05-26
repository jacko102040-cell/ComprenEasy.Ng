import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { AcademicFlowSummary } from '../../../../core/models/academic-flow.models';
import { AdaptiveRecommendation } from '../../../../core/models/adaptive-recommendation.models';
import { AcademicFlowService } from '../../../../core/services/academic-flow.service';
import { AdaptiveRecommendationService } from '../../../../core/services/adaptive-recommendation.service';
import { AuthService } from '../../../../core/services/auth.service';
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
  private readonly readingService = inject(ReadingService);

  protected recommendation: AdaptiveRecommendation | null = null;
  protected recommendationLoading = true;
  protected recommendationError = '';
  protected recommendationEmpty = false;
  protected flowLoading = true;
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
      readings: this.readingService.getActiveReadings().pipe(catchError(() => of([]))),
      summary: this.academicFlowService
        .getCurrentSummary()
        .pipe(catchError(() => of<AcademicFlowSummary | null>(null)))
    }).subscribe({
      next: ({ readings, summary }) => {
        this.availableReadings = readings.length;
        this.summary = summary;
        this.flowLoading = false;
      },
      error: () => {
        this.flowLoading = false;
        this.flowError = 'No se pudo cargar el estado general de tu proceso lector.';
      }
    });
  }

  protected recommendationHint(): string {
    switch (this.recommendation?.predictedAction) {
      case 'Avanzar':
        return 'Tu rendimiento reciente permite seguir con un reto mayor.';
      case 'AvanzarConApoyo':
        return 'Puedes avanzar con apoyo guiado y seguimiento cercano.';
      case 'Reforzar':
        return 'Conviene reforzar esta habilidad antes de subir la dificultad.';
      default:
        return '';
    }
  }

  protected firstName(fullName: string): string {
    return fullName.split(' ').filter(Boolean)[0] ?? fullName;
  }

  protected nextActivityLabel(): string {
    if (this.isPosttestEnabled()) {
      return 'Iniciar evaluacion final';
    }

    if (this.summary?.completedReadingSessions) {
      return 'Continuar lectura sugerida';
    }

    return 'Comenzar con lecturas';
  }

  protected nextActivityRoute(): string | unknown[] {
    if (this.isPosttestEnabled()) {
      return '/posttests';
    }

    return this.normalizeStudentRoute(this.summary?.recommendedRoute) ?? '/readings';
  }

  protected nextActivityDescription(): string {
    if (this.isPosttestEnabled()) {
      return 'Completaste las lecturas requeridas y puedes cerrar tu proceso de refuerzo lector.';
    }

    return '[Seed Flow] Los ecos del bosque';
  }

  protected recommendationActivityLabel(): string {
    if (!this.recommendation) {
      return 'Sin actividad directa';
    }

    const activity = (
      this.recommendation.recommendedActivityType ??
      this.recommendation.recommendedAssessmentTitle ??
      'Actividad de refuerzo'
    );

    return this.displayEvaluationLabel(activity);
  }

  protected recommendationActionLabel(): string {
    if (!this.recommendation) {
      return 'Sin datos';
    }

    return this.isPosttestRecommendation()
      ? 'Evaluacion final'
      : this.displayEvaluationLabel(this.recommendation.predictedAction);
  }

  protected recommendationButtonLabel(): string {
    if (this.isPosttestRecommendation()) {
      return 'Ver recomendación';
    }

    return this.hasRecommendationPrimaryRoute() ? 'Ir a lectura recomendada' : 'Ver recomendación';
  }

  protected isPosttestRecommendation(): boolean {
    const activity = `${this.recommendation?.recommendedActivityType ?? ''} ${
      this.recommendation?.recommendedAssessmentTitle ?? ''
    } ${this.recommendation?.recommendedRoute ?? ''}`;

    return activity.toLowerCase().includes('posttest');
  }

  protected recommendationPrimaryRoute(): string | unknown[] {
    return this.normalizeStudentRoute(this.recommendation?.recommendedRoute) ?? this.nextActivityRoute();
  }

  protected hasRecommendationPrimaryRoute(): boolean {
    return !!this.normalizeStudentRoute(this.recommendation?.recommendedRoute);
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

  protected readingProgressStatus(): string {
    if (!this.summary) {
      return 'Sin datos';
    }

    if (this.summary.hasCompletedMinimumReadingIntervention) {
      return 'Meta cumplida';
    }

    return this.summary.completedReadingSessions > 0 ? 'En progreso' : 'Por comenzar';
  }

  protected readingProgressHint(): string {
    if (!this.summary) {
      return 'No se pudo determinar el avance actual de lecturas.';
    }

    return `${this.summary.completedReadingSessions}/${this.summary.minimumReadingSessionsRequired} lecturas requeridas completadas.`;
  }

  protected completedReadingsLabel(): string {
    return `${this.summary?.completedReadingSessions ?? 0}/${this.summary?.minimumReadingSessionsRequired ?? 0}`;
  }

  protected latestReadingHint(): string {
    if (!this.summary?.latestReadingFinishedAt) {
      return 'Todavia no registras una sesion completa de lectura.';
    }

    return 'Ya cuentas con sesiones terminadas dentro del proceso de refuerzo.';
  }

  protected interventionStateLabel(): string {
    if (!this.summary) {
      return 'Sin datos';
    }

    return this.summary.hasCompletedMinimumReadingIntervention
      ? 'Intervención completada'
      : 'Intervención en curso';
  }

  protected interventionShortLabel(): string {
    return this.summary?.hasCompletedMinimumReadingIntervention ? 'Completada' : 'Pendiente';
  }

  protected totalCompletedReadings(): number {
    return this.summary?.completedReadingSessions ?? 0;
  }

  protected requiredCompletedLabel(): string {
    const completed = this.summary?.completedReadingSessions ?? 0;
    const required = this.summary?.minimumReadingSessionsRequired ?? 0;
    const requiredProgress = this.summary?.hasCompletedMinimumReadingIntervention
      ? required
      : Math.min(completed, required);

    return `${requiredProgress}/${required}`;
  }

  protected progressValueLabel(): string {
    return `${this.readingProgressPercent()}%`;
  }

  protected flowStepClass(stage: 'Readings' | 'Reinforcement' | 'Posttest'): string {
    if (!this.summary) {
      return 'pending';
    }

    if (stage === 'Readings') {
      return this.summary.completedReadingSessions > 0 ? 'done' : 'current';
    }

    if (stage === 'Reinforcement') {
      return this.summary.hasCompletedMinimumReadingIntervention ? 'done' : 'current';
    }

    if (this.summary.hasCompletedPosttest) {
      return 'done';
    }

    return this.summary.canAccessPosttest ? 'current' : 'pending';
  }

  protected isPosttestEnabled(): boolean {
    return !!this.summary?.canAccessPosttest && !this.summary?.hasCompletedPosttest;
  }

  protected canAccessPosttest(): boolean {
    return !!this.summary?.canAccessPosttest;
  }

  protected posttestCardState(): 'available' | 'pending' | 'completed' {
    if (this.summary?.hasCompletedPosttest) {
      return 'completed';
    }

    return this.summary?.canAccessPosttest ? 'available' : 'pending';
  }

  protected posttestStatusLabel(): string {
    switch (this.posttestCardState()) {
      case 'available':
        return 'Habilitado';
      case 'completed':
        return 'Completado';
      default:
        return 'Pendiente';
    }
  }

  protected posttestTitle(): string {
    switch (this.posttestCardState()) {
      case 'available':
        return 'Evaluacion final disponible';
      case 'completed':
        return 'Evaluacion final completada';
      default:
        return 'Evaluacion final aún no disponible';
    }
  }

  protected posttestDescription(): string {
    switch (this.posttestCardState()) {
      case 'available':
        return 'Usa la evaluacion final para validar tu avance después del trabajo con lecturas PQ4R.';
      case 'completed':
        return 'Ya registraste la evaluacion final como cierre del proceso de refuerzo lector.';
      default:
        return 'Completa las lecturas requeridas para desbloquear la evaluación final.';
    }
  }

  protected posttestActionLabel(): string {
    return this.summary?.hasCompletedPosttest ? 'Ver dashboard' : 'Ir a la evaluacion final';
  }

  protected posttestActionRoute(): string {
    return this.summary?.hasCompletedPosttest ? '/dashboard' : '/posttests';
  }

  protected showPosttestAction(): boolean {
    return this.posttestCardState() === 'available';
  }

  private normalizeStudentRoute(route: string | null | undefined): string | null {
    if (!route) {
      return null;
    }

    return ['/pretests', '/pre-post-comparison'].includes(route) ? '/readings' : route;
  }

  private displayEvaluationLabel(value: string): string {
    return value.replace(/post[-\s]?test|postest/gi, 'Evaluacion final');
  }
}
