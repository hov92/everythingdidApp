import { CommonModule, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonSpinner,
  IonTextarea,
  IonFooter,
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { arrowBackOutline, sendOutline } from 'ionicons/icons';

import {
  BuddyBossMessagesService,
  ThreadDetail,
  MessageRow,
} from '../../../services/buddyboss-messages.service';

@Component({
  standalone: true,
  selector: 'app-message-thread',
  templateUrl: './thread.page.html',
  styleUrls: ['./thread.page.scss'],
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
    IonSpinner,
    IonTextarea,
    IonFooter,
  ],
})
export class MessageThreadPage {
  threadId = '';
  loading = false;
  error = '';

  title = 'Chat';
  avatar = 'https://www.gravatar.com/avatar/?d=mp&s=96';

  currentUserId = 0;
  messages: MessageRow[] = [];

  text = '';

  constructor(
    private api: BuddyBossMessagesService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    addIcons({ arrowBackOutline, sendOutline });
  }

  ionViewWillEnter() {
    const id = this.route.snapshot.paramMap.get('id');
    this.threadId = id ? decodeURIComponent(id) : '';

    const draft = (this.route.snapshot.queryParamMap.get('draft') || '').toString();
    if (draft) this.text = draft;

    this.load();
  }

  back() {
    this.router.navigateByUrl('/community/messages');
  }

  load() {
    if (!this.threadId) return;

    this.loading = true;
    this.error = '';

    this.api.getThread(this.threadId, { per_page: 30, page: 1 }).subscribe({
      next: (t: ThreadDetail) => {
        this.loading = false;

        this.title = t?.title || 'Chat';
        this.avatar = t?.avatar || this.avatar;
        this.currentUserId = Number(t?.currentUser || 0);

        const rows = Array.isArray(t?.messages) ? t.messages : [];

        // Sort oldest -> newest using the SAME parser used for display
        this.messages = rows.slice().sort((a, b) => {
          const da = (this.parseApiDate(a?.at) ?? new Date(0)).getTime();
          const db = (this.parseApiDate(b?.at) ?? new Date(0)).getTime();
          return da - db;
        });

        this.scrollToBottomSoon();
      },
      error: (e: any) => {
        this.loading = false;
        this.error = e?.error?.message ?? 'Could not load thread.';
      },
    });
  }

  isMine(m: MessageRow) {
    return Number(m?.senderId || 0) === this.currentUserId;
  }

  send() {
    const msg = (this.text || '').trim();
    if (!msg || !this.threadId) return;

    // Optimistic bubble (device local time)
    const optimistic: MessageRow = {
      id: `local-${Date.now()}`,
      threadId: String(this.threadId),
      senderId: this.currentUserId,
      fromMe: true,
      text: msg,
      at: new Date().toISOString(),
    };

    this.messages = [...this.messages, optimistic];
    this.text = '';
    this.scrollToBottomSoon();

    // BuddyBoss reply to existing thread
    this.api.sendMessage({ id: this.threadId, message: msg }).subscribe({
      next: () => this.load(),
      error: (e: any) => {
        this.error = e?.error?.message ?? 'Could not send message.';
      },
    });
  }

  /**
   * ✅ Device-local display, fixes your “+5 hours” issue:
   * BuddyBoss returns strings like "2026-02-22T03:52:00" (NO timezone).
   * That format must be interpreted as UTC, then displayed in device local time.
   *
   * If the string already includes timezone (Z or +/-hh:mm), Date() handles it correctly.
   */
  parseApiDate(input: any): Date | null {
    const s = String(input ?? '').trim();
    if (!s) return null;

    // Already has timezone info -> normal parse
    if (/[zZ]|[+\-]\d{2}:\d{2}$/.test(s)) {
      const d = new Date(s);
      return isNaN(d.getTime()) ? null : d;
    }

    // No timezone -> treat as UTC
    const m = s.match(
      /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/
    );
    if (!m) {
      const d = new Date(s);
      return isNaN(d.getTime()) ? null : d;
    }

    const y = Number(m[1]);
    const mo = Number(m[2]) - 1;
    const day = Number(m[3]);
    const h = Number(m[4]);
    const mi = Number(m[5]);
    const sec = Number(m[6] ?? 0);

    return new Date(Date.UTC(y, mo, day, h, mi, sec));
  }

  shouldShowDay(i: number): boolean {
    if (i === 0) return true;

    const prev = this.parseApiDate(this.messages[i - 1]?.at);
    const cur = this.parseApiDate(this.messages[i]?.at);
    if (!prev || !cur) return false;

    return (
      prev.getFullYear() !== cur.getFullYear() ||
      prev.getMonth() !== cur.getMonth() ||
      prev.getDate() !== cur.getDate()
    );
  }

  dayDate(i: number): Date | null {
    return this.parseApiDate(this.messages[i]?.at);
  }

  private scrollToBottomSoon() {
    setTimeout(() => this.scrollToBottom(), 60);
  }

  private scrollToBottom() {
    const el = document.querySelector('.chat-scroll') as HTMLElement | null;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }
}