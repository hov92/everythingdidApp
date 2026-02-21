import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class BuddyBossService {
  constructor(private http: HttpClient) {}

  timeline(params: any = {}) {
    const qs = new URLSearchParams(params).toString();
    const bb = `/wp-json/buddyboss/v1/activity${qs ? `?${qs}` : ''}`;
    const bp = `/wp-json/buddypress/v1/activity${qs ? `?${qs}` : ''}`;

    return this.http.get<any[]>(bb).pipe(
      catchError(() => this.http.get<any[]>(bp))
    );
  }

  postUpdate(content: string) {
    const bb = `/wp-json/buddyboss/v1/activity`;
    const bp = `/wp-json/buddypress/v1/activity`;

    return this.http.post(bb, { content }).pipe(
      catchError(() => this.http.post(bp, { content }))
    );
  }
}