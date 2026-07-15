# App Launcher Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the browser terminal to launch full-screen apps/games via commands like `tetris` or `./tetris`, with an X button to return to the shell.

**Architecture:** The shell fetches `manifest.json` at startup to discover all commands and apps. When an app command is detected, the terminal hides and a full-screen container with an X button appears. The app's `execute()` function receives a DOM container and an `onExit` callback. No virtual filesystem — `./tetris` normalizes to `tetris`.

**Tech Stack:** Vanilla JS, xterm.js, ES modules, static HTML/CSS

## Global Constraints

- `./` prefix must be stripped before command resolution (so `./tetris` → `tetris`)
- Apps render full-screen, hiding the terminal completely
- Terminal state must be preserved on app exit and restored exactly as before
- New apps require only: create `commands/<name>.js` + add entry to `manifest.json`
- No changes to `index.html` should be needed to add a new app
- Existing commands (`dig`, `ping`, `clear`, `help`, `exit`) must continue to work unchanged

---

### Task 1: Update manifest.json with type fields

**Files:**
- Modify: `commands/manifest.json`

**Interfaces:**
- Consumes: existing manifest structure
- Produces: manifest with `type` field on each entry (`"command"` or `"app"`)

- [ ] **Step 1: Update manifest.json to include type fields**

Change each entry to include a `type` field:

```json
[
  { "name": "dig", "type": "command", "desc": "Look up DNS information for a host" },
  { "name": "ping", "type": "command", "desc": "Test network connectivity to a host" }
]
```

- [ ] **Step 2: Verify manifest.json is valid JSON**

Run: `node -e "JSON.parse(require('fs').readFileSync('commands/manifest.json','utf8')); console.log('valid')" `
Expected: `valid`

- [ ] **Step 3: Commit**

```bash
git add commands/manifest.json
git commit -m "chore: add type field to manifest entries"
```

---

### Task 2: Refactor index.html — normalize input and fetch manifest

**Files:**
- Modify: `index.html`

**Interfaces:**
- Consumes: existing `executeCommand()` function, existing `COMMANDS` array
- Produces: command resolution that strips `./` prefix, fetches manifest.json, distinguishes apps from commands

- [ ] **Step 1: Add `./` prefix normalization in `executeCommand()`**

In the `executeCommand()` function (line 114), update the command parsing to strip `./` prefix:

```javascript
async function executeCommand(command) {
    const parts = command.split(' ');
    let cmd = parts[0].toLowerCase();
    // Strip ./ prefix so ./tetris maps to tetris
    cmd = cmd.replace(/^\.\//, '');
    const args = parts.slice(1);
```

- [ ] **Step 2: Replace hardcoded COMMANDS array with manifest-based discovery**

Remove the hardcoded `const COMMANDS` array (line 49). Replace it with a variable that will hold discovered commands:

```javascript
// Command and app registry — loaded from manifest.json
let registry = [];
```

- [ ] **Step 3: Add manifest fetch function**

Add a function to load the manifest and populate the registry. Add this before `executeCommand()`:

```javascript
async function loadRegistry() {
    try {
        const response = await fetch('./commands/manifest.json');
        registry = await response.json();
    } catch (err) {
        console.error('Failed to load command registry:', err);
        registry = [];
    }
}
```

- [ ] **Step 4: Call loadRegistry on page load**

At the end of the existing script (before the closing `</script>` tag, after the banner), add:

```javascript
// Load command registry on startup
loadRegistry();
```

- [ ] **Step 5: Update executeCommand to check manifest for apps**

After the built-in command checks (lines 124-136), add app/command discovery logic. Replace the existing try/catch block (lines 138-150) with:

```javascript
    // Check if this is a registered command or app
    const entry = registry.find(r => r.name === cmd);
    if (!entry) {
        term.write(`\r\nCommand not found: ${cmd}\r\n\r$ `);
        return;
    }

    // Built-in commands that don't use manifest modules
    if (cmd === 'clear') { clear(); return; }
    if (cmd === 'exit') { exit(); return; }
    if (cmd === 'help') { await help(); return; }

    // Terminal commands (type: "command")
    if (entry.type === 'command') {
        try {
            const module = await import(`./commands/${cmd}.js`);
            if (module && typeof module.execute === 'function') {
                await module.execute(args);
            } else {
                throw new Error('Invalid command module');
            }
        } catch (err) {
            console.error("Error executing command:", err);
            term.write(`\r\nCommand error: ${cmd}\r\n\r$ `);
        }
        return;
    }

    // Apps (type: "app")
    if (entry.type === 'app') {
        try {
            const module = await import(`./commands/${cmd}.js`);
            if (module && typeof module.execute === 'function') {
                await launchApp(cmd, module, args);
            } else {
                throw new Error('Invalid app module');
            }
        } catch (err) {
            console.error("Error launching app:", err);
            term.write(`\r\nFailed to launch ${cmd}\r\n\r$ `);
        }
        return;
    }
```

- [ ] **Step 6: Update help() to use registry**

Replace the `help()` function with one that reads from the registry:

```javascript
async function help() {
    term.write('\r\nAvailable commands:\r\n');
    
    for (const entry of registry) {
        const desc = entry.desc || "No description available";
        term.write(`  ${entry.name.padEnd(15)} - ${desc}\r\n`);
    }
    
    term.write('  clear            - Clear the terminal screen\r\n');
    term.write('  help             - Show this help message\r\n');
    term.write('  exit             - Close this tab/window\r\n');
    term.write('\r$ ');
}
```

- [ ] **Step 7: Add launchApp function**

Add this function before `help()`:

```javascript
let appContainer = null;

async function launchApp(name, module, args) {
    // Hide terminal
    term.write('\r\n');
    document.getElementById('terminal').style.display = 'none';
    
    // Create app container
    appContainer = document.createElement('div');
    appContainer.id = 'app-container';
    appContainer.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:black;z-index:1000;';
    
    // Add close button
    const closeBtn = document.createElement('button');
    closeBtn.id = 'app-close';
    closeBtn.innerHTML = '&#10005;';
    closeBtn.style.cssText = 'position:absolute;top:10px;right:10px;background:rgba(255,0,0,0.7);color:white;border:none;border-radius:50%;width:32px;height:32px;font-size:18px;cursor:pointer;z-index:1001;';
    closeBtn.title = 'Exit app';
    closeBtn.addEventListener('click', () => {
        if (module.onExit) module.onExit();
        restoreTerminal();
    });
    
    appContainer.appendChild(closeBtn);
    document.body.appendChild(appContainer);
    
    // Launch app
    await module.execute(args, appContainer, () => {
        // App cleanup callback (called by the app itself)
    });
}

function restoreTerminal() {
    if (appContainer) {
        appContainer.remove();
        appContainer = null;
    }
    document.getElementById('terminal').style.display = '';
    term.focus();
}
```

- [ ] **Step 8: Commit**

```bash
git add index.html
git commit -m "feat: add app launcher with manifest-based discovery and ./ prefix normalization"
```

---

### Task 3: Add app container styles

**Files:**
- Modify: `styles.css`

**Interfaces:**
- Consumes: existing body/terminal styles
- Produces: styles for `#app-container` and `#app-close`

- [ ] **Step 1: Add styles for app container and close button**

Append these styles to `styles.css`:

```css
#app-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: black;
    z-index: 1000;
}

#app-close {
    position: absolute;
    top: 10px;
    right: 10px;
    background: rgba(255, 0, 0, 0.7);
    color: white;
    border: none;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    font-size: 18px;
    cursor: pointer;
    z-index: 1001;
    transition: background 0.2s;
}

#app-close:hover {
    background: rgba(255, 0, 0, 1);
}
```

- [ ] **Step 2: Commit**

```bash
git add styles.css
git commit -m "style: add app container and close button styles"
```

---

### Task 4: Create example app (tetris)

**Files:**
- Create: `commands/tetris.js`
- Modify: `commands/manifest.json` (add tetris entry)

**Interfaces:**
- Consumes: manifest entry with `type: "app"`
- Produces: a working Tetris game rendered in the app container

- [ ] **Step 1: Add tetris entry to manifest.json**

Add this entry to the manifest array:

```json
{ "name": "tetris", "type": "app", "desc": "A classic block-stacking game" }
```

- [ ] **Step 2: Create commands/tetris.js with the app contract**

Create a Tetris game that follows the app module contract:

```javascript
export const type = 'app';
export const title = 'Tetris';
export const description = 'A classic block-stacking game';

// Game constants
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 25;

// Tetromino definitions
const SHAPES = [
    [[1,1,1,1]],                           // I
    [[1,1],[1,1]],                          // O
    [[0,1,0],[1,1,1]],                      // T
    [[1,0,0],[1,1,1]],                      // L
    [[0,0,1],[1,1,1]],                      // J
    [[0,1,1],[1,1,0]],                      // S
    [[1,1,0],[0,1,1]]                       // Z
];

const COLORS = ['#00f0f0', '#f0f000', '#a000f0', '#f0a000', '#0000f0', '#00f000', '#f00000'];

let canvas, ctx;
let board, currentPiece, currentX, currentY, currentShape, currentColor;
let score, gameOver, gameInterval, animationId;

export function execute(args, container, onExit) {
    // Create canvas
    canvas = document.createElement('canvas');
    canvas.width = COLS * BLOCK_SIZE;
    canvas.height = ROWS * BLOCK_SIZE;
    canvas.style.cssText = 'display:block;margin:40px auto 0;';
    container.appendChild(canvas);
    
    ctx = canvas.getContext('2d');
    
    // Initialize game
    initGame();
    
    // Setup keyboard controls
    document.addEventListener('keydown', handleKeyDown);
    
    // Store cleanup function
    window._tetrisCleanup = () => {
        document.removeEventListener('keydown', handleKeyDown);
        if (gameInterval) clearInterval(gameInterval);
        if (animationId) cancelAnimationFrame(animationId);
    };
}

export function onExit() {
    if (window._tetrisCleanup) {
        window._tetrisCleanup();
        delete window._tetrisCleanup;
    }
}

function initGame() {
    board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    score = 0;
    gameOver = false;
    spawnPiece();
    gameLoop();
}

function spawnPiece() {
    const idx = Math.floor(Math.random() * SHAPES.length);
    currentShape = SHAPES[idx];
    currentColor = COLORS[idx];
    currentX = Math.floor((COLS - currentShape[0].length) / 2);
    currentY = 0;
    
    if (collides(currentShape, currentX, currentY)) {
        gameOver = true;
    }
}

function collides(shape, offsetX, offsetY) {
    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x]) {
                const newX = offsetX + x;
                const newY = offsetY + y;
                if (newX < 0 || newX >= COLS || newY >= ROWS) return true;
                if (newY >= 0 && board[newY][newX]) return true;
            }
        }
    }
    return false;
}

function rotate(shape) {
    const rows = shape.length;
    const cols = shape[0].length;
    const rotated = Array.from({ length: cols }, () => Array(rows).fill(0));
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            rotated[x][rows - 1 - y] = shape[y][x];
        }
    }
    return rotated;
}

function merge() {
    for (let y = 0; y < currentShape.length; y++) {
        for (let x = 0; x < currentShape[y].length; x++) {
            if (currentShape[y][x]) {
                board[currentY + y][currentX + x] = currentColor;
            }
        }
    }
}

function clearLines() {
    let linesCleared = 0;
    for (let y = ROWS - 1; y >= 0; y--) {
        if (board[y].every(cell => cell !== 0)) {
            board.splice(y, 1);
            board.unshift(Array(COLS).fill(0));
            linesCleared++;
            y++;
        }
    }
    if (linesCleared > 0) {
        score += linesCleared * 100;
    }
}

function drop() {
    if (!collides(currentShape, currentX, currentY + 1)) {
        currentY++;
    } else {
        merge();
        clearLines();
        spawnPiece();
    }
}

function handleKeyDown(e) {
    if (gameOver) return;
    
    switch (e.key) {
        case 'ArrowLeft':
            if (!collides(currentShape, currentX - 1, currentY)) currentX--;
            break;
        case 'ArrowRight':
            if (!collides(currentShape, currentX + 1, currentY)) currentX++;
            break;
        case 'ArrowDown':
            drop();
            break;
        case 'ArrowUp':
            const rotated = rotate(currentShape);
            if (!collides(rotated, currentX, currentY)) {
                currentShape = rotated;
            }
            break;
    }
}

function draw() {
    // Clear
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw board
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (board[y][x]) {
                ctx.fillStyle = board[y][x];
                ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
            }
        }
    }
    
    // Draw current piece
    if (currentShape && !gameOver) {
        ctx.fillStyle = currentColor;
        for (let y = 0; y < currentShape.length; y++) {
            for (let x = 0; x < currentShape[y].length; x++) {
                if (currentShape[y][x]) {
                    ctx.fillRect((currentX + x) * BLOCK_SIZE, (currentY + y) * BLOCK_SIZE, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
                }
            }
        }
    }
    
    // Draw score
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText(`Score: ${score}`, 10, ROWS * BLOCK_SIZE + 25);
    
    // Draw game over
    if (gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = '24px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
        ctx.font = '16px monospace';
        ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 30);
        ctx.fillText('Press X to quit', canvas.width / 2, canvas.height / 2 + 60);
    }
}

function gameLoop() {
    if (gameOver) return;
    
    draw();
    
    if (!gameInterval) {
        gameInterval = setInterval(() => {
            if (!gameOver) drop();
        }, 500);
    }
    
    animationId = requestAnimationFrame(gameLoop);
}
```

- [ ] **Step 3: Commit**

```bash
git add commands/tetris.js commands/manifest.json
git commit -m "feat: add Tetris game as example app"
```

---

### Task 5: Update README.md

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: existing README content
- Produces: updated README documenting project structure and how to add apps/commands

- [ ] **Step 1: Update README.md with project structure and app documentation**

Replace the entire README.md with:

```markdown
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
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: update README with project structure and app/commands guide"
```

---

## Self-Review

**Spec coverage:**
- `./` prefix normalization → Task 2, Step 1
- Manifest-based discovery → Task 2, Steps 2-4
- Apps vs commands distinction → Task 2, Step 5
- Full-screen app rendering → Task 2, Step 5 (launchApp)
- X button to close → Task 2, Step 5 (closeBtn)
- Terminal state preserved on exit → Task 2, Step 5 (restoreTerminal)
- App module contract (`execute`, `onExit`) → Task 2, Step 5 + Task 4
- No changes to index.html needed for new apps → Task 4 (only manifest + new file)
- Existing commands unchanged → Task 2 preserves dig/ping/clear/help/exit paths
- Styles for app container → Task 3
- README documentation → Task 5

**Placeholder scan:** No TBD, TODO, or vague requirements found. All steps have concrete code.

**Type consistency:** `execute(args, container, onExit)` signature is consistent across Task 2, Task 4, and README. `manifest.json` uses `type`, `name`, `desc` fields consistently.

**Scope check:** Single feature — app launcher. Focused and implementable.
