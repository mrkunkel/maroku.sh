// Shared game UI setup — creates centered wrapper, heading, and styled canvas.
// All games should use this unless they explicitly override defaults.
//
// Usage:
//   import { createGameUI } from './game-ui.js';
//   const { wrapper, heading, canvas, addCleanup, removeCleanup } = createGameUI({
//     title: 'My Game',
//     width: 800,
//     height: 600,
//   });
//   container.appendChild(wrapper);
//   // ... game code ...
//   // Register cleanup to run on exit:
//   addCleanup(() => { /* remove listeners, etc */ });
//   // Then in onExit():
//   removeCleanup();

const DEFAULTS = {
    title: '',
    width: 800,
    height: 600,
    headingColor: '#FFF',
    headingFont: 'monospace',
    headingSize: '32px',
    canvasBg: '#000',
    canvasBorder: '#FFF',
    canvasBorderWidth: '4px',
    canvasBoxShadow: '0 0 20px rgba(255,255,255,0.15)',
    headingMargin: '0 0 10px 0',
};

export function createGameUI(options = {}) {
    const opts = { ...DEFAULTS, ...options };

    // Centering wrapper
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;width:100%;';

    // Heading
    const heading = document.createElement('h1');
    heading.style.cssText = `color:${opts.headingColor};font-family:${opts.headingFont};font-size:${opts.headingSize};margin:${opts.headingMargin};`;
    heading.textContent = opts.title;
    wrapper.appendChild(heading);

    // Cleanup registry
    const cleanupFns = [];

    function addCleanup(fn) {
        cleanupFns.push(fn);
    }

    function removeCleanup() {
        for (const fn of cleanupFns) {
            fn();
        }
        cleanupFns.length = 0;
    }

    return { wrapper, heading, addCleanup, removeCleanup };
}
