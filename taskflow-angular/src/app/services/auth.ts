import {
  Injectable,
  signal
} from '@angular/core';

import {
  HttpClient
} from '@angular/common/http';

import {
  Observable,
  map
} from 'rxjs';

import {
  API_BASE_URL
} from '../api-config';

import {
  User
} from '../user';

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

interface AuthResponse {
  success: boolean;
  data: {
    user: User;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl =
    `${API_BASE_URL}/auth`;

  private readonly currentUser =
    signal<User | null>(null);

  constructor(
    private readonly http: HttpClient
  ) {}

  login(
    credentials: LoginRequest
  ): Observable<User> {
    return this.http
      .post<AuthResponse>(
        `${this.apiUrl}/login`,
        credentials
      )
      .pipe(
        map(response => response.data.user)
      );
  }

  register(
    data: RegisterRequest
  ): Observable<User> {
    return this.http
      .post<AuthResponse>(
        `${this.apiUrl}/register`,
        data
      )
      .pipe(
        map(response => response.data.user)
      );
  }

  getCurrentUser(): Observable<User> {
    return this.http
      .get<AuthResponse>(
        `${this.apiUrl}/me`
      )
      .pipe(
        map(response => response.data.user)
      );
  }

  logout(): Observable<void> {
    return this.http.post<void>(
      `${this.apiUrl}/logout`,
      {}
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
    return this.currentUser() !== null;
  }
}