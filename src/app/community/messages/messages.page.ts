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
  IonItem,
  IonLabel,
  IonList,
  IonSearchbar,
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { addOutline, chatbubblesOutline, paperPlaneOutline } from 'ionicons/icons';

type Recipient = { id: number | string; name: string; avatar?: string };
type OutboxItem = { to: Recipient; url: string; postId: string; sentAt: string };

type Msg = { id: string; fromMe: boolean; text: string; at: string };
type Thread = { id: string; peer: Recipient; lastText: string; lastAt: string; unread?: number; messages: Msg[] };

const OUTBOX_KEY = 'ed_dm_outbox';
const THREADS_KEY = 'ed_dm_threads';

function safeJson<T>(raw: string | null, fallback: T): T {
  try { return raw ? (JSON.parse(raw) as T) : fallback; } catch { return fallback; }
}

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
    IonList,
    IonItem,
    IonLabel,
    IonSearchbar,
  ],
})
export class MessagesPage {
  q = '';
  threads: Thread[] = [];
  outbox: OutboxItem[] = [];

  constructor(private router: Router) {
    addIcons({ addOutline, chatbubblesOutline, paperPlaneOutline });
  }

  ionViewWillEnter() {
    this.load();
  }

  load() {
    this.outbox = safeJson<OutboxItem[]>(localStorage.getItem(OUTBOX_KEY), []);
    this.threads = safeJson<Thread[]>(localStorage.getItem(THREADS_KEY), []);
    // newest first
    this.threads.sort((a, b) => (b.lastAt || '').localeCompare(a.lastAt || ''));
  }

  get filteredThreads() {
    const q = (this.q || '').trim().toLowerCase();
    if (!q) return this.threads;
    return this.threads.filter(t =>
      (t.peer?.name || '').toLowerCase().includes(q) ||
      (t.lastText || '').toLowerCase().includes(q)
    );
  }

  // Convert outbox “sent link” into a real local thread (so it looks like DM exists)
  acceptOutbox(item: OutboxItem) {
    const threads = safeJson<Thread[]>(localStorage.getItem(THREADS_KEY), []);

    const peer = item.to;
    const tid = `peer:${peer.id}`;

    let thread = threads.find(t => t.id === tid);
    if (!thread) {
      thread = {
        id: tid,
        peer,
        lastText: '',
        lastAt: '',
        unread: 0,
        messages: [],
      };
      threads.unshift(thread);
    }

    const msg: Msg = {
      id: `m-${Date.now()}`,
      fromMe: true,
      text: item.url,
      at: item.sentAt,
    };

    thread.messages.unshift(msg);
    thread.lastText = 'Shared a post';
    thread.lastAt = item.sentAt;

    localStorage.setItem(THREADS_KEY, JSON.stringify(threads));

    // remove from outbox
    const outbox = safeJson<OutboxItem[]>(localStorage.getItem(OUTBOX_KEY), []);
    const next = outbox.filter(x => !(x.sentAt === item.sentAt && String(x.to?.id) === String(item.to?.id)));
    localStorage.setItem(OUTBOX_KEY, JSON.stringify(next));

    this.load();
    this.openThread(thread);
  }

  openThread(t: Thread) {
    this.router.navigate(['/community/messages', encodeURIComponent(t.id)]);
  }

  newMessage() {
    // We’ll reuse your existing “recipient picker” idea later.
    // For now, this just goes to Messages list; you can add a picker next.
    this.router.navigateByUrl('/community/messages');
  }
}