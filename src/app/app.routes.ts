import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { guestGuard } from './core/guest.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/landing/landing').then(m => m.LandingPage)
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login').then(m => m.LoginPage)
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/register/register').then(m => m.RegisterPage)
  },
  {
    path: 'reset-password',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/password-reset/password-reset.component').then(m => m.PasswordResetComponent)
  },
  {
    path: 'verify-email',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/verify-email/verify-email').then(m => m.VerifyEmailPage)
  },

  { path: 'workers', redirectTo: 'workers/marketplace', pathMatch: 'full' },
  { path: 'clients', redirectTo: 'client', pathMatch: 'full' },
  { path: 'admins', redirectTo: 'admin', pathMatch: 'full' },
  {
    path: 'enterprise',
    loadComponent: () => import('./features/enterprise/enterprise').then(m => m.EnterprisePage)
  },
  {
    path: 'solutions',
    loadComponent: () => import('./features/solutions/solutions').then(m => m.SolutionsPage)
  },

  {
    path: 'worker',
    loadComponent: () => import('./features/worker/worker-layout').then(m => m.WorkerLayout),
    canActivate: [authGuard],
    data: { role: 'Worker' },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/worker/dashboard/overview').then(m => m.WorkerDashboardOverviewPage)
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/worker/profile/profile-management').then(m => m.WorkerProfilePage)
      },
      {
        path: 'verification',
        loadComponent: () => import('./features/worker/verification/verification-documents').then(m => m.WorkerVerificationPage)
      },
      {
        path: 'history',
        loadComponent: () => import('./features/worker/history/job-history').then(m => m.WorkerHistoryPage)
      },
      {
        path: 'messages',
        loadComponent: () => import('./shared/components/messages').then(m => m.SharedMessagesComponent)
      },
      {
        path: 'settings',
        loadComponent: () => import('./shared/components/settings').then(m => m.SharedSettingsPage)
      }
    ]
  },
  {
    path: 'client',
    loadComponent: () => import('./features/client/client-layout').then(m => m.ClientLayout),
    canActivate: [authGuard],
    data: { role: 'Client' },
    children: [
      { path: '', redirectTo: 'marketplace', pathMatch: 'full' },
      {
        path: 'marketplace',
        loadComponent: () => import('./features/client/client-dashboard').then(m => m.ClientDashboardPage)
      },
      {
        path: 'profile/:id',
        loadComponent: () => import('./features/client/worker-profile/worker-profile').then(m => m.ClientWorkerProfilePage)
      },
      {
        path: 'messages',
        loadComponent: () => import('./shared/components/messages').then(m => m.SharedMessagesComponent)
      },
      {
        path: 'bookings',
        loadComponent: () => import('./features/client/bookings/my-bookings').then(m => m.ClientBookingsPage)
      },
      {
        path: 'settings',
        loadComponent: () => import('./shared/components/settings').then(m => m.SharedSettingsPage)
      }
    ]
  },
  {
    path: 'admin',
    loadComponent: () => import('./features/admin/admin-layout').then(m => m.AdminLayout),
    canActivate: [authGuard],
    data: { role: 'Admin' },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/admin/dashboard/overview').then(m => m.AdminOverviewPage)
      },
      {
        path: 'verification',
        loadComponent: () => import('./features/admin/verification/verification-queue').then(m => m.AdminVerificationPage)
      },
      {
        path: 'users',
        loadComponent: () => import('./features/admin/users/user-management').then(m => m.AdminUserManagementPage)
      },
      {
        path: 'activity',
        loadComponent: () => import('./features/admin/activity/platform-activity').then(m => m.AdminActivityPage)
      },
      {
        path: 'messages',
        loadComponent: () => import('./shared/components/messages').then(m => m.SharedMessagesComponent)
      },
      {
        path: 'settings',
        loadComponent: () => import('./shared/components/settings').then(m => m.SharedSettingsPage)
      }
    ]
  },
  // FALLBACK ROUTE
  {
    path: '**',
    redirectTo: '',
  },
];

