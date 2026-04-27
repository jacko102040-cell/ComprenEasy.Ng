import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  ContentAssessmentDetail,
  ContentAssessmentListItem,
  ContentAssessmentQuestionEditor,
  ContentLookups,
  SaveContentAssessmentRequest
} from '../../../../core/models/academic-content.models';
import { AcademicContentService } from '../../../../core/services/academic-content.service';

@Component({
  selector: 'app-content-assessments-page',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './content-assessments-page.component.html',
  styleUrl: './content-assessments-page.component.css'
})
export class ContentAssessmentsPageComponent {
  private readonly academicContentService = inject(AcademicContentService);

  protected lookups: ContentLookups | null = null;
  protected assessments: ContentAssessmentListItem[] = [];
  protected form: SaveContentAssessmentRequest = this.buildEmptyForm();
  protected selectedAssessmentId: number | null = null;
  protected loading = true;
  protected saving = false;
  protected errorMessage = '';
  protected successMessage = '';

  constructor() {
    this.loadData();
  }

  protected selectAssessment(assessmentId: number): void {
    this.errorMessage = '';
    this.successMessage = '';

    this.academicContentService.getAssessment(assessmentId).subscribe({
      next: (assessment) => {
        this.selectedAssessmentId = assessment.assessmentId;
        this.form = this.mapAssessmentToForm(assessment);
      },
      error: (error) => {
        this.errorMessage = error?.error?.message ?? 'No se pudo cargar la evaluacion seleccionada.';
      }
    });
  }

  protected startNew(): void {
    this.selectedAssessmentId = null;
    this.form = this.buildEmptyForm();
    this.successMessage = '';
    this.errorMessage = '';
  }

  protected addQuestionLink(): void {
    this.form.questions = [
      ...this.form.questions,
      {
        assessmentQuestionId: null,
        questionId: this.lookups?.questions[0]?.questionId ?? 0,
        questionStem: '',
        dimensionName: '',
        phaseId: null,
        displayOrder: this.form.questions.length + 1,
        points: 1,
        isActive: true
      }
    ];
  }

  protected removeQuestionLink(index: number): void {
    this.form.questions = this.form.questions.filter((_, currentIndex) => currentIndex !== index);
  }

  protected syncQuestionLookup(link: ContentAssessmentQuestionEditor): void {
    const selected = this.lookups?.questions.find((item) => item.questionId === Number(link.questionId));
    link.questionStem = selected?.stem ?? '';
    link.dimensionName = selected?.dimensionName ?? '';
  }

  protected save(): void {
    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const request = this.normalizeForm();
    const operation = this.selectedAssessmentId
      ? this.academicContentService.updateAssessment(this.selectedAssessmentId, request)
      : this.academicContentService.createAssessment(request);

    operation.subscribe({
      next: (assessment) => {
        this.saving = false;
        this.selectedAssessmentId = assessment.assessmentId;
        this.form = this.mapAssessmentToForm(assessment);
        this.successMessage = 'Evaluacion guardada correctamente.';
        this.refreshAssessments();
      },
      error: (error) => {
        this.saving = false;
        this.errorMessage = error?.error?.message ?? 'No se pudo guardar la evaluacion.';
      }
    });
  }

  protected archive(): void {
    if (!this.selectedAssessmentId || this.saving) {
      return;
    }

    this.saving = true;
    this.academicContentService.archiveAssessment(this.selectedAssessmentId).subscribe({
      next: () => {
        this.saving = false;
        this.startNew();
        this.successMessage = 'Evaluacion archivada.';
        this.refreshAssessments();
      },
      error: (error) => {
        this.saving = false;
        this.errorMessage = error?.error?.message ?? 'No se pudo archivar la evaluacion.';
      }
    });
  }

  private loadData(): void {
    this.academicContentService.getLookups().subscribe({
      next: (lookups) => {
        this.lookups = lookups;
        this.form = this.buildEmptyForm();
        this.refreshAssessments();
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error?.error?.message ?? 'No se pudo cargar el modulo de evaluaciones.';
      }
    });
  }

  private refreshAssessments(): void {
    this.academicContentService.getAssessments().subscribe({
      next: (assessments) => {
        this.assessments = assessments;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error?.error?.message ?? 'No se pudo cargar la lista de evaluaciones.';
      }
    });
  }

  private buildEmptyForm(): SaveContentAssessmentRequest {
    return {
      assessmentType: 'Pretest',
      readingId: null,
      title: '',
      description: null,
      difficultyLevelId: null,
      isActive: true,
      questions: []
    };
  }

  private mapAssessmentToForm(assessment: ContentAssessmentDetail): SaveContentAssessmentRequest {
    return {
      assessmentType: assessment.assessmentType,
      readingId: assessment.readingId,
      title: assessment.title,
      description: assessment.description,
      difficultyLevelId: assessment.difficultyLevelId,
      isActive: assessment.isActive,
      questions: assessment.questions.map((question) => ({ ...question }))
    };
  }

  private normalizeForm(): SaveContentAssessmentRequest {
    return {
      ...this.form,
      title: this.form.title.trim(),
      description: this.form.description?.trim() || null,
      readingId:
        this.form.assessmentType === 'ReadingPractice' && this.form.readingId
          ? Number(this.form.readingId)
          : null,
      difficultyLevelId: this.form.difficultyLevelId ? Number(this.form.difficultyLevelId) : null,
      questions: this.form.questions.map((question) => ({
        ...question,
        questionId: Number(question.questionId),
        phaseId:
          this.form.assessmentType === 'ReadingPractice' && question.phaseId
            ? Number(question.phaseId)
            : null,
        displayOrder: Number(question.displayOrder),
        points: Number(question.points)
      }))
    };
  }
}
