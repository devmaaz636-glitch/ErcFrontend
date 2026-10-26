import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  browserLocalPersistence,
  getAuth,
  inMemoryPersistence,
  initializeAuth,
} from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: 'AIzaSyDIdGSzIPL_j6iIxsYt9JV-2ZJMYqFaZ98',
  authDomain: 'enfield-royal-app.firebaseapp.com',
  projectId: 'enfield-royal-app',
  storageBucket: 'enfield-royal-app.firebasestorage.app',
  messagingSenderId: '813358301406',
  appId: '1:813358301406:web:d55b1a925e8d68b0ea824f',
  measurementId: 'G-ZEN8K5JJ71',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

function createAuth() {
  try {
    return initializeAuth(app, {
      persistence:
        Platform.OS === 'web'
          ? browserLocalPersistence
          : inMemoryPersistence,
    });
  } catch {
    return getAuth(app);
  }
}

function createFirestore() {
  try {
    return initializeFirestore(app, {
      experimentalForceLongPolling: true,
    });
  } catch {
    return getFirestore(app);
  }
}

export const auth = createAuth();
export const db = createFirestore();
export { app };
