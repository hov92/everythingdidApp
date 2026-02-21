import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';

@Injectable({ providedIn: 'root' })
export class FirebaseAuthService {
  private app = initializeApp({
    apiKey: "AIzaSyBUvSqvrCbnuW1v7gSdDXXhFgr0IEWDpQY",
  authDomain: "everythingdid-5fab0.firebaseapp.com",
  projectId: "everythingdid-5fab0",
    appId: "1:237480427206:web:a84192eba530d39a07a1c7",
  });

  private auth = getAuth(this.app);

  currentUser(): User | null {
    return this.auth.currentUser;
  }

  async googleLogin(): Promise<string> {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(this.auth, provider);
    return await cred.user.getIdToken();
  }

  async facebookLogin(): Promise<string> {
    const provider = new FacebookAuthProvider();
    const cred = await signInWithPopup(this.auth, provider);
    return await cred.user.getIdToken();
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
  }
}