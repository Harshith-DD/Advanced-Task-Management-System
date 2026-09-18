import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../services/auth';

type AuthMode = 'login' | 'register';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly mode = signal<AuthMode>('login');
  readonly loginEmail = signal('');
  readonly loginPassword = signal('');
  readonly registerName = signal('');
  readonly registerEmail = signal('');
  readonly registerPassword = signal('');

  readonly loginError = signal('');
  readonly registerError = signal('');
  readonly registrationSuccess = signal('');
  readonly isLoginLoading = signal(false);
  readonly isRegisterLoading = signal(false);

  showRegister(): void {
    this.mode.set('register');
    this.clearMessages();
  }

  showLogin(): void {
    this.mode.set('login');
    this.clearMessages();
  }

  private clearMessages(): void {
    this.loginError.set('');
    this.registerError.set('');
    this.registrationSuccess.set('');
  }

  login(): void {
    this.loginError.set('');
    this.registrationSuccess.set('');
    this.isLoginLoading.set(true);

    this.authService.login({
      email: this.loginEmail().trim(),
      password: this.loginPassword()
    }).pipe(
      finalize(() => this.isLoginLoading.set(false))
    ).subscribe({
      next: user => {
        this.authService.setUser(user);
        this.loginEmail.set('');
        this.loginPassword.set('');
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
    this.isRegisterLoading.set(true);

    this.authService.register({
      name: this.registerName().trim(),
      email: this.registerEmail().trim(),
      password: this.registerPassword()
    }).pipe(
      finalize(() => this.isRegisterLoading.set(false))
    ).subscribe({
      next: () => {
        this.registerName.set('');
        this.registerEmail.set('');
        this.registerPassword.set('');
        this.mode.set('login');
        this.loginEmail.set('');
        this.loginPassword.set('');
        this.loginError.set('');
        this.registerError.set('');
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
