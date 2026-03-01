# JigAi Mobile App

React Native (Expo) mobile app for JigAi — receives idle notifications from the JigAi server over LAN.

## Companion project
The Python server lives at `../JigAi/` (nafistiham/jigai on GitHub).
Server runs on port 9384. WebSocket at `ws://[ip]:9384/ws`.

## Stack
- Expo SDK with prebuild (not managed workflow, not bare CLI)
- Expo Router (file-based navigation)
- TypeScript
- Zustand (state)
- react-native-zeroconf (mDNS discovery)
- expo-notifications + expo-background-fetch (notifications)

## Commands
```bash
npm install
npx expo prebuild          # generate native iOS/Android projects
npx expo start             # start dev server
npx expo run:ios           # run on iOS simulator
npx expo run:android       # run on Android emulator
npm test                   # Jest tests
```

## Git workflow
- Branches: `main` ← `develop` ← `feat/*` / `fix/*`
- PRs always target `develop`
- Rebase merge only — no squash, no merge commits

## Commits
- Never add `Co-Authored-By` or any co-authorship trailer to commit messages

## Commit convention
```
feat(scope):  new feature
fix(scope):   bug fix
docs:         documentation only
test:         tests only
chore:        build, config, tooling
```
