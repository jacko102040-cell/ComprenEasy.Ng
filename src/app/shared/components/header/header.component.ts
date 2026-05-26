import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { catchError, of } from 'rxjs';
import { AcademicFlowService } from '../../../core/services/academic-flow.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  protected readonly authService = inject(AuthService);
  private readonly academicFlowService = inject(AcademicFlowService);
  private readonly router = inject(Router);
  protected readonly academicSummary = this.academicFlowService.currentSummary;

  constructor() {
    this.academicFlowService
      .getCurrentSummary()
      .pipe(catchError(() => of(null)))
      .subscribe();
  }

  protected initials(fullName: string): string {
    return fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }

  protected logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        void this.router.navigate(['/login']);
      }
    });
  }

  protected isReadingsActive(): boolean {
    return this.router.url.startsWith('/readings') || this.router.url.startsWith('/reading-sessions');
  }

  protected isReadingSession(): boolean {
    return this.router.url.startsWith('/reading-sessions');
  }

  protected isProgressActive(): boolean {
    return this.router.url.startsWith('/pre-post-comparison');
  }

  protected isPosttestActive(): boolean {
    return this.router.url.startsWith('/posttests') || this.router.url.startsWith('/evaluations');
  }

  protected isMaterialsActive(): boolean {
    return this.router.url.startsWith('/materials');
  }

  protected canShowPosttestLink(): boolean {
    return this.authService.currentUser()?.role === 'Student' && !!this.academicSummary()?.canAccessPosttest;
  }
}
