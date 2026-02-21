import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export type StoreProduct = {
  id: number;
  name: string;
  prices?: { price: string; regular_price?: string; sale_price?: string; currency_symbol?: string };
  images?: { src: string }[];
};

@Injectable({ providedIn: 'root' })
export class ShopService {
  constructor(private http: HttpClient) {}

  list(params: any = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.http.get<StoreProduct[]>(`/wp-json/wc/store/v1/products?${qs}`);
  }
}