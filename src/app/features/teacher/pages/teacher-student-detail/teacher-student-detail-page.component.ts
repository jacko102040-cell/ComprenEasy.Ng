import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdaptiveRecommendation } from '../../../../core/models/adaptive-recommendation.models';
import {
  CreateTeacherCommentRequest,
  ResetStudentPasswordResult,
  TeacherCommentTag,
  TeacherStudentAssessmentAttempt,
  TeacherStudentComment,
  TeacherStudentDetail,
  TeacherStudentReadingSession
} from '../../../../core/models/teacher-panel.models';
import { TeacherPanelService } from '../../../../core/services/teacher-panel.service';

@Component({
  selector: 'app-teacher-student-detail-page',
  imports: [CommonModule, FormsModule, RouterLink, DatePipe, DecimalPipe],
  templateUrl: './teacher-student-detail-page.component.html',
  styleUrl: './teacher-student-detail-page.component.css'
})
export class TeacherStudentDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly teacherPanelService = inject(TeacherPanelService);

  protected student: TeacherStudentDetail | null = null;
  protected loading = true;
  protected resettingPassword = false;
  protected savingComment = false;
  protected errorMessage = '';
  protected resetErrorMessage = '';
  protected commentErrorMessage = '';
  protected resetResult: ResetStudentPasswordResult | null = null;
  protected commentSuccessMessage = '';

  protected selectedTagId: number | null = null;
  protected selectedAttemptId: number | null = null;
  protected commentText = '';

  constructor() {
    const studentId = Number(this.route.snapshot.paramMap.get('studentId'));
    this.loadStudent(studentId);
  }

  protected resetPassword(): void {
    if (!this.student || this.resettingPassword) {
      return;
    }

    this.resettingPassword = true;
    this.resetErrorMessage = '';
    this.resetResult = null;

    this.teacherPanelService.resetStudentPassword(this.student.studentId).subscribe({
      next: (result) => {
        this.resetResult = result;
        this.resettingPassword = false;
      },
      error: (error) => {
        this.resettingPassword = false;
        this.resetErrorMessage =
          error?.error?.message ?? 'No se pudo reiniciar la contraseña del estudiante.';
      }
    });
  }

  protected saveComment(): void {
    if (!this.student || this.savingComment || !this.selectedTagId || !this.commentText.trim()) {
      return;
    }

    this.savingComment = true;
    this.commentErrorMessage = '';
    this.commentSuccessMessage = '';

    const payload: CreateTeacherCommentRequest = {
      attemptId: this.selectedAttemptId,
      commentTagId: this.selectedTagId,
      commentText: this.commentText.trim()
    };

    this.teacherPanelService.addComment(this.student.studentId, payload).subscribe({
      next: () => {
        this.savingComment = false;
        this.commentText = '';
        this.selectedAttemptId = null;
        this.commentSuccessMessage = 'Comentario registrado correctamente.';
        this.loadStudent(this.student!.studentId, true);
      },
      error: (error) => {
        this.savingComment = false;
        this.commentErrorMessage =
          error?.error?.message ?? 'No se pudo guardar el comentario del docente.';
      }
    });
  }

  protected attemptOptions(): Array<{ label: string; value: number }> {
    if (!this.student) {
      return [];
    }

    const evaluationOptions = this.student.evaluationAttempts.map((attempt) => ({
      value: attempt.attemptId,
      label: `Evaluación #${attempt.attemptId} · ${attempt.assessmentTitle}`
    }));

    const readingOptions = this.student.readingSessions.map((session) => ({
      value: session.attemptId,
      label: `Lectura #${session.attemptId} · ${session.readingTitle}`
    }));

    return [...evaluationOptions, ...readingOptions];
  }

  protected latestScore(): number | null {
    return this.student?.progressSummary.latestCompletedScore ?? null;
  }

  protected latestScoreLabel(): string {
    const score = this.latestScore();

    return score === null ? 'Sin datos' : `${score.toFixed(2)}%`;
  }

  protected scoreStateLabel(score: number | null = this.latestScore()): string {
    if (score === null) {
      return 'Sin datos';
    }

    if (score < 40) {
      return 'Reforzar';
    }

    if (score < 70) {
      return 'En seguimiento';
    }

    return 'Avanza bien';
  }

  protected scoreStateClass(score: number | null = this.latestScore()): string {
    if (score === null) {
      return 'no-data';
    }

    if (score < 40) {
      return 'low';
    }

    if (score < 70) {
      return 'medium';
    }

    return 'high';
  }

  protected gaugeBackground(): string {
    const score = Math.max(0, Math.min(this.latestScore() ?? 0, 100));

    return `conic-gradient(${this.gaugeColor()} ${score * 3.6}deg, #eadfcd 0deg)`;
  }

  protected recommendationLabel(action: string | null | undefined): string {
    const normalized = (action || '').toLowerCase();

    if (!normalized) {
      return 'Sin recomendación';
    }

    if (normalized.includes('reforz') || normalized.includes('reinforce')) {
      return 'Reforzar';
    }

    if (normalized.includes('avanz') || normalized.includes('advance')) {
      return 'Avanzar con apoyo';
    }

    if (normalized.includes('seguim') || normalized.includes('follow')) {
      return 'En seguimiento';
    }

    return action || 'Sin recomendación';
  }

  protected statusLabel(status: string): string {
    const normalized = status.toLowerCase();

    if (normalized === 'completed') {
      return 'Completado';
    }

    if (normalized === 'inprogress' || normalized === 'in_progress') {
      return 'En progreso';
    }

    if (normalized === 'pending') {
      return 'Pendiente';
    }

    if (normalized === 'notstarted' || normalized === 'not_started') {
      return 'No iniciado';
    }

    return status || 'Sin datos';
  }

  protected statusClass(status: string): string {
    const normalized = status.toLowerCase();

    if (normalized === 'completed') {
      return 'completed';
    }

    if (normalized === 'inprogress' || normalized === 'in_progress') {
      return 'progress';
    }

    return 'pending';
  }

  protected secondsLabel(totalSeconds: number | null): string {
    const seconds = totalSeconds ?? 0;

    if (seconds < 60) {
      return `${seconds} s`;
    }

    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;

    return remainder ? `${minutes} min ${remainder} s` : `${minutes} min`;
  }

  protected recommendationSource(recommendation: AdaptiveRecommendation): string {
    return (
      recommendation.recommendedAssessmentTitle ||
      recommendation.sourceAssessmentTitle ||
      recommendation.recommendedActivityType ||
      'Actividad asociada no disponible'
    );
  }

  protected relatedAttemptLabel(comment: TeacherStudentComment): string {
    if (!comment.attemptId) {
      return 'General';
    }

    return `Intento #${comment.attemptId}`;
  }

  protected trackTag(_: number, tag: TeacherCommentTag): number {
    return tag.commentTagId;
  }

  protected trackEvaluationAttempt(_: number, attempt: TeacherStudentAssessmentAttempt): number {
    return attempt.attemptId;
  }

  protected trackReadingSession(_: number, session: TeacherStudentReadingSession): number {
    return session.attemptId;
  }

  private gaugeColor(): string {
    const score = this.latestScore();

    if (score === null) {
      return '#b9afa4';
    }

    if (score < 40) {
      return '#8f1d19';
    }

    if (score < 70) {
      return '#c59332';
    }

    return '#217a57';
  }

  private loadStudent(studentId: number, preserveMessages = false): void {
    this.loading = !preserveMessages;

    if (!preserveMessages) {
      this.errorMessage = '';
    }

    this.teacherPanelService.getStudentDetail(studentId).subscribe({
      next: (student) => {
        this.student = student;
        this.loading = false;

        if (!this.selectedTagId && student.availableCommentTags.length) {
          this.selectedTagId = student.availableCommentTags[0].commentTagId;
        }
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error?.error?.message ?? 'No se pudo cargar el detalle del estudiante.';
      }
    });
  }
}
