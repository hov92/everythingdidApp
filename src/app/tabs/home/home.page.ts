import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { IonContent, IonHeader, IonItem, IonLabel, IonList, IonToolbar } from '@ionic/angular/standalone';

@Component({
  standalone: true,
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  imports: [IonToolbar, IonHeader, CommonModule, IonContent, IonList, IonItem, IonLabel],
})
export class HomePage {
  items = [
    { author: 'Welcome', content: 'EverythingDid app is running ✅', date: new Date().toISOString() }
  ];
}