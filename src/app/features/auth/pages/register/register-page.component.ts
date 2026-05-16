import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-register-page',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register-page.component.html',
  styleUrl: './register-page.component.css'
})
export class RegisterPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly form = this.formBuilder.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    username: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    grade: [1 as number | null],
    section: ['']
  });

  protected readonly gradeOptions = [1, 2];
  protected readonly pq4rSteps = [
    {
      id: 'preview',
      name: 'Preview',
      description: 'Explora el texto antes de leer.'
    },
    {
      id: 'question',
      name: 'Question',
      description: 'Convierte ideas en preguntas.'
    },
    {
      id: 'read',
      name: 'Read',
      description: 'Lee con propósito y atención.'
    },
    {
      id: 'reflect',
      name: 'Reflect',
      description: 'Relaciona y analiza lo leído.'
    },
    {
      id: 'recite',
      name: 'Recite',
      description: 'Explica con tus palabras.'
    },
    {
      id: 'review',
      name: 'Review',
      description: 'Repasa y consolida tu avance.'
    }
  ];
  protected readonly valuePropositions = [
    { id: 'adaptability', label: 'Adaptabilidad IA' },
    { id: 'methodology', label: 'Metodología Científica' },
    { id: 'results', label: 'Resultados Medibles' }
  ];

  protected loading = false;
  protected submitted = false;
  protected showPassword = false;
  protected errorMessage = '';
  protected successMessage = '';

  protected togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  protected submit(): void {
    this.submitted = true;

    if (this.form.invalid || this.loading) {
      this.form.markAllAsTouched();

      if (this.form.invalid) {
        this.errorMessage = this.validationSummary();
      }

      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const value = this.form.getRawValue();

    this.authService
      .registerStudent({
        fullName: value.fullName?.trim() ?? '',
        username: value.username?.trim() ?? '',
        password: value.password ?? '',
        grade: 1,
        section: value.section?.trim() || null
      })
      .subscribe({
        next: () => {
          this.loading = false;
          this.submitted = false;
          this.successMessage = 'Cuenta creada correctamente. Ahora puedes iniciar sesión.';
          this.form.reset({
            fullName: '',
            username: '',
            password: '',
            grade: 1,
            section: ''
          });

          setTimeout(() => {
            void this.router.navigate(['/login']);
          }, 900);
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error?.error?.message ?? 'No se pudo completar el registro.';
        }
      });
  }

  protected validationSummary(): string {
    const missingFields: string[] = [];
    const fullName = this.form.controls.fullName;
    const username = this.form.controls.username;
    const password = this.form.controls.password;

    if (fullName.invalid) {
      missingFields.push('nombre completo');
    }

    if (username.invalid) {
      missingFields.push('usuario');
    }

    if (password.invalid) {
      missingFields.push('contraseña de al menos 8 caracteres');
    }

    if (missingFields.length === 0) {
      return 'Completa los campos requeridos antes de registrar.';
    }

    if (missingFields.length === 1) {
      return `Falta completar ${missingFields[0]} para registrar la cuenta.`;
    }

    const lastField = missingFields.pop();
    return `Faltan ${missingFields.join(', ')} y ${lastField} para registrar la cuenta.`;
  }
}
