import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent } from '@ionic/angular/standalone';

@Component({
  standalone: true,
  selector: 'app-community-messages',
  template: `<ion-content class="ion-padding">Messages</ion-content>`,
  imports: [CommonModule, IonContent],
})
export class MessagesPage {}