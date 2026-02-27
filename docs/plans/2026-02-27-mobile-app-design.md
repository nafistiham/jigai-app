# JigAi Mobile App — Design Document

**Date:** 2026-02-27
**Status:** Approved
**Repo:** nafistiham/jigai-app (separate from nafistiham/jigai)

---

## Summary

React Native mobile app (iOS + Android) for JigAi. Receives idle notifications from the JigAi server running on the same LAN and displays them as OS push notifications and an in-app feed.

---

## Decisions

| Question | Decision |
|---|---|
| Platforms | iOS + Android |
| Notification model | OS push notification + in-app feed |
| Server discovery | mDNS auto-discovery with manual IP fallback |
| Foreground behaviour | In-app banner slides in from top, auto-dismisses in 4s |
| Screens | Two: Feed + Settings |
| Background push (iOS) | Background fetch (~15 min interval) + local notifications |
| Framework | Expo with prebuild (not managed, not bare CLI) |
| State | Zustand |

---

## Architecture

### Framework

Expo SDK with `expo prebuild` — generates native iOS/Android projects while retaining Expo tooling (EAS Build, expo-notifications, hot reload). Required because `react-native-zeroconf` is a native module incompatible with Expo managed workflow.

### Connection Layer

- `react-native-zeroconf` scans for `_jigai._tcp.local.` on app startup
- Connects via WebSocket to `ws://[ip]:9384/ws`
- Auto-reconnects with exponential backoff: 1s → 2s → 4s → 8s → max 30s
- Manual fallback: user enters IP:port in Settings screen

### Notification Layer

- **Foreground:** custom `InAppBanner` component slides in from top, auto-dismisses after 4s
- **Background:** `expo-background-fetch` + `expo-task-manager` registers a periodic task that polls `GET /api/events`, compares timestamps against last-seen stored in AsyncStorage, fires local notifications (`expo-notifications`) for new events

### State Management

Zustand store with three slices:
- `connection` — status, server address, last heartbeat
- `events` — feed array, last-seen timestamp
- `settings` — auto-discovery toggle, notifications toggle, sound toggle

---

## Screens

### Feed Screen (default tab)

- **Connection status bar** — green dot + server hostname when connected; red "Disconnected" + retry button when not
- **Event list** — newest first, each card shows:
  - Tool name + detection method (pattern / timeout)
  - Last meaningful output line
  - Shortened working directory
  - Relative timestamp ("2 min ago")
- **In-app banner** — slides from top on new event, auto-dismisses in 4s
- **Pull-to-refresh**
- **Empty state** — "No notifications yet — run `jigai watch claude` on your Mac"

### Settings Screen

**Connection**
- Auto-discovery toggle (on by default)
- Discovered server row — shows `JigAi on MacBook-Pro · 192.168.1.5:9384`, tap to connect
- Manual IP:port entry field
- Connect / Disconnect button

**Notifications**
- Enable local notifications toggle
- Sound toggle

**About**
- App version

---

## Data Flow

### Startup
1. Load saved server config from AsyncStorage
2. If auto-discovery on → start mDNS scan
3. If saved server exists → attempt WebSocket connect immediately
4. On `connected` message → hydrate session list into store

### Live (Foreground)
- `idle_detected` → append to feed + show in-app banner + schedule local notification
- `session_started` / `session_stopped` → update connection status bar
- `heartbeat` → update last-seen timestamp
- Connection drop → reconnect with exponential backoff

### Background Fetch
- Registered task polls `GET /api/events?limit=20` every ~15 min
- Compares event timestamps against `last_seen` in AsyncStorage
- Fires a local notification for each new event
- Updates `last_seen`

### Offline
- Feed shows last cached events from AsyncStorage
- Settings shows last known server address
- Reconnect attempted on app foreground

---

## Project Structure

```
jigai-app/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx             # Tab bar definition
│   │   ├── index.tsx               # Feed screen
│   │   └── settings.tsx            # Settings screen
│   └── _layout.tsx                 # Root layout (notifications setup)
├── components/
│   ├── EventCard.tsx
│   ├── InAppBanner.tsx
│   ├── ConnectionStatus.tsx
│   └── EmptyState.tsx
├── hooks/
│   ├── useWebSocket.ts
│   └── useDiscovery.ts
├── store/
│   └── index.ts                    # Zustand store
├── lib/
│   ├── api.ts
│   └── notifications.ts
├── tasks/
│   └── backgroundFetch.ts
├── docs/
│   └── plans/
│       └── 2026-02-27-mobile-app-design.md
├── app.json
└── package.json
```

### Key Dependencies

| Package | Purpose |
|---|---|
| `expo-router` | File-based navigation |
| `expo-notifications` | Local notifications |
| `expo-background-fetch` | Background polling |
| `expo-task-manager` | Background task registration |
| `react-native-zeroconf` | mDNS discovery |
| `zustand` | State management |
| `@react-native-async-storage/async-storage` | Persistence |

---

## Testing

- **Unit tests** (Jest) — Zustand store logic, `api.ts` helpers, timestamp formatting
- **Component tests** (React Native Testing Library) — `EventCard`, `ConnectionStatus`, `EmptyState`
- **Manual checklist** — connect/disconnect, mDNS, manual IP, foreground banner, background fetch, offline cache

No E2E (Detox/Maestro) for v0.2.
