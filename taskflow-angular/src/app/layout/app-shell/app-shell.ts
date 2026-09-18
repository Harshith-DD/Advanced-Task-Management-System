import {
  Component,
  OnDestroy,
  OnInit,
  inject
} from '@angular/core';

import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet
} from '@angular/router';

import {
  Subject,
  takeUntil
} from 'rxjs';

import { AuthService } from '../../services/auth';
import {
  NotificationService
} from '../../services/notifications';
import {
  TaskStateService
} from '../../services/task-state';

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
export class AppShell
  implements OnInit, OnDestroy
{
  protected readonly authService =
    inject(AuthService);

  protected readonly notificationService =
    inject(NotificationService);

  private readonly taskState =
    inject(TaskStateService);

  private readonly router =
    inject(Router);

  private readonly destroy$ =
    new Subject<void>();

  ngOnInit(): void {

    this.notificationService
      .loadIfNeeded()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: error => {
          console.error(
            'Failed to load notifications:',
            error
          );
        }
      });
  }

  logout(): void {
    this.authService
      .logout()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.finishLogout(),
        error: error => {

          console.error(
            'Logout request failed:',
            error
          );

          this.finishLogout();
        }
      });
  }

  private finishLogout(): void {

    this.authService.clearUser();
    this.notificationService.clear();
    this.taskState.reset();

    this.router.navigate(['/login']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}