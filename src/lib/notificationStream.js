import { api } from './api';
import { auth } from './firebase';

/**
 * Lightweight SSE client for React Native (no EventSource in RN).
 * Falls back to polling when the stream cannot stay open.
 */
export function openNotificationStream({ onEvent, onError, pollMs = 5000 }) {
  let closed = false;
  let xhr = null;
  let pollTimer = null;
  let buffer = '';

  async function authToken() {
    const user = auth.currentUser;
    if (!user) return null;
    return user.getIdToken();
  }

  function handleChunk(chunk) {
    buffer += chunk;
    const parts = buffer.split('\n\n');
    buffer = parts.pop() || '';
    for (const part of parts) {
      const line = part
        .split('\n')
        .find((l) => l.startsWith('data:'));
      if (!line) continue;
      try {
        const payload = JSON.parse(line.slice(5).trim());
        onEvent?.(payload);
      } catch {
        /* ignore malformed */
      }
    }
  }

  async function startPoll() {
    if (closed || pollTimer) return;
    const tick = async () => {
      if (closed) return;
      try {
        const token = await authToken();
        if (!token) return;
        const { data } = await api.get('/api/notifications/feed', {
          headers: { Authorization: `Bearer ${token}` },
        });
        onEvent?.({ type: 'snapshot', items: data.items || [] });
      } catch (err) {
        onError?.(err);
      }
    };
    await tick();
    pollTimer = setInterval(tick, pollMs);
  }

  async function startSse() {
    const token = await authToken();
    if (!token || closed) {
      startPoll();
      return;
    }

    const base = api.defaults.baseURL?.replace(/\/$/, '') || '';
    xhr = new XMLHttpRequest();
    let lastIndex = 0;

    xhr.open('GET', `${base}/api/notifications/stream`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.setRequestHeader('Accept', 'text/event-stream');

    xhr.onprogress = () => {
      const text = xhr.responseText || '';
      const chunk = text.slice(lastIndex);
      lastIndex = text.length;
      if (chunk) handleChunk(chunk);
    };

    xhr.onerror = () => {
      if (closed) return;
      onError?.(new Error('SSE disconnected'));
      startPoll();
    };

    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4 && !closed) {
        // Stream ended — keep feed fresh via poll.
        startPoll();
      }
    };

    try {
      xhr.send();
    } catch (err) {
      onError?.(err);
      startPoll();
    }
  }

  startSse();

  return () => {
    closed = true;
    if (xhr) {
      try {
        xhr.abort();
      } catch {
        /* ignore */
      }
      xhr = null;
    }
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  };
}
