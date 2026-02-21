import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent } from '@ionic/angular/standalone';

@Component({
  standalone: true,
  selector: 'app-threads',
  template: `<ion-content class="ion-padding">Threads</ion-content>`,
  imports: [CommonModule, IonContent],
})
export class ThreadsPage {}