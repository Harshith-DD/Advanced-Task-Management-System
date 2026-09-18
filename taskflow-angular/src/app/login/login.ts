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

  email = '';
  password = '';

  errorMessage = '';
  isLoading = false;

  login(): void {
    this.errorMessage = '';
    this.isLoading = true;

    this.authService.login({
      email: this.email,
      password: this.password
    }).subscribe({
      next: user => {
        this.authService.setUser(user);

        this.router.navigate(['/tasks']);
      },

      error: error => {
        console.error(
          'Login failed:',
          error
        );

        this.errorMessage =
          error.error?.message ??
          'Login failed. Please check your credentials.';

        this.isLoading = false;
      }
    });
  }
}