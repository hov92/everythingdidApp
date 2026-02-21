import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonTabs,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { flameOutline, newspaperOutline, homeOutline, chatbubblesOutline, personOutline } from 'ionicons/icons';

@Component({
  standalone: true,
  selector: 'app-community-tabs',
  templateUrl: './community-tabs.page.html',
  styleUrls: ['./community-tabs.page.scss'],
  imports: [
    CommonModule,
    RouterLink,
    IonTabs,
    IonRouterOutlet,
    IonTabBar,
    IonTabButton,
    IonIcon,
    IonLabel,
  ],
})
export class CommunityTabsPage {
  constructor() {
    addIcons({
      flameOutline,
      newspaperOutline,
      homeOutline,
      chatbubblesOutline,
      personOutline,
    });
  }
}