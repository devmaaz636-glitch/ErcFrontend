import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { api } from './api';

export async function saveSignedInUser(user, extras = {}) {
  const userRef = doc(db, 'users', user.uid);
  const existing = await getDoc(userRef);
  const name = extras.name || user.displayName || null;
  const role = extras.role || null;

  await setDoc(
    userRef,
    {
      email: user.email ?? '',
      ...(name ? { name, displayName: name } : {}),
      ...(role ? { role } : {}),
      ...(extras.gender ? { gender: extras.gender } : {}),
      ...(extras.phone ? { phone: extras.phone } : {}),
      ...(extras.region ? { region: extras.region } : {}),
      ...(extras.photoUrl ? { photoUrl: extras.photoUrl } : {}),
      ...(existing.exists() ? {} : { createdAt: serverTimestamp() }),
      lastLoginAt: serverTimestamp(),
    },
    { merge: true }
  );
}

/** Resolve with the promise, or reject if it takes longer than `ms`. */
export function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('Timed out.')), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export async function getUserProfile(uid) {
  const snapshot = await getDoc(doc(db, 'users', uid));
  return snapshot.exists() ? snapshot.data() : null;
}

// Sign-in and session start both ask for /api/me within moments of each other.
// Share one request (and reuse the answer briefly) instead of asking twice.
let meCache = { uid: null, at: 0, promise: null };
const ME_REUSE_MS = 4000;

export function getAuthenticatedUserProfile({ forceRefresh = false } = {}) {
  const uid = auth.currentUser?.uid || null;
  if (
    !forceRefresh &&
    uid &&
    meCache.uid === uid &&
    meCache.promise &&
    Date.now() - meCache.at < ME_REUSE_MS
  ) {
    return meCache.promise;
  }
  const promise = fetchAuthenticatedUserProfile({ forceRefresh });
  meCache = { uid, at: Date.now(), promise };
  // A failed request must not be reused.
  promise.catch(() => {
    if (meCache.promise === promise) meCache = { uid: null, at: 0, promise: null };
  });
  return promise;
}

async function fetchAuthenticatedUserProfile({ forceRefresh = false } = {}) {
  const firebaseUser = auth.currentUser;
  if (!firebaseUser) throw new Error('Sign in required.');
  // A sign-in already refreshes the token. Reusing it here prevents a second
  // round trip from delaying session bootstrap on every app launch.
  const token = await firebaseUser.getIdToken(forceRefresh);
  const { data } = await api.get('/api/me', {
    headers: { Authorization: 'Bearer ' + token },
  });
  return data.user;
}

export function firestoreErrorMessage(error) {
  if (error?.code === 'permission-denied') {
    return 'Firestore blocked this account. Allow signed-in users to read and write their own users document.';
  }
  if (error?.code === 'unavailable') {
    return 'Firestore is unreachable. Check the connection and try again.';
  }
  return 'Could not reach Firestore.';
}
