import { Routes } from '@angular/router';
import { LandingPage } from './features/landing/landing';
import { LoginPage } from './features/auth/login/login';
import { RegisterPage } from './features/auth/register/register';

import { AdminLayout } from './features/admin/admin-layout';
import { AdminOverviewPage } from './features/admin/dashboard/overview';
import { AdminVerificationPage } from './features/admin/verification/verification-queue';
import { AdminUserManagementPage } from './features/admin/users/user-management';
import { AdminActivityPage } from './features/admin/activity/platform-activity';

import { WorkerLayout } from './features/worker/worker-layout';
import { WorkerDashboardOverviewPage } from './features/worker/dashboard/overview';
import { WorkerProfilePage } from './features/worker/profile/profile-management';
import { WorkerVerificationPage } from './features/worker/verification/verification-documents';
import { WorkerHistoryPage } from './features/worker/history/job-history';

import { ClientLayout } from './features/client/client-layout';
import { ClientDashboardPage } from './features/client/client-dashboard';
import { ClientWorkerProfilePage } from './features/client/worker-profile/worker-profile';
import { ClientMessagesPage } from './features/client/messages/messages';
import { ClientBookingsPage } from './features/client/bookings/my-bookings';

import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: '', component: LandingPage },
  { path: 'login', component: LoginPage },
  { path: 'register', component: RegisterPage },
  
  { path: 'workers', redirectTo: 'client/marketplace', pathMatch: 'full' },
  { path: 'clients', redirectTo: 'client', pathMatch: 'full' },
  { path: 'admins', redirectTo: 'admin', pathMatch: 'full' },
  
  { 
    path: 'worker', 
    component: WorkerLayout,
    canActivate: [authGuard],
    data: { role: 'Worker' },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: WorkerDashboardOverviewPage },
      { path: 'profile', component: WorkerProfilePage },
      { path: 'verification', component: WorkerVerificationPage },
      { path: 'history', component: WorkerHistoryPage },
      { path: 'messages', component: ClientMessagesPage }
    ]
  },
  { 
    path: 'client', 
    component: ClientLayout,
    canActivate: [authGuard],
    data: { role: 'Client' },
    children: [
      { path: '', redirectTo: 'marketplace', pathMatch: 'full' },
      { path: 'marketplace', component: ClientDashboardPage },
      { path: 'profile/:id', component: ClientWorkerProfilePage },
      { path: 'messages', component: ClientMessagesPage },
      { path: 'bookings', component: ClientBookingsPage }
    ]
  },
  { 
    path: 'admin', 
    component: AdminLayout,
    canActivate: [authGuard],
    data: { role: 'Admin' },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminOverviewPage },
      { path: 'verification', component: AdminVerificationPage },
      { path: 'users', component: AdminUserManagementPage },
      { path: 'activity', component: AdminActivityPage }
    ]
  }
];
