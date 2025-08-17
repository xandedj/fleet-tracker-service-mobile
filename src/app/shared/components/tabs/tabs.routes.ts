import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('../../../features/dashboard/dashboard.page').then(
            (m) => m.DashboardPage
          ),
      },
      {
        path: 'scanner',
        loadComponent: () =>
          import('../../../features/scanner/scanner.page').then(
            (m) => m.ScannerPage
          ),
      },
      {
        path: 'config',
        loadComponent: () =>
          import('../../../features/config/config.page').then(
            (m) => m.ConfigPage
          ),
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
];
