import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  ReadingProgressItem,
  ReadingProgressSummary
} from '../../../../core/models/reading.models';
import { ReadingService } from '../../../../core/services/reading.service';

type ReadingProgressImage = ReadingProgressItem & {
  coverImageUrl?: string | null;
};

@Component({
  selector: 'app-pre-post-comparison-page',
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './pre-post-comparison-page.component.html',
  styleUrl: './pre-post-comparison-page.component.css'
})
export class PrePostComparisonPageComponent {
  private readonly readingService = inject(ReadingService);
  private readonly defaultReadingBackground = 'assets/img/readings/default-reading.png';
  private readonly readingBackgrounds: Record<number, string> = {
    1: 'assets/img/readings/el-puente-antiguo.png',
    2: 'assets/img/readings/innovacion-en-el-aula.png',
    3: 'assets/img/readings/los-ecos-del-bosque.png',
    1002: 'assets/img/readings/1002-la-mochila-de-los-objetos-perdidos.png',
    1003: 'assets/img/readings/1003-el-viaje-de-una-gota-en-casa.png',
    1004: 'assets/img/readings/1004-quien-debe-ser-el-delegado.png',
    1005: 'assets/img/readings/1005-el-club-de-los-recreos-silenciosos.png',
    1006: 'assets/img/readings/1006-la-alarma-que-organiza-el-dia.png',
    1007: 'assets/img/readings/1007-el-mapa-del-mercado-del-barrio.png',
    1008: 'assets/img/readings/1008-la-ultima-pagina-de-cuaderno-rojo.png',
    1009: 'assets/img/readings/1009-la-ciudad-que-escuchaba-a-sus-arboles.png',
    1010: 'assets/img/readings/1010-el-algoritmo-de-las-tareas.png',
    1011: 'assets/img/readings/1011-el-mensaje-dentro-de-la-botella.png',
    1012: 'assets/img/readings/1012-cuando-el-recreo-tambien-ensena.png',
    1013: 'assets/img/readings/1013-la-biblioteca-que-nadie-visitaba.png'
  };

  protected summary: ReadingProgressSummary | null = null;
  protected loading = true;
  protected errorMessage = '';

  constructor() {
    this.readingService.getReadingProgress().subscribe({
      next: (summary) => {
        this.summary = {
          ...summary,
          readings: [...(summary.readings ?? [])].sort(
            (left, right) => this.statusPriority(left.status) - this.statusPriority(right.status)
          )
        };
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error?.error?.message ?? 'No se pudo cargar el progreso lector.';
      }
    });
  }

  protected visibleReadings(): ReadingProgressItem[] {
    return this.summary?.readings.filter((reading) => reading.status !== 'NotStarted') ?? [];
  }

  protected hasRegisteredReadings(): boolean {
    return this.visibleReadings().length > 0;
  }

  protected statusLabel(status: string): string {
    switch (status) {
      case 'Completed':
        return 'Completada';
      case 'InProgress':
        return 'En progreso';
      default:
        return status;
    }
  }

  protected statusChipClass(status: string): string {
    return status === 'Completed' ? 'completed' : 'progress';
  }

  protected difficultyClass(reading: ReadingProgressItem): string {
    const value = reading.difficultyLevelName.toLowerCase();

    if (value.includes('avanz')) {
      return 'advanced';
    }

    if (value.includes('inter')) {
      return 'intermediate';
    }

    return 'basic';
  }

  protected actionLabel(reading: ReadingProgressItem): string {
    return reading.status === 'Completed' ? 'Ver resultado' : 'Continuar lectura';
  }

  protected primaryRoute(reading: ReadingProgressItem): string | null {
    if (reading.status === 'Completed') {
      return reading.resultRoute || (reading.attemptId ? `/reading-sessions/${reading.attemptId}/result` : null);
    }

    return reading.actionRoute || (reading.attemptId ? `/reading-sessions/${reading.attemptId}` : null);
  }

  protected progressWidth(value: number | null | undefined): string {
    return `${this.clampPercent(value)}%`;
  }

  protected completionRingBackground(): string {
    return `conic-gradient(#7b1418 ${this.clampPercent(this.summary?.completionPercentage)}%, #eee5d8 0)`;
  }

  protected gaugeBackground(value: number | null): string {
    const degrees = this.clampPercent(value) * 1.8;
    return `conic-gradient(from 270deg at 50% 100%, #7b1418 0deg ${degrees}deg, #eee5d8 ${degrees}deg 180deg, transparent 180deg 360deg)`;
  }

  protected dimensionBarHeight(value: number | null): string {
    const normalized = this.clampPercent(value);
    return `${Math.max(0.25, (normalized / 100) * 3.2)}rem`;
  }

  protected scoreLabel(value: number | null): string {
    return `${(value ?? 0).toFixed(1)}%`;
  }

  protected roundedProgress(value: number | null | undefined): number {
    return Math.round(this.clampPercent(value));
  }

  protected totalMinutesLabel(totalTimeSeconds: number | null | undefined): string {
    const seconds = Math.max(0, totalTimeSeconds ?? 0);

    if (seconds === 0) {
      return '0 min';
    }

    return `${Math.max(1, Math.round(seconds / 60))} min`;
  }

  protected readingTimeLabel(reading: ReadingProgressItem): string {
    const seconds = Math.max(0, reading.totalTimeSeconds ?? 0);

    if (seconds >= 60) {
      return `${Math.max(1, Math.round(seconds / 60))} min`;
    }

    if (seconds > 0) {
      return `${seconds} s`;
    }

    return reading.estimatedMinutes ? `Aprox. ${reading.estimatedMinutes} min` : 'Sin registro';
  }

  protected readingQuestionsLabel(reading: ReadingProgressItem): string {
    return `${reading.answeredQuestions}/${reading.totalQuestions}`;
  }

  protected readingAccuracyLabel(reading: ReadingProgressItem): string {
    const correct = reading.totalCorrect ?? 0;
    const errors = reading.totalErrors ?? 0;
    return `${correct} aciertos - ${errors} errores`;
  }

  protected dateLabel(reading: ReadingProgressItem): string {
    return reading.finishedAt ? 'Fecha de finalizacion' : 'Inicio de lectura';
  }

  protected dateValue(reading: ReadingProgressItem): string | null {
    return reading.finishedAt ?? reading.startedAt;
  }

  protected getReadingImage(reading: ReadingProgressItem): string {
    const readingWithCover = reading as ReadingProgressImage;

    return (
      reading.imageUrl?.trim() ||
      readingWithCover.coverImageUrl?.trim() ||
      this.readingBackgrounds[reading.readingId] ||
      this.defaultReadingBackground
    );
  }

  private clampPercent(value: number | null | undefined): number {
    return Math.min(100, Math.max(0, value ?? 0));
  }

  private statusPriority(status: string): number {
    switch (status) {
      case 'Completed':
        return 0;
      case 'InProgress':
        return 1;
      default:
        return 2;
    }
  }
}
