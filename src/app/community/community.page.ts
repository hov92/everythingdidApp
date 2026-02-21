import { CommonModule, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonTextarea,
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  heartOutline,
  heart,
  chatbubbleOutline,
  ellipsisHorizontal,
  openOutline,
  refreshOutline
} from 'ionicons/icons';

import { BuddyBossService } from '../services/buddyboss.service';
import { environment } from '../../environments/environment';

type AnyObj = Record<string, any>;

@Component({
  standalone: true,
  selector: 'app-community',
  templateUrl: './community.page.html',
  styleUrls: ['./community.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    IonContent,
    IonTextarea,
    IonButton,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonRefresher,
    IonRefresherContent,
    IonSpinner,
  ],
})
export class CommunityPage {
  text = '';
  error = '';
  loading = false;

  feed: AnyObj[] = [];

  // UI-only likes for now
  private likedIds = new Set<string>();

  constructor(
    private bb: BuddyBossService,
    private router: Router
  ) {
    addIcons({
      heartOutline,
      heart,
      chatbubbleOutline,
      ellipsisHorizontal,
      openOutline,
      refreshOutline
    });
  }

  ionViewWillEnter() {
    this.refresh();
  }

  refresh(ev?: any) {
    this.error = '';
    this.loading = true;

    this.bb.timeline({ per_page: 20 }).subscribe({
      next: (rows) => {
        const list = Array.isArray(rows) ? rows : [];
        // IMPORTANT: normalize each item for media URLs
        this.feed = list.map((x) => this.normalizeItem(x));
        this.loading = false;
        ev?.target?.complete?.();
      },
      error: (e) => {
        this.feed = [];
        this.loading = false;
        this.error = e?.error?.message ?? 'Could not load community feed.';
        ev?.target?.complete?.();
      },
    });
  }

  post() {
    const content = (this.text || '').trim();
    if (!content) return;

    this.error = '';
    this.loading = true;

    this.bb.postUpdate(content).subscribe({
      next: () => {
        this.text = '';
        this.refresh();
      },
      error: (e) => {
        this.loading = false;
        this.error = e?.error?.message ?? 'Failed to post.';
      },
    });
  }

  // =========================
  // Threads navigation
  // =========================
  openThread(item: any) {
  this.router.navigate(['/tabs/community/thread', this.idOf(item)]);
}

  // Optional: open the post in your website in a new tab
  openInWeb(item: AnyObj, ev?: Event) {
    ev?.stopPropagation();
    const link = this.linkOf(item);
    if (link) window.open(link, '_blank');
  }

  openMenu(item: AnyObj, ev?: Event) {
    ev?.stopPropagation();
    console.log('menu:', this.idOf(item), item);
  }

  // =========================
  // Like / Comment (UI only)
  // =========================
  isLiked(item: AnyObj): boolean {
    return this.likedIds.has(this.idOf(item));
  }

  toggleLike(item: AnyObj, ev?: Event) {
    ev?.stopPropagation();
    const id = this.idOf(item);
    if (this.likedIds.has(id)) this.likedIds.delete(id);
    else this.likedIds.add(id);
  }

  comment(item: AnyObj, ev?: Event) {
    ev?.stopPropagation();
    this.openThread(item);
  }

  // =========================
  // Normalization + helpers
  // =========================

  private normalizeItem(item: AnyObj): AnyObj {
    const copy: AnyObj = { ...item };
    // cache media list + cleaned content on the object (NO dot props to avoid TS4111)
    copy['__media'] = this.mediaUrlsOf(copy);
    copy['__contentNoImgs'] = this.contentWithoutImgsOf(copy);
    return copy;
  }

  idOf(item: AnyObj): string {
    const id =
      item?.['id'] ??
      item?.['activity_id'] ??
      item?.['item_id'] ??
      item?.['primary_item_id'];
    return String(id ?? `${this.authorOf(item)}-${this.dateOf(item)}`);
  }

  authorOf(item: AnyObj): string {
    return (
      item?.['user_name'] ??
      item?.['display_name'] ??
      item?.['name'] ??
      item?.['user']?.['name'] ??
      item?.['user']?.['display_name'] ??
      'User'
    );
  }

  avatarOf(item: AnyObj): string {
    const u =
      item?.['user_avatar'] ??
      item?.['avatar'] ??
      item?.['user']?.['avatar_urls']?.['96'] ??
      item?.['avatar_urls']?.['96'] ??
      item?.['user']?.['avatar_urls']?.['48'] ??
      item?.['avatar_urls']?.['48'] ??
      '';
    return this.absUrl(u) || 'https://www.gravatar.com/avatar/?d=mp&s=96';
  }

  dateOf(item: AnyObj): string {
    return (
      item?.['date'] ??
      item?.['date_gmt'] ??
      item?.['created'] ??
      item?.['created_at'] ??
      ''
    );
  }

  // Some BuddyBoss items include a "link" to the activity
  linkOf(item: AnyObj): string {
    const link = item?.['link'] ?? item?.['url'] ?? '';
    return this.absUrl(link);
  }

  // Body HTML from activity
  contentOf(item: AnyObj): string {
    const c =
      item?.['content']?.['rendered'] ??
      item?.['content_html'] ??
      item?.['action'] ??
      item?.['content'] ??
      '';
    return typeof c === 'string' ? c : '';
  }

  // Use cached cleaned content if present
  safeBody(item: AnyObj): string {
    return (item?.['__contentNoImgs'] ?? this.contentWithoutImgsOf(item)) as string;
  }

  // Use cached media if present
  mediaOf(item: AnyObj): string[] {
    return (item?.['__media'] ?? this.mediaUrlsOf(item)) as string[];
  }

  // ---- MEDIA EXTRACTION (fixes your “media not showing” problem) ----
  mediaUrlsOf(item: AnyObj): string[] {
    const html = this.contentOf(item) || '';
    const out: string[] = [];

    // 1) Find <img src="...">
    const imgRe = /<img[^>]+src\s*=\s*["']([^"']+)["'][^>]*>/gi;
    let m: RegExpExecArray | null;
    while ((m = imgRe.exec(html)) !== null) {
      const src = this.absUrl(this.decodeHtml(m[1] || ''));
      if (src) out.push(src);
    }

    // 2) Some BuddyBoss feeds store media in object arrays too
    const mediaArr = item?.['media'] ?? item?.['_media'] ?? null;
    if (Array.isArray(mediaArr)) {
      for (const it of mediaArr) {
        const src = this.absUrl(it?.url ?? it?.['url'] ?? it?.src ?? it?.['src'] ?? '');
        if (src) out.push(src);
      }
    }

    return Array.from(new Set(out));
  }

  contentWithoutImgsOf(item: AnyObj): string {
    const html = this.contentOf(item) || '';
    return html.replace(/<img[^>]*>/gi, '');
  }

  // Converts /wp-content/... -> https://everythingdid.com/wp-content/...
  private absUrl(url: string): string {
    if (!url) return '';

    // trim + decode
    let u = String(url).trim();
    if (!u) return '';

    // already absolute
    if (u.startsWith('http://') || u.startsWith('https://')) return u;

    // protocol-relative //example.com/img.jpg
    if (u.startsWith('//')) return `https:${u}`;

    // relative path: /wp-content/...
    if (u.startsWith('/')) return `${environment.WP_BASE}${u}`;

    // odd cases like "wp-content/uploads/.."
    if (!u.startsWith('/')) return `${environment.WP_BASE}/${u}`;

    return u;
  }

  private decodeHtml(s: string): string {
    // handles &amp; etc inside src attr
    return s
      .replace(/&amp;/g, '&')
      .replace(/&#038;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'");
  }

  trackById = (_: number, item: AnyObj) => this.idOf(item);
}