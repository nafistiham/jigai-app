import { useEffect, useRef, useCallback } from 'react';
import { useJigAiStore } from '../store';

const BACKOFF_MS = [1000, 2000, 4000, 8000, 16000, 30000];

export function useWebSocket() {
  const ws = useRef<WebSocket | null>(null);
  const retryCount = useRef(0);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmounted = useRef(false);

  const server = useJigAiStore((s) => s.server);
  const setStatus = useJigAiStore((s) => s.setStatus);
  const addEvent = useJigAiStore((s) => s.addEvent);
  const setLastHeartbeat = useJigAiStore((s) => s.setLastHeartbeat);

  const connect = useCallback(() => {
    if (!server || unmounted.current) return;
    setStatus('connecting');

    const url = `ws://${server.ip}:${server.port}/ws`;
    const socket = new WebSocket(url);
    ws.current = socket;

    socket.onopen = () => {
      if (unmounted.current) return socket.close();
      retryCount.current = 0;
      setStatus('connected');
    };

    socket.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'idle_detected') addEvent(msg);
        if (msg.type === 'heartbeat') setLastHeartbeat(new Date().toISOString());
      } catch {}
    };

    socket.onclose = () => {
      if (unmounted.current) return;
      setStatus('disconnected');
      const delay = BACKOFF_MS[Math.min(retryCount.current, BACKOFF_MS.length - 1)];
      retryCount.current++;
      retryTimer.current = setTimeout(connect, delay);
    };

    socket.onerror = () => {
      socket.close();
    };
  }, [server, setStatus, addEvent, setLastHeartbeat]);

  useEffect(() => {
    unmounted.current = false;
    retryCount.current = 0;
    if (server) connect();

    return () => {
      unmounted.current = true;
      if (retryTimer.current) clearTimeout(retryTimer.current);
      ws.current?.close();
    };
  }, [server, connect]);
}
