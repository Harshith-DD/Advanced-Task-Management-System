import {
  Injectable,
  computed,
  signal
} from '@angular/core';

import {
  HttpClient
} from '@angular/common/http';

import {
  Observable,
  finalize,
  map,
  of,
  shareReplay,
  tap
} from 'rxjs';

import { API_BASE_URL } from '../api-config';
import { User } from '../user';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  data: {
    user: User;
  };
}

interface RegisterResponse {
  success: boolean;
  data: User;
}

interface CurrentUserResponse {
  success: boolean;
  data: {
    user: User;
  };
}

interface LogoutResponse {
  success: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl =
    `${API_BASE_URL}/auth`;

  readonly currentUser =
    signal<User | null>(null);

  readonly isLoggedIn =
    computed(() => this.currentUser() !== null);

  readonly isAdmin =
    computed(() => this.currentUser()?.role === 'admin');

  readonly isRestoringSession =
    signal(false);

  private sessionRestore$: Observable<User> | null = null;

  constructor(
    private readonly http: HttpClient
  ) {}

  login(
    credentials: LoginRequest
  ): Observable<User> {
    return this.http
      .post<LoginResponse>(
        `${this.apiUrl}/login`,
        credentials
      )
      .pipe(
        map(response => response.data.user),
        tap(user => this.setUser(user))
      );
  }

  register(
    data: RegisterRequest
  ): Observable<User> {
    return this.http
      .post<RegisterResponse>(
        `${this.apiUrl}/register`,
        data
      )
      .pipe(
        map(response => response.data)
      );
  }

  getCurrentUser(): Observable<User> {
    return this.http
      .get<CurrentUserResponse>(
        `${this.apiUrl}/me`
      )
      .pipe(
        map(response => response.data.user)
      );
  }

  restoreSession(): Observable<User> {
    const existingUser =
      this.currentUser();

    if (existingUser) {
      return of(existingUser);
    }

    if (!this.sessionRestore$) {
      this.isRestoringSession.set(true);

      this.sessionRestore$ =
        this.getCurrentUser().pipe(
          tap({
            next: user => this.setUser(user),
            error: () => this.clearUser()
          }),

          finalize(() => {
            this.isRestoringSession.set(false);
            this.sessionRestore$ = null;
          }),

          shareReplay({
            bufferSize: 1,
            refCount: false
          })
        );
    }

    return this.sessionRestore$;
  }

  logout(): Observable<LogoutResponse> {
    return this.http
      .post<LogoutResponse>(
        `${this.apiUrl}/logout`,
        {}
      )
      .pipe(
        tap({
          next: () => this.clearUser(),
          error: () => this.clearUser()
        })
      );
  }

  setUser(user: User): void {
    this.currentUser.set(user);
  }

  clearUser(): void {
    this.currentUser.set(null);
  }

  getUser(): User | null {
    return this.currentUser();
  }

  isAuthenticated(): boolean {
    return this.isLoggedIn();
  }
}