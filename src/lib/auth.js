import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  signInWithCustomToken,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
} from 'firebase/auth';
import { api } from './api';
import { DEMO_PASSWORD, isDemoManagerEmail } from './demoAccounts';
import { auth } from './firebase';
import {
  confirmNewPassword,
  requestResetCode,
  resetErrorMessage,
  verifyResetCode,
} from './passwordReset';

async function signInDemoManager(email, password) {
  const { data } = await api.post('/api/auth/demo-login', {
    email: String(email).trim().toLowerCase(),
    password: String(password),
  });
  if (!data?.customToken) {
    throw Object.assign(new Error('Demo login failed.'), { code: 'auth/invalid-credential' });
  }
  const result = await signInWithCustomToken(auth, data.customToken);
  // Force-refresh so role + branchId custom claims are on the ID token.
  await result.user.getIdToken(true);
  return result;
}

function isRateLimitedError(error) {
  return (
    error?.code === 'auth/too-many-requests' ||
    /too many attempts|too-many-requests/i.test(String(error?.message || ''))
  );
}

function isNetworkError(error) {
  return (
    error?.code === 'auth/network-request-failed' ||
    error?.code === 'ECONNABORTED' ||
    error?.code === 'ERR_NETWORK' ||
    !error?.response && Boolean(error?.request)
  );
}

export async function signInWithEmail(email, password) {
  const nextEmail = String(email || '').trim();
  const nextPassword = String(password || '');

  // Demo managers NEVER use Firebase password sign-in.
  // Failed password tries cause auth/too-many-requests; custom-token bypasses that lockout.
  if (isDemoManagerEmail(nextEmail)) {
    return signInDemoManager(nextEmail, nextPassword);
  }

  try {
    const result = await signInWithEmailAndPassword(auth, nextEmail, nextPassword);
    await result.user.getIdToken(true);
    return result;
  } catch (error) {
    // If this email was later added as a demo manager, recover via backend.
    if (isRateLimitedError(error) && isDemoManagerEmail(nextEmail)) {
      return signInDemoManager(nextEmail, nextPassword);
    }
    throw error;
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

export function authErrorMessage(error, email = '') {
  const resetMessage = resetErrorMessage(error);
  const demoEmail = isDemoManagerEmail(email);

  if (error?.response?.data?.message || error?.response?.data?.error) {
    const apiMessage = error.response.data.message || error.response.data.error;
    if (error.response?.status === 401 || error.response?.data?.error === 'INVALID_CREDENTIALS') {
      return demoEmail
        ? `Email or password is incorrect. Use password ${DEMO_PASSWORD}.`
        : 'Email or password is incorrect.';
    }
    return typeof apiMessage === 'string' ? apiMessage : resetMessage;
  }

  if (isNetworkError(error)) {
    return demoEmail
      ? 'Cannot reach the API. Start the Backend server, then try again.'
      : 'Check your connection and try again.';
  }

  if (isRateLimitedError(error)) {
    return demoEmail
      ? `Firebase locked password login. Use password ${DEMO_PASSWORD} — demo managers sign in through the API (no wait).`
      : 'Too many attempts. Wait a minute, then try again.';
  }

  switch (error?.code) {
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/missing-password':
      return 'Enter your password.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return demoEmail
        ? `Email or password is incorrect. Use password ${DEMO_PASSWORD}.`
        : 'Email or password is incorrect.';
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
