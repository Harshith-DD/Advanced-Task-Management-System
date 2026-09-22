import { Component, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../services/auth';

type AuthMode = 'login' | 'register';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly mode = signal<AuthMode>('login');
  readonly loginError = signal('');
  readonly registerError = signal('');
  readonly registrationSuccess = signal('');
  readonly isLoginLoading = signal(false);
  readonly isRegisterLoading = signal(false);

  readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  readonly registerForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  showRegister(): void {
    this.mode.set('register');
    this.clearMessages();
    this.registerForm.reset();
  }

  showLogin(): void {
    this.mode.set('login');
    this.clearMessages();
    this.loginForm.reset();
  }

  private clearMessages(): void {
    this.loginError.set('');
    this.registerError.set('');
    this.registrationSuccess.set('');
  }

  login(): void {
    this.loginError.set('');
    this.registrationSuccess.set('');

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoginLoading.set(true);
    const { email, password } = this.loginForm.getRawValue();

    this.authService
      .login({
        email: email.trim(),
        password
      })
      .pipe(finalize(() => this.isLoginLoading.set(false)))
      .subscribe({
        next: () => {
          this.loginForm.reset();
          this.router.navigate(['/dashboard']);
        },
        error: error => {
          console.error('Login failed:', error);
          this.loginError.set(
            error?.error?.error?.message ??
            error?.error?.message ??
            'Login failed. Please check your credentials.'
          );
        }
      });
  }

  register(): void {
    this.registerError.set('');
    this.registrationSuccess.set('');

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isRegisterLoading.set(true);
    const { name, email, password } = this.registerForm.getRawValue();

    this.authService
      .register({
        name: name.trim(),
        email: email.trim(),
        password
      })
      .pipe(finalize(() => this.isRegisterLoading.set(false)))
      .subscribe({
        next: () => {
          this.registerForm.reset();
          this.loginForm.reset({
            email: email.trim(),
            password: ''
          });
          this.mode.set('login');
          this.registrationSuccess.set(
            'Registration successful. Please log in.'
          );
        },
        error: error => {
          console.error('Registration failed:', error);
          this.registerError.set(
            error?.error?.error?.message ??
            error?.error?.message ??
            'Registration failed. Please try again.'
          );
        }
      });
  }
}
