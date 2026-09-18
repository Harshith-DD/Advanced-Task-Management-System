import { inject } from '@angular/core';
import {
  CanActivateFn,
  Router
} from '@angular/router';

import {
  catchError,
  map,
  of
} from 'rxjs';

import { AuthService } from '../services/auth';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  return authService.restoreSession().pipe(
    map(() => true),
    catchError(() => {
      authService.clearUser();
      return of(router.createUrlTree(['/login']));
    })
  );
};

export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return router.createUrlTree(['/dashboard']);
  }

  return authService.restoreSession().pipe(
    map(() => router.createUrlTree(['/dashboard'])),
    catchError(() => {
      authService.clearUser();
      return of(true);
    })
  );
};