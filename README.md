# maroku.sh

A browser-based terminal for performing network tasks and launching interactive apps.

## Features

- `dig <host>` - Look up DNS information for a host
- `ping <host>` - Test network connectivity to a host
- `ifconfig` - Show network interface configuration
- `ls` - List directory contents
- `uname` - Print system information
- `whoami` - Print current user
- `clear` - Clear the terminal screen
- `help` - Show available commands
- `exit` - Close this tab/window
- Apps - Type an app name to launch it full-screen (e.g., `tetris`, `pong`, `tictactoe`, `invaders`, `asteroids`, `chess`, `connect4`, `checkers`)

## Project Structure

```
index.html          # Main shell, terminal, command routing
styles.css          # Terminal and app container styles
commands/
  manifest.json     # Registry of all commands and apps
  game-ui.js        # Shared game UI setup (wrapper, heading, canvas)
  ping.js           # Terminal command: ping a host
  dig.js            # Terminal command: DNS lookup
  ifconfig.js       # Terminal command: network interfaces
  ls.js             # Terminal command: list directory
  uname.js          # Terminal command: system info
  whoami.js         # Terminal command: current user
  tetris.js         # App: Tetris game
  pong.js           # App: Pong (mouse wheel control)
  tictactoe.js      # App: Two-player tic-tac-toe
  invaders.js       # App: Space Invaders
  asteroids.js      # App: Asteroids
  chess.js          # App: Two-player chess
  connect4.js       # App: Two-player Connect 4
  checkers.js       # App: Two-player checkers
```

## Adding a New App

1. Create `commands/<name>.js` with the app module contract:

```javascript
import { createGameUI } from './game-ui.js';

export const type = 'app';
export const title = 'My App';
export const description = 'What my app does';

export function execute(args, container, onExit) {
    const { wrapper, heading, addCleanup } = createGameUI({
        title: 'MY APP',
        width: 800,
        height: 600,
    });

    // Create your canvas and add it to the wrapper
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    wrapper.appendChild(canvas);

    container.appendChild(wrapper);

    // Register cleanup functions to run on exit
    addCleanup(() => {
        // Remove event listeners, cancel animations, etc.
    });
}

export function onExit() {
    // Called when the user clicks the X button
}
```

`createGameUI` provides a centered layout with a white heading above the game. Customize with options: `{ title, width, height, headingColor, headingFont, headingSize, canvasBg, canvasBorder, canvasBorderWidth, canvasBoxShadow, headingMargin }`.

2. Add an entry to `commands/manifest.json`:

```json
{ "name": "my-app", "type": "app", "desc": "What my app does" }
```

3. No changes to `index.html` needed. Your app will be discovered automatically.

## Adding a New Terminal Command

1. Create `commands/<name>.js` with the command module contract:

```javascript
export const description = 'What the command does';

export async function execute(args) {
    // Your command logic
    // Use window.term.write() to output to the terminal
}
```

2. Add an entry to `commands/manifest.json`:

```json
{ "name": "my-command", "type": "command", "desc": "What the command does" }
```

3. If the command needs special handling (like `clear` or `help`), register it in `executeCommand()` in `index.html`.

## Notes

- Use `./command-name` or `command-name` — both work (the `./` is stripped)
- Apps run full-screen with an X button to return to the shell
- Terminal state is preserved when apps are running
