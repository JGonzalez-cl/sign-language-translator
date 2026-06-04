// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'translator',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then(m => m.Login),
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register').then(m => m.Register),
  },
  {
    path: '',
    loadComponent: () => import('./layout/main-layout/main-layout').then(m => m.MainLayout),
    canActivate: [authGuard],
    children: [
      {
        path: 'translator',
        children: [
          { path: '', redirectTo: 'live', pathMatch: 'full' },
          {
            path: 'image',
            loadComponent: () => import('./features/translator/image/image').then(m => m.Image),
          },
          {
            path: 'video',
            loadComponent: () => import('./features/translator/video/video').then(m => m.Video),
          },
          {
            path: 'live',
            loadComponent: () => import('./features/translator/live/live').then(m => m.Live),
          },
        ],
      },
      {
        path: 'history',
        children: [
          {
            path: '',
            loadComponent: () => import('./features/history/list/history-list/history-list').then(m => m.HistoryList),
          },
          {
            path: ':id',
            loadComponent: () => import('./features/history/detail/history-detail/history-detail').then(m => m.HistoryDetail),
          },
        ],
      },
      {
        path: 'admin',
        canActivate: [adminGuard],
        children: [
          { path: '', redirectTo: 'users', pathMatch: 'full' },
          {
            path: 'users',
            loadComponent: () => import('./features/admin/users/admin-users/admin-users').then(m => m.AdminUsers),
          },
          {
            path: 'predictions',
            loadComponent: () => import('./features/admin/predictions/admin-predictions/admin-predictions').then(m => m.AdminPredictions),
          },
          {
            path: 'logs',
            loadComponent: () => import('./features/admin/logs/admin-logs/admin-logs').then(m => m.AdminLogs),
          },
          {
            path: 'stats',
            loadComponent: () => import('./features/admin/stats/admin-stats/admin-stats').then(m => m.AdminStats),
          },
        ],
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile').then(m => m.Profile),
      },
      { 
        path: 'stats', 
        loadComponent: () => import('./features/stats/stats').then(m => m.Stats),
      },
    ],
  },
  {
    path: 'unauthorized',
    loadComponent: () => import('./shared/unauthorized/unauthorized').then(m => m.Unauthorized),
  },
  {
    path: '**',
    loadComponent: () => import('./shared/not-found/not-found').then(m => m.NotFound),
  },
];