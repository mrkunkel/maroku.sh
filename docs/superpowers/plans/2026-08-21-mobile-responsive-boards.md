# Mobile Responsive Board Games Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make tic-tac-toe, connect4, chess, and checkers fill the mobile screen by hiding the heading and sizing the canvas to available space, plus disabling connect4's hover preview on touch devices.

**Architecture:** Add two helper methods to `game-ui.js` (`hideHeading`, `getAvailableSize`). Each game calls them during `execute()`. `board.js` gains a `resize()` method. Connect4 skips its `mousemove` listener on touch devices.

**Tech Stack:** Vanilla JS, browser APIs only (`matchMedia`, `getBoundingClientRect`, `resizeObserver`).

## Global Constraints

- No build step, no npm, no tests, no lint — open `index.html` in a browser to verify
- `createGameUI()` existing options and return values must not break
- `hideHeading()` and `getAvailableSize()` are new additions to the return value
- `EightByEightBoard.resize()` recalculates `cellSize` and canvas dimensions in-place
- Connect4 hover: only attach `mousemove` listener when `window.matchMedia('(hover: hover)').matches` is true

---

### Task 1: game-ui.js — add `hideHeading()` and `getAvailableSize()` helpers

**Files:**
- Modify: `commands/game-ui.js`

**Interfaces:**
- Consumes: existing `createGameUI()` return `{ wrapper, heading, addCleanup, removeCleanup }`
- Produces: adds `hideHeading()` and `getAvailableSize()` to the return value

- [ ] **Step 1: Add `hideHeading()` method**

After the `removeCleanup` function in `createGameUI()`, add:

```javascript
function hideHeading() {
    heading.style.display = 'none';
}
```

- [ ] **Step 2: Add `getAvailableSize()` method**

Add after `hideHeading()`:

```javascript
function getAvailableSize() {
    return {
        width: wrapper.clientWidth,
        height: wrapper.clientHeight - heading.offsetHeight,
    };
}
```

- [ ] **Step 3: Add both to return value**

Update the return statement to:

```javascript
return { wrapper, heading, addCleanup, removeCleanup, hideHeading, getAvailableSize };
```

- [ ] **Step 4: Verify**

Open `index.html` in a browser, launch any existing app (e.g., `tetris`). Confirm it still works identically — heading visible, no layout changes.

---

### Task 2: board.js — add `resize(newWidth, newHeight)` method

**Files:**
- Modify: `commands/board.js`

**Interfaces:**
- Consumes: existing `this.canvas`, `this.ctx`, `this.config`
- Produces: `resize(width, height)` — recalculates cellSize, resizes canvas, re-renders

- [ ] **Step 1: Add `resize()` method to EightByEightBoard**

Add this method to the class (before `destroy()`):

```javascript
resize(newWidth, newHeight) {
    const oldCanvas = this.canvas;
    this.canvas.width = newWidth;
    this.canvas.height = newHeight;
    this.cellSize = newWidth / 8;
    this.canvas.style.width = newWidth + 'px';
    this.canvas.style.height = newHeight + 'px';
    this.render();
}
```

- [ ] **Step 2: Verify**

Open `index.html`, launch chess or checkers. Confirm board renders correctly at original size.

---

### Task 3: tictactoe.js — make responsive on mobile

**Files:**
- Modify: `commands/tictactoe.js`

**Interfaces:**
- Consumes: `hideHeading()`, `getAvailableSize()` from `createGameUI()`
- Produces: canvas sized to fill mobile screen, heading hidden on mobile

- [ ] **Step 1: Replace fixed canvas size with responsive sizing**

In `execute()`, replace the fixed `canvasSize` block (lines 26-31):

```javascript
// OLD:
const canvasSize = 450;
const { wrapper, heading, addCleanup } = createGameUI({
    title: 'TIC TAC TOE',
    width: canvasSize,
    height: canvasSize,
});

// NEW:
const isMobile = !window.matchMedia('(hover: hover)').matches;
const { wrapper, heading, addCleanup, hideHeading, getAvailableSize } = createGameUI({
    title: 'TIC TAC TOE',
    width: 450,
    height: 450,
});

if (isMobile) {
    hideHeading();
}

const avail = getAvailableSize();
const canvasSize = Math.min(avail.width, avail.height) - 20;
```

- [ ] **Step 2: Make canvas scale to fit**

After creating the canvas (line 33-36), add a style to make it responsive:

```javascript
canvas.style.cssText = 'background:#000;border:4px solid #FFF;box-shadow:0 0 20px rgba(255,255,255,0.15);display:block;cursor:pointer;width:' + canvasSize + 'px;height:' + canvasSize + 'px;';
```

- [ ] **Step 3: Verify**

Open in browser on mobile (or DevTools mobile emulation). Heading should be hidden, canvas should fill the screen. Launch tictactoe, confirm it's playable by tapping.

---

### Task 4: connect4.js — make responsive on mobile + disable hover on touch

**Files:**
- Modify: `commands/connect4.js`

**Interfaces:**
- Consumes: `hideHeading()`, `getAvailableSize()` from `createGameUI()`
- Produces: responsive canvas, no hover preview on touch devices

- [ ] **Step 1: Replace fixed sizing with responsive sizing + mobile detection**

In `execute()`, replace lines 36-41:

```javascript
// OLD:
const { wrapper, heading, addCleanup, removeCleanup } = createGameUI({
    title: 'CONNECT 4',
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
});

// NEW:
const isMobile = !window.matchMedia('(hover: hover)').matches;
const { wrapper, heading, addCleanup, removeCleanup, hideHeading, getAvailableSize } = createGameUI({
    title: 'CONNECT 4',
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
});

if (isMobile) {
    hideHeading();
}

const avail = getAvailableSize();
const scale = Math.min(avail.width / CANVAS_WIDTH, avail.height / CANVAS_HEIGHT, 1);
const displayWidth = Math.round(CANVAS_WIDTH * scale);
const displayHeight = Math.round(CANVAS_HEIGHT * scale);
```

- [ ] **Step 2: Apply display sizing to canvas**

After creating the canvas (lines 44-48), update the canvas style:

```javascript
canvas.style.cssText = 'background:' + COLOR_BOARD + ';border:4px solid #FFF;box-shadow:0 0 20px rgba(255,255,255,0.15);display:block;cursor:pointer;width:' + displayWidth + 'px;height:' + displayHeight + 'px;';
```

- [ ] **Step 3: Conditionally attach mousemove listener**

In the event listener block (lines 56-63), wrap `mousemove` in a hover check:

```javascript
// OLD:
const mouseMoveHandler = (e) => handleMouseMove(e);
const clickHandler = (e) => handleClick(e);
canvas.addEventListener('mousemove', mouseMoveHandler);
canvas.addEventListener('click', clickHandler);
addCleanup(() => {
    canvas.removeEventListener('mousemove', mouseMoveHandler);
    canvas.removeEventListener('click', clickHandler);
});

// NEW:
const clickHandler = (e) => handleClick(e);
canvas.addEventListener('click', clickHandler);

if (window.matchMedia('(hover: hover)').matches) {
    const mouseMoveHandler = (e) => handleMouseMove(e);
    canvas.addEventListener('mousemove', mouseMoveHandler);
    addCleanup(() => {
        canvas.removeEventListener('mousemove', mouseMoveHandler);
    });
}

addCleanup(() => {
    canvas.removeEventListener('click', clickHandler);
});
```

- [ ] **Step 4: Verify**

Open in browser, launch connect4 on desktop — hover preview should work. Then check mobile emulation — heading hidden, board scaled, no hover preview on tap.

---

### Task 5: chess.js — make responsive on mobile

**Files:**
- Modify: `commands/chess.js`

**Interfaces:**
- Consumes: `hideHeading()`, `getAvailableSize()` from `createGameUI()`
- Produces: heading hidden on mobile, board sized to fill available space

- [ ] **Step 1: Add mobile detection and responsive sizing**

Replace the hardcoded `canvasSize` and layout block (lines 61-96):

```javascript
// OLD:
const canvasSize = 480;

const wrapper = document.createElement('div');
wrapper.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;width:100%;';

const heading = document.createElement('h1');
heading.style.cssText = 'color:#FFF;font-family:monospace;font-size:32px;margin:0 0 10px 0;';
heading.textContent = 'CHESS';
wrapper.appendChild(heading);

boardView = new EightByEightBoard({
    width: canvasSize,
    height: canvasSize,
    ...
});

turnIndicator = document.createElement('div');
turnIndicator.style.cssText = 'color:#FFF;font-size:22px;font-weight:bold;margin:10px 0 0 0;font-family:monospace;';
turnIndicator.textContent = "White's turn";

wrapper.appendChild(turnIndicator);

// NEW:
const isMobile = !window.matchMedia('(hover: hover)').matches;

const wrapper = document.createElement('div');
wrapper.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;width:100%;';

const heading = document.createElement('h1');
heading.style.cssText = 'color:#FFF;font-family:monospace;font-size:32px;margin:0 0 10px 0;';
heading.textContent = 'CHESS';
if (isMobile) heading.style.display = 'none';
wrapper.appendChild(heading);

const avail = { width: window.innerWidth, height: window.innerHeight };
const headingHeight = isMobile ? 0 : 52; // heading + margin
const turnHeight = 40;
const canvasSize = Math.min(avail.width - 20, avail.height - headingHeight - turnHeight - 20);

boardView = new EightByEightBoard({
    width: canvasSize,
    height: canvasSize,
    ...
});

turnIndicator = document.createElement('div');
turnIndicator.style.cssText = 'color:#FFF;font-size:22px;font-weight:bold;margin:10px 0 0 0;font-family:monospace;';
turnIndicator.textContent = "White's turn";

wrapper.appendChild(turnIndicator);
```

- [ ] **Step 2: Apply canvas size to boardView after setup**

After `boardView.setup(canvasWrapper)` (line 101), add:

```javascript
boardView.resize(canvasSize, canvasSize);
```

- [ ] **Step 3: Verify**

Open in browser, launch chess on desktop — should look identical. Check mobile emulation — heading hidden, board fills screen.

---

### Task 6: checkers.js — make responsive on mobile

**Files:**
- Modify: `commands/checkers.js`

**Interfaces:**
- Consumes: same pattern as chess.js — mobile detection, responsive canvas sizing
- Produces: heading hidden on mobile, board sized to fill available space

- [ ] **Step 1: Apply same changes as chess.js**

Replace the `canvasSize` and layout block (lines 53-78) with the same pattern from Task 5:

```javascript
const isMobile = !window.matchMedia('(hover: hover)').matches;

const wrapper = document.createElement('div');
wrapper.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;width:100%;';

const heading = document.createElement('h1');
heading.style.cssText = 'color:#FFF;font-family:monospace;font-size:32px;margin:0 0 10px 0;';
heading.textContent = 'CHECKERS';
if (isMobile) heading.style.display = 'none';
wrapper.appendChild(heading);

const avail = { width: window.innerWidth, height: window.innerHeight };
const headingHeight = isMobile ? 0 : 52;
const turnHeight = 40;
const canvasSize = Math.min(avail.width - 20, avail.height - headingHeight - turnHeight - 20);

boardView = new EightByEightBoard({
    width: canvasSize,
    height: canvasSize,
    ...
});

turnIndicator = document.createElement('div');
turnIndicator.style.cssText = 'color:#CC0000;font-size:22px;font-weight:bold;margin:10px 0 0 0;font-family:monospace;';
turnIndicator.textContent = "Red's turn";

wrapper.appendChild(turnIndicator);
```

- [ ] **Step 2: Apply canvas size to boardView after setup**

After `boardView.setup(canvasWrapper)` (line 83), add:

```javascript
boardView.resize(canvasSize, canvasSize);
```

- [ ] **Step 3: Verify**

Open in browser, launch checkers on desktop — should look identical. Check mobile emulation — heading hidden, board fills screen.

---

### Task 7: Final verification of all games

**Files:**
- No file changes

**Interfaces:**
- Consumes: all previous tasks
- Produces: confirmed working on both desktop and mobile

- [ ] **Step 1: Desktop verification**

Open `index.html` in a desktop browser. Launch each game:
- `tictactoe` — heading visible, 450x450 canvas, playable with click
- `connect4` — heading visible, hover preview works, playable with click
- `chess` — heading visible, 480x480 board, playable with click
- `checkers` — heading visible, 480x480 board, playable with click

- [ ] **Step 2: Mobile verification (DevTools or real device)**

Open DevTools Device Toolbar (Ctrl+Shift+M). Launch each game:
- `tictactoe` — heading hidden, canvas fills screen, playable by tap
- `connect4` — heading hidden, board scaled, NO hover preview, playable by tap
- `chess` — heading hidden, board fills screen, playable by tap
- `checkers` — heading hidden, board fills screen, playable by tap

- [ ] **Step 3: Verify non-target games unchanged**

Launch `tetris`, `asteroids`, `pong`, `invaders` — confirm they still look identical to before.
