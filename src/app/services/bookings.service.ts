import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export type BookingServiceItem = { id: number; name: string; vendor: string };

@Injectable({ providedIn: 'root' })
export class BookingsService {
  constructor(private http: HttpClient) {}

  // This will call the WP endpoint we add next:
  services() {
    return this.http.get<BookingServiceItem[]>('/wp-json/ed/v1/booking-services');
  }
}