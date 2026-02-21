import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private key = 'jwt';
  constructor(private http: HttpClient) {}

  login(username: string, password: string) {
    return this.http
      .post<any>('/wp-json/jwt-auth/v1/token', { username, password })
      .pipe(tap(res => localStorage.setItem(this.key, res.token)));
  }

  token() { return localStorage.getItem(this.key) ?? ''; }
  logout() { localStorage.removeItem(this.key); }
}