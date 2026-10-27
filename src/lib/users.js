import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { api } from './api';

export async function saveSignedInUser(user) {
  const userRef = doc(db, 'users', user.uid);
  const existing = await getDoc(userRef);

  await setDoc(
    userRef,
    {
      email: user.email ?? '',
      ...(existing.exists() ? {} : { createdAt: serverTimestamp() }),
      lastLoginAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function getUserProfile(uid) {
  const snapshot = await getDoc(doc(db, 'users', uid));
  return snapshot.exists() ? snapshot.data() : null;
}

export async function getAuthenticatedUserProfile() {
  const firebaseUser = auth.currentUser;
  if (!firebaseUser) throw new Error('Sign in required.');
  const token = await firebaseUser.getIdToken(true);
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
