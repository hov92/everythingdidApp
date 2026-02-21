import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonList, IonItem, IonLabel, IonButton } from '@ionic/angular/standalone';
import { BookingsService, BookingServiceItem } from '../../services/bookings.service';

@Component({
  standalone: true,
  selector: 'app-book',
  templateUrl: './book.page.html',
  styleUrls: ['./book.page.scss'],
  imports: [CommonModule, IonContent, IonList, IonItem, IonLabel, IonButton]
})
export class BookPage {
  loading = false;
  error = '';
  services: BookingServiceItem[] = [];

  constructor(private bookings: BookingsService) {}

  ionViewWillEnter() {
    this.loading = true;
    this.bookings.services().subscribe({
      next: (rows) => { this.services = rows ?? []; this.loading = false; },
      error: () => { this.error = 'Failed to load services.'; this.loading = false; }
    });
  }

  book(serviceId: number) {
    alert(`Booking flow for service ${serviceId} next (we’ll add slots + checkout).`);
  }
}