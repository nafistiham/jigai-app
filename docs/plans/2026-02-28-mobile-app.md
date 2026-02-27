# JigAi Mobile App Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a React Native (Expo) iOS + Android app that connects to the JigAi server over LAN and delivers idle notifications as OS push alerts and an in-app feed.

**Architecture:** Expo SDK with prebuild for native module access. Two-tab Expo Router app (Feed + Settings). Zustand store persisted via AsyncStorage. WebSocket connection to the JigAi server with exponential backoff reconnection. mDNS auto-discovery via react-native-zeroconf with manual IP fallback. Background fetch polls `/api/events` every ~15 min for background notifications.

**Tech Stack:** React Native, Expo SDK 52, Expo Router, TypeScript, Zustand, react-native-zeroconf, expo-notifications, expo-background-fetch, expo-task-manager, @react-native-async-storage/async-storage, Jest, React Native Testing Library

---

## Prerequisites

- Node.js 20+
- Xcode (for iOS simulator) and/or Android Studio (for Android emulator)
- Expo CLI: `npm install -g expo-cli`
- Working directory: `/Users/md.tihami/Desktop/Learn/Projects/Personal/jigai-app/`

---

### Task 1: Scaffold Expo project and install dependencies

**Files:**
- Create: `package.json`, `app.json`, `tsconfig.json`, `babel.config.js` (via Expo template)
- Create: `.gitignore`

**Step 1: Scaffold Expo project into existing directory**

```bash
cd /Users/md.tihami/Desktop/Learn/Projects/Personal/jigai-app
npx create-expo-app@latest . --template blank-typescript
```

When prompted about non-empty directory, confirm yes.

**Step 2: Install project dependencies**

```bash
npm install zustand
npm install @react-native-async-storage/async-storage
npm install react-native-zeroconf
npx expo install expo-router expo-notifications expo-background-fetch expo-task-manager
npx expo install expo-constants expo-linking expo-status-bar react-native-safe-area-context react-native-screens
```

**Step 3: Install dev dependencies**

```bash
npm install --save-dev @testing-library/react-native @testing-library/jest-native jest-expo
```

**Step 4: Update `app.json` — set bundle ID, scheme, and enable background fetch**

Replace the contents of `app.json` with:

```json
{
  "expo": {
    "name": "JigAi",
    "slug": "jigai-app",
    "version": "0.1.0",
    "scheme": "jigai",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/images/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.nafistiham.jigai",
      "infoPlist": {
        "UIBackgroundModes": ["fetch", "remote-notification"]
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.nafistiham.jigai"
    },
    "plugins": [
      "expo-router",
      [
        "expo-notifications",
        {
          "icon": "./assets/images/notification-icon.png",
          "color": "#ffffff"
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

**Step 5: Update `package.json` — add Jest config and main entry**

Add to `package.json`:

```json
{
  "main": "expo-router/entry",
  "jest": {
    "preset": "jest-expo",
    "setupFilesAfterFramework": ["@testing-library/jest-native/extend-expect"],
    "transformIgnorePatterns": [
      "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|zustand)"
    ]
  }
}
```

**Step 6: Update `tsconfig.json`**

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

**Step 7: Verify scaffold works**

```bash
npx expo start
```

Expected: Metro bundler starts, QR code shown. Press `i` for iOS simulator. Should open a blank app. Press `Ctrl+C` to stop.

**Step 8: Commit**

```bash
git add -A
git commit -m "chore: scaffold Expo project with dependencies"
```

---

### Task 2: Set up Expo Router navigation

**Files:**
- Create: `app/_layout.tsx`
- Create: `app/(tabs)/_layout.tsx`
- Create: `app/(tabs)/index.tsx`
- Create: `app/(tabs)/settings.tsx`
- Delete: `app/index.tsx` (default Expo template file, if it exists)

**Step 1: Create root layout**

Create `app/_layout.tsx`:

```tsx
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="auto" />
    </>
  );
}
```

**Step 2: Create tab layout**

Create `app/(tabs)/_layout.tsx`:

```tsx
import { Tabs } from 'expo-router';
import { Bell, Settings } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ color }) => <Bell size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Settings size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
```

**Step 3: Install lucide-react-native for icons**

```bash
npm install lucide-react-native react-native-svg
npx expo install react-native-svg
```

**Step 4: Create placeholder Feed screen**

Create `app/(tabs)/index.tsx`:

```tsx
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function FeedScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Notifications</Text>
      <Text style={styles.placeholder}>Feed coming soon</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', padding: 16 },
  placeholder: { padding: 16, color: '#888' },
});
```

**Step 5: Create placeholder Settings screen**

Create `app/(tabs)/settings.tsx`:

```tsx
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.placeholder}>Settings coming soon</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', padding: 16 },
  placeholder: { padding: 16, color: '#888' },
});
```

**Step 6: Verify navigation works**

```bash
npx expo start
```

Expected: Two-tab app with Notifications and Settings tabs.

**Step 7: Commit**

```bash
git add -A
git commit -m "feat(nav): set up Expo Router with two-tab navigation"
```

---

### Task 3: Zustand store with AsyncStorage persistence

**Files:**
- Create: `store/index.ts`
- Create: `store/__tests__/store.test.ts`

**Step 1: Write failing tests**

Create `store/__tests__/store.test.ts`:

```typescript
import { act } from '@testing-library/react-native';
import { useJigAiStore } from '../index';

// Reset store between tests
beforeEach(() => {
  useJigAiStore.setState({
    status: 'disconnected',
    server: null,
    lastHeartbeat: null,
    events: [],
    lastSeenTimestamp: null,
    autoDiscovery: true,
    notificationsEnabled: true,
    soundEnabled: true,
    manualAddress: '',
  });
});

const mockEvent = {
  session_id: 'abc123',
  tool_name: 'Claude Code',
  working_dir: '/projects/foo',
  last_output: 'What would you like to do?',
  idle_seconds: 32.5,
  detection_method: 'pattern',
  timestamp: '2026-02-28T10:00:00Z',
  server_time: '2026-02-28T10:00:01Z',
};

describe('connection slice', () => {
  it('sets status', () => {
    act(() => useJigAiStore.getState().setStatus('connected'));
    expect(useJigAiStore.getState().status).toBe('connected');
  });

  it('sets server', () => {
    const server = { name: 'MacBook', ip: '192.168.1.5', port: 9384 };
    act(() => useJigAiStore.getState().setServer(server));
    expect(useJigAiStore.getState().server).toEqual(server);
  });
});

describe('events slice', () => {
  it('adds event to front of list', () => {
    act(() => useJigAiStore.getState().addEvent(mockEvent));
    expect(useJigAiStore.getState().events[0]).toEqual(mockEvent);
  });

  it('limits events to 50', () => {
    act(() => {
      for (let i = 0; i < 60; i++) {
        useJigAiStore.getState().addEvent({ ...mockEvent, session_id: `id${i}` });
      }
    });
    expect(useJigAiStore.getState().events.length).toBe(50);
  });

  it('clears events', () => {
    act(() => {
      useJigAiStore.getState().addEvent(mockEvent);
      useJigAiStore.getState().clearEvents();
    });
    expect(useJigAiStore.getState().events).toHaveLength(0);
  });
});

describe('settings slice', () => {
  it('toggles autoDiscovery', () => {
    act(() => useJigAiStore.getState().setAutoDiscovery(false));
    expect(useJigAiStore.getState().autoDiscovery).toBe(false);
  });

  it('sets manual address', () => {
    act(() => useJigAiStore.getState().setManualAddress('192.168.1.10:9384'));
    expect(useJigAiStore.getState().manualAddress).toBe('192.168.1.10:9384');
  });
});
```

**Step 2: Run tests — verify they fail**

```bash
npm test store/__tests__/store.test.ts
```

Expected: FAIL — "Cannot find module '../index'"

**Step 3: Implement the store**

Create `store/index.ts`:

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface IdleEvent {
  session_id: string;
  tool_name: string;
  working_dir: string;
  last_output: string;
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
```

**Step 4: Run tests — verify they pass**

```bash
npm test store/__tests__/store.test.ts
```

Expected: PASS — 7 tests passing

**Step 5: Commit**

```bash
git add store/
git commit -m "feat(store): add Zustand store with AsyncStorage persistence"
```

---

### Task 4: API library

**Files:**
- Create: `lib/api.ts`
- Create: `lib/__tests__/api.test.ts`

**Step 1: Write failing tests**

Create `lib/__tests__/api.test.ts`:

```typescript
import { fetchHealth, fetchEvents, fetchSessions } from '../api';

const BASE = 'http://192.168.1.5:9384';

beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('fetchHealth', () => {
  it('returns health data on success', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', version: '0.1.0', clients: 1, sessions: 2 }),
    });

    const result = await fetchHealth(BASE);
    expect(result).toEqual({ status: 'ok', version: '0.1.0', clients: 1, sessions: 2 });
    expect(fetch).toHaveBeenCalledWith(`${BASE}/api/health`);
  });

  it('returns null on network error', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
    const result = await fetchHealth(BASE);
    expect(result).toBeNull();
  });
});

describe('fetchEvents', () => {
  it('returns events array', async () => {
    const events = [{ session_id: 'abc', tool_name: 'Claude Code' }];
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ events }),
    });

    const result = await fetchEvents(BASE, 20);
    expect(result).toEqual(events);
    expect(fetch).toHaveBeenCalledWith(`${BASE}/api/events?limit=20`);
  });

  it('returns empty array on error', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('timeout'));
    const result = await fetchEvents(BASE, 20);
    expect(result).toEqual([]);
  });
});

describe('fetchSessions', () => {
  it('returns sessions array', async () => {
    const sessions = [{ session_id: 'abc', tool_name: 'Claude Code', status: 'idle' }];
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ sessions }),
    });

    const result = await fetchSessions(BASE);
    expect(result).toEqual(sessions);
  });
});
```

**Step 2: Run tests — verify they fail**

```bash
npm test lib/__tests__/api.test.ts
```

Expected: FAIL — "Cannot find module '../api'"

**Step 3: Implement the API library**

Create `lib/api.ts`:

```typescript
export interface HealthResponse {
  status: string;
  version: string;
  clients: number;
  sessions: number;
}

export interface EventResponse {
  session_id: string;
  tool_name: string;
  working_dir: string;
  last_output: string;
  idle_seconds: number;
  detection_method: string;
  timestamp: string;
  server_time: string;
}

export interface SessionResponse {
  session_id: string;
  tool_name: string;
  working_dir: string;
  status: string;
}

export async function fetchHealth(baseUrl: string): Promise<HealthResponse | null> {
  try {
    const res = await fetch(`${baseUrl}/api/health`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function fetchEvents(baseUrl: string, limit = 20): Promise<EventResponse[]> {
  try {
    const res = await fetch(`${baseUrl}/api/events?limit=${limit}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.events ?? [];
  } catch {
    return [];
  }
}

export async function fetchSessions(baseUrl: string): Promise<SessionResponse[]> {
  try {
    const res = await fetch(`${baseUrl}/api/sessions`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.sessions ?? [];
  } catch {
    return [];
  }
}
```

**Step 4: Run tests — verify they pass**

```bash
npm test lib/__tests__/api.test.ts
```

Expected: PASS — 5 tests passing

**Step 5: Commit**

```bash
git add lib/
git commit -m "feat(api): add REST API helpers with error handling"
```

---

### Task 5: WebSocket hook

**Files:**
- Create: `hooks/useWebSocket.ts`
- Create: `hooks/__tests__/useWebSocket.test.ts`

**Step 1: Write failing tests**

Create `hooks/__tests__/useWebSocket.test.ts`:

```typescript
import { renderHook, act } from '@testing-library/react-native';
import { useWebSocket } from '../useWebSocket';
import { useJigAiStore } from '../../store';

// Mock WebSocket
class MockWebSocket {
  static instances: MockWebSocket[] = [];
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  closed = false;

  constructor(public url: string) {
    MockWebSocket.instances.push(this);
  }

  close() { this.closed = true; this.onclose?.(); }
  triggerOpen() { this.onopen?.(); }
  triggerMessage(data: object) { this.onmessage?.({ data: JSON.stringify(data) }); }
}

(global as any).WebSocket = MockWebSocket;

beforeEach(() => {
  MockWebSocket.instances = [];
  useJigAiStore.setState({
    status: 'disconnected',
    server: { name: 'Mac', ip: '192.168.1.5', port: 9384 },
    events: [],
    lastHeartbeat: null,
  });
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('useWebSocket', () => {
  it('connects when server is set', () => {
    renderHook(() => useWebSocket());
    expect(MockWebSocket.instances).toHaveLength(1);
    expect(MockWebSocket.instances[0].url).toBe('ws://192.168.1.5:9384/ws');
  });

  it('sets status to connected on open', () => {
    renderHook(() => useWebSocket());
    act(() => MockWebSocket.instances[0].triggerOpen());
    expect(useJigAiStore.getState().status).toBe('connected');
  });

  it('adds event to store on idle_detected message', () => {
    renderHook(() => useWebSocket());
    act(() => {
      MockWebSocket.instances[0].triggerOpen();
      MockWebSocket.instances[0].triggerMessage({
        type: 'idle_detected',
        session_id: 'abc',
        tool_name: 'Claude Code',
        working_dir: '/foo',
        last_output: 'waiting',
        idle_seconds: 30,
        detection_method: 'pattern',
        timestamp: '2026-02-28T10:00:00Z',
        server_time: '2026-02-28T10:00:01Z',
      });
    });
    expect(useJigAiStore.getState().events).toHaveLength(1);
    expect(useJigAiStore.getState().events[0].tool_name).toBe('Claude Code');
  });

  it('sets status to disconnected on close', () => {
    renderHook(() => useWebSocket());
    act(() => {
      MockWebSocket.instances[0].triggerOpen();
      MockWebSocket.instances[0].close();
    });
    expect(useJigAiStore.getState().status).toBe('disconnected');
  });
});
```

**Step 2: Run tests — verify they fail**

```bash
npm test hooks/__tests__/useWebSocket.test.ts
```

Expected: FAIL — "Cannot find module '../useWebSocket'"

**Step 3: Implement the hook**

Create `hooks/useWebSocket.ts`:

```typescript
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
    if (server) connect();

    return () => {
      unmounted.current = true;
      if (retryTimer.current) clearTimeout(retryTimer.current);
      ws.current?.close();
    };
  }, [server, connect]);
}
```

**Step 4: Run tests — verify they pass**

```bash
npm test hooks/__tests__/useWebSocket.test.ts
```

Expected: PASS — 4 tests passing

**Step 5: Commit**

```bash
git add hooks/
git commit -m "feat(hooks): add useWebSocket with reconnect backoff"
```

---

### Task 6: mDNS discovery hook

> Note: `react-native-zeroconf` is a native module — it cannot be unit tested with Jest. This task implements the hook and adds a manual testing note.

**Files:**
- Create: `hooks/useDiscovery.ts`

**Step 1: Create mock for react-native-zeroconf (for future tests)**

Create `__mocks__/react-native-zeroconf.ts`:

```typescript
export default class Zeroconf {
  scan = jest.fn();
  stop = jest.fn();
  on = jest.fn();
  removeDeviceListeners = jest.fn();
}
```

**Step 2: Implement the hook**

Create `hooks/useDiscovery.ts`:

```typescript
import { useEffect } from 'react';
import Zeroconf from 'react-native-zeroconf';
import { useJigAiStore } from '../store';

interface ZeroconfService {
  name: string;
  host: string;
  port: number;
  addresses: string[];
}

export function useDiscovery(enabled: boolean) {
  const setServer = useJigAiStore((s) => s.setServer);
  const setStatus = useJigAiStore((s) => s.setStatus);

  useEffect(() => {
    if (!enabled) return;

    const zeroconf = new Zeroconf();
    setStatus('discovering');

    zeroconf.on('resolved', (service: ZeroconfService) => {
      const ip = service.addresses?.[0] ?? service.host;
      setServer({
        name: service.name.replace('._jigai._tcp.local.', '').trim(),
        ip,
        port: service.port,
      });
    });

    zeroconf.on('error', () => {
      setStatus('disconnected');
    });

    // Scan for _jigai._tcp services
    zeroconf.scan('jigai', 'tcp', 'local.');

    return () => {
      zeroconf.stop();
      zeroconf.removeDeviceListeners();
    };
  }, [enabled, setServer, setStatus]);
}
```

**Step 3: Manual test note**

To manually test mDNS discovery:
1. Run `jigai server start` on the Mac
2. Run the app on a physical device (same WiFi)
3. Open Settings tab — should auto-populate the server row within ~2s

**Step 4: Commit**

```bash
git add hooks/useDiscovery.ts __mocks__/
git commit -m "feat(hooks): add useDiscovery for mDNS server auto-detection"
```

---

### Task 7: Notifications setup and background fetch

**Files:**
- Create: `lib/notifications.ts`
- Create: `tasks/backgroundFetch.ts`
- Create: `lib/__tests__/notifications.test.ts`

**Step 1: Write failing tests for notifications**

Create `lib/__tests__/notifications.test.ts`:

```typescript
import { scheduleIdleNotification } from '../notifications';

jest.mock('expo-notifications', () => ({
  scheduleNotificationAsync: jest.fn().mockResolvedValue('notification-id'),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  setNotificationHandler: jest.fn(),
  AndroidImportance: { HIGH: 4 },
  setNotificationChannelAsync: jest.fn(),
}));

import * as Notifications from 'expo-notifications';

describe('scheduleIdleNotification', () => {
  it('schedules notification with tool name in title', async () => {
    await scheduleIdleNotification({
      toolName: 'Claude Code',
      lastOutput: 'What would you like to do?',
      workingDir: '~/projects/foo',
      sound: true,
    });

    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({
          title: 'Claude Code is waiting',
          body: 'What would you like to do?',
        }),
      })
    );
  });

  it('falls back to working dir when last output is empty', async () => {
    await scheduleIdleNotification({
      toolName: 'Aider',
      lastOutput: '',
      workingDir: '~/projects/bar',
      sound: true,
    });

    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({
          body: '~/projects/bar',
        }),
      })
    );
  });
});
```

**Step 2: Run tests — verify they fail**

```bash
npm test lib/__tests__/notifications.test.ts
```

Expected: FAIL — "Cannot find module '../notifications'"

**Step 3: Implement notifications lib**

Create `lib/notifications.ts`:

```typescript
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('jigai', {
      name: 'JigAi Notifications',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
  }

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

interface NotificationOptions {
  toolName: string;
  lastOutput: string;
  workingDir: string;
  sound: boolean;
}

export async function scheduleIdleNotification(opts: NotificationOptions): Promise<void> {
  const body = opts.lastOutput || opts.workingDir || 'Waiting for your input';

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${opts.toolName} is waiting`,
      body,
      sound: opts.sound,
    },
    trigger: null, // immediate
  });
}
```

**Step 4: Run tests — verify they pass**

```bash
npm test lib/__tests__/notifications.test.ts
```

Expected: PASS — 2 tests passing

**Step 5: Implement background fetch task**

Create `tasks/backgroundFetch.ts`:

```typescript
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { fetchEvents } from '../lib/api';
import { scheduleIdleNotification } from '../lib/notifications';
import { useJigAiStore } from '../store';

export const BACKGROUND_FETCH_TASK = 'JIGAI_BACKGROUND_FETCH';

TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    const store = useJigAiStore.getState();
    const { server, lastSeenTimestamp, notificationsEnabled, soundEnabled, setLastSeen } = store;

    if (!server || !notificationsEnabled) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    const baseUrl = `http://${server.ip}:${server.port}`;
    const events = await fetchEvents(baseUrl, 20);

    if (!events.length) return BackgroundFetch.BackgroundFetchResult.NoData;

    // Filter events newer than last seen
    const newEvents = lastSeenTimestamp
      ? events.filter((e) => e.server_time > lastSeenTimestamp)
      : events.slice(0, 1);

    for (const event of newEvents.slice(0, 3)) {
      await scheduleIdleNotification({
        toolName: event.tool_name,
        lastOutput: event.last_output,
        workingDir: event.working_dir,
        sound: soundEnabled,
      });
    }

    if (newEvents.length > 0) {
      setLastSeen(newEvents[0].server_time);
    }

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerBackgroundFetch(): Promise<void> {
  await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
    minimumInterval: 15 * 60, // 15 minutes (iOS enforces minimum)
    stopOnTerminate: false,
    startOnBoot: true,
  });
}
```

**Step 6: Commit**

```bash
git add lib/notifications.ts lib/__tests__/notifications.test.ts tasks/
git commit -m "feat(notifications): add local notifications and background fetch task"
```

---

### Task 8: EventCard component

**Files:**
- Create: `components/EventCard.tsx`
- Create: `components/__tests__/EventCard.test.tsx`

**Step 1: Write failing tests**

Create `components/__tests__/EventCard.test.tsx`:

```tsx
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { EventCard } from '../EventCard';

const mockEvent = {
  session_id: 'abc123',
  tool_name: 'Claude Code',
  working_dir: '/Users/user/projects/foo',
  last_output: 'What would you like to do next?',
  idle_seconds: 32.5,
  detection_method: 'pattern',
  timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  server_time: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
};

describe('EventCard', () => {
  it('renders tool name', () => {
    render(<EventCard event={mockEvent} />);
    expect(screen.getByText('Claude Code')).toBeTruthy();
  });

  it('renders last output', () => {
    render(<EventCard event={mockEvent} />);
    expect(screen.getByText('What would you like to do next?')).toBeTruthy();
  });

  it('renders detection method badge', () => {
    render(<EventCard event={mockEvent} />);
    expect(screen.getByText('pattern')).toBeTruthy();
  });

  it('renders working directory (shortened)', () => {
    render(<EventCard event={mockEvent} />);
    expect(screen.getByText(/foo/)).toBeTruthy();
  });
});
```

**Step 2: Run tests — verify they fail**

```bash
npm test components/__tests__/EventCard.test.tsx
```

Expected: FAIL

**Step 3: Implement EventCard**

Create `components/EventCard.tsx`:

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { IdleEvent } from '../store';

function shortenPath(path: string): string {
  return path.replace(/^\/Users\/[^/]+/, '~').replace(/^.*\/(.{2}\/[^/]+\/[^/]+)$/, '~/$1');
}

function timeAgo(isoString: string): string {
  const seconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

interface Props {
  event: IdleEvent;
}

export function EventCard({ event }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.toolName}>{event.tool_name}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{event.detection_method}</Text>
        </View>
        <Text style={styles.time}>{timeAgo(event.server_time)}</Text>
      </View>
      {event.last_output ? (
        <Text style={styles.output} numberOfLines={2}>{event.last_output}</Text>
      ) : null}
      <Text style={styles.dir}>{shortenPath(event.working_dir)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  toolName: { fontSize: 15, fontWeight: '600', flex: 1 },
  badge: {
    backgroundColor: '#E8F4FE',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 11, color: '#007AFF' },
  time: { fontSize: 12, color: '#888' },
  output: { fontSize: 13, color: '#333', marginBottom: 4, lineHeight: 18 },
  dir: { fontSize: 11, color: '#999', fontFamily: 'monospace' },
});
```

**Step 4: Run tests — verify they pass**

```bash
npm test components/__tests__/EventCard.test.tsx
```

Expected: PASS — 4 tests passing

**Step 5: Commit**

```bash
git add components/EventCard.tsx components/__tests__/
git commit -m "feat(components): add EventCard"
```

---

### Task 9: ConnectionStatus, EmptyState, InAppBanner components

**Files:**
- Create: `components/ConnectionStatus.tsx`
- Create: `components/EmptyState.tsx`
- Create: `components/InAppBanner.tsx`
- Create: `components/__tests__/ConnectionStatus.test.tsx`
- Create: `components/__tests__/EmptyState.test.tsx`

**Step 1: Write failing tests**

Create `components/__tests__/ConnectionStatus.test.tsx`:

```tsx
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { ConnectionStatus } from '../ConnectionStatus';

describe('ConnectionStatus', () => {
  it('shows connected state with server name', () => {
    render(<ConnectionStatus status="connected" serverName="MacBook-Pro" />);
    expect(screen.getByText(/MacBook-Pro/)).toBeTruthy();
  });

  it('shows disconnected state', () => {
    render(<ConnectionStatus status="disconnected" serverName={null} />);
    expect(screen.getByText(/Disconnected/)).toBeTruthy();
  });

  it('shows discovering state', () => {
    render(<ConnectionStatus status="discovering" serverName={null} />);
    expect(screen.getByText(/Discovering/)).toBeTruthy();
  });
});
```

Create `components/__tests__/EmptyState.test.tsx`:

```tsx
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { EmptyState } from '../EmptyState';

describe('EmptyState', () => {
  it('renders the prompt message', () => {
    render(<EmptyState />);
    expect(screen.getByText(/jigai watch/)).toBeTruthy();
  });
});
```

**Step 2: Run tests — verify they fail**

```bash
npm test components/__tests__/ConnectionStatus.test.tsx components/__tests__/EmptyState.test.tsx
```

Expected: FAIL

**Step 3: Implement ConnectionStatus**

Create `components/ConnectionStatus.tsx`:

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ConnectionStatus as StatusType } from '../store';

const STATUS_LABEL: Record<StatusType, string> = {
  disconnected: 'Disconnected',
  discovering: 'Discovering...',
  connecting: 'Connecting...',
  connected: 'Connected',
};

const STATUS_COLOR: Record<StatusType, string> = {
  disconnected: '#FF3B30',
  discovering: '#FF9500',
  connecting: '#FF9500',
  connected: '#34C759',
};

interface Props {
  status: StatusType;
  serverName: string | null;
}

export function ConnectionStatus({ status, serverName }: Props) {
  const color = STATUS_COLOR[status];
  const label = status === 'connected' && serverName
    ? serverName
    : STATUS_LABEL[status];

  return (
    <View style={styles.container}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F2F2F7',
    gap: 6,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  label: { fontSize: 13, color: '#333' },
});
```

**Step 4: Implement EmptyState**

Create `components/EmptyState.tsx`:

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function EmptyState() {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🔔</Text>
      <Text style={styles.title}>No notifications yet</Text>
      <Text style={styles.subtitle}>
        Run{' '}
        <Text style={styles.code}>jigai watch claude</Text>
        {' '}on your Mac to start receiving notifications
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  icon: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20 },
  code: { fontFamily: 'monospace', backgroundColor: '#F2F2F7' },
});
```

**Step 5: Implement InAppBanner**

Create `components/InAppBanner.tsx`:

```tsx
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { IdleEvent } from '../store';

interface Props {
  event: IdleEvent | null;
  onDismiss: () => void;
}

export function InAppBanner({ event, onDismiss }: Props) {
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (!event) return;

    Animated.sequence([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }),
      Animated.delay(4000),
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => onDismiss());
  }, [event]);

  if (!event) return null;

  return (
    <Animated.View style={[styles.banner, { transform: [{ translateY }] }]}>
      <TouchableOpacity style={styles.content} onPress={onDismiss} activeOpacity={0.9}>
        <Text style={styles.title}>{event.tool_name} is waiting</Text>
        {event.last_output ? (
          <Text style={styles.body} numberOfLines={1}>{event.last_output}</Text>
        ) : null}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    backgroundColor: '#1C1C1E',
    margin: 12,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  content: { padding: 14 },
  title: { fontSize: 14, fontWeight: '600', color: '#fff', marginBottom: 2 },
  body: { fontSize: 13, color: '#aaa' },
});
```

**Step 6: Run tests — verify they pass**

```bash
npm test components/__tests__/
```

Expected: PASS — 7 tests passing

**Step 7: Commit**

```bash
git add components/
git commit -m "feat(components): add ConnectionStatus, EmptyState, InAppBanner"
```

---

### Task 10: Feed screen

**Files:**
- Modify: `app/(tabs)/index.tsx`

**Step 1: Implement full Feed screen**

Replace `app/(tabs)/index.tsx` with:

```tsx
import React, { useState, useEffect } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useJigAiStore, IdleEvent } from '../../store';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useDiscovery } from '../../hooks/useDiscovery';
import { EventCard } from '../../components/EventCard';
import { ConnectionStatus } from '../../components/ConnectionStatus';
import { EmptyState } from '../../components/EmptyState';
import { InAppBanner } from '../../components/InAppBanner';
import { requestNotificationPermissions, scheduleIdleNotification } from '../../lib/notifications';

export default function FeedScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [bannerEvent, setBannerEvent] = useState<IdleEvent | null>(null);

  const events = useJigAiStore((s) => s.events);
  const status = useJigAiStore((s) => s.status);
  const server = useJigAiStore((s) => s.server);
  const autoDiscovery = useJigAiStore((s) => s.autoDiscovery);
  const notificationsEnabled = useJigAiStore((s) => s.notificationsEnabled);
  const soundEnabled = useJigAiStore((s) => s.soundEnabled);
  const clearEvents = useJigAiStore((s) => s.clearEvents);

  // Request notification permissions on mount
  useEffect(() => {
    if (notificationsEnabled) requestNotificationPermissions();
  }, [notificationsEnabled]);

  // Start WebSocket connection
  useWebSocket();

  // Start mDNS discovery
  useDiscovery(autoDiscovery);

  // Show in-app banner and schedule local notification on new events
  const prevEventCount = React.useRef(events.length);
  useEffect(() => {
    if (events.length > prevEventCount.current) {
      const newest = events[0];
      setBannerEvent(newest);
      if (notificationsEnabled) {
        scheduleIdleNotification({
          toolName: newest.tool_name,
          lastOutput: newest.last_output,
          workingDir: newest.working_dir,
          sound: soundEnabled,
        });
      }
    }
    prevEventCount.current = events.length;
  }, [events]);

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <InAppBanner event={bannerEvent} onDismiss={() => setBannerEvent(null)} />

      <Text style={styles.title}>Notifications</Text>

      <ConnectionStatus
        status={status}
        serverName={server?.name ?? null}
      />

      <FlatList
        data={events}
        keyExtractor={(item) => `${item.session_id}-${item.server_time}`}
        renderItem={({ item }) => <EventCard event={item} />}
        ListEmptyComponent={<EmptyState />}
        contentContainerStyle={events.length === 0 ? styles.emptyContainer : styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  title: { fontSize: 28, fontWeight: 'bold', padding: 16, paddingBottom: 8 },
  list: { paddingVertical: 8 },
  emptyContainer: { flex: 1 },
});
```

**Step 2: Verify visually**

```bash
npx expo start
```

Expected: Feed screen shows title, connection status bar, empty state message. mDNS discovery starts automatically.

**Step 3: Commit**

```bash
git add app/(tabs)/index.tsx
git commit -m "feat(screens): implement Feed screen with WebSocket and notifications"
```

---

### Task 11: Settings screen

**Files:**
- Modify: `app/(tabs)/settings.tsx`

**Step 1: Implement full Settings screen**

Replace `app/(tabs)/settings.tsx` with:

```tsx
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useJigAiStore } from '../../store';
import Constants from 'expo-constants';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function Row({
  label,
  right,
  onPress,
}: {
  label: string;
  right?: React.ReactNode;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} disabled={!onPress}>
      <Text style={styles.rowLabel}>{label}</Text>
      {right}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const autoDiscovery = useJigAiStore((s) => s.autoDiscovery);
  const notificationsEnabled = useJigAiStore((s) => s.notificationsEnabled);
  const soundEnabled = useJigAiStore((s) => s.soundEnabled);
  const manualAddress = useJigAiStore((s) => s.manualAddress);
  const server = useJigAiStore((s) => s.server);
  const status = useJigAiStore((s) => s.status);

  const setAutoDiscovery = useJigAiStore((s) => s.setAutoDiscovery);
  const setNotificationsEnabled = useJigAiStore((s) => s.setNotificationsEnabled);
  const setSoundEnabled = useJigAiStore((s) => s.setSoundEnabled);
  const setManualAddress = useJigAiStore((s) => s.setManualAddress);
  const setServer = useJigAiStore((s) => s.setServer);
  const setStatus = useJigAiStore((s) => s.setStatus);

  const [addressInput, setAddressInput] = useState(manualAddress);

  const handleConnect = () => {
    const trimmed = addressInput.trim();
    if (!trimmed) return;

    const [ip, portStr] = trimmed.split(':');
    const port = parseInt(portStr ?? '9384', 10);

    if (!ip || isNaN(port)) {
      Alert.alert('Invalid address', 'Use format: 192.168.1.5:9384');
      return;
    }

    setManualAddress(trimmed);
    setServer({ name: ip, ip, port });
    setAutoDiscovery(false);
  };

  const handleDisconnect = () => {
    setServer(null);
    setStatus('disconnected');
  };

  const isConnected = status === 'connected';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>Settings</Text>
      <ScrollView>

        <Section title="CONNECTION">
          <Row
            label="Auto-discovery"
            right={
              <Switch
                value={autoDiscovery}
                onValueChange={setAutoDiscovery}
              />
            }
          />
          {server && (
            <Row
              label={`${server.name} · ${server.ip}:${server.port}`}
              right={
                <Text style={[styles.statusPill, isConnected ? styles.connected : styles.disconnected]}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </Text>
              }
            />
          )}
          <View style={styles.manualRow}>
            <TextInput
              style={styles.input}
              value={addressInput}
              onChangeText={setAddressInput}
              placeholder="192.168.1.5:9384"
              placeholderTextColor="#aaa"
              autoCapitalize="none"
              keyboardType="numbers-and-punctuation"
            />
            <TouchableOpacity
              style={[styles.connectBtn, isConnected && styles.disconnectBtn]}
              onPress={isConnected ? handleDisconnect : handleConnect}
            >
              <Text style={styles.connectBtnText}>
                {isConnected ? 'Disconnect' : 'Connect'}
              </Text>
            </TouchableOpacity>
          </View>
        </Section>

        <Section title="NOTIFICATIONS">
          <Row
            label="Enable notifications"
            right={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
              />
            }
          />
          <Row
            label="Sound"
            right={
              <Switch
                value={soundEnabled}
                onValueChange={setSoundEnabled}
                disabled={!notificationsEnabled}
              />
            }
          />
        </Section>

        <Section title="ABOUT">
          <Row label="Version" right={<Text style={styles.value}>v{Constants.expoConfig?.version}</Text>} />
          <Row label="Server" right={<Text style={styles.value}>nafistiham/jigai</Text>} />
        </Section>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  title: { fontSize: 28, fontWeight: 'bold', padding: 16, paddingBottom: 8 },
  section: { marginTop: 20, marginHorizontal: 16 },
  sectionTitle: { fontSize: 12, color: '#888', fontWeight: '600', marginBottom: 6, letterSpacing: 0.5 },
  sectionBody: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  rowLabel: { fontSize: 16, color: '#000' },
  value: { fontSize: 15, color: '#888' },
  statusPill: { fontSize: 12, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  connected: { backgroundColor: '#E6F9EE', color: '#34C759' },
  disconnected: { backgroundColor: '#FEE2E2', color: '#FF3B30' },
  manualRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 15,
    backgroundColor: '#F9F9F9',
  },
  connectBtn: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  disconnectBtn: { backgroundColor: '#FF3B30' },
  connectBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
```

**Step 2: Verify visually**

```bash
npx expo start
```

Expected: Settings screen shows Connection, Notifications, About sections with proper iOS-style grouped list.

**Step 3: Commit**

```bash
git add app/(tabs)/settings.tsx
git commit -m "feat(screens): implement Settings screen"
```

---

### Task 12: Register background fetch and run all tests

**Files:**
- Modify: `app/_layout.tsx`

**Step 1: Register background fetch task in root layout**

Replace `app/_layout.tsx` with:

```tsx
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { registerBackgroundFetch } from '../tasks/backgroundFetch';

export default function RootLayout() {
  useEffect(() => {
    registerBackgroundFetch().catch(() => {
      // Background fetch registration can fail on simulators — that's fine
    });
  }, []);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="auto" />
    </>
  );
}
```

**Step 2: Run full test suite**

```bash
npm test
```

Expected: All tests pass. Count should be 18+.

**Step 3: Run prebuild to generate native projects**

```bash
npx expo prebuild
```

Expected: `ios/` and `android/` directories created.

**Step 4: Run on iOS simulator**

```bash
npx expo run:ios
```

Expected: App opens on simulator, two tabs visible, connection starts discovering.

**Step 5: Manual integration test checklist**

- [ ] Start `jigai server start` on Mac
- [ ] Open app — server discovered automatically within 2s
- [ ] Connection bar shows green dot + server name
- [ ] Run `jigai watch claude` on Mac, let Claude Code go idle
- [ ] App receives event, shows in-app banner
- [ ] Banner auto-dismisses after 4s
- [ ] Event appears in feed with tool name, output, time
- [ ] Put app in background — wait for idle event — local notification fires (may take up to 15 min on iOS)
- [ ] Kill server — app shows "Disconnected", retries automatically
- [ ] Restart server — app reconnects

**Step 6: Final commit**

```bash
git add app/_layout.tsx
git commit -m "feat: register background fetch task on app startup"
```

---

### Task 13: GitHub repo setup and initial push

**Step 1: Create GitHub repo**

```bash
gh repo create nafistiham/jigai-app --public --description "JigAi mobile app — iOS & Android notifications for AI coding agents"
```

**Step 2: Set up develop branch and push**

```bash
git checkout -b develop
git push -u origin develop
git checkout main
git push -u origin main
gh repo edit nafistiham/jigai-app --default-branch main
```

**Step 3: Add `.gitignore` for React Native**

Ensure `.gitignore` includes:

```
node_modules/
.expo/
ios/
android/
dist/
*.jks
*.keystore
.env*
```

> Note: `ios/` and `android/` are generated by `expo prebuild` — commit them only when ready for EAS Build / App Store submission.

**Step 4: Final commit and push**

```bash
git add .gitignore
git commit -m "chore: finalize gitignore for React Native"
git push origin main
```
