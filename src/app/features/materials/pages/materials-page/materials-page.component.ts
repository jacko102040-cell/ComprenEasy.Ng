import { CommonModule } from '@angular/common';
import { Component, HostListener, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

type MaterialCategory =
  | 'Comprensión lectora'
  | 'Inferencia'
  | 'Lectura crítica'
  | 'PQ4R'
  | 'Inteligencia artificial'
  | 'Aprendizaje automático';

type MaterialCategoryFilter = MaterialCategory | 'Todos';

interface LearningMaterial {
  id: number;
  title: string;
  description: string;
  category: MaterialCategory;
  type: 'Video';
  duration: string;
  youtubeVideoId: string;
  recommendation: string;
}

@Component({
  selector: 'app-materials-page',
  imports: [CommonModule],
  templateUrl: './materials-page.component.html',
  styleUrl: './materials-page.component.css'
})
export class MaterialsPageComponent {
  private readonly sanitizer = inject(DomSanitizer);

  protected readonly categories: MaterialCategoryFilter[] = [
    'Todos',
    'Comprensión lectora',
    'Inferencia',
    'Lectura crítica',
    'PQ4R',
    'Inteligencia artificial',
    'Aprendizaje automático'
  ];

  protected readonly materials: LearningMaterial[] = [
    {
      id: 1,
      title: '¿Qué es la comprensión lectora?',
      description:
        'Repasa cómo se construye el significado de un texto y por qué no basta con leer rápido.',
      category: 'Comprensión lectora',
      type: 'Video',
      duration: '5 min',
      youtubeVideoId: 'b03epT4GA8U',
      recommendation: 'Se recomienda ver este material antes de iniciar tu primera lectura PQ4R.'
    },
    {
      id: 2,
      title: 'Nivel literal, inferencial y crítico',
      description: 'Diferencia los tres niveles que se trabajan en las lecturas y evaluaciones.',
      category: 'Comprensión lectora',
      type: 'Video',
      duration: '6 min',
      youtubeVideoId: 'MZg31ZT1hcg',
      recommendation: 'Úsalo para entender cómo se evalúan tus respuestas en ComprenEasy.'
    },
    {
      id: 3,
      title: 'Estrategias para comprender mejor',
      description:
        'Conoce acciones prácticas para mejorar tu comprensión antes, durante y después de leer.',
      category: 'Comprensión lectora',
      type: 'Video',
      duration: '8 min',
      youtubeVideoId: '9njlmj2OzK0',
      recommendation:
        'Revísalo si quieres fortalecer tus hábitos de lectura antes de continuar con nuevas sesiones.'
    },
    {
      id: 4,
      title: 'Tema e idea principal',
      description:
        'Aprende a diferenciar el tema central, la idea principal y las ideas de apoyo en un texto.',
      category: 'Comprensión lectora',
      type: 'Video',
      duration: '7 min',
      youtubeVideoId: 'iR0-03DZJGI',
      recommendation: 'Te ayudará especialmente en preguntas literales e inferenciales.'
    },
    {
      id: 5,
      title: 'Comprensión lectora: inferencias',
      description:
        'Refuerza cómo descubrir información implícita a partir de pistas del texto.',
      category: 'Inferencia',
      type: 'Video',
      duration: '6 min',
      youtubeVideoId: 'gFzDlNStms8',
      recommendation: 'Úsalo si tus resultados muestran dificultad en la dimensión inferencial.'
    },
    {
      id: 6,
      title: 'Lectura inferencial con ejemplos',
      description:
        'Practica cómo obtener conclusiones a partir de información que no aparece de forma directa.',
      category: 'Inferencia',
      type: 'Video',
      duration: '6 min',
      youtubeVideoId: 'wItNUyFh3SE',
      recommendation:
        'Ideal para reforzar preguntas donde la respuesta no está escrita literalmente.'
    },
    {
      id: 7,
      title: 'Pensamiento crítico y lectura',
      description: 'Aprende a cuestionar, comparar y valorar ideas mientras lees.',
      category: 'Lectura crítica',
      type: 'Video',
      duration: '7 min',
      youtubeVideoId: 'JHpZ6qi2k3E',
      recommendation: 'Revísalo antes de responder preguntas crítica-evaluativas.'
    },
    {
      id: 8,
      title: '¿Qué es la lectura crítica?',
      description:
        'Conoce qué implica leer críticamente y cómo evaluar la intención o postura de un texto.',
      category: 'Lectura crítica',
      type: 'Video',
      duration: '8 min',
      youtubeVideoId: 'Gc0LVdAW9c8',
      recommendation:
        'Te servirá para mejorar respuestas donde debes valorar argumentos o conclusiones.'
    },
    {
      id: 9,
      title: 'Cómo usar PQ4R para leer mejor',
      description: 'Conoce las fases Explorar, Preguntar, Leer, Reflexionar, Recitar y Repasar.',
      category: 'PQ4R',
      type: 'Video',
      duration: '7 min',
      youtubeVideoId: 'Cll7Uig4X24',
      recommendation:
        'Revísalo antes de iniciar una sesión de lectura para aprovechar mejor cada fase.'
    },
    {
      id: 10,
      title: 'IA como apoyo al aprendizaje',
      description:
        'Aprende cómo la inteligencia artificial puede apoyar el aprendizaje sin reemplazar el esfuerzo del estudiante.',
      category: 'Inteligencia artificial',
      type: 'Video',
      duration: '5 min',
      youtubeVideoId: 'NOSBak2scO8',
      recommendation:
        'Te ayudará a entender por qué ComprenEasy recomienda lecturas según tu avance.'
    },
    {
      id: 11,
      title: 'Inteligencia artificial en educación',
      description:
        'Explora cómo la IA se relaciona con nuevas formas de enseñar, aprender y personalizar actividades.',
      category: 'Inteligencia artificial',
      type: 'Video',
      duration: '8 min',
      youtubeVideoId: 'JGQA_btxUyw',
      recommendation: 'Úsalo para comprender el componente tecnológico detrás del sistema.'
    },
    {
      id: 12,
      title: 'Aprendizaje automático explicado fácil',
      description:
        'Introducción simple a cómo los sistemas aprenden de datos para realizar recomendaciones.',
      category: 'Aprendizaje automático',
      type: 'Video',
      duration: '6 min',
      youtubeVideoId: 'vj6v4YHTNF4',
      recommendation:
        'Úsalo para comprender de forma básica cómo funcionan las recomendaciones adaptativas.'
    }
  ];

  protected selectedCategory: MaterialCategoryFilter = 'Todos';
  protected selectedMaterial: LearningMaterial | null = null;
  protected safeVideoUrl: SafeResourceUrl | null = null;

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.selectedMaterial) {
      this.closeModal();
    }
  }

  protected filteredMaterials(): LearningMaterial[] {
    if (this.selectedCategory === 'Todos') {
      return this.materials;
    }

    return this.materials.filter((material) => material.category === this.selectedCategory);
  }

  protected selectCategory(category: MaterialCategoryFilter): void {
    this.selectedCategory = category;
  }

  protected thumbnailUrl(material: LearningMaterial): string {
    return `https://img.youtube.com/vi/${material.youtubeVideoId}/hqdefault.jpg`;
  }

  protected openMaterial(material: LearningMaterial): void {
    this.selectedMaterial = material;
    this.safeVideoUrl = this.videoUrlFromId(material.youtubeVideoId);
  }

  protected closeModal(): void {
    this.selectedMaterial = null;
    this.safeVideoUrl = null;
  }

  private videoUrlFromId(youtubeVideoId: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.youtube-nocookie.com/embed/${youtubeVideoId}`
    );
  }
}
