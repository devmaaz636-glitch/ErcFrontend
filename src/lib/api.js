import axios from 'axios';
import Constants from 'expo-constants';

function apiBaseUrl() {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, '');
  }

  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoGo?.debuggerHost ||
    Constants.manifest?.debuggerHost ||
    '';
  const host = String(hostUri).split(':')[0];
  if (host && host !== 'localhost' && !host.includes('exp.direct')) {
    return `http://${host}:4000`;
  }

  return 'http://localhost:4000';
}

export const api = axios.create({
  baseURL: apiBaseUrl(),
  timeout: 15000,
});
