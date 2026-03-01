# JigAi App

Mobile companion for [JigAi](https://github.com/nafistiham/jigai) — get notified on your phone when Claude (or any AI coding agent) goes idle.

If you give Claude a task that takes more than 5 minutes, you can walk away from your computer and still know the moment it's done or waiting for you.

## How it works

```
jigai watch claude     →     JigAi server     →     your phone
  (detects idle)           (WebSocket hub)        (push notification)
```

1. `jigai watch claude` monitors Claude Code on your Mac/Linux/Windows machine
2. When Claude goes idle, it sends the event to the JigAi server running on the same machine
3. The server pushes it to the mobile app over your local Wi-Fi

Your phone and computer must be on the **same Wi-Fi network**.

---

## Prerequisites

- [JigAi server](https://github.com/nafistiham/jigai) installed and working on your machine
- Node.js 18+
- For iOS: Xcode 15+ (Mac only)
- For Android: Android Studio with an emulator or a physical device

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/nafistiham/jigai-app.git
cd jigai-app
npm install
```

### 2. Generate native projects

```bash
npx expo prebuild
```

### 3. Build and run

**iOS (simulator)**
```bash
npx expo run:ios
```

**iOS (physical device)**

Open `ios/JigAi.xcworkspace` in Xcode, select your device, and hit Run. You'll need to sign the app with your Apple ID under *Signing & Capabilities*.

> Free Apple ID: app expires after 7 days and needs to be rebuilt.
> Paid Apple Developer account ($99/yr): app stays valid for a year.

**Android**
```bash
npx expo run:android
```

---

## Usage

### Start the server first, then the watcher

The watcher only connects to the server at startup. Always start them in this order:

**Terminal 1 — start the server**
```bash
jigai server start
```

**Terminal 2 — start watching Claude**
```bash
jigai watch claude
```

You should see `Server: Connected to JigAi server` in Terminal 2. If you see `Server: Not running`, stop the watcher and restart it after the server is up.

### Connect the app

**Auto-discovery (recommended)**

Keep *Auto-discovery* on in Settings. The app scans for `_jigai._tcp` on your local network and connects automatically.

> Auto-discovery uses mDNS (Bonjour on macOS/Windows, Avahi on Linux).
> It may not work on some corporate or guest Wi-Fi networks that block mDNS.
> Use manual connection in that case.

**Manual connection**

Go to **Settings → type your machine's IP and port → Connect**

```
192.168.1.x:9384
```

Find your machine's IP with:
```bash
# macOS / Linux
ipconfig getifaddr en0

# Windows
ipconfig
```

---

## Notifications

The app delivers idle events as:

- **In-app feed** — a card showing the tool name, detection method, last output, and working directory
- **In-app banner** — a slide-in alert when the app is open
- **OS push notification** — fires even when the app is in the background

Grant notification permission when the app asks on first launch. If you missed it, go to **Settings → Notifications → JigAi** and enable them.

---

## Project structure

```
app/
  _layout.tsx           root layout, registers background fetch
  (tabs)/
    index.tsx           notifications feed
    settings.tsx        connection and notification settings
components/
  EventCard.tsx         idle event card
  ConnectionStatus.tsx  green/orange/red dot with status label
  EmptyState.tsx        empty feed placeholder
  InAppBanner.tsx       slide-in banner for new events
hooks/
  useWebSocket.ts       WebSocket connection with exponential backoff
  useDiscovery.ts       mDNS auto-discovery
lib/
  api.ts                REST client for /api/events and /api/health
  notifications.ts      local notification helpers
store/
  index.ts              Zustand store (persisted via AsyncStorage)
tasks/
  backgroundFetch.ts    background polling every 15 minutes
```

---

## Tech stack

- [Expo SDK 55](https://expo.dev) with prebuild (not managed workflow)
- [Expo Router](https://expo.github.io/router) — file-based navigation
- [Zustand](https://github.com/pmndrs/zustand) — state management
- [react-native-zeroconf](https://github.com/balthazar/react-native-zeroconf) — mDNS discovery
- [expo-notifications](https://docs.expo.dev/versions/latest/sdk/notifications/) — push and local notifications
- [expo-background-fetch](https://docs.expo.dev/versions/latest/sdk/background-fetch/) — background polling

---

## Contributing

PRs are welcome. Branch off `develop`, target PRs at `develop`. `main` is kept in sync with `develop` after review.

```
main ← develop ← feat/* / fix/*
```

---

## License

MIT
