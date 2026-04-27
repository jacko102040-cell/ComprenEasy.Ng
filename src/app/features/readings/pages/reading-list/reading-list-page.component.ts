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
}
