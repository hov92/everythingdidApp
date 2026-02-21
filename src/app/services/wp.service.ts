import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class WpService {
  constructor(private http: HttpClient) {}
  me() {
    return this.http.get<any>('/wp-json/wp/v2/users/me');
  }
}