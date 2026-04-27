import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  CreateTeacherCommentRequest,
  ResetStudentPasswordResult,
  TeacherCommentTag,
  TeacherStudentAssessmentAttempt,
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
          error?.error?.message ?? 'No se pudo reiniciar la contrasena del estudiante.';
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
      label: `Evaluacion #${attempt.attemptId} · ${attempt.assessmentTitle}`
    }));

    const readingOptions = this.student.readingSessions.map((session) => ({
      value: session.attemptId,
      label: `Lectura #${session.attemptId} · ${session.readingTitle}`
    }));

    return [...evaluationOptions, ...readingOptions];
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
