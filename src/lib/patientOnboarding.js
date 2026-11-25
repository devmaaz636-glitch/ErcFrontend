import AsyncStorage from '@react-native-async-storage/async-storage';

const keyFor = (uid) => `@erc/patient-onboarding-done:${uid || 'guest'}`;
const PENDING_KEY = '@erc/patient-pending-onboarding-email';
const PROFILE_COMPLETE_PREFIX = '@erc/patient-profile-complete:';

export async function isPatientProfileComplete(uid) {
  if (!uid) return false;
  try {
    return (await AsyncStorage.getItem(`${PROFILE_COMPLETE_PREFIX}${uid}`)) === '1';
  } catch {
    return false;
  }
}

export async function markPatientProfileComplete(uid) {
  if (!uid) return;
  await AsyncStorage.setItem(`${PROFILE_COMPLETE_PREFIX}${uid}`, '1');
}

export function hasCompletePatientProfile(profile) {
  return Boolean(
    profile &&
    String(profile.region || '').trim() &&
    String(profile.gender || '').trim()
  );
}

export async function isPatientOnboardingDone(uid) {
  if (!uid) return false;
  try {
    const value = await AsyncStorage.getItem(keyFor(uid));
    return value === '1';
  } catch {
    return false;
  }
}

export async function markPatientOnboardingDone(uid) {
  if (uid) {
    await AsyncStorage.setItem(keyFor(uid), '1');
  }
  await AsyncStorage.removeItem(PENDING_KEY).catch(() => {});
}

export async function clearPatientOnboarding(uid) {
  if (!uid) return;
  await AsyncStorage.removeItem(keyFor(uid));
}

/** After signup — next successful patient sign-in must show onboarding. */
export async function markPatientNeedsOnboarding(email, uid) {
  const normalized = String(email || '').trim().toLowerCase();
  if (normalized) {
    await AsyncStorage.setItem(PENDING_KEY, normalized);
  }
  if (uid) {
    await AsyncStorage.removeItem(keyFor(uid));
    await AsyncStorage.removeItem(`${PROFILE_COMPLETE_PREFIX}${uid}`);
  }
}

export async function patientMustSeeOnboarding(email, uid) {
  const normalized = String(email || '').trim().toLowerCase();
  try {
    const pending = String((await AsyncStorage.getItem(PENDING_KEY)) || '')
      .trim()
      .toLowerCase();
    if (pending && normalized && pending === normalized) return true;
  } catch {
    /* ignore */
  }
  return !(await isPatientOnboardingDone(uid));
}
