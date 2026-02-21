import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { environment } from '../environments/environment';

const app = getApps().length ? getApp() : initializeApp(environment.FIREBASE);
export const fbAuth = getAuth(app);