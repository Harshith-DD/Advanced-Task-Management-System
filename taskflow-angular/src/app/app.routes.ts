import {
  Routes
} from '@angular/router';

import {
  Dashboard
} from './dashboard/dashboard';

import {
  Login
} from './login/login';

import {
  Tasks
} from './tasks/tasks';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },

  {
    path: 'login',
    component: Login
  },

  {
    path: 'dashboard',
    component: Dashboard
  },

  {
    path: 'tasks',
    component: Tasks
  }
];