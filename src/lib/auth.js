import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { api } from './api';
import { auth } from './firebase';

const NEW_ACCOUNT_CODES = new Set([
  'auth/invalid-credential',
  'auth/user-not-found',
  'auth/wrong-password',
]);

export async function signInWithEmail(email, password) {
  const nextEmail = email.trim();
  let credential;

  try {
    credential = await signInWithEmailAndPassword(auth, nextEmail, password);
  } catch (error) {
    if (!NEW_ACCOUNT_CODES.has(error?.code)) {
      throw error;
    }
    credential = await createUserWithEmailAndPassword(auth, nextEmail, password);
  }

  const idToken = await credential.user.getIdToken();

  await api
    .post('/api/auth/session', null, {
      headers: { Authorization: `Bearer ${idToken}` },
    })
    .catch(() => {});

  return credential;
}

export function sendPasswordReset(email) {
  return sendPasswordResetEmail(auth, email.trim());
}

export function signOutUser() {
  return signOut(auth);
}

export function authErrorMessage(error) {
  switch (error?.code) {
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/missing-password':
      return 'Enter your password.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email or password is incorrect.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Try again in a few minutes.';
    case 'auth/network-request-failed':
      return 'Check your connection and try again.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/weak-password':
      return 'Use a password of at least 6 characters.';
    case 'auth/email-already-in-use':
      return 'Email or password is incorrect.';
    default:
      return 'Something went wrong. Please try again.';
  }
}
