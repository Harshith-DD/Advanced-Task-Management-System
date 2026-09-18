import {
  Component,
  OnInit,
  inject
} from '@angular/core';

import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet
} from '@angular/router';

import { AuthService } from '../../services/auth';
import { NotificationService } from '../../services/notifications';

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
export class AppShell implements OnInit {
  protected readonly authService = inject(AuthService);
  protected readonly notificationService = inject(NotificationService);

  private readonly router = inject(Router);

  ngOnInit(): void {
    this.notificationService.load();
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => this.finishLogout(),
      error: () => this.finishLogout()
    });
  }

  private finishLogout(): void {
    this.authService.clearUser();
    this.notificationService.notifications.set([]);

    this.router.navigate(['/login']);
  }
}