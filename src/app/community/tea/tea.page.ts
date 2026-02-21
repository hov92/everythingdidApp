import { CommonModule, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonRefresher,
  IonRefresherContent,
  IonSearchbar,
  IonSpinner,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';

import { ActionSheetController, ToastController } from '@ionic/angular';

import { addIcons } from 'ionicons';
import {
  heartOutline,
  heart,
  chatbubbleOutline,
  ellipsisHorizontal,
  shareOutline,
  repeatOutline,
  imageOutline,
  closeCircle,
  sendOutline,
  closeOutline,
  personCircleOutline,
  linkOutline,
} from 'ionicons/icons';

import { BuddyBossService } from '../../services/buddyboss.service';

type AnyObj = Record<string, any>;
type MediaItem = { url: string; kind: 'image' | 'video' };
type Recipient = { id: number | string; name: string; avatar?: string };

@Component({
  standalone: true,
  selector: 'app-tea',
  templateUrl: './tea.page.html',
  styleUrls: ['./tea.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,

    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,

    IonTextarea,
    IonButton,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,

    IonRefresher,
    IonRefresherContent,
    IonSpinner,

    IonModal,
    IonSearchbar,
  ],
})
export class TeaPage {
  // Composer
  text = '';
  attachments: MediaItem[] = [];

  // Feed
  feed: AnyObj[] = [];
  loading = false;
  error = '';

  // Local UI-only likes
  private likedIds = new Set<string>();

  // Share / Send
  private shareItem: AnyObj | null = null;

  // Recipient picker modal
  pickerOpen = false;
  pickerQuery = '';
  pickerLoading = false;
  pickerError = '';
  recipients: Recipient[] = [];

  constructor(
    private bb: BuddyBossService,
    private http: HttpClient,
    private router: Router,
    private actionSheet: ActionSheetController,
    private toastCtrl: ToastController
  ) {
    addIcons({
      heartOutline,
      heart,
      chatbubbleOutline,
      ellipsisHorizontal,
      shareOutline,
      repeatOutline,
      imageOutline,
      closeCircle,
      sendOutline,
      closeOutline,
      personCircleOutline,
      linkOutline,
    });
  }

  ionViewWillEnter() {
    this.refresh();
  }

  refresh(ev?: any) {
    this.error = '';
    this.loading = !ev;

    this.bb.timeline({ per_page: 20 }).subscribe({
      next: (rows) => {
        this.feed = Array.isArray(rows) ? rows : [];
        this.loading = false;
        ev?.target?.complete?.();
      },
      error: (e) => {
        this.feed = [];
        this.loading = false;
        this.error = e?.error?.message ?? 'Could not load Tea feed.';
        ev?.target?.complete?.();
      },
    });
  }

  // ===== Composer =====

  post() {
    const content = (this.text || '').trim();
    if (!content && !this.attachments.length) return;

    this.error = '';
    this.loading = true;

    // NOTE: attachments are preview-only for now; server upload wiring comes next.
    this.bb.postUpdate(content || ' ').subscribe({
      next: () => {
        this.text = '';
        this.clearAttachments();
        this.refresh();
      },
      error: (e) => {
        this.loading = false;
        this.error = e?.error?.message ?? 'Failed to post.';
      },
    });
  }

  onPickMediaClick(fileInput: HTMLInputElement) {
    fileInput.click();
  }

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    input.value = '';

    for (const f of files) {
      const url = URL.createObjectURL(f);
      const kind: MediaItem['kind'] = f.type.startsWith('video') ? 'video' : 'image';
      this.attachments.push({ url, kind });
    }
  }

  removeAttachment(i: number) {
    const item = this.attachments[i];
    if (item?.url?.startsWith('blob:')) URL.revokeObjectURL(item.url);
    this.attachments.splice(i, 1);
  }

  clearAttachments() {
    for (const a of this.attachments) {
      if (a.url?.startsWith('blob:')) URL.revokeObjectURL(a.url);
    }
    this.attachments = [];
  }

  // ===== Feed helpers =====

  idOf(item: AnyObj): string {
    const id = item?.['id'] ?? item?.['activity_id'] ?? item?.['ID'] ?? `${this.authorOf(item)}-${this.dateOf(item)}`;
    return String(id);
  }

  authorOf(item: AnyObj): string {
    return (
      item?.['user_name'] ??
      item?.['display_name'] ??
      item?.['name'] ??
      item?.['user']?.['name'] ??
      item?.['user']?.['display_name'] ??
      item?.['user']?.['user_display_name'] ??
      'User'
    );
  }

  avatarOf(item: AnyObj): string {
    return (
      item?.['user_avatar'] ??
      item?.['user']?.['avatar_urls']?.['96'] ??
      item?.['user']?.['avatar_urls']?.['48'] ??
      item?.['avatar_urls']?.['96'] ??
      item?.['avatar_urls']?.['48'] ??
      item?.['avatar'] ??
      'https://www.gravatar.com/avatar/?d=mp&s=96'
    );
  }

  dateOf(item: AnyObj): string {
    return (
      item?.['date'] ??
      item?.['date_gmt'] ??
      item?.['created_at'] ??
      item?.['created'] ??
      item?.['time'] ??
      ''
    );
  }

  contentHtmlOf(item: AnyObj): string {
    const c =
      item?.['content']?.['rendered'] ??
      item?.['content_html'] ??
      item?.['action'] ??
      item?.['content'] ??
      item?.['message'] ??
      '';
    return typeof c === 'string' ? c : '';
  }

  // “Correct media parsing”: tries common API shapes FIRST, then HTML extraction as fallback.
  mediaOf(item: AnyObj): MediaItem[] {
    const out: MediaItem[] = [];

    // 1) Common BuddyBoss/BuddyPress shapes (arrays of objects)
    const candidates =
      item?.['media'] ??
      item?.['media_items'] ??
      item?.['attachments'] ??
      item?.['bp_media'] ??
      item?.['bb_media'] ??
      item?.['media_list'] ??
      null;

    if (Array.isArray(candidates)) {
      for (const m of candidates) {
        const url =
          m?.url ??
          m?.src ??
          m?.source_url ??
          m?.['source_url'] ??
          m?.['full'] ??
          m?.['full_url'] ??
          m?.['media_url'] ??
          m?.['guid']?.['rendered'] ??
          '';
        if (!url) continue;

        const kind: MediaItem['kind'] =
          (m?.type && String(m.type).includes('video')) || this.isVideoUrl(url) ? 'video' : 'image';

        out.push({ url, kind });
      }
    }

    // 2) Sometimes media is a single object
    const single =
      item?.['media_item'] ??
      item?.['attachment'] ??
      item?.['featured_media'] ??
      null;

    if (single && typeof single === 'object') {
      const url =
        single?.url ??
        single?.src ??
        single?.source_url ??
        single?.['source_url'] ??
        single?.['guid']?.['rendered'] ??
        '';
      if (url) out.push({ url, kind: this.isVideoUrl(url) ? 'video' : 'image' });
    }

    // 3) HTML parsing fallback
    const html = this.contentHtmlOf(item);
    if (html) {
      // <img src="">
      const imgRe = /<img[^>]+src=["']([^"']+)["']/gi;
      let m: RegExpExecArray | null;
      while ((m = imgRe.exec(html))) out.push({ url: m[1], kind: 'image' });

      // <video src="">
      const videoRe = /<video[^>]+src=["']([^"']+)["']/gi;
      while ((m = videoRe.exec(html))) out.push({ url: m[1], kind: 'video' });

      // <source src="">
      const sourceRe = /<source[^>]+src=["']([^"']+)["']/gi;
      while ((m = sourceRe.exec(html))) {
        const url = m[1];
        out.push({ url, kind: this.isVideoUrl(url) ? 'video' : 'image' });
      }

      // links to direct media (common when content is just an <a>)
      const hrefRe = /<a[^>]+href=["']([^"']+)["'][^>]*>/gi;
      while ((m = hrefRe.exec(html))) {
        const url = m[1];
        if (this.isMediaUrl(url)) out.push({ url, kind: this.isVideoUrl(url) ? 'video' : 'image' });
      }
    }

    // Unique + clean
    const seen = new Set<string>();
    return out
      .map((x) => ({ url: this.cleanUrl(x.url), kind: x.kind }))
      .filter((x) => x.url && !seen.has(x.url) && (seen.add(x.url), true));
  }

  private cleanUrl(url: string) {
    return String(url || '').replace(/&amp;/g, '&').trim();
  }

  private isVideoUrl(url: string) {
    return /\.(mp4|webm|mov|m4v|ogg)(\?.*)?$/i.test(url);
  }

  private isMediaUrl(url: string) {
    return /\.(png|jpe?g|gif|webp|mp4|webm|mov|m4v|ogg)(\?.*)?$/i.test(url);
  }

  snippetOf(item: AnyObj): string {
    const html = this.contentHtmlOf(item);
    const text = String(html)
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    return text.length > 240 ? text.slice(0, 240).trim() + '…' : text;
  }

  // ===== Actions =====

  isLiked(item: AnyObj) {
    return this.likedIds.has(this.idOf(item));
  }

  toggleLike(item: AnyObj) {
    const id = this.idOf(item);
    this.likedIds.has(id) ? this.likedIds.delete(id) : this.likedIds.add(id);
  }

  openMenu(item: AnyObj) {
    console.log('menu:', this.idOf(item), item);
  }

  openThread(item: AnyObj) {
    this.router.navigateByUrl(`/community/thread/${encodeURIComponent(this.idOf(item))}`);
  }

  shareUrlOf(item: AnyObj): string {
    const id = this.idOf(item);
    return `https://everythingdid.com/?activity=${encodeURIComponent(id)}`;
  }

  async openShare(item: AnyObj) {
    this.shareItem = item;

    const sheet = await this.actionSheet.create({
      header: 'Share',
      buttons: [
        {
          text: 'Send to…',
          icon: 'send-outline',
          handler: () => this.openRecipientPicker(item),
        },
        {
          text: 'Copy link',
          icon: 'link-outline',
          handler: async () => {
            try {
              await navigator.clipboard.writeText(this.shareUrlOf(item));
              await this.toast('Copied link');
            } catch {
              await this.toast('Could not copy link');
            }
          },
        },
        {
          text: 'Reshare',
          icon: 'repeat-outline',
          handler: () => this.reshare(item),
        },
        { text: 'Cancel', role: 'cancel' },
      ],
    });

    await sheet.present();
  }

  // ✅ Instant repost
  reshare(item: AnyObj) {
    const author = this.authorOf(item);
    const snippet = this.snippetOf(item);
    const link = this.shareUrlOf(item);

    const content =
      `<p><strong>Reshared</strong></p>` +
      `<blockquote><p><strong>${this.escape(author)}</strong></p><p>${this.escape(snippet)}</p></blockquote>` +
      `<p><a href="${link}" target="_blank" rel="noopener">View original</a></p>`;

    this.error = '';
    this.loading = true;

    this.bb.postUpdate(content).subscribe({
      next: () => this.refresh(),
      error: (e) => {
        this.loading = false;
        this.error = e?.error?.message ?? 'Reshare failed.';
      },
    });
  }

  // ===== Recipient picker modal (no Messages page needed yet) =====

  openRecipientPicker(item: AnyObj) {
    this.shareItem = item;
    this.pickerOpen = true;
    this.pickerQuery = '';
    this.recipients = [];
    this.pickerError = '';
    this.loadRecipients(''); // initial
  }

  closePicker() {
    this.pickerOpen = false;
    this.pickerQuery = '';
    this.recipients = [];
    this.pickerError = '';
    this.pickerLoading = false;
  }

  onPickerSearch(ev: any) {
    const q = (ev?.detail?.value ?? '').toString();
    this.pickerQuery = q;
    this.loadRecipients(q);
  }

  loadRecipients(search: string) {
    this.pickerLoading = true;
    this.pickerError = '';

    const qs = new URLSearchParams();
    if (search) qs.set('search', search);
    qs.set('per_page', '20');

    // Try BuddyBoss, fallback BuddyPress
    const bbUrl = `/wp-json/buddyboss/v1/members?${qs.toString()}`;
    const bpUrl = `/wp-json/buddypress/v1/members?${qs.toString()}`;

    this.http.get<any[]>(bbUrl).subscribe({
      next: (rows) => {
        this.recipients = this.normalizeRecipients(rows);
        this.pickerLoading = false;
      },
      error: () => {
        this.http.get<any[]>(bpUrl).subscribe({
          next: (rows) => {
            this.recipients = this.normalizeRecipients(rows);
            this.pickerLoading = false;
          },
          error: (e2) => {
            this.recipients = [];
            this.pickerLoading = false;
            this.pickerError = e2?.error?.message ?? 'Could not load recipients.';
          },
        });
      },
    });
  }

  private normalizeRecipients(rows: any[]): Recipient[] {
    const arr = Array.isArray(rows) ? rows : [];
    return arr.map((m) => ({
      id: m?.id ?? m?.user_id ?? m?.ID ?? String(Math.random()),
      name: m?.name ?? m?.display_name ?? m?.user_name ?? m?.username ?? 'User',
      avatar:
        m?.avatar_urls?.['96'] ??
        m?.avatar_urls?.['48'] ??
        m?.avatar ??
        m?.user_avatar ??
        'https://www.gravatar.com/avatar/?d=mp&s=96',
    }));
  }

  async pickRecipient(r: Recipient) {
    const item = this.shareItem;
    if (!item) return;

    // Store locally as an “outbox” placeholder (until Messages page exists)
    const outboxKey = 'ed_dm_outbox';
    const existing = JSON.parse(localStorage.getItem(outboxKey) || '[]');

    existing.unshift({
      to: r,
      url: this.shareUrlOf(item),
      postId: this.idOf(item),
      sentAt: new Date().toISOString(),
    });

    localStorage.setItem(outboxKey, JSON.stringify(existing));

    this.closePicker();
    await this.toast(`Sent to ${r.name}`);
  }

  // ===== Utils =====

  private async toast(msg: string) {
    const t = await this.toastCtrl.create({
      message: msg,
      duration: 1400,
      position: 'bottom',
    });
    await t.present();
  }

  private escape(s: string) {
    const str = String(s ?? '');
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}