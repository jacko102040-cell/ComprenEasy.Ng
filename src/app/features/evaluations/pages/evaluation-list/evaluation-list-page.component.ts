import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { AcademicFlowSummary } from '../../../../core/models/academic-flow.models';
import { EvaluationService } from '../../../../core/services/evaluation.service';
import { ActiveAssessment } from '../../../../core/models/evaluation.models';
import { ReadingProgressSummary } from '../../../../core/models/reading.models';
import { AcademicFlowService } from '../../../../core/services/academic-flow.service';
import { ReadingService } from '../../../../core/services/reading.service';

@Component({
  selector: 'app-evaluation-list-page',
  imports: [CommonModule, RouterLink],
  templateUrl: './evaluation-list-page.component.html',
  styleUrl: './evaluation-list-page.component.css'
})
export class EvaluationListPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly evaluationService = inject(EvaluationService);
  private readonly academicFlowService = inject(AcademicFlowService);
  private readonly readingService = inject(ReadingService);

  protected title = '';
  protected assessments: ActiveAssessment[] = [];
  protected flowSummary: AcademicFlowSummary | null = null;
  protected readingProgress: ReadingProgressSummary | null = null;
  protected loading = true;
  protected errorMessage = '';
  protected isPosttestView = false;

  constructor() {
    const assessmentType = this.route.snapshot.data['assessmentType'] as string;
    this.title = this.route.snapshot.data['title'] as string;
    this.isPosttestView = assessmentType === 'Posttest';

    if (this.isPosttestView) {
      this.loadPosttestView();
      return;
    }

    this.evaluationService.getActivePretests().subscribe({
      next: (items) => {
        this.assessments = items;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error?.error?.message ?? 'No se pudieron cargar las evaluaciones.';
      }
    });
  }

  protected posttestAssessment(): ActiveAssessment | null {
    return this.assessments[0] ?? null;
  }

  protected posttestTitle(): string {
    const assessment = this.posttestAssessment();

    return this.displayEvaluationLabel(
      assessment?.readingTitle?.trim() || assessment?.title || '[Seed Flow] Evaluacion Final'
    );
  }

  protected posttestDescription(): string {
    return this.displayEvaluationLabel(
      this.posttestAssessment()?.description ||
        'Evaluacion activa para validar el cierre del flujo academico y certificar tu progreso en las dimensiones de comprension lectora.'
    );
  }

  protected canStartPosttest(): boolean {
    return !!this.posttestAssessment() && (this.flowSummary?.canAccessPosttest ?? true);
  }

  protected posttestUnavailableMessage(): string {
    if (!this.posttestAssessment()) {
      return 'Completa tus lecturas PQ4R para habilitar la evaluacion final.';
    }

    return 'Completa las lecturas requeridas para habilitar la evaluacion final.';
  }

  protected scoreLabel(value: number | null | undefined): string {
    return `${(value ?? 0).toFixed(1)}%`;
  }

  protected questionCount(): number {
    return this.posttestAssessment()?.questionCount || 6;
  }

  private loadPosttestView(): void {
    forkJoin({
      assessments: this.evaluationService.getActivePosttests(),
      flow: this.academicFlowService
        .getCurrentSummary()
        .pipe(catchError(() => of<AcademicFlowSummary | null>(null))),
      progress: this.readingService
        .getReadingProgress()
        .pipe(catchError(() => of<ReadingProgressSummary | null>(null)))
    }).subscribe({
      next: ({ assessments, flow, progress }) => {
        this.assessments = assessments;
        this.flowSummary = flow;
        this.readingProgress = progress;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error?.error?.message ?? 'No se pudo cargar la evaluacion final.';
      }
    });
  }

  private displayEvaluationLabel(value: string): string {
    return value.replace(/post[-\s]?test|postest/gi, 'Evaluacion final');
  }
}
