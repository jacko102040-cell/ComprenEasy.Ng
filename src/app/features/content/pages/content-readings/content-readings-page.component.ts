import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  ContentLookups,
  ContentReadingDetail,
  ContentReadingListItem,
  ContentReadingPhaseEditor,
  SaveContentReadingRequest
} from '../../../../core/models/academic-content.models';
import { AcademicContentService } from '../../../../core/services/academic-content.service';

@Component({
  selector: 'app-content-readings-page',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './content-readings-page.component.html',
  styleUrl: './content-readings-page.component.css'
})
export class ContentReadingsPageComponent {
  private readonly academicContentService = inject(AcademicContentService);
  private readonly pq4rOrder = ['preview', 'question', 'read', 'reflect', 'recite', 'review'];

  protected lookups: ContentLookups | null = null;
  protected readings: ContentReadingListItem[] = [];
  protected form: SaveContentReadingRequest = this.buildEmptyForm();
  protected selectedReadingId: number | null = null;
  protected readingSearch = '';
  protected difficultyFilter = 'Todas';
  protected expandedPhaseId: number | null = null;
  protected loading = true;
  protected saving = false;
  protected errorMessage = '';
  protected successMessage = '';

  constructor() {
    this.loadData();
  }

  protected selectReading(readingId: number): void {
    this.errorMessage = '';
    this.successMessage = '';

    this.academicContentService.getReading(readingId).subscribe({
      next: (reading) => {
        this.selectedReadingId = reading.readingId;
        this.form = this.mapReadingToForm(reading);
        this.setDefaultExpandedPhase();
      },
      error: (error) => {
        this.errorMessage = error?.error?.message ?? 'No se pudo cargar la lectura seleccionada.';
      }
    });
  }

  protected startNew(): void {
    this.selectedReadingId = null;
    this.form = this.buildEmptyForm();
    this.setDefaultExpandedPhase();
    this.successMessage = '';
    this.errorMessage = '';
  }

  protected save(): void {
    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const request = this.normalizeForm();
    const operation = this.selectedReadingId
      ? this.academicContentService.updateReading(this.selectedReadingId, request)
      : this.academicContentService.createReading(request);

    operation.subscribe({
      next: (reading) => {
        this.saving = false;
        this.selectedReadingId = reading.readingId;
        this.form = this.mapReadingToForm(reading);
        this.setDefaultExpandedPhase();
        this.successMessage = 'Lectura guardada correctamente.';
        this.refreshReadings();
      },
      error: (error) => {
        this.saving = false;
        this.errorMessage = error?.error?.message ?? 'No se pudo guardar la lectura.';
      }
    });
  }

  protected archive(): void {
    if (!this.selectedReadingId || this.saving) {
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.academicContentService.archiveReading(this.selectedReadingId).subscribe({
      next: () => {
        this.saving = false;
        this.startNew();
        this.successMessage = 'Lectura archivada.';
        this.refreshReadings();
      },
      error: (error) => {
        this.saving = false;
        this.errorMessage = error?.error?.message ?? 'No se pudo archivar la lectura.';
      }
    });
  }

  protected filteredReadings(): ContentReadingListItem[] {
    const query = this.readingSearch.trim().toLowerCase();
    const filter = this.difficultyFilter.toLowerCase();

    return this.readings.filter((reading) => {
      const matchesQuery = !query || reading.title.toLowerCase().includes(query);
      const matchesDifficulty =
        this.difficultyFilter === 'Todas' || reading.difficultyLevelName.toLowerCase() === filter;

      return matchesQuery && matchesDifficulty;
    });
  }

  protected difficultyFilters(): string[] {
    const levels = this.lookups?.difficultyLevels.map((level) => level.name) ?? [];
    return ['Todas', ...levels];
  }

  protected editorTitle(): string {
    return this.selectedReadingId ? this.form.title || 'Lectura sin titulo' : 'Nueva lectura';
  }

  protected editorSubtitle(): string {
    return this.selectedReadingId
      ? 'Edita el texto, dificultad, sinopsis y fases PQ4R que vera el estudiante.'
      : 'Completa los datos principales y configura las fases PQ4R antes de guardar.';
  }

  protected difficultyName(): string {
    if (!this.selectedReadingId && !this.form.difficultyLevelId) {
      return 'Pendiente';
    }

    return (
      this.lookups?.difficultyLevels.find((level) => level.id === this.form.difficultyLevelId)?.name ??
      'Pendiente'
    );
  }

  protected contentState(): string {
    return this.form.content.trim().length > 0 ? 'Completo' : 'Vacio';
  }

  protected estimatedTimeLabel(): string {
    return this.form.estimatedMinutes ? `${this.form.estimatedMinutes} min` : 'Sin datos';
  }

  protected enabledPhaseCount(): number {
    if (!this.selectedReadingId) {
      return this.form.phases.length;
    }

    return this.form.phases.filter((phase) => phase.isEnabled).length;
  }

  protected wordCount(): number {
    return this.form.content.trim().split(/\s+/).filter(Boolean).length;
  }

  protected characterCount(): number {
    return this.form.content.length;
  }

  protected orderedPhases(): ContentReadingPhaseEditor[] {
    return [...this.form.phases].sort((a, b) => {
      const aIndex = this.phaseSortIndex(a);
      const bIndex = this.phaseSortIndex(b);

      if (aIndex !== bIndex) {
        return aIndex - bIndex;
      }

      return a.displayOrder - b.displayOrder;
    });
  }

  protected togglePhase(phaseId: number): void {
    this.expandedPhaseId = this.expandedPhaseId === phaseId ? null : phaseId;
  }

  protected isPhaseExpanded(phaseId: number): boolean {
    return this.expandedPhaseId === phaseId;
  }

  protected setDifficultyFilter(filter: string): void {
    this.difficultyFilter = filter;
  }

  protected phaseQuestionLabel(phase: ContentReadingPhaseEditor): string {
    const count = phase.minQuestionsToUnlockNext ?? 0;
    return count === 1 ? '1 pregunta' : `${count} preguntas`;
  }

  protected translatedPhaseLabel(phase: Pick<ContentReadingPhaseEditor, 'code' | 'displayName'>): string {
    switch (phase.code.trim().toLowerCase()) {
      case 'preview':
        return 'Explorar';
      case 'question':
        return 'Preguntar';
      case 'read':
        return 'Leer';
      case 'reflect':
        return 'Reflexionar';
      case 'recite':
        return 'Recitar';
      case 'review':
        return 'Repasar';
      default:
        return phase.displayName;
    }
  }

  private loadData(): void {
    this.academicContentService.getLookups().subscribe({
      next: (lookups) => {
        this.lookups = lookups;
        this.form = this.buildEmptyForm();
        this.setDefaultExpandedPhase();
        this.refreshReadings();
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error?.error?.message ?? 'No se pudo cargar el modulo de lecturas.';
      }
    });
  }

  private refreshReadings(): void {
    this.academicContentService.getReadings().subscribe({
      next: (readings) => {
        this.readings = readings;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error?.error?.message ?? 'No se pudo cargar la lista de lecturas.';
      }
    });
  }

  private buildEmptyForm(): SaveContentReadingRequest {
    return {
      title: '',
      summary: null,
      content: '',
      imageUrl: null,
      difficultyLevelId: 0,
      estimatedMinutes: null,
      isActive: false,
      phases:
        this.lookups?.phases.map((phase) => ({
          phaseId: phase.phaseId,
          code: phase.code,
          displayName: phase.displayName,
          displayOrder: phase.defaultOrder,
          isEnabled: false,
          isRequired: false,
          guidanceText: null,
          minQuestionsToUnlockNext: null
        })) ?? []
    };
  }

  private mapReadingToForm(reading: ContentReadingDetail): SaveContentReadingRequest {
    const existingByPhaseId = new Map<number, ContentReadingPhaseEditor>(
      reading.phases.map((phase) => [phase.phaseId, phase])
    );

    return {
      title: reading.title,
      summary: reading.summary,
      content: reading.content,
      imageUrl: reading.imageUrl,
      difficultyLevelId: reading.difficultyLevelId,
      estimatedMinutes: reading.estimatedMinutes,
      isActive: reading.isActive,
      phases:
        this.lookups?.phases.map((phase) => {
          const existing = existingByPhaseId.get(phase.phaseId);

          return {
            phaseId: phase.phaseId,
            code: phase.code,
            displayName: phase.displayName,
            displayOrder: existing?.displayOrder ?? phase.defaultOrder,
            isEnabled: existing?.isEnabled ?? false,
            isRequired: existing?.isRequired ?? false,
            guidanceText: existing?.guidanceText ?? null,
            minQuestionsToUnlockNext: existing?.minQuestionsToUnlockNext ?? null
          };
        }) ?? []
    };
  }

  private normalizeForm(): SaveContentReadingRequest {
    return {
      ...this.form,
      title: this.form.title.trim(),
      summary: this.form.summary?.trim() || null,
      content: this.form.content.trim(),
      imageUrl: this.form.imageUrl?.trim() || null,
      phases: this.form.phases.map((phase) => ({
        ...phase,
        guidanceText: phase.guidanceText?.trim() || null
      }))
    };
  }

  private setDefaultExpandedPhase(): void {
    this.expandedPhaseId = this.orderedPhases()[0]?.phaseId ?? null;
  }

  private phaseSortIndex(phase: ContentReadingPhaseEditor): number {
    const normalizedCode = phase.code.trim().toLowerCase();
    const index = this.pq4rOrder.findIndex((item) => normalizedCode === item);

    return index === -1 ? Number.MAX_SAFE_INTEGER : index;
  }
}
