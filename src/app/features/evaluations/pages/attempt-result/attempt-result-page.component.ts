import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdaptiveRecommendation } from '../../../../core/models/adaptive-recommendation.models';
import { AdaptiveRecommendationService } from '../../../../core/services/adaptive-recommendation.service';
import { AssessmentAttemptResult, AttemptAnswerResult } from '../../../../core/models/evaluation.models';
import { EvaluationService } from '../../../../core/services/evaluation.service';
import { utcDateInput } from '../../../../core/utils/date-time.utils';

type AnswerFilter = 'all' | 'correct' | 'incorrect' | 'literal' | 'inferential' | 'critical';

interface DimensionSummary {
  key: AnswerFilter;
  name: string;
  score: number;
  description: string;
}

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
  protected activeFilter: AnswerFilter = 'all';

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
      return 'Actividad sugerida no disponible';
    }

    return this.recommendation.recommendedActivityType
      ?? this.recommendation.recommendedAssessmentTitle
      ?? 'Actividad sugerida no disponible';
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

  protected setFilter(filter: AnswerFilter): void {
    this.activeFilter = filter;
  }

  protected filteredAnswers(): AttemptAnswerResult[] {
    const answers = this.result?.answers ?? [];

    switch (this.activeFilter) {
      case 'correct':
        return answers.filter((answer) => answer.isCorrect === true);
      case 'incorrect':
        return answers.filter((answer) => answer.isCorrect === false);
      case 'literal':
      case 'inferential':
      case 'critical':
        return answers.filter((answer) => this.dimensionKey(answer.dimensionName) === this.activeFilter);
      default:
        return answers;
    }
  }

  protected dimensionSummaries(result: AssessmentAttemptResult): DimensionSummary[] {
    return [
      {
        key: 'literal',
        name: 'Literal',
        score: result.literalScore,
        description: 'Identificación de información explícita del texto.'
      },
      {
        key: 'inferential',
        name: 'Inferencial',
        score: result.inferentialScore,
        description: 'Deducción de ideas no expresadas directamente.'
      },
      {
        key: 'critical',
        name: 'Crítica-evaluativa',
        score: result.criticalScore,
        description: 'Valoración y juicio sobre ideas del texto.'
      }
    ];
  }

  protected normalizedScore(score: number | null | undefined): number {
    return Math.max(0, Math.min(100, Number(score ?? 0)));
  }

  protected answeredQuestions(result: AssessmentAttemptResult): number {
    return result.answers.filter((answer) => answer.selectedOptionId !== null).length;
  }

  protected performanceMessage(score: number): string {
    if (score >= 80) {
      return 'Tu resultado refleja un buen dominio de las habilidades de comprensión lectora.';
    }

    if (score >= 50) {
      return 'Tu resultado muestra avances importantes y algunas habilidades por consolidar.';
    }

    return 'Tu resultado muestra que aún necesitas reforzar algunas habilidades de comprensión lectora.';
  }

  protected dimensionStatus(score: number): 'Reforzar' | 'En proceso' | 'Buen avance' {
    if (score >= 80) {
      return 'Buen avance';
    }

    if (score >= 50) {
      return 'En proceso';
    }

    return 'Reforzar';
  }

  protected dimensionStatusClass(score: number): string {
    if (score >= 80) {
      return 'good';
    }

    if (score >= 50) {
      return 'process';
    }

    return 'reinforce';
  }

  protected answerStatusLabel(answer: AttemptAnswerResult): string {
    if (answer.isCorrect === true) {
      return 'Correcta';
    }

    if (answer.isCorrect === false) {
      return 'Incorrecta';
    }

    return 'Sin responder';
  }

  protected resultStatusLabel(status: string): string {
    return status === 'Completed' ? 'Completado' : status;
  }

  protected utcDate(value: string | null | undefined): string | null {
    return utcDateInput(value);
  }

  protected formatSeconds(seconds: number | null | undefined): string {
    const safeSeconds = Math.max(0, Number(seconds ?? 0));
    const minutes = Math.floor(safeSeconds / 60);
    const remainder = safeSeconds % 60;

    if (minutes <= 0) {
      return `${remainder} s`;
    }

    return `${minutes} min ${remainder} s`;
  }

  private dimensionKey(dimensionName: string): AnswerFilter {
    const normalized = dimensionName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

    if (normalized.includes('literal')) {
      return 'literal';
    }

    if (normalized.includes('inferencial')) {
      return 'inferential';
    }

    if (normalized.includes('crit')) {
      return 'critical';
    }

    return 'all';
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
