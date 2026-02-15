# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev              # Start dev server with hot reload
npm run build            # Type check + production build
npm run typecheck        # Run both TypeScript checks (node + web)
npm run typecheck:node   # Type check main process + preload
npm run typecheck:web    # Type check renderer
npm run lint             # ESLint
npm run format           # Prettier
npm run build:mac        # Build macOS distributable
npm run build:win        # Build Windows distributable
npm run build:linux      # Build Linux distributable
```

No test framework is configured.

## Architecture

Drift is an Electron app built with electron-vite (Vite-based toolchain). The main process is the source of truth for all state; the renderer is a pure display layer.

**Three TypeScript project zones** (separate tsconfigs):
- `tsconfig.node.json` — `src/main/` + `src/preload/` (Node/Electron APIs)
- `tsconfig.web.json` — `src/renderer/` (React, DOM APIs)
- `tsconfig.json` — composite root that references both

**Main process (`src/main/`):**
- `index.ts` — App entry: creates window, tray, starts watcher, checks for HandBrakeCLI
- `store.ts` — Persistent state via electron-store (AppSettings + QueueItem[] schema)
- `watcher.ts` — chokidar file watcher on the configured watch directory
- `encoder.ts` — Wraps handbrake-js to spawn HandBrakeCLI processes
- `queue.ts` — Orchestrates encoding: fills parallel slots, handles completion/failure, crash recovery
- `tray.ts` — System tray with minimize-to-tray behavior (window hides on close, app stays alive)
- `ipc.ts` — All IPC handler registrations

**Preload (`src/preload/`):**
- `index.ts` — Exposes `window.api` via contextBridge
- `index.d.ts` — TypeScript types for the `DriftAPI` interface (used by renderer)

**Renderer (`src/renderer/src/`):**
- Simple tab-based UI (Queue / Settings), no router or state management library
- `hooks/useIpc.ts` — `useQueue()` hook subscribes to IPC events with cleanup
- Components use inline styles (no CSS-in-JS library)

**IPC flow:** Renderer calls `window.api.*` methods (invoke) → preload forwards via ipcRenderer → main handles in `ipc.ts`. Main pushes updates to renderer via `webContents.send()` for `queue:updated`, `queue:progress`, and `app:error` events.

## Key Technical Decisions

- **ESM output for main process**: `electron.vite.config.ts` sets `format: 'es'` for the main build because `electron-store` v11 and `handbrake-js` v7 are ESM-only packages. The entry point is `out/main/index.mjs`.
- **Queue persistence**: Stored in electron-store JSON, not a database. Progress ticks are only sent via IPC (not persisted) to avoid disk thrashing; only status transitions are written.
- **Crash recovery**: On startup, any items with status `encoding` are reset to `pending`.
- **HandBrakeCLI**: Not bundled — must be installed by the user or pointed to via the `handbrakeCliPath` setting. The app checks on startup and shows an error banner if not found.
- **Renderer path alias**: `@renderer/*` maps to `src/renderer/src/*`.

## Code Style

- Prettier: single quotes, no semicolons, 100 char width, no trailing commas
- 2-space indentation (editorconfig)
