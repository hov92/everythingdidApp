import { Routes } from '@angular/router';

// IMPORTANT:
// This file should ONLY define the child routes inside TabsPage.
// TabsPage is loaded by '/tabs' in app.routes.ts.
// If you load TabsPage here too, you'll get 2 tab bars.

export const tabsRoutes: Routes = [
  { path: 'home', loadComponent: () => import('./home/home.page').then(m => m.HomePage) },
  { path: 'book', loadComponent: () => import('./book/book.page').then(m => m.BookPage) },
  { path: 'shop', loadComponent: () => import('./shop/shop.page').then(m => m.ShopPage) },
  { path: 'account', loadComponent: () => import('./account/account.page').then(m => m.AccountPage) },
  { path: 'community', redirectTo: '/community/tea', pathMatch: 'full' },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
];