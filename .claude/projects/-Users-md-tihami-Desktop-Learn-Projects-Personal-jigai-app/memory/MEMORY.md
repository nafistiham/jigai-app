# JigAi App Memory

## What It Is
React Native mobile app (iOS + Android) for JigAi.
Connects to JigAi server over LAN, shows idle notifications as OS push + in-app feed.

## Companion Project
Python server: `/Users/md.tihami/Desktop/Learn/Projects/Personal/JigAi/`
GitHub: nafistiham/jigai
Server port: 9384, WebSocket: ws://[ip]:9384/ws

## Key Design Decisions
- Expo + prebuild (needed for react-native-zeroconf native module)
- Two screens: Feed (default) + Settings
- mDNS auto-discovery with manual IP fallback
- Background fetch (~15 min) for iOS background notifications
- Foreground: in-app banner, 4s auto-dismiss
- State: Zustand
- Persistence: AsyncStorage

## Design Doc
`docs/plans/2026-02-27-mobile-app-design.md`

## Git Workflow
- Branches: main ← develop ← feat/* / fix/*
- Rebase merge only, no squash, no merge commits
- PRs always target develop

## Status
Project initialized. Implementation plan not yet written.
