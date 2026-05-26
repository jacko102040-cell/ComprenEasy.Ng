import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TeacherStudentListItem } from '../../../../core/models/teacher-panel.models';
import { TeacherPanelService } from '../../../../core/services/teacher-panel.service';
import { utcDateInput } from '../../../../core/utils/date-time.utils';

@Component({
  selector: 'app-teacher-student-list-page',
  imports: [CommonModule, FormsModule, RouterLink, DatePipe, DecimalPipe],
  templateUrl: './teacher-student-list-page.component.html',
  styleUrl: './teacher-student-list-page.component.css'
})
export class TeacherStudentListPageComponent {
  private readonly teacherPanelService = inject(TeacherPanelService);

  protected students: TeacherStudentListItem[] = [];
  protected loading = true;
  protected exporting = false;
  protected errorMessage = '';
  protected searchTerm = '';
  protected selectedGrade = 'Todos';
  protected selectedSection = 'Todos';
  protected selectedStatus = 'Todos';

  protected readonly statusFilters = [
    'Todos',
    'Activos',
    'Inactivos',
    'Sin actividad',
    'Requieren refuerzo'
  ];

  constructor() {
    this.loadStudents();
  }

  protected loadStudents(): void {
    this.loading = true;
    this.errorMessage = '';

    this.teacherPanelService.getStudents().subscribe({
      next: (students) => {
        this.students = students;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error?.error?.message ?? 'No se pudo cargar la lista de estudiantes.';
      }
    });
  }

  protected filteredStudents(): TeacherStudentListItem[] {
    const term = this.searchTerm.trim().toLowerCase();

    return this.students.filter((student) => {
      const matchesSearch =
        !term ||
        student.fullName.toLowerCase().includes(term) ||
        student.username.toLowerCase().includes(term);
      const matchesGrade = this.selectedGrade === 'Todos' || String(student.grade) === this.selectedGrade;
      const matchesSection =
        this.selectedSection === 'Todos' || this.sectionLabel(student) === this.selectedSection;
      const matchesStatus = this.matchesStatus(student);

      return matchesSearch && matchesGrade && matchesSection && matchesStatus;
    });
  }

  protected gradeOptions(): string[] {
    return this.uniqueOptions(this.students.map((student) => String(student.grade)));
  }

  protected sectionOptions(): string[] {
    return this.uniqueOptions(this.students.map((student) => this.sectionLabel(student)));
  }

  protected activeStudentsCount(): number {
    return this.students.filter((student) => student.isActive).length;
  }

  protected studentsInProgressCount(): number {
    return this.students.filter((student) => !!student.lastActivityAt).length;
  }

  protected averageScore(): number | null {
    const scores = this.students
      .map((student) => student.latestScore)
      .filter((score): score is number => score !== null);

    if (!scores.length) {
      return null;
    }

    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  protected averageScoreLabel(): string {
    const score = this.averageScore();

    return score === null ? 'Sin datos' : `${score.toFixed(1)}%`;
  }

  protected reinforcementCount(): number {
    return this.students.filter((student) => this.requiresReinforcement(student)).length;
  }

  protected noActivityCount(): number {
    return this.students.filter((student) => !student.lastActivityAt).length;
  }

  protected clearFilters(): void {
    this.searchTerm = '';
    this.selectedGrade = 'Todos';
    this.selectedSection = 'Todos';
    this.selectedStatus = 'Todos';
  }

  protected downloadPosttestReadingsExport(): void {
    if (this.exporting) {
      return;
    }

    this.exporting = true;
    this.errorMessage = '';

    this.teacherPanelService.exportPosttestReadings().subscribe({
      next: (file) => {
        this.exporting = false;
        this.downloadFile(file, 'seguimiento_evaluacion_final_lecturas.xlsx');
      },
      error: (error) => {
        this.exporting = false;
        this.errorMessage =
          error?.error?.message ?? 'No se pudo descargar el Excel de evaluacion final y lecturas.';
      }
    });
  }

  protected initials(fullName: string): string {
    return fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }

  protected sectionLabel(student: TeacherStudentListItem): string {
    return student.section || 'Sin sección';
  }

  protected statusLabel(student: TeacherStudentListItem): string {
    if (!student.lastActivityAt) {
      return 'Sin actividad';
    }

    return student.isActive ? 'Activo' : 'Inactivo';
  }

  protected recommendationLabel(student: TeacherStudentListItem): string {
    if (this.requiresReinforcement(student)) {
      return 'Reforzar';
    }

    if (student.latestScore !== null && student.latestScore >= 70) {
      return 'Avanza bien';
    }

    if (student.latestScore !== null) {
      return 'En seguimiento';
    }

    return student.latestRecommendationAction || 'Sin recomendación';
  }

  protected scoreStateLabel(student: TeacherStudentListItem): string {
    const score = student.latestScore;

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

  protected scoreWidth(student: TeacherStudentListItem): string {
    return `${Math.max(0, Math.min(student.latestScore ?? 0, 100))}%`;
  }

  protected scoreClass(student: TeacherStudentListItem): string {
    const score = student.latestScore;

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

  protected statusClass(student: TeacherStudentListItem): string {
    if (!student.lastActivityAt) {
      return 'idle';
    }

    return student.isActive ? 'active' : 'inactive';
  }

  protected recommendationClass(student: TeacherStudentListItem): string {
    if (this.requiresReinforcement(student)) {
      return 'reinforce';
    }

    if (student.latestScore !== null && student.latestScore >= 70) {
      return 'advance';
    }

    if (student.latestScore !== null) {
      return 'watch';
    }

    return 'muted';
  }

  protected utcDate(value: string | null | undefined): string | null {
    return utcDateInput(value);
  }

  protected requiresReinforcement(student: TeacherStudentListItem): boolean {
    const recommendation = (student.latestRecommendationAction || '').toLowerCase();

    return recommendation.includes('reforz') || recommendation.includes('reinforce');
  }

  private matchesStatus(student: TeacherStudentListItem): boolean {
    switch (this.selectedStatus) {
      case 'Activos':
        return student.isActive;
      case 'Inactivos':
        return !student.isActive;
      case 'Sin actividad':
        return !student.lastActivityAt;
      case 'Requieren refuerzo':
        return this.requiresReinforcement(student);
      default:
        return true;
    }
  }

  private uniqueOptions(options: string[]): string[] {
    return Array.from(new Set(options)).sort((first, second) => first.localeCompare(second));
  }

  private downloadFile(file: Blob, fileName: string): void {
    const url = URL.createObjectURL(file);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}
