import {
  Component,
  effect,
  inject
} from '@angular/core';

import {
  RouterOutlet
} from '@angular/router';

import { AuthService } from './services/auth';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private readonly authService = inject(AuthService);

  constructor() {
    effect(() => {
      document.body.classList.toggle(
        'is-authenticated',
        this.authService.isLoggedIn()
      );
    });
  }
}