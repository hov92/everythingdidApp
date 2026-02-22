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

  draft = '';
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

    this.draft = (this.route.snapshot.queryParamMap.get('draft') || '').toString();
    if (this.draft) this.text = this.draft;

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

        // ✅ your type is currentUser
        this.currentUserId = Number(t?.currentUser || 0);

        // assume service already normalizes MessageRow; keep safe sort
        const rows = Array.isArray(t?.messages) ? t.messages : [];
        this.messages = rows.slice().sort((a, b) => {
          const da = new Date((a as any)?.at || (a as any)?.date || 0).getTime();
          const db = new Date((b as any)?.at || (b as any)?.date || 0).getTime();
          return da - db;
        });

        setTimeout(() => this.scrollToBottom(), 50);
      },
      error: (e: any) => {
        this.loading = false;
        this.error = e?.error?.message ?? 'Could not load thread.';
      },
    });
  }

  isMine(m: MessageRow) {
    // ✅ MessageRow includes senderId
    return Number((m as any)?.senderId || 0) === this.currentUserId;
  }

  send() {
    const msg = (this.text || '').trim();
    if (!msg || !this.threadId) return;

    // ✅ build optimistic row with required fields
    const optimistic: MessageRow = {
      id: `local-${Date.now()}`,
      threadId: this.threadId,
      senderId: this.currentUserId,
      fromMe: true,
      text: msg,
      at: new Date().toISOString(),
    };

    this.messages = [...this.messages, optimistic];
    this.text = '';
    setTimeout(() => this.scrollToBottom(), 10);

    // ✅ call your service the way it is currently defined (1 arg)
    // Most common: sendMessage({ thread_id, message }) OR sendMessage(payload)
    const payload: any = {
      thread_id: this.threadId,
      id: this.threadId,
      message: msg,
      content: msg,
    };

    this.api.sendMessage(payload).subscribe({
      next: () => this.load(),
      error: () => {
        this.error = 'Could not send message.';
      },
    });
  }

  private scrollToBottom() {
    const el = document.querySelector('.chat-scroll') as HTMLElement | null;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }
}