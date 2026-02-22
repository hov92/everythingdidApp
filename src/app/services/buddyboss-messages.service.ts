import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, throwError } from 'rxjs';

type AnyObj = Record<string, any>;

export type ThreadListParams = {
  per_page?: number;
  page?: number;
  box?: 'inbox' | 'sentbox' | 'starred';
  type?: 'all' | 'read' | 'unread';
};

export type ThreadRow = {
  id: string;
  title: string;
  avatar: string;
  lastText: string;
  lastAt: string;     // ISO string from API
  unread: number;
};

export type ThreadDetail = {
  id: string;
  title: string;
  avatar: string;
  currentUser: number;
  unread: number;
  canSend: boolean;
  recipients: Array<{
    user_id: number;
    name: string;
    avatar: string;
  }>;
  messages: MessageRow[];
};

export type MessageRow = {
  id: string;
  threadId: string;
  senderId: number;
  fromMe: boolean;
  text: string;
  at: string;
  senderName?: string;
  senderAvatar?: string;
};

export type SendMessageInput = {
  // Reply to existing thread:
  id?: number | string;

  // Start a new thread:
  recipients?: Array<number | string>;

  // Message content (required)
  message: string;

  // Optional (BuddyBoss uses subject for first message sometimes)
  subject?: string;
};

@Injectable({ providedIn: 'root' })
export class BuddyBossMessagesService {
  constructor(private http: HttpClient) {}

  // BuddyBoss first, fallback BuddyPress
  private bb = {
    threads: (qs = '') => `/wp-json/buddyboss/v1/messages?${qs}`,
    thread: (id: string, qs = '') => `/wp-json/buddyboss/v1/messages/${id}?${qs}`,
    create: () => `/wp-json/buddyboss/v1/messages`,
  };

  private bp = {
    threads: (qs = '') => `/wp-json/buddypress/v1/messages?${qs}`,
    thread: (id: string, qs = '') => `/wp-json/buddypress/v1/messages/${id}?${qs}`,
    create: () => `/wp-json/buddypress/v1/messages`,
  };

  // ---------------- API ----------------

  listThreads(params: ThreadListParams = {}): Observable<ThreadRow[]> {
    const qs = new URLSearchParams({
      per_page: String(params.per_page ?? 20),
      page: String(params.page ?? 1),
      box: String(params.box ?? 'inbox'),
      type: String(params.type ?? 'all'),
    }).toString();

    return this.http.get<any>(this.bb.threads(qs)).pipe(
      catchError(() => this.http.get<any>(this.bp.threads(qs))),
      map((raw) => this.normalizeThreads(raw))
    );
  }

  getThread(threadId: number | string, params: { per_page?: number; page?: number } = {}): Observable<ThreadDetail> {
    const id = String(threadId);
    const qs = new URLSearchParams({
      per_page: String(params.per_page ?? 20),
      page: String(params.page ?? 1),
    }).toString();

    return this.http.get<any>(this.bb.thread(id, qs)).pipe(
      catchError(() => this.http.get<any>(this.bp.thread(id, qs))),
      map((raw) => this.normalizeThreadDetail(raw))
    );
  }

  /**
   * BuddyBoss send:
   * - Reply: POST /messages with { id: threadId, message: "..." }
   * - New:   POST /messages with { recipients: [ids], message: "...", subject?: "..." }
   */
  sendMessage(input: SendMessageInput): Observable<any> {
    const payload: AnyObj = {
      message: String(input.message ?? '').trim(),
    };

    if (!payload['message']) {
      return throwError(() => new Error('Message is required.'));
    }

    if (input.subject) payload['subject'] = String(input.subject);

    if (input.id != null) {
      // reply to existing thread
      payload['id'] = Number(input.id);
    } else {
      // create a new thread
      const recips = Array.isArray(input.recipients) ? input.recipients : [];
      payload['recipients'] = recips.map((x) => Number(x));
    }

    return this.http.post<any>(this.bb.create(), payload).pipe(
      catchError(() => this.http.post<any>(this.bp.create(), payload))
    );
  }

  // Optional: BuddyBoss recipient search (IG “To:” picker)
  searchRecipients(term: string, params: { per_page?: number; page?: number } = {}) {
    const qs = new URLSearchParams({
      term: term,
      per_page: String(params.per_page ?? 20),
      page: String(params.page ?? 1),
    }).toString();

    return this.http.get<any>(`/wp-json/buddyboss/v1/messages/search-recipients?${qs}`);
  }

  // ---------------- Normalizers (based on YOUR real response) ----------------

  private normalizeThreads(raw: any): ThreadRow[] {
    // BuddyBoss list endpoint usually returns an array of thread objects like the one you pasted (minus messages array sometimes)
    const arr: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.['threads']) ? raw['threads'] : [];
    if (!Array.isArray(arr)) return [];

    return arr.map((t) => this.threadToRow(t));
  }

  private threadToRow(t: AnyObj): ThreadRow {
    const id = String(t?.['id'] ?? '');

    const currentUser = Number(t?.['current_user'] ?? 0);

    // recipients is an object keyed by user id in YOUR response
    const recipientsObj = t?.['recipients'];
    const recipientsArr: AnyObj[] =
      recipientsObj && typeof recipientsObj === 'object' ? (Object.values(recipientsObj) as AnyObj[]) : [];

    // pick the “other person” (1:1) for avatar/title
    const other = recipientsArr.find((r) => Number(r?.['user_id'] ?? 0) !== currentUser) || recipientsArr[0] || {};

    const subject = this.htmlToText(t?.['subject']?.['rendered'] ?? '') || 'Message';
    const title = this.safeText(other?.['name']) || subject;

    const avatar =
      other?.['user_avatars']?.['thumb'] ||
      other?.['user_avatars']?.['full'] ||
      t?.['avatar']?.[0]?.['thumb'] ||
      t?.['avatar']?.[0]?.['full'] ||
      'https://www.gravatar.com/avatar/?d=mp&s=96';

    const lastText =
      this.htmlToText(t?.['excerpt']?.['rendered'] ?? '') ||
      this.htmlToText(t?.['message']?.['rendered'] ?? '') ||
      '';

    const lastAt = this.safeText(t?.['date'] ?? t?.['start_date'] ?? '');

    const unread = Number(t?.['unread_count'] ?? 0) || 0;

    return { id, title, avatar, lastText, lastAt, unread };
  }

  private normalizeThreadDetail(t: AnyObj): ThreadDetail {
    const id = String(t?.['id'] ?? '');

    const currentUser = Number(t?.['current_user'] ?? 0);
    const unread = Number(t?.['unread_count'] ?? 0) || 0;
    const canSend = Boolean(t?.['can_send_message']);

    const recipientsObj = t?.['recipients'];
    const recipientsArr: AnyObj[] =
      recipientsObj && typeof recipientsObj === 'object' ? (Object.values(recipientsObj) as AnyObj[]) : [];

    const other = recipientsArr.find((r) => Number(r?.['user_id'] ?? 0) !== currentUser) || recipientsArr[0] || {};

    const subject = this.htmlToText(t?.['subject']?.['rendered'] ?? '') || 'Chat';
    const title = this.safeText(other?.['name']) || subject;

    const avatar =
      other?.['user_avatars']?.['thumb'] ||
      other?.['user_avatars']?.['full'] ||
      t?.['avatar']?.[0]?.['thumb'] ||
      t?.['avatar']?.[0]?.['full'] ||
      'https://www.gravatar.com/avatar/?d=mp&s=96';

    const recipients = recipientsArr.map((r) => ({
      user_id: Number(r?.['user_id'] ?? 0),
      name: this.safeText(r?.['name']) || 'User',
      avatar:
        r?.['user_avatars']?.['thumb'] ||
        r?.['user_avatars']?.['full'] ||
        'https://www.gravatar.com/avatar/?d=mp&s=96',
    }));

    const msgs: AnyObj[] = Array.isArray(t?.['messages']) ? t['messages'] : [];

    const messages: MessageRow[] = msgs
      .map((m) => this.messageToRow(m, currentUser))
      // chat should be oldest -> newest
      .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

    return {
      id,
      title,
      avatar,
      currentUser,
      unread,
      canSend,
      recipients,
      messages,
    };
  }

  private messageToRow(m: AnyObj, currentUser: number): MessageRow {
    const id = String(m?.['id'] ?? m?.['message_id'] ?? '');
    const threadId = String(m?.['thread_id'] ?? '');

    const senderId = Number(m?.['sender_id'] ?? 0);
    const fromMe = senderId === currentUser;

    // prefer raw, fallback rendered html -> text
    const rawText = m?.['message']?.['raw'];
    const rendered = m?.['message']?.['rendered'];
    const text = this.safeText(rawText) || this.htmlToText(rendered ?? '');

    const at = this.safeText(m?.['date_sent'] ?? m?.['date'] ?? '');

    const senderName = this.safeText(m?.['sender_data']?.['sender_name']);
    const senderAvatar =
      m?.['sender_data']?.['user_avatars']?.['thumb'] ||
      m?.['sender_data']?.['user_avatars']?.['full'] ||
      '';

    return {
      id,
      threadId,
      senderId,
      fromMe,
      text,
      at,
      senderName: senderName || undefined,
      senderAvatar: senderAvatar || undefined,
    };
  }

  // ---------------- utils ----------------

  private safeText(v: any): string {
    if (v == null) return '';
    if (typeof v === 'string') return v;
    if (typeof v === 'number' || typeof v === 'boolean') return String(v);
    if (typeof v === 'object') {
      if (typeof v['rendered'] === 'string') return v['rendered'];
      if (typeof v['raw'] === 'string') return v['raw'];
      if (typeof v['name'] === 'string') return v['name'];
    }
    return '';
  }

  private htmlToText(html: string): string {
    return String(html || '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
}