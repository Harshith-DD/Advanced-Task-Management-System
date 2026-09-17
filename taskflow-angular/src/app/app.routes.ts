import { Routes } from '@angular/router';

import { Dashboard } from './dashboard/dashboard';
import { Tasks } from './tasks/tasks';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    component: Dashboard,
  },
  {
    path: 'tasks',
    component: Tasks,
  },
];