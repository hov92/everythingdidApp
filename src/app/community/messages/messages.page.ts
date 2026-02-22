import { CommonModule, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonSearchbar,
  IonSpinner,
  IonBadge,
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { createOutline } from 'ionicons/icons';

import { BuddyBossMessagesService, ThreadRow } from '../../services/buddyboss-messages.service';

@Component({
  standalone: true,
  selector: 'app-messages',
  templateUrl: './messages.page.html',
  styleUrls: ['./messages.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,

    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,

    IonSearchbar,
    IonSpinner,
    IonList,
    IonItem,
    IonLabel,
    IonBadge,
  ],
})
export class MessagesPage {
  q = '';
  loading = false;
  error = '';
  threads: ThreadRow[] = [];

  constructor(private api: BuddyBossMessagesService, private router: Router) {
    addIcons({ createOutline });
  }

  ionViewWillEnter() {
    this.load();
  }

  load(ev?: any) {
    this.loading = !ev;
    this.error = '';

    this.api.listThreads({ per_page: 30, page: 1 }).subscribe({
      next: (rows) => {
        this.threads = Array.isArray(rows) ? rows : [];
        this.loading = false;
        ev?.target?.complete?.();
      },
      error: (e) => {
        this.loading = false;
        this.error = e?.error?.message ?? 'Could not load messages.';
        ev?.target?.complete?.();
      },
    });
  }

  onSearch(ev: any) {
    this.q = (ev?.detail?.value ?? '').toString();
  }

  get filtered(): ThreadRow[] {
    const q = (this.q || '').trim().toLowerCase();
    if (!q) return this.threads;

    return (this.threads || []).filter((t) => {
      const title = String(t?.title || '').toLowerCase();
      const last = String(t?.lastText || '').toLowerCase();
      return title.includes(q) || last.includes(q);
    });
  }

  openThread(t: ThreadRow) {
    // route: /community/messages/:id
    this.router.navigate(['/community/messages', encodeURIComponent(t.id)]);
  }

  compose() {
    // next step: open recipient picker (IG style) then create thread
    console.log('compose');
  }
}