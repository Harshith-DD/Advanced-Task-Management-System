import {
  Component,
  inject
} from '@angular/core';

import {
  FormsModule
} from '@angular/forms';

import {
  Router
} from '@angular/router';

import {
  AuthService
} from '../services/auth';

type AuthMode =
  | 'login'
  | 'register';

@Component({
  selector: 'app-login',
  imports: [
    FormsModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  private readonly authService =
    inject(AuthService);

  private readonly router =
    inject(Router);

  mode: AuthMode = 'login';

  loginEmail = '';
  loginPassword = '';

  registerName = '';
  registerEmail = '';
  registerPassword = '';

  loginError = '';
  registerError = '';

  registrationSuccess = '';

  isLoading = false;

  showRegister(): void {
    this.mode = 'register';

    this.loginError = '';
    this.registerError = '';
    this.registrationSuccess = '';
  }

  showLogin(): void {
    this.mode = 'login';

    this.loginError = '';
    this.registerError = '';
    this.registrationSuccess = '';
  }

  login(): void {
    this.loginError = '';
    this.isLoading = true;

    this.authService.login({
      email: this.loginEmail.trim(),
      password: this.loginPassword
    }).subscribe({
      next: user => {
        this.authService.setUser(user);

        this.loginEmail = '';
        this.loginPassword = '';

        this.isLoading = false;

        this.router.navigate([
          '/dashboard'
        ]);
      },

      error: error => {
        console.error(
          'Login failed:',
          error
        );

        this.loginError =
          error.error?.message ??
          'Login failed. Please check your credentials.';

        this.isLoading = false;
      }
    });
  }

  register(): void {
    this.registerError = '';
    this.registrationSuccess = '';
    this.isLoading = true;

    this.authService.register({
      name: this.registerName.trim(),
      email: this.registerEmail.trim(),
      password: this.registerPassword
    }).subscribe({
      next: () => {
        this.registerName = '';
        this.registerEmail = '';
        this.registerPassword = '';

        this.registrationSuccess =
          'Registration successful. Please log in.';

        this.isLoading = false;
      },

      error: error => {
        console.error(
          'Registration failed:',
          error
        );

        this.registerError =
          error.error?.message ??
          'Registration failed. Please try again.';

        this.isLoading = false;
      }
    });
  }
}