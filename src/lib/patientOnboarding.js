import AsyncStorage from '@react-native-async-storage/async-storage';

const keyFor = (uid) => `@erc/patient-onboarding-done:${uid || 'guest'}`;

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
  if (!uid) return;
  await AsyncStorage.setItem(keyFor(uid), '1');
}

export async function clearPatientOnboarding(uid) {
  if (!uid) return;
  await AsyncStorage.removeItem(keyFor(uid));
}
