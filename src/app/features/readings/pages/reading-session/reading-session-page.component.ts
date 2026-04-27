import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { ReadingService } from '../../../../core/services/reading.service';
import {
  PhaseProgress,
  ReadingPhaseQuestion,
  ReadingDetail,
  ReadingSessionProgress,
  SaveReadingPhaseAnswerItem,
  SaveReadingPhaseProgressRequest
} from '../../../../core/models/reading.models';

interface ReadingSessionDraftState {
  phaseNotes: Record<number, string>;
  selectedAnswers: Record<number, number>;
  answerTimeSeconds: Record<number, number>;
}

@Component({
  selector: 'app-reading-session-page',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './reading-session-page.component.html',
  styleUrl: './reading-session-page.component.css'
})
export class ReadingSessionPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly readingService = inject(ReadingService);

  private readonly phaseAnchors: Record<number, number> = {};
  private readonly questionAnchors: Record<number, number> = {};
  private draftLoaded = false;

  protected session: ReadingSessionProgress | null = null;
  protected reading: ReadingDetail | null = null;
  protected loading = true;
  protected busy = false;
  protected errorMessage = '';
  protected successMessage = '';
  protected phaseNotes: Record<number, string> = {};
  protected selectedAnswers: Record<number, number> = {};
  protected answerTimeSeconds: Record<number, number> = {};

  constructor() {
    const attemptId = Number(this.route.snapshot.paramMap.get('attemptId'));
    this.loadSession(attemptId);
  }

  protected currentPhase(): PhaseProgress | null {
    if (!this.session) {
      return null;
    }

    return (
      this.session.phases.find((phase) => phase.phaseId === this.session?.currentPhaseId) ??
      this.session.phases.find((phase) => phase.status !== 'Completed') ??
      null
    );
  }

  protected currentNote(): string {
    const currentPhase = this.currentPhase();
    return currentPhase ? this.phaseNotes[currentPhase.phaseId] ?? '' : '';
  }

  protected currentQuestions(): ReadingPhaseQuestion[] {
    return this.currentPhase()?.questions ?? [];
  }

  protected phaseOrder(phase: PhaseProgress): number {
    return phase.sequenceOrder ?? phase.displayOrder ?? 0;
  }

  protected selectOption(questionId: number, optionId: number): void {
    const now = Date.now();
    this.captureQuestionElapsedTime(questionId, now, true);
    this.selectedAnswers = {
      ...this.selectedAnswers,
      [questionId]: optionId
    };
    this.persistDraft();
  }

  protected isSelected(questionId: number, optionId: number): boolean {
    return this.selectedAnswers[questionId] === optionId;
  }

  protected answeredQuestionsForPhase(phase: PhaseProgress): number {
    const localAnswered = phase.questions.filter(
      (question) => this.selectedAnswers[question.questionId] !== undefined
    ).length;

    return Math.max(phase.answeredQuestions, localAnswered);
  }

  protected phaseRequirementMessage(phase: PhaseProgress): string {
    if (!phase.totalQuestions || !phase.minQuestionsToUnlockNext) {
      return '';
    }

    return `Responde al menos ${phase.minQuestionsToUnlockNext} de ${phase.totalQuestions} preguntas para completar esta fase con seguridad.`;
  }

  protected isPhaseBelowMinimum(phase: PhaseProgress): boolean {
    if (!phase.totalQuestions || !phase.minQuestionsToUnlockNext) {
      return false;
    }

    return this.answeredQuestionsForPhase(phase) < phase.minQuestionsToUnlockNext;
  }

  protected questionStateLabel(question: ReadingPhaseQuestion): string {
    if (question.isCorrect === true) {
      return 'Correcta';
    }

    if (question.isCorrect === false) {
      return 'Incorrecta';
    }

    if (this.selectedAnswers[question.questionId] !== undefined) {
      return 'Seleccionada';
    }

    return 'Pendiente';
  }

  protected questionStateClass(question: ReadingPhaseQuestion): string {
    if (question.isCorrect === true) {
      return 'correct';
    }

    if (question.isCorrect === false) {
      return 'incorrect';
    }

    return this.selectedAnswers[question.questionId] !== undefined ? 'selected' : 'pending';
  }

  protected questionTime(question: ReadingPhaseQuestion): number {
    return this.answerTimeSeconds[question.questionId] ?? question.answerTimeSeconds ?? 0;
  }

  protected hasQuestions(phase: PhaseProgress): boolean {
    return phase.totalQuestions > 0 && phase.questions.length > 0;
  }

  protected onNoteChange(note: string): void {
    const currentPhase = this.currentPhase();

    if (!currentPhase) {
      return;
    }

    this.phaseNotes = {
      ...this.phaseNotes,
      [currentPhase.phaseId]: note
    };

    this.persistDraft();
  }

  protected saveProgress(): void {
    const currentPhase = this.currentPhase();

    if (!this.session || !currentPhase || this.busy || currentPhase.status === 'Completed') {
      return;
    }

    this.busy = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload = this.buildPhasePayload(currentPhase.phaseId, false);

    this.readingService.savePhaseProgress(this.session.attemptId, currentPhase.phaseId, payload).subscribe({
      next: (session) => {
        this.syncSession(session);
        this.busy = false;
        this.successMessage = `Avance guardado en ${currentPhase.displayName}.`;
      },
      error: (error) => {
        this.busy = false;
        this.errorMessage = error?.error?.message ?? 'No se pudo guardar el progreso de la fase.';
      }
    });
  }

  protected completePhase(): void {
    const currentPhase = this.currentPhase();

    if (!this.session || !currentPhase || this.busy || currentPhase.status === 'Completed') {
      return;
    }

    this.busy = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload = this.buildPhasePayload(currentPhase.phaseId, true);

    this.readingService.completePhase(this.session.attemptId, currentPhase.phaseId, payload).subscribe({
      next: (session) => {
        this.phaseNotes = {
          ...this.phaseNotes,
          [currentPhase.phaseId]: ''
        };

        this.syncSession(session);
        this.busy = false;
        this.successMessage = `${currentPhase.displayName} completada.`;
      },
      error: (error) => {
        this.busy = false;
        this.errorMessage = this.mapPhaseCompletionError(currentPhase, error);
      }
    });
  }

  protected finishSession(): void {
    if (!this.session || this.busy) {
      return;
    }

    this.busy = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.readingService.finishReadingSession(this.session.attemptId).subscribe({
      next: (session) => {
        this.clearDraft();
        this.busy = false;
        void this.router.navigate(['/reading-sessions', session.attemptId, 'result']);
      },
      error: (error) => {
        this.busy = false;
        this.errorMessage = error?.error?.message ?? 'No se pudo finalizar la sesión de lectura.';
      }
    });
  }

  protected phaseStatusClass(status: string): string {
    return status.toLowerCase();
  }

  protected canFinishSession(): boolean {
    return (
      this.session?.phases.every((phase) => !phase.isRequired || phase.status === 'Completed') ?? false
    );
  }

  protected progressWidth(): string {
    return `${this.session?.completionPercentage ?? 0}%`;
  }

  protected feedbackForPhase(phase: PhaseProgress): string {
    if (phase.status === 'Completed') {
      return 'Fase completada. Puedes revisar la siguiente fase o finalizar si ya cerraste las obligatorias.';
    }

    if (this.session?.currentPhaseId === phase.phaseId) {
      return phase.guidanceText || 'Fase activa. Registra tu avance y complétala cuando termines.';
    }

    if (phase.status === 'Pending') {
      return phase.isRequired
        ? 'Esta fase sigue pendiente y forma parte del recorrido obligatorio.'
        : 'Esta fase es opcional y puedes dejarla pendiente si ya completaste las obligatorias.';
    }

    return phase.guidanceText || 'Fase en progreso.';
  }

  private mapPhaseCompletionError(phase: PhaseProgress, error: unknown): string {
    const backendMessage =
      (error as { error?: { message?: string } })?.error?.message ?? 'No se pudo completar la fase actual.';
    const normalizedMessage = backendMessage.toLowerCase();

    if (normalizedMessage.includes('min') || normalizedMessage.includes('minimum')) {
      return this.phaseRequirementMessage(phase) || backendMessage;
    }

    if (this.isPhaseBelowMinimum(phase)) {
      return this.phaseRequirementMessage(phase) || backendMessage;
    }

    return backendMessage;
  }

  private loadSession(attemptId: number): void {
    this.readingService.getReadingSession(attemptId).subscribe({
      next: (session) => {
        this.syncSession(session);
        this.loading = false;

        if (!this.reading || this.reading.readingId !== session.readingId) {
          this.loadReadingDetail(session.readingId);
        }
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error?.error?.message ?? 'No se pudo cargar la sesión de lectura.';
      }
    });
  }

  private loadReadingDetail(readingId: number): void {
    this.readingService.getReadingDetail(readingId).subscribe({
      next: (reading) => {
        this.reading = reading;
      }
    });
  }

  private syncSession(session: ReadingSessionProgress): void {
    const previousCurrentPhaseId = this.session?.currentPhaseId ?? null;
    this.session = session;

    if (!this.draftLoaded) {
      const draft = this.readDraft();
      this.phaseNotes = draft?.phaseNotes ?? {};
      this.selectedAnswers = draft?.selectedAnswers ?? {};
      this.answerTimeSeconds = draft?.answerTimeSeconds ?? {};
      this.draftLoaded = true;
    }

    this.applySavedAnswersFromSession(session);

    if (session.sessionStatus === 'Completed') {
      this.clearDraft();
      void this.router.navigate(['/reading-sessions', session.attemptId, 'result']);
      return;
    }

    const currentPhase = this.currentPhase();

    if (currentPhase && currentPhase.phaseId !== previousCurrentPhaseId) {
      this.phaseAnchors[currentPhase.phaseId] = Date.now();
    } else if (currentPhase && !this.phaseAnchors[currentPhase.phaseId]) {
      this.phaseAnchors[currentPhase.phaseId] = Date.now();
    }

    if (currentPhase) {
      this.resetQuestionAnchors(currentPhase.questions, true);
    }

    this.persistDraft();
  }

  private buildPhasePayload(
    phaseId: number,
    requireMinimumOneSecond: boolean
  ): SaveReadingPhaseProgressRequest {
    const rawNote = this.phaseNotes[phaseId]?.trim();

    return {
      timeSpentSeconds: this.captureElapsedSeconds(phaseId, requireMinimumOneSecond),
      progressNote: rawNote ? rawNote : null,
      answers: this.buildAnswerPayload(phaseId)
    };
  }

  private buildAnswerPayload(phaseId: number): SaveReadingPhaseAnswerItem[] {
    const now = Date.now();
    const phaseQuestions = this.session?.phases.find((phase) => phase.phaseId === phaseId)?.questions ?? [];

    return phaseQuestions
      .filter((question) => this.selectedAnswers[question.questionId] !== undefined)
      .map((question) => {
        const accumulated = this.answerTimeSeconds[question.questionId] ?? 0;
        const anchor = this.questionAnchors[question.questionId] ?? now;
        const deltaSeconds = Math.max(0, Math.floor((now - anchor) / 1000));
        const selectedOptionId = this.selectedAnswers[question.questionId]!;

        return {
          questionId: question.questionId,
          selectedOptionId,
          answerTimeSeconds: accumulated + deltaSeconds
        };
      });
  }

  private captureElapsedSeconds(phaseId: number, requireMinimumOneSecond: boolean): number {
    const now = Date.now();
    const anchor = this.phaseAnchors[phaseId] ?? now;
    const elapsedSeconds = Math.floor((now - anchor) / 1000);
    const safeSeconds = requireMinimumOneSecond
      ? Math.max(1, elapsedSeconds)
      : Math.max(0, elapsedSeconds);

    this.phaseAnchors[phaseId] = now;
    return safeSeconds;
  }

  private captureQuestionElapsedTime(
    questionId: number,
    now: number,
    requireMinimumOneSecond: boolean
  ): void {
    const anchor = this.questionAnchors[questionId] ?? now;
    const elapsedSeconds = Math.ceil((now - anchor) / 1000);
    const safeSeconds = requireMinimumOneSecond ? Math.max(1, elapsedSeconds) : Math.max(0, elapsedSeconds);

    this.answerTimeSeconds = {
      ...this.answerTimeSeconds,
      [questionId]: (this.answerTimeSeconds[questionId] ?? 0) + safeSeconds
    };

    this.questionAnchors[questionId] = now;
  }

  private resetQuestionAnchors(questions: ReadingPhaseQuestion[], forceReset: boolean): void {
    const now = Date.now();

    for (const question of questions) {
      if (forceReset || !this.questionAnchors[question.questionId]) {
        this.questionAnchors[question.questionId] = now;
      }
    }
  }

  private applySavedAnswersFromSession(session: ReadingSessionProgress): void {
    const selectedAnswers: Record<number, number> = {};
    const answerTimeSeconds: Record<number, number> = {};

    for (const phase of session.phases) {
      for (const question of phase.questions) {
        if (question.selectedOptionId !== null) {
          selectedAnswers[question.questionId] = question.selectedOptionId;
        }

        if ((question.answerTimeSeconds ?? 0) > 0) {
          answerTimeSeconds[question.questionId] = question.answerTimeSeconds ?? 0;
        }
      }
    }

    this.selectedAnswers = {
      ...this.selectedAnswers,
      ...selectedAnswers
    };
    this.answerTimeSeconds = {
      ...this.answerTimeSeconds,
      ...answerTimeSeconds
    };
  }

  private persistDraft(): void {
    if (!this.session) {
      return;
    }

    const draft: ReadingSessionDraftState = {
      phaseNotes: this.phaseNotes,
      selectedAnswers: this.selectedAnswers,
      answerTimeSeconds: this.answerTimeSeconds
    };

    localStorage.setItem(this.getDraftStorageKey(), JSON.stringify(draft));
  }

  private readDraft(): ReadingSessionDraftState | null {
    if (!this.session) {
      return null;
    }

    const rawDraft = localStorage.getItem(this.getDraftStorageKey());

    if (!rawDraft) {
      return null;
    }

    try {
      return JSON.parse(rawDraft) as ReadingSessionDraftState;
    } catch {
      localStorage.removeItem(this.getDraftStorageKey());
      return null;
    }
  }

  private clearDraft(): void {
    if (this.session) {
      localStorage.removeItem(this.getDraftStorageKey());
    }
  }

  private getDraftStorageKey(): string {
    const userId = this.authService.currentUser()?.userId ?? 0;
    return `reading-adaptive:reading-session:${userId}:${this.session!.attemptId}`;
  }
}
