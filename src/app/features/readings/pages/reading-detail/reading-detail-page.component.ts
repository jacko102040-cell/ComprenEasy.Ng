import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ReadingDetail, ReadingPhase } from '../../../../core/models/reading.models';
import { ReadingService } from '../../../../core/services/reading.service';

interface PhasePresentation {
  code: string;
  title: string;
  guidance: string;
  minutes: number;
  icon: string;
  tone: string;
}

const readingBackgrounds: Record<number, string> = {
  1: 'assets/img/readings/el-puente-antiguo.png',
  2: 'assets/img/readings/innovacion-en-el-aula.png',
  3: 'assets/img/readings/los-ecos-del-bosque.png'
};

const defaultReadingBackground = 'assets/img/readings/default-reading.png';

const phasePresentations: PhasePresentation[] = [
  {
    code: 'preview',
    title: 'Preview',
    guidance: 'Observa titulos y pistas antes de leer.',
    minutes: 1,
    icon: 'book-open',
    tone: 'preview'
  },
  {
    code: 'question',
    title: 'Question',
    guidance: 'Formula preguntas sobre lo que esperas encontrar.',
    minutes: 3,
    icon: 'question',
    tone: 'question'
  },
  {
    code: 'read',
    title: 'Read',
    guidance: 'Lee con atencion buscando ideas centrales y detalles.',
    minutes: 4,
    icon: 'book',
    tone: 'read'
  },
  {
    code: 'reflect',
    title: 'Reflect',
    guidance: 'Relaciona lo leido con conocimientos previos y situaciones reales.',
    minutes: 5,
    icon: 'spark',
    tone: 'reflect'
  },
  {
    code: 'recite',
    title: 'Recite',
    guidance: 'Explica con tus palabras lo aprendido.',
    minutes: 3,
    icon: 'chat',
    tone: 'recite'
  },
  {
    code: 'review',
    title: 'Review',
    guidance: 'Revisa ideas clave y verifica tus respuestas.',
    minutes: 3,
    icon: 'edit',
    tone: 'review'
  }
];

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

  protected readingBackground(): string {
    if (!this.reading) {
      return defaultReadingBackground;
    }

    return this.reading.imageUrl || readingBackgrounds[this.reading.readingId] || defaultReadingBackground;
  }

  protected estimatedMinutes(): number {
    return this.reading?.estimatedMinutes ?? 8;
  }

  protected activePhaseCount(): number {
    return this.phases.length || phasePresentations.length;
  }

  protected difficultyLabel(): string {
    return this.reading?.difficultyLevelName || 'Basico';
  }

  protected readingSummary(): string {
    return (
      this.reading?.summary ||
      'Lectura breve sobre una caminata en un bosque y el hallazgo de pistas antiguas.'
    );
  }

  protected displayedPhases(): PhasePresentation[] {
    if (!this.phases.length) {
      return phasePresentations;
    }

    return this.phases.map((phase, index) => {
      const presentation = phasePresentations.find(
        (item) => item.code === phase.code.toLowerCase() || item.title.toLowerCase() === phase.displayName.toLowerCase()
      );

      return {
        ...(presentation ?? phasePresentations[index] ?? phasePresentations[0]),
        title: presentation?.title ?? phase.displayName,
        guidance: presentation?.guidance ?? phase.guidanceText ?? 'Avanza esta fase de la lectura guiada.',
        minutes: presentation?.minutes ?? Math.max(1, phase.minQuestionsToUnlockNext ?? 3)
      };
    });
  }

  protected wordCount(): number {
    if (!this.reading?.content) {
      return 1200;
    }

    return Math.max(1, this.reading.content.trim().split(/\s+/).filter(Boolean).length);
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
        this.errorMessage = error?.error?.message ?? 'No se pudo iniciar la sesión de lectura.';
      }
    });
  }
}
