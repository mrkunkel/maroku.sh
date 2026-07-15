# maroku.sh

A browser-based terminal for performing network tasks and launching interactive apps.

## Features

- `dig <host>` - Look up DNS information for a host
- `ping <host>` - Test network connectivity to a host
- `clear` - Clear the terminal screen
- `help` - Show available commands
- `exit` - Close this tab/window
- Apps - Type an app name to launch it full-screen (e.g., `tetris`)

## Project Structure

```
index.html          # Main shell, xterm.js terminal, command routing
styles.css          # Terminal and app container styles
commands/
  manifest.json     # Registry of all commands and apps
  ping.js           # Terminal command: ping a host
  dig.js            # Terminal command: DNS lookup
  tetris.js         # App: Tetris game
```

## Adding a New App

1. Create `commands/<name>.js` with the app module contract:

```javascript
export const type = 'app';
export const title = 'My App';
export const description = 'What my app does';

export function execute(args, container, onExit) {
    // Render your app into the container element
    // The container is full-screen and ready for your content
}

export function onExit() {
    // Clean up your app when the user closes it
    // Remove event listeners, cancel animations, etc.
}
```

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
