import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent } from '@ionic/angular/standalone';

@Component({
  standalone: true,
  selector: 'app-community-profile',
  template: `<ion-content class="ion-padding">Profile</ion-content>`,
  imports: [CommonModule, IonContent],
})
export class ProfilePage {}