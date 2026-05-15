import { CommonModule } from '@angular/common';
import { Component, OnDestroy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { ReadingService } from '../../../../core/services/reading.service';
import {
  PhaseProgress,
  ReadingDetail,
  ReadingPhaseQuestion,
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
export class ReadingSessionPageComponent implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly readingService = inject(ReadingService);

  private readonly phaseAnchors: Record<number, number> = {};
  private readonly questionAnchors: Record<number, number> = {};
  private readonly currentQuestionIndexes: Record<number, number> = {};
  private autoSaveTimer: ReturnType<typeof setTimeout> | null = null;
  private autoSaveRequestId = 0;
  private draftLoaded = false;

  protected session: ReadingSessionProgress | null = null;
  protected reading: ReadingDetail | null = null;
  protected loading = true;
  protected busy = false;
  protected errorMessage = '';
  protected successMessage = '';
  protected autoSaveState: 'idle' | 'saving' | 'saved' | 'error' = 'idle';
  protected autoSaveMessage = '';
  protected phaseNotes: Record<number, string> = {};
  protected selectedAnswers: Record<number, number> = {};
  protected answerTimeSeconds: Record<number, number> = {};

  constructor() {
    const attemptId = Number(this.route.snapshot.paramMap.get('attemptId'));
    this.loadSession(attemptId);
  }

  ngOnDestroy(): void {
    this.cancelAutoSave();
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

  protected currentQuestion(): ReadingPhaseQuestion | null {
    const questions = this.currentQuestions();

    return questions[this.currentQuestionIndex()] ?? null;
  }

  protected currentQuestionIndex(): number {
    const currentPhase = this.currentPhase();
    const questions = this.currentQuestions();

    if (!currentPhase || !questions.length) {
      return 0;
    }

    const savedIndex = this.currentQuestionIndexes[currentPhase.phaseId];
    const fallbackIndex = this.firstUnansweredQuestionIndex(questions);
    const index = savedIndex ?? fallbackIndex;

    return Math.min(Math.max(index, 0), questions.length - 1);
  }

  protected questionProgressLabel(): string {
    const totalQuestions = this.currentQuestions().length;

    if (!totalQuestions) {
      return '0/0';
    }

    return `${this.currentQuestionIndex() + 1}/${totalQuestions}`;
  }

  protected canGoToPreviousQuestion(): boolean {
    return this.currentQuestionIndex() > 0;
  }

  protected canGoToNextQuestion(): boolean {
    return this.currentQuestionIndex() < this.currentQuestions().length - 1;
  }

  protected goToPreviousQuestion(): void {
    this.moveCurrentQuestion(-1);
  }

  protected goToNextQuestion(): void {
    this.moveCurrentQuestion(1);
  }

  protected optionLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  protected sessionElapsedLabel(): string {
    return this.formatClock(this.session?.totalTimeSeconds ?? 0);
  }

  protected phaseActivityTitle(phase: PhaseProgress): string {
    switch (phase.code.toLowerCase()) {
      case 'preview':
        return 'Exploracion inicial';
      case 'question':
        return 'Preguntas guia';
      case 'read':
        return 'Lectura atenta';
      case 'reflect':
        return 'Conexion y analisis';
      case 'recite':
        return 'Recuperacion activa';
      case 'review':
        return 'Revision final';
      default:
        return phase.displayName;
    }
  }

  protected phaseIntro(phase: PhaseProgress): string {
    if (phase.guidanceText) {
      return phase.guidanceText;
    }

    switch (phase.code.toLowerCase()) {
      case 'preview':
        return 'Antes de leer, observa la estructura, titulos e imagenes para predecir de que trata el texto.';
      case 'question':
        return 'Formula preguntas que orienten tu lectura y te ayuden a buscar informacion relevante.';
      case 'read':
        return 'Lee con atencion para identificar ideas centrales, detalles y relaciones importantes.';
      case 'reflect':
        return 'Relaciona lo leido con tus conocimientos previos y evalua sus implicancias.';
      case 'recite':
        return 'Explica con tus palabras las ideas principales para comprobar tu comprension.';
      case 'review':
        return 'Revisa tus respuestas y consolida las ideas clave antes de cerrar la sesion.';
      default:
        return this.feedbackForPhase(phase);
    }
  }

  protected questionHeading(question: ReadingPhaseQuestion): string {
    return `Paso ${question.displayOrder}: ${question.dimensionName || 'Actividad'}`;
  }

  protected aiTip(phase: PhaseProgress): string {
    return phase.guidanceText || this.feedbackForPhase(phase);
  }

  protected phaseOrder(phase: PhaseProgress): number {
    return phase.sequenceOrder ?? phase.displayOrder ?? 0;
  }

  protected selectOption(questionId: number, optionId: number): void {
    const currentPhase = this.currentPhase();

    if (!currentPhase || currentPhase.status === 'Completed') {
      return;
    }

    const now = Date.now();
    this.rememberCurrentQuestionIndex(currentPhase);
    this.captureQuestionElapsedTime(questionId, now, true);
    this.selectedAnswers = {
      ...this.selectedAnswers,
      [questionId]: optionId
    };
    this.persistDraft();
    this.scheduleAutoSave(currentPhase.phaseId);
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

    this.cancelAutoSave();
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

  protected saveAndContinue(): void {
    if (this.canGoToNextQuestion()) {
      this.saveProgress();
      this.goToNextQuestion();
      return;
    }

    this.completePhase();
  }

  protected pauseSession(): void {
    const currentPhase = this.currentPhase();

    if (!this.session || this.busy) {
      return;
    }

    if (!currentPhase || currentPhase.status === 'Completed') {
      void this.router.navigate(['/readings']);
      return;
    }

    this.cancelAutoSave();
    this.busy = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload = this.buildPhasePayload(currentPhase.phaseId, false);

    this.readingService.savePhaseProgress(this.session.attemptId, currentPhase.phaseId, payload).subscribe({
      next: (session) => {
        this.syncSession(session);
        this.busy = false;
        void this.router.navigate(['/readings']);
      },
      error: (error) => {
        this.busy = false;
        this.errorMessage = error?.error?.message ?? 'No se pudo pausar la sesion de lectura.';
      }
    });
  }

  protected completePhase(): void {
    const currentPhase = this.currentPhase();

    if (!this.session || !currentPhase || this.busy || currentPhase.status === 'Completed') {
      return;
    }

    this.cancelAutoSave();
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

    this.cancelAutoSave();
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
    return status.toLowerCase().replace(/[^a-z]/g, '');
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

  protected formatSeconds(seconds: number | null | undefined): string {
    return `${seconds ?? 0} s`;
  }

  protected currentPhaseLabel(): string {
    const phase = this.currentPhase();
    return phase ? `${this.phaseOrder(phase)}. ${phase.displayName}` : 'Sin fase activa';
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

  private formatClock(seconds: number): string {
    const safeSeconds = Math.max(0, seconds);
    const minutes = Math.floor(safeSeconds / 60);
    const remainingSeconds = safeSeconds % 60;

    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
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

  private scheduleAutoSave(phaseId: number): void {
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
    }

    const requestId = ++this.autoSaveRequestId;
    this.autoSaveState = 'saving';
    this.autoSaveMessage = 'Guardando...';
    this.autoSaveTimer = setTimeout(() => {
      this.autoSaveTimer = null;
      this.autoSaveProgress(phaseId, requestId);
    }, 650);
  }

  private autoSaveProgress(phaseId: number, requestId: number): void {
    const phase = this.session?.phases.find((item) => item.phaseId === phaseId);

    if (!this.session || !phase || phase.status === 'Completed') {
      return;
    }

    const payload = this.buildPhasePayload(phaseId, false);

    this.readingService.savePhaseProgress(this.session.attemptId, phaseId, payload).subscribe({
      next: (session) => {
        if (requestId !== this.autoSaveRequestId) {
          return;
        }

        this.syncSession(session);
        this.autoSaveState = 'saved';
        this.autoSaveMessage = 'Guardado automáticamente';
      },
      error: () => {
        if (requestId !== this.autoSaveRequestId) {
          return;
        }

        this.autoSaveState = 'error';
        this.autoSaveMessage = 'No se pudo guardar automáticamente';
      }
    });
  }

  private cancelAutoSave(): void {
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }

    this.autoSaveRequestId++;
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
      this.ensureQuestionIndex(currentPhase);
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

  private firstUnansweredQuestionIndex(questions: ReadingPhaseQuestion[]): number {
    const unansweredIndex = questions.findIndex(
      (question) => this.selectedAnswers[question.questionId] === undefined
    );

    return unansweredIndex >= 0 ? unansweredIndex : 0;
  }

  private ensureQuestionIndex(phase: PhaseProgress): void {
    if (!phase.questions.length || this.currentQuestionIndexes[phase.phaseId] !== undefined) {
      return;
    }

    this.currentQuestionIndexes[phase.phaseId] = this.firstUnansweredQuestionIndex(phase.questions);
  }

  private rememberCurrentQuestionIndex(phase: PhaseProgress): void {
    this.currentQuestionIndexes[phase.phaseId] = this.currentQuestionIndex();
  }

  private moveCurrentQuestion(delta: number): void {
    const currentPhase = this.currentPhase();
    const questions = this.currentQuestions();

    if (!currentPhase || !questions.length) {
      return;
    }

    const nextIndex = Math.min(Math.max(this.currentQuestionIndex() + delta, 0), questions.length - 1);
    this.currentQuestionIndexes[currentPhase.phaseId] = nextIndex;
    this.resetQuestionAnchors([questions[nextIndex]], true);
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
