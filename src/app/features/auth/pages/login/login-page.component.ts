import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-login-page',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.css'
})
export class LoginPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly form = this.formBuilder.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  protected loading = false;
  protected errorMessage = '';

  protected pq4rSteps = [
    { id: 'preview', name: 'Explorar', icon: 'ph ph-eye' },
    { id: 'question', name: 'Preguntar', icon: 'ph ph-question' },
    { id: 'read', name: 'Leer', icon: 'ph ph-book-open' },
    { id: 'reflect', name: 'Reflexionar', icon: 'ph ph-brain' },
    { id: 'recite', name: 'Recitar', icon: 'ph ph-microphone' },
    { id: 'review', name: 'Repasar', icon: 'ph ph-arrows-counter-clockwise' }
  ];

  constructor() {
    this.authService.loadCurrentUser().subscribe((user) => {
      if (user) {
        void this.router.navigate([user.role === 'Teacher' ? '/teacher/students' : '/dashboard']);
      }
    });
  }

  protected submit(): void {
    if (this.form.invalid || this.loading) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.login(this.form.getRawValue()).subscribe({
      next: (user) => {
        void this.router.navigate([user.role === 'Teacher' ? '/teacher/students' : '/dashboard']);
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error?.error?.message ?? 'No se pudo iniciar sesión.';
      }
    });
  }
}
