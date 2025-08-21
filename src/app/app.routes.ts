import { Routes } from '@angular/router';
import { authGuard } from './shared/guards/auth.guard';
import { loginGuard } from './shared/guards/login.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./shared/components/main-layout/main-layout.component').then(
        (m) => m.MainLayoutComponent
      ),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'config',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.page').then(
            (m) => m.DashboardPage
          ),
      },
      {
        path: 'scanner',
        loadComponent: () =>
          import('./features/scanner/scanner.page').then((m) => m.ScannerPage),
      },
      {
        path: 'config',
        loadComponent: () =>
          import('./features/config/config-simple.page').then(
            (m) => m.ConfigSimplePage
          ),
      },
    ],
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login.page').then((m) => m.LoginPage),
    canActivate: [loginGuard],
  },
  {
    path: 'scanner',
    loadComponent: () =>
      import('./features/scanner/scanner.page').then((m) => m.ScannerPage),
  },
];
