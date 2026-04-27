import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  ContentLookups,
  ContentQuestionDetail,
  ContentQuestionListItem,
  SaveContentQuestionRequest
} from '../../../../core/models/academic-content.models';
import { AcademicContentService } from '../../../../core/services/academic-content.service';

@Component({
  selector: 'app-content-questions-page',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './content-questions-page.component.html',
  styleUrl: './content-questions-page.component.css'
})
export class ContentQuestionsPageComponent {
  private readonly academicContentService = inject(AcademicContentService);

  protected lookups: ContentLookups | null = null;
  protected questions: ContentQuestionListItem[] = [];
  protected form: SaveContentQuestionRequest = this.buildEmptyForm();
  protected selectedQuestionId: number | null = null;
  protected loading = true;
  protected saving = false;
  protected errorMessage = '';
  protected successMessage = '';

  constructor() {
    this.loadData();
  }

  protected selectQuestion(questionId: number): void {
    this.errorMessage = '';
    this.successMessage = '';

    this.academicContentService.getQuestion(questionId).subscribe({
      next: (question) => {
        this.selectedQuestionId = question.questionId;
        this.form = this.mapQuestionToForm(question);
      },
      error: (error) => {
        this.errorMessage = error?.error?.message ?? 'No se pudo cargar la pregunta seleccionada.';
      }
    });
  }

  protected startNew(): void {
    this.selectedQuestionId = null;
    this.form = this.buildEmptyForm();
    this.successMessage = '';
    this.errorMessage = '';
  }

  protected addOption(): void {
    this.form.options = [
      ...this.form.options,
      {
        optionId: null,
        optionText: '',
        isCorrect: false,
        displayOrder: this.form.options.length + 1
      }
    ];
  }

  protected removeOption(index: number): void {
    this.form.options = this.form.options.filter((_, currentIndex) => currentIndex !== index);
  }

  protected save(): void {
    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const request = this.normalizeForm();
    const operation = this.selectedQuestionId
      ? this.academicContentService.updateQuestion(this.selectedQuestionId, request)
      : this.academicContentService.createQuestion(request);

    operation.subscribe({
      next: (question) => {
        this.saving = false;
        this.selectedQuestionId = question.questionId;
        this.form = this.mapQuestionToForm(question);
        this.successMessage = 'Pregunta guardada correctamente.';
        this.refreshQuestions();
      },
      error: (error) => {
        this.saving = false;
        this.errorMessage = error?.error?.message ?? 'No se pudo guardar la pregunta.';
      }
    });
  }

  protected archive(): void {
    if (!this.selectedQuestionId || this.saving) {
      return;
    }

    this.saving = true;
    this.academicContentService.archiveQuestion(this.selectedQuestionId).subscribe({
      next: () => {
        this.saving = false;
        this.startNew();
        this.successMessage = 'Pregunta archivada.';
        this.refreshQuestions();
      },
      error: (error) => {
        this.saving = false;
        this.errorMessage = error?.error?.message ?? 'No se pudo archivar la pregunta.';
      }
    });
  }

  private loadData(): void {
    this.academicContentService.getLookups().subscribe({
      next: (lookups) => {
        this.lookups = lookups;
        this.form = this.buildEmptyForm();
        this.refreshQuestions();
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error?.error?.message ?? 'No se pudo cargar el modulo de preguntas.';
      }
    });
  }

  private refreshQuestions(): void {
    this.academicContentService.getQuestions().subscribe({
      next: (questions) => {
        this.questions = questions;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error?.error?.message ?? 'No se pudo cargar la lista de preguntas.';
      }
    });
  }

  private buildEmptyForm(): SaveContentQuestionRequest {
    return {
      dimensionId: 1,
      stem: '',
      questionType: 'MultipleChoice',
      explanation: null,
      difficultyLevelId: null,
      isActive: true,
      options: [
        { optionId: null, optionText: '', isCorrect: false, displayOrder: 1 },
        { optionId: null, optionText: '', isCorrect: false, displayOrder: 2 }
      ]
    };
  }

  private mapQuestionToForm(question: ContentQuestionDetail): SaveContentQuestionRequest {
    return {
      dimensionId: question.dimensionId,
      stem: question.stem,
      questionType: question.questionType,
      explanation: question.explanation,
      difficultyLevelId: question.difficultyLevelId,
      isActive: question.isActive,
      options: question.options.map((option) => ({ ...option }))
    };
  }

  private normalizeForm(): SaveContentQuestionRequest {
    return {
      ...this.form,
      dimensionId: Number(this.form.dimensionId),
      stem: this.form.stem.trim(),
      questionType: this.form.questionType.trim(),
      explanation: this.form.explanation?.trim() || null,
      difficultyLevelId: this.form.difficultyLevelId ? Number(this.form.difficultyLevelId) : null,
      options: this.form.options.map((option) => ({
        ...option,
        optionText: option.optionText.trim(),
        displayOrder: Number(option.displayOrder)
      }))
    };
  }
}
