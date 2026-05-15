import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { AcademicContentService } from '../../../../core/services/academic-content.service';

interface ContentMetrics {
  totalReadings: number;
  activeReadings: number;
  assessments: number;
  questions: number;
  options: number;
  pending: number;
}

@Component({
  selector: 'app-content-home-page',
  imports: [CommonModule, RouterLink],
  templateUrl: './content-home-page.component.html',
  styleUrl: './content-home-page.component.css'
})
export class ContentHomePageComponent {
  private readonly academicContentService = inject(AcademicContentService);

  protected metrics: ContentMetrics = {
    totalReadings: 0,
    activeReadings: 0,
    assessments: 0,
    questions: 0,
    options: 0,
    pending: 0
  };
  protected loadingMetrics = true;

  constructor() {
    this.loadMetrics();
  }

  protected hasNoContent(): boolean {
    return (
      !this.loadingMetrics &&
      this.metrics.totalReadings === 0 &&
      this.metrics.assessments === 0 &&
      this.metrics.questions === 0
    );
  }

  protected loadMetrics(): void {
    this.loadingMetrics = true;

    forkJoin({
      readings: this.academicContentService.getReadings().pipe(catchError(() => of([]))),
      assessments: this.academicContentService.getAssessments().pipe(catchError(() => of([]))),
      questions: this.academicContentService.getQuestions().pipe(catchError(() => of([])))
    }).subscribe(({ readings, assessments, questions }) => {
      this.metrics = {
        totalReadings: readings.length,
        activeReadings: readings.filter((reading) => reading.isActive).length,
        assessments: assessments.length,
        questions: questions.length,
        options: questions.reduce((total, question) => total + question.optionCount, 0),
        pending: 0
      };
      this.loadingMetrics = false;
    });
  }
}
