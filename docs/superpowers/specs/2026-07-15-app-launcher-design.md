# App Launcher Design

## Goal

Extend maroku.sh (a browser-based terminal) to support launching games and interactive apps that take over the full screen. Users type an app name like `tetris` or `./tetris` to launch, and click an X to return to the shell.

## Architecture

### Command Resolution

`executeCommand()` in `index.html` normalizes input by stripping the `./` prefix, so `./tetris` and `tetris` are treated identically. Commands are split into two categories:

- **Terminal commands** — `ping`, `dig`, `clear`, `help`, `exit` (existing behavior, run inline in the terminal)
- **Apps** — discovered dynamically from `manifest.json` at runtime (render full-screen)

The shell fetches `manifest.json` once on load and builds a combined list of all commands + apps. No hardcoded `COMMANDS` array for apps.

### App Module Contract

New apps are ES modules in `commands/` with this signature:

```js
export const type = 'app';
export const title = 'Tetris';
export const description = 'A classic block-stacking game';

export function execute(args, container, onExit) {
  // Render app into container
  // Call onExit when the app should close
}
```

- `container` — DOM element where the app renders (full-screen)
- `onExit` — callback to call when the app closes (restores terminal)
- The app is responsible for cleaning up its own DOM when `onExit` is called

### Launch & Exit Flow

1. User types `tetris` → terminal saves its state, hides the terminal element
2. App container appears full-screen with a small **X** button in the corner
3. App renders into the container via `execute()`
4. Clicking **X** calls `onExit` → app container clears → terminal reappears exactly as before

### manifest.json

Updated to include apps:

```json
[
  { "name": "dig", "type": "command", "desc": "Look up DNS information for a host" },
  { "name": "ping", "type": "command", "desc": "Test network connectivity to a host" },
  { "name": "tetris", "type": "app", "desc": "A classic block-stacking game" }
]
```

New apps are added by creating `commands/tetris.js` and adding an entry to `manifest.json`.

## Project Structure

```
index.html          # Main shell, xterm.js terminal, command routing
styles.css          # Terminal and app container styles
commands/
  manifest.json     # Registry of all commands and apps
  ping.js           # Terminal command: ping a host
  dig.js            # Terminal command: DNS lookup
  tetris.js         # App: Tetris game (example)
```

## Adding a New App

1. Create `commands/<name>.js` with the module contract above
2. Add an entry to `commands/manifest.json` with `"type": "app"`
3. No changes to `index.html` or other existing files needed

## Adding a New Terminal Command

1. Create `commands/<name>.js` with `export const description = "..."` and `export async function execute(args) {}`
2. Add an entry to `commands/manifest.json` with `"type": "command"`
3. Register the command in `executeCommand()` with a special-case handler if needed (e.g., `clear`, `help`)
