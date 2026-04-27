import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TeacherStudentListItem } from '../../../../core/models/teacher-panel.models';
import { TeacherPanelService } from '../../../../core/services/teacher-panel.service';

@Component({
  selector: 'app-teacher-student-list-page',
  imports: [CommonModule, RouterLink, DatePipe, DecimalPipe],
  templateUrl: './teacher-student-list-page.component.html',
  styleUrl: './teacher-student-list-page.component.css'
})
export class TeacherStudentListPageComponent {
  private readonly teacherPanelService = inject(TeacherPanelService);

  protected students: TeacherStudentListItem[] = [];
  protected loading = true;
  protected errorMessage = '';

  constructor() {
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
}
