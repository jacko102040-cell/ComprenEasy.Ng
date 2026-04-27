import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EvaluationService } from '../../../../core/services/evaluation.service';
import { ActiveAssessment } from '../../../../core/models/evaluation.models';

@Component({
  selector: 'app-evaluation-list-page',
  imports: [CommonModule, RouterLink],
  templateUrl: './evaluation-list-page.component.html',
  styleUrl: './evaluation-list-page.component.css'
})
export class EvaluationListPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly evaluationService = inject(EvaluationService);

  protected title = '';
  protected assessments: ActiveAssessment[] = [];
  protected loading = true;
  protected errorMessage = '';

  constructor() {
    const assessmentType = this.route.snapshot.data['assessmentType'] as string;
    this.title = this.route.snapshot.data['title'] as string;

    const request =
      assessmentType === 'Posttest'
        ? this.evaluationService.getActivePosttests()
        : this.evaluationService.getActivePretests();

    request.subscribe({
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
}
