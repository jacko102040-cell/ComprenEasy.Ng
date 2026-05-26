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

const POSTTEST_SUPPORT_TEXTS: Record<string, string> = {
  'leer en tiempos de respuestas rapidas': `LEER EN TIEMPOS DE RESPUESTAS RAPIDAS

Durante mucho tiempo, leer fue imaginado como una actividad silenciosa: una persona frente a un libro, una mesa ordenada y varias horas disponibles. Sin embargo, esa imagen ya no representa por completo la manera en que muchos estudiantes se relacionan con los textos. Hoy se lee en pantallas pequenas, entre notificaciones, enlaces, videos breves y respuestas generadas en segundos. El problema no es que estos cambios sean malos por si mismos, sino que han modificado la forma en que se presta atencion, se interpreta informacion y se decide que merece ser recordado.

En una secundaria de la ciudad, la profesora Elena observo una situacion curiosa. Sus estudiantes podian encontrar rapidamente un dato en internet, pero tenian dificultades para explicar como ese dato se conectaba con una idea mas amplia. Si se les preguntaba por una fecha, respondian con velocidad. Si se les pedia comparar dos posturas o justificar una opinion con evidencias del texto, muchos dudaban. La profesora comprendio que no bastaba con ensenar a buscar informacion; era necesario ensenar a permanecer dentro de una idea el tiempo suficiente para comprenderla.

Por eso, propuso una actividad distinta. Entrego a sus estudiantes un texto sobre el uso de la inteligencia artificial en la educacion. Antes de leerlo, les pidio observar el titulo, anticipar el tema y escribir una pregunta. Durante la lectura, debian subrayar ideas centrales y marcar frases que no entendieran. Despues, tenian que explicar el texto con sus propias palabras, relacionarlo con una experiencia escolar y evaluar si el autor defendia su postura con argumentos suficientes.

Al inicio, varios estudiantes se impacientaron. Algunos preguntaron por que no podian usar un resumen automatico. Otros dijeron que leer paso a paso era mas lento. Elena no rechazo la tecnologia, pero les explico que una herramienta puede acelerar ciertas tareas sin reemplazar el proceso de pensar. Un resumen puede mostrar una ruta, pero no garantiza que el lector haya recorrido el camino. Del mismo modo, una respuesta correcta puede ocultar una comprension debil si el estudiante no sabe explicar por que esa respuesta es adecuada.

Con el paso de las sesiones, los estudiantes empezaron a notar diferencias. Camila, que antes respondia al azar cuando una pregunta parecia dificil, comenzo a volver al texto para revisar pistas. Diego descubrio que sus errores no siempre se debian a falta de memoria, sino a leer sin detenerse en conectores como "sin embargo", "por eso" o "en cambio". Esas palabras, que antes le parecian adornos, funcionaban como senales de direccion dentro del texto. Lucia, por su parte, entendio que opinar no consistia solo en decir "estoy de acuerdo" o "no estoy de acuerdo", sino en explicar razones, reconocer limites y usar evidencias.

La experiencia tambien mostro un punto importante: no todos avanzaban de la misma manera. Algunos mejoraban en preguntas literales porque aprendian a ubicar informacion explicita. Otros progresaban en preguntas inferenciales al relacionar ideas dispersas. Un grupo menor comenzo a destacar en preguntas criticas, especialmente cuando debia evaluar la intencion del autor o la calidad de los argumentos. Para Elena, esa variedad no era un problema, sino una senal de que la comprension lectora no es una sola habilidad simple, sino un conjunto de procesos que se fortalecen con practica guiada.

Al finalizar el proyecto, la profesora no afirmo que leer en pantalla fuera inferior a leer en papel, ni que la tecnologia debiera ser expulsada del aula. Su conclusion fue mas cuidadosa: en una epoca de respuestas rapidas, la escuela debe ensenar a formular mejores preguntas. La velocidad puede ayudar a encontrar informacion, pero la comprension requiere atencion, relacion entre ideas y juicio propio. Leer bien no significa unicamente terminar un texto, sino dialogar con el, detectar sus pistas, reconocer sus silencios y decidir que valor tiene lo que afirma.

Por eso, cuando sus estudiantes le preguntaron si algun dia una maquina podria leer por ellos, Elena respondio que quiza una maquina podria resumir, ordenar o sugerir caminos. Pero comprender, en sentido profundo, seguiria exigiendo algo que ninguna herramienta puede entregar por completo: la decision personal de pensar con paciencia.`
};

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
  protected currentQuestionIndex = 0;

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
    if (this.busy) {
      return;
    }

    const now = Date.now();
    this.captureElapsedTime(questionId, now, true);
    this.selectedAnswers = {
      ...this.selectedAnswers,
      [questionId]: optionId
    };
    this.persistDraft();
    this.saveSelectedAnswerAndAdvance(questionId);
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
    const remoteText =
      this.assessment?.readingContent ??
      this.assessment?.supportText ??
      this.assessment?.readingText ??
      this.assessment?.supportContent ??
      this.assessment?.passage ??
      this.assessment?.sourceText ??
      this.assessment?.text ??
      this.assessment?.content;

    if (remoteText?.trim()) {
      return remoteText;
    }

    return this.localPosttestSupportText();
  }

  protected currentQuestion() {
    return this.assessment?.questions[this.currentQuestionIndex] ?? null;
  }

  protected currentQuestionNumber(): number {
    return this.currentQuestionIndex + 1;
  }

  protected totalQuestions(): number {
    return this.assessment?.questions.length ?? 0;
  }

  protected attemptProgress(): number {
    const total = this.totalQuestions();

    if (!total) {
      return 0;
    }

    return (this.currentQuestionNumber() / total) * 100;
  }

  protected canGoPrevious(): boolean {
    return this.currentQuestionIndex > 0;
  }

  protected canGoNext(): boolean {
    return this.currentQuestionIndex < this.totalQuestions() - 1;
  }

  protected previousQuestion(): void {
    if (this.canGoPrevious()) {
      this.currentQuestionIndex -= 1;
    }
  }

  protected nextQuestion(): void {
    if (this.canGoNext()) {
      this.currentQuestionIndex += 1;
    }
  }

  protected optionLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  protected displaySupportText(): string {
    return this.supportText() ?? 'Texto de apoyo no disponible para esta evaluacion.';
  }

  protected timeRemainingLabel(): string {
    return '29:45';
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

  private ensureAttemptForAutosave(nextStep: () => void): void {
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
        nextStep();
      },
      error: (error) => {
        this.busy = false;
        this.errorMessage = error?.error?.message ?? 'No se pudo iniciar el intento.';
      }
    });
  }

  private saveSelectedAnswerAndAdvance(questionId: number): void {
    this.ensureAttemptForAutosave(() => {
      const answer = this.buildAnswerPayloadForQuestion(questionId);

      if (!answer) {
        this.busy = false;
        return;
      }

      this.busy = true;
      this.errorMessage = '';
      this.successMessage = '';

      this.evaluationService.saveAnswers(this.attemptId!, { answers: [answer] }).subscribe({
        next: () => {
          this.commitSyncedAnswerTimes([answer]);
          this.busy = false;

          if (this.canGoNext()) {
            this.nextQuestion();
          }
        },
        error: (error) => {
          this.busy = false;
          this.errorMessage = error?.error?.message ?? 'No se pudo guardar la respuesta.';
        }
      });
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

  private buildAnswerPayloadForQuestion(questionId: number): SaveAttemptAnswerItem | null {
    const selectedOptionId = this.selectedAnswers[questionId];

    if (!selectedOptionId) {
      return null;
    }

    const now = Date.now();
    const accumulated = this.answerTimeSeconds[questionId] ?? 0;
    const anchor = this.answerAnchors[questionId] ?? now;
    const deltaSeconds = Math.max(0, Math.floor((now - anchor) / 1000));

    return {
      questionId,
      selectedOptionId,
      answerTimeSeconds: accumulated + deltaSeconds
    };
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

  private localPosttestSupportText(): string | null {
    const title = this.assessment?.title ?? this.assessment?.readingTitle ?? '';
    const normalizedTitle = this.normalizeTextKey(title);

    return POSTTEST_SUPPORT_TEXTS[normalizedTitle] ?? null;
  }

  private normalizeTextKey(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }
}
