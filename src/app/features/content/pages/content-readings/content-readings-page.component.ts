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

  protected lookups: ContentLookups | null = null;
  protected readings: ContentReadingListItem[] = [];
  protected form: SaveContentReadingRequest = this.buildEmptyForm();
  protected selectedReadingId: number | null = null;
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
      },
      error: (error) => {
        this.errorMessage = error?.error?.message ?? 'No se pudo cargar la lectura seleccionada.';
      }
    });
  }

  protected startNew(): void {
    this.selectedReadingId = null;
    this.form = this.buildEmptyForm();
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

  private loadData(): void {
    this.academicContentService.getLookups().subscribe({
      next: (lookups) => {
        this.lookups = lookups;
        this.form = this.buildEmptyForm();
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
      difficultyLevelId: 1,
      estimatedMinutes: null,
      isActive: true,
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
}
