import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
} from 'firebase/auth';
import { auth } from './firebase';
import {
  confirmNewPassword,
  requestResetCode,
  resetErrorMessage,
  verifyResetCode,
} from './passwordReset';

const NEW_ACCOUNT_CODES = new Set([
  'auth/invalid-credential',
  'auth/user-not-found',
  'auth/wrong-password',
]);

export async function signInWithEmail(email, password) {
  const nextEmail = email.trim();

  try {
    return await signInWithEmailAndPassword(auth, nextEmail, password);
  } catch (error) {
    if (!NEW_ACCOUNT_CODES.has(error?.code)) {
      throw error;
    }
    return createUserWithEmailAndPassword(auth, nextEmail, password);
  }
}

export function requestPasswordReset(email) {
  return requestResetCode(email);
}

export function verifyPasswordResetCode(email, code) {
  return verifyResetCode(email, code);
}

export function saveNewPassword(_email, password, resetToken) {
  return confirmNewPassword(resetToken, password);
}

export function signOutUser() {
  return signOut(auth);
}

export async function changePassword(currentPassword, newPassword) {
  const user = auth.currentUser;
  if (!user?.email) {
    throw new Error('You must be signed in to change your password.');
  }

  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
}

export function authErrorMessage(error) {
  const resetMessage = resetErrorMessage(error);
  if (error?.response?.data?.message || error?.response?.data?.error) {
    return resetMessage;
  }

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
      return 'Use at least 8 characters with a letter and a number.';
    case 'auth/requires-recent-login':
      return 'For your security, sign in again before changing your password.';
    case 'auth/email-already-in-use':
      return 'Email or password is incorrect.';
    default:
      return resetMessage;
  }
}
