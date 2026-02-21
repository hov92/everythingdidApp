import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import {
  IonTabs,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { bag, calendar, home, people, person, logoGoogle, logoFacebook } from 'ionicons/icons';

@Component({
  standalone: true,
  selector: 'app-tabs',
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
  imports: [
    CommonModule,
    RouterLink,          // ✅ required because you use [routerLink]
    IonTabs,
    IonRouterOutlet,     // ✅ required for <ion-router-outlet>
    IonTabBar,
    IonTabButton,
    IonIcon,
    IonLabel
  ],
})
export class TabsPage {
  constructor(private router: Router) {
    addIcons({ home, calendar, bag, people, person, logoGoogle, logoFacebook });
  }

  goCommunity(ev?: Event) {
    ev?.preventDefault();
    ev?.stopPropagation();
    this.router.navigateByUrl('/community/tea');
  }
}
