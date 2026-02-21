import { Routes } from '@angular/router';

export const communityRoutes: Routes = [
  { path: 'tea', loadComponent: () => import('./tea/tea.page').then(m => m.TeaPage) },
  { path: 'threads', loadComponent: () => import('./threads/thread.page').then(m => m.ThreadsPage) },
  { path: 'profile', loadComponent: () => import('./profile/profile.page').then(m => m.ProfilePage) },
  { path: 'messages', loadComponent: () => import('./messages/messages.page').then(m => m.MessagesPage) },

  // shortcut back to main app Home tab
  { path: 'home', redirectTo: '/tabs/home', pathMatch: 'full' },

  // default inside community
  { path: '', redirectTo: 'tea', pathMatch: 'full' },
];