import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ActiveReading } from '../../../../core/models/reading.models';
import { ReadingService } from '../../../../core/services/reading.service';

@Component({
  selector: 'app-reading-list-page',
  imports: [CommonModule, RouterLink],
  templateUrl: './reading-list-page.component.html',
  styleUrl: './reading-list-page.component.css'
})
export class ReadingListPageComponent {
  private readonly readingService = inject(ReadingService);

  protected readings: ActiveReading[] = [];
  protected loading = true;
  protected errorMessage = '';

  constructor() {
    this.readingService.getActiveReadings().subscribe({
      next: (readings) => {
        this.readings = readings;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error?.error?.message ?? 'No se pudieron cargar las lecturas.';
      }
    });
  }

  protected difficultyClass(reading: ActiveReading): string {
    const difficulty = reading.difficultyLevelName.toLowerCase();

    if (difficulty.includes('avanz')) {
      return 'advanced';
    }

    if (difficulty.includes('inter')) {
      return 'intermediate';
    }

    return 'basic';
  }

  protected readingSummary(reading: ActiveReading): string {
    return reading.summary || 'Lectura lista para trabajar comprensión con un recorrido guiado PQ4R.';
  }

  protected estimatedMinutes(reading: ActiveReading): number {
    return reading.estimatedMinutes ?? 10;
  }

  protected phaseCount(reading: ActiveReading): number {
    return reading.activePhaseCount || 6;
  }

  protected hasReadingImage(reading: ActiveReading): boolean {
    return !!reading.imageUrl;
  }

  protected readingBannerStyle(reading: ActiveReading): string | null {
    return reading.imageUrl ? `url('${reading.imageUrl}')` : null;
  }
}
