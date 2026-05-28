// src/app/features/auth/register/register.ts
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  form: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    nombre_usuario: ['', [Validators.required, Validators.minLength(3)]],
    nombre: ['', Validators.required],
    apellidos: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  loading = signal(false);
  errorMessage = signal('');

  get email() { return this.form.get('email')!; }
  get nombre_usuario() { return this.form.get('nombre_usuario')!; }
  get nombre() { return this.form.get('nombre')!; }
  get apellidos() { return this.form.get('apellidos')!; }
  get password() { return this.form.get('password')!; }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.authService.register(this.form.value).subscribe({
      next: () => this.router.navigate(['/translator']),
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.detail ?? 'Error al registrarse. Inténtalo de nuevo.');
      },
    });
  }
}