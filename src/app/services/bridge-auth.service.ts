import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class BridgeAuthService {
  // local dev bridge
  private base = 'http://localhost:8787';

  constructor(private http: HttpClient) {}

  async exchangeFirebaseForWpJwt(idToken: string): Promise<{ token: string; user: any }> {
    return await firstValueFrom(
      this.http.post<{ token: string; user: any }>(`${this.base}/auth/firebase`, { idToken })
    );
  }
}