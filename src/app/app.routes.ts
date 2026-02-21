import { Routes } from '@angular/router';
import { tabsRoutes } from './tabs/tabs.routes';
import { communityRoutes } from './community/community.routes';

export const routes: Routes = [
  { path: '', redirectTo: 'tabs/home', pathMatch: 'full' },

  {
    path: 'tabs',
    loadComponent: () => import('./tabs/tabs.page').then(m => m.TabsPage),
    children: tabsRoutes,
  },

  // ✅ Community becomes its own section
  {
    path: 'community',
    loadComponent: () =>
      import('./community/community-tabs/community-tabs.page').then(m => m.CommunityTabsPage),
    children: communityRoutes,
  },

  { path: '**', redirectTo: 'tabs/home' },
];