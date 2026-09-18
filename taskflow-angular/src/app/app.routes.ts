import { Routes } from '@angular/router';

import { Dashboard } from './dashboard/dashboard';
import { Login } from './login/login';
import { Tasks } from './tasks/tasks';
import { Activity } from './activity/activity';
import { Notifications } from './notifications/notifications';
import { Reports } from './reports/reports';
import { AppShell } from './layout/app-shell/app-shell';

import { authGuard, guestGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard'
  },

  {
    path: 'login',
    component: Login,
    canActivate: [guestGuard]
  },

  {
    path: '',
    component: AppShell,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        component: Dashboard
      },
      {
        path: 'tasks',
        component: Tasks
      },
      {
        path: 'activity',
        component: Activity
      },
      {
        path: 'notifications',
        component: Notifications
      },
      {
        path: 'reports',
        component: Reports
      },

      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard'
      }
    ]
  },

  {
    path: '**',
    redirectTo: 'dashboard'
  }
];