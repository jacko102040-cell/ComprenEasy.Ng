import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PrePostComparisonSummary } from '../../../../core/models/evaluation.models';
import { EvaluationService } from '../../../../core/services/evaluation.service';

@Component({
  selector: 'app-pre-post-comparison-page',
  imports: [CommonModule, RouterLink, DatePipe, DecimalPipe],
  templateUrl: './pre-post-comparison-page.component.html',
  styleUrl: './pre-post-comparison-page.component.css'
})
export class PrePostComparisonPageComponent {
  private readonly evaluationService = inject(EvaluationService);

  protected comparison: PrePostComparisonSummary | null = null;
  protected loading = true;
  protected errorMessage = '';

  constructor() {
    this.evaluationService.getLatestPrePostComparison().subscribe({
      next: (comparison) => {
        this.comparison = comparison;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage =
          error?.error?.message ?? 'No se pudo cargar la comparacion final del estudiante.';
      }
    });
  }

  protected improvementTone(value: number | null): 'positive' | 'negative' | 'neutral' {
    if (value === null || value === 0) {
      return 'neutral';
    }

    return value > 0 ? 'positive' : 'negative';
  }
}
