import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonContent,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonText,
  IonSpinner,
  IonIcon,
} from '@ionic/angular/standalone';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { WpService } from '../../services/wp.service';
import { environment } from '../../../environments/environment';

import {
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import { fbAuth } from '../../firebase';

@Component({
  standalone: true,
  selector: 'app-account',
  templateUrl: './account.page.html',
  styleUrls: ['./account.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonList,
    IonItem,
    IonInput,
    IonButton,
    IonLabel,
    IonText,
    IonSpinner,
    IonIcon
  ],
})
export class AccountPage {
  username = '';
  password = '';
  me: any = null;
  error = '';
  loading = false;
  debug = false;

  constructor(
    private auth: AuthService,
    private wp: WpService,
    private http: HttpClient
  ) {}

  ionViewWillEnter() {
    this.loadMe();
  }

  loadMe() {
    this.wp.me().subscribe({
      next: (u) => {
        this.me = u;
        this.error = '';
      },
      error: () => {
        this.me = null;
        this.error = '';
      },
    });
  }

  // ✅ your existing WP username/password login
  login() {
    this.error = '';
    this.loading = true;

    this.auth.login(this.username, this.password).subscribe({
      next: () => {
        this.loading = false;
        this.loadMe();
      },
      error: (e) => {
        this.loading = false;
        this.error = e?.error?.message ?? 'Login failed';
      },
    });
  }

  // ✅ logs out WP + firebase (if used)
  async logout() {
    localStorage.removeItem('jwt');
    this.auth.logout?.(); // if your AuthService has it
    await signOut(fbAuth).catch(() => {});
    this.me = null;
  }

  // =========================
  // Social login -> ed-auth -> WP JWT
  // =========================

  async loginWithGoogle() {
    this.error = '';
    this.loading = true;

    try {
      const cred = await signInWithPopup(fbAuth, new GoogleAuthProvider());
      await this.exchangeFirebaseForWpJwt(cred.user);
    } catch (e: any) {
      this.loading = false;
      this.error = e?.message ?? 'Google login failed';
    }
  }

  async loginWithFacebook() {
    this.error = '';
    this.loading = true;

    try {
      const provider = new FacebookAuthProvider();
      provider.addScope('email');

      const cred = await signInWithPopup(fbAuth, provider);
      await this.exchangeFirebaseForWpJwt(cred.user);
    } catch (e: any) {
      this.loading = false;
      this.error = e?.message ?? 'Facebook login failed';
    }
  }

  private async exchangeFirebaseForWpJwt(user: User) {
    const idToken = await user.getIdToken(true);

    const res = await firstValueFrom(
      this.http.post<{ token: string; user?: any }>(
        `${environment.AUTH_BRIDGE}/auth/firebase`,
        { idToken }
      )
    );

    if (!res?.token) throw new Error('Bridge did not return WP JWT');

    // ✅ IMPORTANT: store under your key "jwt"
    localStorage.setItem('jwt', res.token);

    this.loading = false;
    this.loadMe();
  }
}