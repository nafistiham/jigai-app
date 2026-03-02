import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface IdleEvent {
  session_id: string;
  tool_name: string;
  working_dir: string;
  last_output: string;
  notification_body?: string; // Pre-processed single line from server (no decorative chars)
  idle_seconds: number;
  detection_method: string;
  timestamp: string;
  server_time: string;
}

export interface ServerInfo {
  name: string;
  ip: string;
  port: number;
}

export type ConnectionStatus = 'disconnected' | 'discovering' | 'connecting' | 'connected';

interface JigAiStore {
  // Connection
  status: ConnectionStatus;
  server: ServerInfo | null;
  lastHeartbeat: string | null;
  setStatus: (status: ConnectionStatus) => void;
  setServer: (server: ServerInfo | null) => void;
  setLastHeartbeat: (time: string) => void;

  // Events
  events: IdleEvent[];
  lastSeenTimestamp: string | null;
  addEvent: (event: IdleEvent) => void;
  clearEvents: () => void;
  setLastSeen: (timestamp: string) => void;

  // Settings
  autoDiscovery: boolean;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  manualAddress: string;
  setAutoDiscovery: (v: boolean) => void;
  setNotificationsEnabled: (v: boolean) => void;
  setSoundEnabled: (v: boolean) => void;
  setManualAddress: (addr: string) => void;
}

export const useJigAiStore = create<JigAiStore>()(
  persist(
    (set) => ({
      // Connection
      status: 'disconnected',
      server: null,
      lastHeartbeat: null,
      setStatus: (status) => set({ status }),
      setServer: (server) => set({ server }),
      setLastHeartbeat: (time) => set({ lastHeartbeat: time }),

      // Events
      events: [],
      lastSeenTimestamp: null,
      addEvent: (event) =>
        set((state) => ({
          events: [event, ...state.events].slice(0, 50),
          lastSeenTimestamp: event.server_time,
        })),
      clearEvents: () => set({ events: [] }),
      setLastSeen: (timestamp) => set({ lastSeenTimestamp: timestamp }),

      // Settings
      autoDiscovery: true,
      notificationsEnabled: true,
      soundEnabled: true,
      manualAddress: '',
      setAutoDiscovery: (v) => set({ autoDiscovery: v }),
      setNotificationsEnabled: (v) => set({ notificationsEnabled: v }),
      setSoundEnabled: (v) => set({ soundEnabled: v }),
      setManualAddress: (addr) => set({ manualAddress: addr }),
    }),
    {
      name: 'jigai-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        events: state.events,
        lastSeenTimestamp: state.lastSeenTimestamp,
        autoDiscovery: state.autoDiscovery,
        notificationsEnabled: state.notificationsEnabled,
        soundEnabled: state.soundEnabled,
        manualAddress: state.manualAddress,
        server: state.server,
      }),
    }
  )
);
