# JigAi Mobile App — Handoff Document

> Last updated: 2026-03-09

---

## What It Is

React Native (Expo) mobile app for JigAi. Receives idle notifications from the JigAi server over LAN. This is Phase 3 of the JigAi project.

- **Repo:** https://github.com/nafistiham/jigai-app (private)
- **Companion server:** https://github.com/nafistiham/jigai (the Python server)

---

## How It Connects to JigAi Server

- Server runs on port `9384` on the same LAN
- WebSocket endpoint: `ws://[ip]:9384/ws`
- mDNS/Bonjour auto-discovery — phone finds server automatically on LAN

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Expo SDK (prebuild, not managed workflow) |
| Navigation | Expo Router (file-based) |
| Language | TypeScript |
| State | Zustand |
| LAN discovery | react-native-zeroconf (mDNS) |
| Notifications | expo-notifications + expo-background-fetch |

---

## Current Status

Phase 3 is in progress. The app receives WebSocket events from the JigAi server and shows notifications.

---

## Key Commands

```bash
npm install
npx expo prebuild          # generate native iOS/Android projects
npx expo start             # start dev server
npx expo run:ios           # run on iOS simulator
npx expo run:android       # run on Android emulator
npm test                   # Jest tests
```

## Setup on New Machine

```bash
cd jigai-app
npm install
npx expo prebuild
npx expo run:ios   # or run:android
```

You'll need:
- Xcode (for iOS) or Android Studio (for Android)
- The JigAi server running on the same network

---

## Git Workflow

- Branches: `main` ← `develop` ← `feat/*` / `fix/*`
- PRs always target `develop`
- Rebase merge only

---

## What To Do Next

1. Complete Phase 3 — notification display, history, settings screen
2. Test mDNS auto-discovery on real devices
3. Submit to App Store / Play Store (future)
