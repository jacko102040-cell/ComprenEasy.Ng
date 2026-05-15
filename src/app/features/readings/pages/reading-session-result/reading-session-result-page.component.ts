import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdaptiveRecommendation } from '../../../../core/models/adaptive-recommendation.models';
import { PhaseProgress, ReadingDetail, ReadingSessionProgress } from '../../../../core/models/reading.models';
import { AdaptiveRecommendationService } from '../../../../core/services/adaptive-recommendation.service';
import { ReadingService } from '../../../../core/services/reading.service';

interface ScoreItem {
  label: string;
  value: number;
}

@Component({
  selector: 'app-reading-session-result-page',
  imports: [CommonModule, RouterLink],
  templateUrl: './reading-session-result-page.component.html',
  styleUrl: './reading-session-result-page.component.css'
})
export class ReadingSessionResultPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly readingService = inject(ReadingService);
  private readonly adaptiveRecommendationService = inject(AdaptiveRecommendationService);
  private readonly defaultReadingBackground = 'assets/img/readings/default-reading.png';
  private readonly readingBackgrounds: Record<number, string> = {
    1: 'assets/img/readings/el-puente-antiguo.png',
    2: 'assets/img/readings/innovacion-en-el-aula.png',
    3: 'assets/img/readings/los-ecos-del-bosque.png',
    1002: 'assets/img/readings/1002-la-mochila-de-los-objetos-perdidos.png',
    1003: 'assets/img/readings/1003-el-viaje-de-una-gota-en-casa.png',
    1004: 'assets/img/readings/1004-quien-debe-ser-el-delegado.png',
    1005: 'assets/img/readings/1005-el-club-de-los-recreos-silenciosos.png',
    1006: 'assets/img/readings/1006-la-alarma-que-organiza-el-dia.png',
    1007: 'assets/img/readings/1007-el-mapa-del-mercado-del-barrio.png',
    1008: 'assets/img/readings/1008-la-ultima-pagina-de-cuaderno-rojo.png',
    1009: 'assets/img/readings/1009-la-ciudad-que-escuchaba-a-sus-arboles.png',
    1010: 'assets/img/readings/1010-el-algoritmo-de-las-tareas.png',
    1011: 'assets/img/readings/1011-el-mensaje-dentro-de-la-botella.png',
    1012: 'assets/img/readings/1012-cuando-el-recreo-tambien-ensena.png',
    1013: 'assets/img/readings/1013-la-biblioteca-que-nadie-visitaba.png'
  };

  protected session: ReadingSessionProgress | null = null;
  protected reading: ReadingDetail | null = null;
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
        this.loadReadingDetail(session.readingId);

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

  protected totalQuestionsCount(): number {
    return this.session?.phases.reduce((sum, phase) => sum + phase.totalQuestions, 0) ?? 0;
  }

  protected answeredQuestionsCount(): number {
    return this.session?.phases.reduce((sum, phase) => sum + phase.answeredQuestions, 0) ?? 0;
  }

  protected completedActivitiesCount(): number {
    return this.session?.phases.filter((phase) => phase.answeredQuestions > 0).length ?? 0;
  }

  protected phaseOrder(sequenceOrder?: number | null, displayOrder?: number | null): number {
    return sequenceOrder ?? displayOrder ?? 0;
  }

  protected phaseProgress(phase: PhaseProgress): number {
    const answeredQuestions = phase.questions.filter((question) => question.selectedOptionId !== null);

    if (!answeredQuestions.length) {
      return 0;
    }

    const correctQuestions = answeredQuestions.filter((question) => question.isCorrect === true).length;

    return Math.round((correctQuestions / answeredQuestions.length) * 100);
  }

  protected phaseAccuracyLabel(phase: PhaseProgress): string {
    const answeredQuestions = phase.questions.filter((question) => question.selectedOptionId !== null);

    if (!answeredQuestions.length) {
      return '0% correctas';
    }

    const correctQuestions = answeredQuestions.filter((question) => question.isCorrect === true).length;

    return `${correctQuestions}/${answeredQuestions.length} correctas`;
  }

  protected scoreLabel(score: number | null): string {
    return score === null ? 'Sin puntaje' : `${score}%`;
  }

  protected scoreValue(score: number | null): number {
    return Math.min(100, Math.max(0, score ?? 0));
  }

  protected scoreItems(): ScoreItem[] {
    return [
      { label: 'Literal', value: this.scoreValue(this.session?.literalScore ?? null) },
      { label: 'Inferencial', value: this.scoreValue(this.session?.inferentialScore ?? null) },
      { label: 'Critica', value: this.scoreValue(this.session?.criticalScore ?? null) }
    ];
  }

  protected progressRingBackground(): string {
    const progress = Math.min(100, Math.max(0, this.session?.completionPercentage ?? 0));
    return `conic-gradient(#d6a640 ${progress}%, #eee8da 0)`;
  }

  protected countLabel(value: number | null): string {
    return value === null ? '-' : `${value}`;
  }

  protected statusLabel(status: string): string {
    return status === 'Completed' ? 'Completado' : status;
  }

  protected translatedStatus(status: string | null | undefined): string {
    switch (status) {
      case 'InProgress':
        return 'En progreso';
      case 'Pending':
        return 'Pendiente';
      case 'Completed':
        return 'Completada';
      default:
        return status ?? 'Sin estado';
    }
  }

  protected formatDuration(seconds: number | null | undefined): string {
    const safeSeconds = Math.max(0, seconds ?? 0);
    const minutes = Math.floor(safeSeconds / 60);
    const remainingSeconds = safeSeconds % 60;

    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  protected readingBackground(): string {
    return this.reading?.imageUrl || this.readingBackgrounds[this.session?.readingId ?? 0] || this.defaultReadingBackground;
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

  protected recommendationTitle(): string {
    if (!this.recommendation) {
      return 'Recomendacion pendiente';
    }

    if (this.recommendation.predictedAction === 'Reforzar') {
      return 'Reforzar nivel inferencial';
    }

    return this.recommendation.recommendedAssessmentTitle
      ?? this.recommendation.recommendedDifficultyLevelName
      ?? this.recommendation.predictedAction;
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

  protected openAdaptiveRecommendation(): void {
    const route = this.recommendationPrimaryRoute();

    if (typeof route === 'string') {
      void this.router.navigateByUrl(route);
      return;
    }

    if (Array.isArray(route)) {
      void this.router.navigate(route);
      return;
    }

    // TODO: Route to the dedicated adaptive activity screen when that flow exists.
    void this.router.navigate(['/readings']);
  }

  private loadReadingDetail(readingId: number): void {
    this.readingService.getReadingDetail(readingId).subscribe({
      next: (reading) => {
        this.reading = reading;
      }
    });
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
