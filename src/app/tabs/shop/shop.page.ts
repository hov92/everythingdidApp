import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonGrid, IonRow, IonCol, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonImg } from '@ionic/angular/standalone';
import { ShopService, StoreProduct } from '../../services/shop.service';

@Component({
  standalone: true,
  selector: 'app-shop',
  templateUrl: './shop.page.html',
  styleUrls: ['./shop.page.scss'],
  imports: [CommonModule, IonContent, IonGrid, IonRow, IonCol, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonImg]
})
export class ShopPage {
  loading = false;
  error = '';
  products: StoreProduct[] = [];

  constructor(private shop: ShopService) {}

  ionViewWillEnter() {
    this.loading = true;
    this.shop.list({ per_page: 12 }).subscribe({
      next: (items) => { this.products = items ?? []; this.loading = false; },
      error: () => { this.error = 'Failed to load products.'; this.loading = false; }
    });
  }

  price(p: StoreProduct) {
    const sym = p.prices?.currency_symbol ?? '$';
    const cents = p.prices?.price ?? '0';
    const val = (Number(cents) / 100).toFixed(2);
    return `${sym}${val}`;
  }
}