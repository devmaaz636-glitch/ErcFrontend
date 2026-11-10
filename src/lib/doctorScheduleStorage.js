import AsyncStorage from '@react-native-async-storage/async-storage';
import { createDefaultWeeklySchedule } from '../components/SelectScheduleModal';

const keyFor = (uid) => `@erc/doctor-weekly-schedule:${uid || 'guest'}`;
const leaveKeyFor = (uid) => `@erc/doctor-leave-requests:${uid || 'guest'}`;

export async function loadDoctorWeeklySchedule(uid) {
  try {
    const raw = await AsyncStorage.getItem(keyFor(uid));
    if (!raw) return createDefaultWeeklySchedule();
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : createDefaultWeeklySchedule();
  } catch {
    return createDefaultWeeklySchedule();
  }
}

export async function saveDoctorWeeklySchedule(uid, schedule) {
  await AsyncStorage.setItem(keyFor(uid), JSON.stringify(schedule));
  return schedule;
}

export async function loadDoctorLeaveRequests(uid) {
  try {
    const raw = await AsyncStorage.getItem(leaveKeyFor(uid));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveDoctorLeaveRequests(uid, items) {
  await AsyncStorage.setItem(leaveKeyFor(uid), JSON.stringify(items || []));
  return items;
}
