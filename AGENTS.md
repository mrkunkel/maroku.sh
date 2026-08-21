# maroku.sh — Agent Instructions

## Repo at a glance

Single-file vanilla JS browser terminal. No build step, no npm, no tests, no lint.
Open `index.html` in a browser.

- `index.html` — shell, terminal (xterm.js), command routing, app launcher
- `styles.css` — terminal and app container styles
- `commands/manifest.json` — registry of all commands and apps
- `commands/*.js` — individual command/app modules

## Adding a terminal command

1. Create `commands/<name>.js`:

```javascript
export const description = "What the command does";

export async function execute(args) {
    window.term.write('\r\noutput\r\n\r$ ');
}
```

2. Add to `commands/manifest.json`: `{ "name": "my-cmd", "type": "command", "desc": "..." }`

## Adding an app (full-screen game/tool)

1. Create `commands/<name>.js`:

```javascript
import { createGameUI } from './game-ui.js';

export const type = 'app';
export const title = 'My App';
export const description = '...';

export function execute(args, container, onExit) {
    const { wrapper, heading, addCleanup } = createGameUI({
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

`createGameUI()` options: `{ title, width, height, headingColor, headingFont, headingSize, canvasBg, canvasBorder, canvasBorderWidth, canvasBoxShadow, headingMargin }`.

2. Add to `commands/manifest.json`: `{ "name": "my-app", "type": "app", "desc": "..." }`

No changes to `index.html` needed.

## Module contract

- Terminal commands: `export const description`, `export async function execute(args)`
- Apps: `export const type = 'app'`, `export const title`, `export const description`, `export function execute(args, container, onExit)`, `export function onExit()`
- Apps must import `./game-ui.js` for `createGameUI()`
- All modules are loaded dynamically via `import()` from `index.html`

## Shell quirks

- `./command-name` and `command-name` both work (`./` is stripped)
- Built-in commands `clear`, `help`, `exit` are hardcoded in `index.html`
- Tab completion works against the full registry
- Arrow keys cycle command history
- `clear` and `help` are special-cased in `executeCommand()` in `index.html`
- Terminal commands output via `window.term.write()` — always end with `\r$ ` to return to prompt
- Apps run full-screen with `#app-close` button and Escape key to exit
