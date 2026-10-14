import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';

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

export function firestoreErrorMessage(error) {
  if (error?.code === 'permission-denied') {
    return 'Firestore blocked this account. Allow signed-in users to read and write their own users document.';
  }
  if (error?.code === 'unavailable') {
    return 'Firestore is unreachable. Check the connection and try again.';
  }
  return 'Could not reach Firestore.';
}
