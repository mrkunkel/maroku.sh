# maroku.sh — Agent Instructions

## Repo at a glance

Single-file vanilla JS browser terminal. No build step, no npm, no tests, no lint.
Open `index.html` in a browser.

- `index.html` — shell, terminal (xterm.js 4.8.1), command routing, app launcher
- `styles.css` — terminal and app container styles
- `commands/manifest.json` — registry of all commands and apps (discovered dynamically)
- `commands/*.js` — individual command/app modules
- `commands/game-ui.js` — shared game UI factory (`createGameUI`)
- `commands/board.js` — shared `EightByEightBoard` class for 8×8 board games (chess, checkers, connect4)

## Adding a terminal command

1. Create `commands/<name>.js`:

```javascript
export const description = "What the command does";

export async function execute(args) {
    window.term.write('\r\noutput\r\n\r$ ');
}
```

2. Add to `commands/manifest.json`: `{ "name": "my-cmd", "type": "command", "desc": "..." }`

No changes to `index.html` needed.

## Adding an app (full-screen game/tool)

1. Create `commands/<name>.js`:

```javascript
import { createGameUI } from './game-ui.js';

export const type = 'app';
export const title = 'My App';
export const description = '...';

export function execute(args, container, onExit) {
    const { wrapper, heading, addCleanup, hideHeading, getAvailableSize } = createGameUI({
        title: 'MY APP',
        width: 800,
        height: 600,
    });

    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    wrapper.appendChild(canvas);

    container.appendChild(wrapper);
    addCleanup(() => { /* remove listeners, cancel loops */ });
}

export function onExit() {
    // Called when user clicks X or presses Escape
}
```

`createGameUI()` returns `{ wrapper, heading, addCleanup, removeCleanup, hideHeading, getAvailableSize }`.
Options: `{ title, width, height, headingColor, headingFont, headingSize, canvasBg, canvasBorder, canvasBorderWidth, canvasBoxShadow, headingMargin }`.

2. Add to `commands/manifest.json`: `{ "name": "my-app", "type": "app", "desc": "..." }`

No changes to `index.html` needed.

## Module contract

- Terminal commands: `export const description`, `export async function execute(args)`
- Apps: `export const type = 'app'`, `export const title`, `export const description`, `export function execute(args, container, onExit)`, `export function onExit()`
- Apps must import `./game-ui.js` for `createGameUI()`
- All modules are loaded dynamically via `import()` from `index.html`

## Shell quirks

- `./command-name` and `command-name` both work (`./` is stripped in `executeCommand`)
- Built-in commands `clear`, `help`, `exit` are hardcoded in `index.html` (not in manifest)
- Tab completion works against the full registry (builtins + manifest entries)
- Arrow keys cycle command history; Ctrl+D exits
- `clear` calls `term.clear()`; `exit` calls `window.close()` with confirmation
- Terminal commands output via `window.term.write()` — always end with `\r$ ` to return to prompt
- Apps run full-screen in a `#app-container` div; exit via `#app-close` button or Escape key
- `launchApp()` passes `onExit` callback to modules; `restoreTerminal()` cleans up container + event listeners

## Board games (chess, checkers, connect4)

- Use `commands/board.js` — the `EightByEightBoard` class handles canvas setup, click detection, rendering, and move highlighting
- Board games implement a `config` object with: `initBoard()`, `getPiece(row, col)`, `getValidMoves(row, col)`, `executeMove(from, to)`, `getHighlightSquare()`, `drawPiece(ctx, piece, col, row, cs)`
- `EightByEightBoard.setup(container)` attaches the canvas; `destroy()` removes the click listener

## Network commands (ping, dig, ifconfig)

- These simulate terminal behavior — they use `fetch()` with `mode: 'no-cors'` for connectivity checks
- Output is written via `window.term.write()` with `setTimeout` for staggered responses

## Style conventions

- All code is ES modules with named `export` — no `require`, no bundler
- No semicolons, 4-space indentation (matches existing codebase)
- Canvas games use `#000` background, `#FFF` borders, monospace fonts — match the retro terminal aesthetic
- Mobile detection: `!window.matchMedia('(hover: hover)').matches` — hide heading on touch devices
