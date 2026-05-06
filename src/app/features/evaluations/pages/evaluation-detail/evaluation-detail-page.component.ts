import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { EvaluationService } from '../../../../core/services/evaluation.service';
import {
  AssessmentAttemptResult,
  AssessmentDetail,
  SaveAttemptAnswerItem
} from '../../../../core/models/evaluation.models';

interface EvaluationDraftState {
  attemptId: number | null;
  attemptStatus: string;
  selectedAnswers: Record<number, number>;
  answerTimeSeconds: Record<number, number>;
}

@Component({
  selector: 'app-evaluation-detail-page',
  imports: [CommonModule, RouterLink],
  templateUrl: './evaluation-detail-page.component.html',
  styleUrl: './evaluation-detail-page.component.css'
})
export class EvaluationDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly evaluationService = inject(EvaluationService);

  private readonly answerAnchors: Record<number, number> = {};

  protected assessment: AssessmentDetail | null = null;
  protected loading = true;
  protected busy = false;
  protected attemptId: number | null = null;
  protected attemptStatus = '';
  protected errorMessage = '';
  protected successMessage = '';
  protected selectedAnswers: Record<number, number> = {};
  protected answerTimeSeconds: Record<number, number> = {};

  constructor() {
    const assessmentId = Number(this.route.snapshot.paramMap.get('assessmentId'));

    this.evaluationService.getAssessmentDetail(assessmentId).subscribe({
      next: (assessment) => {
        this.assessment = assessment;
        this.restoreDraft();
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error?.error?.message ?? 'No se pudo cargar la evaluación.';
      }
    });
  }

  protected startAttempt(): void {
    if (!this.assessment || this.busy) {
      return;
    }

    this.busy = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.evaluationService.startAttempt(this.assessment.assessmentId).subscribe({
      next: (attempt) => {
        this.attemptId = attempt.attemptId;
        this.attemptStatus = attempt.status;
        this.persistDraft();

        this.syncAttemptFromBackend(
          attempt.attemptId,
          `Intento #${attempt.attemptNumber} listo para responder.`
        );
      },
      error: (error) => {
        this.busy = false;
        this.errorMessage = error?.error?.message ?? 'No se pudo iniciar el intento.';
      }
    });
  }

  protected selectOption(questionId: number, optionId: number): void {
    const now = Date.now();
    this.captureElapsedTime(questionId, now, true);
    this.selectedAnswers = {
      ...this.selectedAnswers,
      [questionId]: optionId
    };
    this.persistDraft();
  }

  protected isSelected(questionId: number, optionId: number): boolean {
    return this.selectedAnswers[questionId] === optionId;
  }

  protected saveProgress(): void {
    if (this.busy) {
      return;
    }

    this.ensureAttempt(() => {
      const answers = this.buildAnswerPayload();

      if (!answers.length) {
        this.errorMessage = 'Selecciona al menos una respuesta antes de guardar.';
        return;
      }

      this.busy = true;
      this.errorMessage = '';
      this.successMessage = '';

      this.evaluationService.saveAnswers(this.attemptId!, { answers }).subscribe({
        next: (response) => {
          this.commitSyncedAnswerTimes(answers);
          this.busy = false;
          this.successMessage =
            `Avance guardado. ${response.answeredQuestions}/${response.totalQuestions} preguntas respondidas.`;
        },
        error: (error) => {
          this.busy = false;
          this.errorMessage = error?.error?.message ?? 'No se pudo guardar el avance.';
        }
      });
    });
  }

  protected submitAttempt(): void {
    if (this.busy) {
      return;
    }

    if (!this.canSubmitAttempt()) {
      this.successMessage = '';
      this.errorMessage = this.incompleteAttemptMessage();
      return;
    }

    this.ensureAttempt(() => {
      const answers = this.buildAnswerPayload();
      const finalizeAttempt = () => {
        this.evaluationService.finishAttempt(this.attemptId!).subscribe({
          next: (result) => {
            this.clearDraft();
            this.busy = false;
            void this.router.navigate(['/attempts', result.attemptId, 'result']);
          },
          error: (error) => {
            this.busy = false;
            this.errorMessage = error?.error?.message ?? 'No se pudo finalizar el intento.';
          }
        });
      };

      this.busy = true;
      this.errorMessage = '';
      this.successMessage = '';

      if (!answers.length) {
        finalizeAttempt();
        return;
      }

      this.evaluationService.saveAnswers(this.attemptId!, { answers }).subscribe({
        next: () => {
          this.commitSyncedAnswerTimes(answers);
          finalizeAttempt();
        },
        error: (error) => {
          this.busy = false;
          this.errorMessage = error?.error?.message ?? 'No se pudieron guardar las respuestas.';
        }
      });
    });
  }

  protected answeredCount(): number {
    return Object.keys(this.selectedAnswers).length;
  }

  protected remainingQuestionsCount(): number {
    if (!this.assessment) {
      return 0;
    }

    return Math.max(0, this.assessment.questions.length - this.answeredCount());
  }

  protected canSubmitAttempt(): boolean {
    return this.remainingQuestionsCount() === 0;
  }

  protected incompleteAttemptMessage(): string {
    const remaining = this.remainingQuestionsCount();

    if (remaining <= 0) {
      return '';
    }

    return `Debes responder todas las preguntas antes de finalizar. Faltan ${remaining} pregunta${remaining === 1 ? '' : 's'}.`;
  }

  protected supportText(): string | null {
    const text =
      this.assessment?.readingContent ??
      this.assessment?.supportText ??
      this.assessment?.content ??
      this.assessment?.description;

    return text?.trim() ? text : null;
  }

  private ensureAttempt(nextStep: () => void): void {
    if (this.attemptId) {
      nextStep();
      return;
    }

    if (!this.assessment) {
      return;
    }

    this.busy = true;
    this.errorMessage = '';

    this.evaluationService.startAttempt(this.assessment.assessmentId).subscribe({
      next: (attempt) => {
        this.attemptId = attempt.attemptId;
        this.attemptStatus = attempt.status;
        this.persistDraft();

        this.syncAttemptFromBackend(attempt.attemptId, undefined, nextStep);
      },
      error: (error) => {
        this.busy = false;
        this.errorMessage = error?.error?.message ?? 'No se pudo iniciar el intento.';
      }
    });
  }

  private syncAttemptFromBackend(
    attemptId: number,
    successMessage?: string,
    nextStep?: () => void
  ): void {
    this.evaluationService.getAttemptResult(attemptId).subscribe({
      next: (result) => {
        if (result.status === 'Completed') {
          this.clearDraft();
          this.busy = false;
          void this.router.navigate(['/attempts', result.attemptId, 'result']);
          return;
        }

        this.applyAttemptSnapshot(result);
        this.busy = false;

        if (result.answers.some((answer) => answer.selectedOptionId !== null)) {
          this.successMessage = successMessage ?? 'Se restauró tu avance guardado.';
        } else if (successMessage) {
          this.successMessage = successMessage;
        }

        nextStep?.();
      },
      error: (error) => {
        if (error?.status === 403 || error?.status === 404) {
          this.attemptId = null;
          this.attemptStatus = '';
          this.clearDraft();
        } else {
          this.persistDraft();
        }

        this.busy = false;
        nextStep?.();
      }
    });
  }

  private applyAttemptSnapshot(result: AssessmentAttemptResult): void {
    this.attemptId = result.attemptId;
    this.attemptStatus = result.status;

    const selectedAnswers: Record<number, number> = {};
    const answerTimeSeconds: Record<number, number> = {};

    for (const answer of result.answers) {
      if (answer.selectedOptionId !== null) {
        selectedAnswers[answer.questionId] = answer.selectedOptionId;
      }

      if (answer.answerTimeSeconds > 0) {
        answerTimeSeconds[answer.questionId] = answer.answerTimeSeconds;
      }
    }

    this.selectedAnswers = selectedAnswers;
    this.answerTimeSeconds = answerTimeSeconds;
    this.resetAnchors();
    this.persistDraft();
  }

  private restoreDraft(): void {
    const draft = this.readDraft();

    if (!draft) {
      this.resetAnchors();
      return;
    }

    this.attemptId = draft.attemptId;
    this.attemptStatus = draft.attemptStatus;
    this.selectedAnswers = draft.selectedAnswers;
    this.answerTimeSeconds = draft.answerTimeSeconds;
    this.resetAnchors();

    if (draft.attemptId) {
      this.busy = true;
      this.syncAttemptFromBackend(draft.attemptId, 'Se restauró tu avance guardado.');
    }
  }

  private buildAnswerPayload(): SaveAttemptAnswerItem[] {
    const now = Date.now();

    return Object.entries(this.selectedAnswers).map(([questionIdText, selectedOptionId]) => {
      const questionId = Number(questionIdText);
      const accumulated = this.answerTimeSeconds[questionId] ?? 0;
      const anchor = this.answerAnchors[questionId] ?? now;
      const deltaSeconds = Math.max(0, Math.floor((now - anchor) / 1000));

      return {
        questionId,
        selectedOptionId,
        answerTimeSeconds: accumulated + deltaSeconds
      };
    });
  }

  private commitSyncedAnswerTimes(answers: SaveAttemptAnswerItem[]): void {
    const now = Date.now();

    for (const answer of answers) {
      this.answerTimeSeconds[answer.questionId] = answer.answerTimeSeconds;
      this.answerAnchors[answer.questionId] = now;
    }

    this.persistDraft();
  }

  private captureElapsedTime(questionId: number, now: number, requireMinimumOneSecond: boolean): void {
    const anchor = this.answerAnchors[questionId] ?? now;
    const elapsedSeconds = Math.ceil((now - anchor) / 1000);
    const safeSeconds = requireMinimumOneSecond ? Math.max(1, elapsedSeconds) : Math.max(0, elapsedSeconds);

    this.answerTimeSeconds[questionId] = (this.answerTimeSeconds[questionId] ?? 0) + safeSeconds;
    this.answerAnchors[questionId] = now;
  }

  private resetAnchors(): void {
    if (!this.assessment) {
      return;
    }

    const now = Date.now();

    for (const question of this.assessment.questions) {
      this.answerAnchors[question.questionId] = now;
    }
  }

  private persistDraft(): void {
    if (!this.assessment) {
      return;
    }

    const draft: EvaluationDraftState = {
      attemptId: this.attemptId,
      attemptStatus: this.attemptStatus,
      selectedAnswers: this.selectedAnswers,
      answerTimeSeconds: this.answerTimeSeconds
    };

    localStorage.setItem(this.getDraftStorageKey(), JSON.stringify(draft));
  }

  private readDraft(): EvaluationDraftState | null {
    if (!this.assessment) {
      return null;
    }

    const rawDraft = localStorage.getItem(this.getDraftStorageKey());

    if (!rawDraft) {
      return null;
    }

    try {
      return JSON.parse(rawDraft) as EvaluationDraftState;
    } catch {
      localStorage.removeItem(this.getDraftStorageKey());
      return null;
    }
  }

  private clearDraft(): void {
    if (this.assessment) {
      localStorage.removeItem(this.getDraftStorageKey());
    }
  }

  private getDraftStorageKey(): string {
    const userId = this.authService.currentUser()?.userId ?? 0;
    return `reading-adaptive:draft:${userId}:${this.assessment!.assessmentId}`;
  }
}
