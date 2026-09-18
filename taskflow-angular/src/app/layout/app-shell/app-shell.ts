import { Component, inject } from '@angular/core';

import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet
} from '@angular/router';

import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-shell',
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet
  ],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.css'
})
export class AppShell {
  protected readonly authService = inject(AuthService);

  private readonly router = inject(Router);

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.authService.clearUser();
        this.router.navigate(['/login']);
      },

      error: error => {
        console.error('Logout failed:', error);
        this.authService.clearUser();
        this.router.navigate(['/login']);
      }
    });
  }
}