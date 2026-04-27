import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ReadingDetail, ReadingPhase } from '../../../../core/models/reading.models';
import { ReadingService } from '../../../../core/services/reading.service';

@Component({
  selector: 'app-reading-detail-page',
  imports: [CommonModule, RouterLink],
  templateUrl: './reading-detail-page.component.html',
  styleUrl: './reading-detail-page.component.css'
})
export class ReadingDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly readingService = inject(ReadingService);

  protected reading: ReadingDetail | null = null;
  protected phases: ReadingPhase[] = [];
  protected loading = true;
  protected starting = false;
  protected errorMessage = '';

  constructor() {
    const readingId = Number(this.route.snapshot.paramMap.get('readingId'));

    forkJoin({
      reading: this.readingService.getReadingDetail(readingId),
      phases: this.readingService.getReadingPhases(readingId)
    }).subscribe({
      next: ({ reading, phases }) => {
        this.reading = reading;
        this.phases = phases.filter((phase) => phase.isEnabled);
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error?.error?.message ?? 'No se pudo cargar la lectura.';
      }
    });
  }

  protected startSession(): void {
    if (!this.reading || this.starting) {
      return;
    }

    this.starting = true;
    this.errorMessage = '';

    this.readingService.startReadingSession(this.reading.readingId).subscribe({
      next: (session) => {
        void this.router.navigate(['/reading-sessions', session.attemptId]);
      },
      error: (error) => {
        this.starting = false;
        this.errorMessage = error?.error?.message ?? 'No se pudo iniciar la sesion de lectura.';
      }
    });
  }
}
