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
  protected searchTerm = '';
  protected assessmentFilter: 'Todas' | 'ReadingPractice' | 'Posttest' | 'Internas' | 'Activas' = 'Todas';

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

  protected filteredAssessments(): ContentAssessmentListItem[] {
    const normalizedSearch = this.normalizeText(this.searchTerm);

    return this.assessments.filter((assessment) => {
      const matchesSearch =
        !normalizedSearch ||
        this.normalizeText(assessment.title).includes(normalizedSearch) ||
        this.normalizeText(assessment.assessmentType).includes(normalizedSearch) ||
        this.normalizeText(assessment.readingTitle ?? '').includes(normalizedSearch) ||
        this.normalizeText(assessment.difficultyLevelName ?? '').includes(normalizedSearch);

      const normalizedType = this.normalizeText(assessment.assessmentType);
      const matchesFilter =
        this.assessmentFilter === 'Todas' ||
        (this.assessmentFilter === 'Activas' && assessment.isActive) ||
        (this.assessmentFilter === 'Internas' && this.isInternalType(assessment.assessmentType)) ||
        (this.assessmentFilter !== 'Activas' &&
          this.assessmentFilter !== 'Internas' &&
          normalizedType === this.normalizeText(this.assessmentFilter));

      return matchesSearch && matchesFilter;
    });
  }

  protected selectedAssessment(): ContentAssessmentListItem | null {
    return (
      this.assessments.find((assessment) => assessment.assessmentId === this.selectedAssessmentId) ?? null
    );
  }

  protected editorTitle(): string {
    if (!this.selectedAssessmentId) {
      return 'Nueva evaluacion';
    }

    return this.form.title.trim() || this.selectedAssessment()?.title || 'Evaluacion sin titulo';
  }

  protected editorSubtitle(): string {
    return this.selectedAssessmentId
      ? 'Configura tipo, lectura asociada, dificultad y preguntas del sistema.'
      : 'Completa titulo, tipo, dificultad y preguntas asociadas antes de guardar.';
  }

  protected statusLabel(): string {
    return this.form.isActive ? 'Activa' : 'Inactiva';
  }

  protected summaryType(): string {
    return this.selectedAssessmentId ? this.displayAssessmentType(this.form.assessmentType) : 'Pendiente';
  }

  protected summaryReading(): string {
    if (!this.form.readingId) {
      return 'Sin lectura';
    }

    return this.lookups?.readings.find((item) => item.id === Number(this.form.readingId))?.name ?? 'Sin lectura';
  }

  protected summaryDifficulty(): string {
    if (!this.selectedAssessmentId || !this.form.difficultyLevelId) {
      return 'Pendiente';
    }

    return (
      this.lookups?.difficultyLevels.find((item) => item.id === Number(this.form.difficultyLevelId))?.name ??
      'Pendiente'
    );
  }

  protected listReading(assessment: ContentAssessmentListItem): string {
    return assessment.readingTitle || 'Sin lectura';
  }

  protected displayAssessmentType(type: string | null | undefined): string {
    if (!type) {
      return 'Pendiente';
    }

    if (this.normalizeText(type) === 'readingpractice') {
      return 'Práctica de lectura';
    }

    if (this.normalizeText(type) === 'posttest') {
      return 'Evaluacion final';
    }

    return this.isInternalType(type) ? 'Interno / Histórico' : type;
  }

  protected typeClass(type: string | null | undefined): string {
    const normalized = this.normalizeText(type ?? '');

    if (normalized === 'readingpractice') {
      return 'reading';
    }

    if (normalized === 'posttest') {
      return 'posttest';
    }

    return 'internal';
  }

  protected dimensionClass(dimensionName: string | null | undefined): string {
    const normalized = this.normalizeText(dimensionName ?? '');

    if (normalized.includes('inferencial')) {
      return 'inferential';
    }

    if (normalized.includes('critica') || normalized.includes('evaluativa')) {
      return 'critical';
    }

    return 'literal';
  }

  protected questionDifficultyLabel(): string {
    if (!this.form.difficultyLevelId) {
      return 'Sin dificultad';
    }

    return (
      this.lookups?.difficultyLevels.find((item) => item.id === Number(this.form.difficultyLevelId))?.name ??
      'Sin dificultad'
    );
  }

  protected truncateText(value: string | null | undefined, maxLength = 78): string {
    const text = (value ?? '').trim();

    if (!text) {
      return 'Sin titulo';
    }

    return text.length > maxLength ? `${text.slice(0, maxLength).trim()}...` : text;
  }

  protected setAssessmentFilter(filter: 'Todas' | 'ReadingPractice' | 'Posttest' | 'Internas' | 'Activas'): void {
    this.assessmentFilter = filter;
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
      assessmentType: '',
      readingId: null,
      title: '',
      description: null,
      difficultyLevelId: null,
      isActive: false,
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

  private isInternalType(type: string | null | undefined): boolean {
    const normalized = this.normalizeText(type ?? '');
    return normalized === 'pretest' || normalized === 'interno' || normalized === 'historico';
  }

  private normalizeText(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }
}
