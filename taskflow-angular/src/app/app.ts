import {
  Component,
  inject,
  OnInit,
  signal
} from '@angular/core';

import {
  Router,
  RouterLink,
  RouterOutlet
} from '@angular/router';

import {
  AuthService
} from './services/auth';

@Component({
  selector: 'app-root',
  imports: [
    RouterLink,
    RouterOutlet
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('TaskFlow');

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.restoreSession();
  }

  private restoreSession(): void {
    this.authService.restoreSession().subscribe({
      next: user => {
        this.authService.setUser(user);
      },

      error: () => {
        this.authService.clearUser();
      }
    });
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.authService.clearUser();
        this.router.navigate(['/login']);
      },

      error: error => {
        console.error('Logout failed:', error);
      }
    });
  }

  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }
}