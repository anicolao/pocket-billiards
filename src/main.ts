import { store } from './store';
import { TableRenderer } from './rendering/renderer';

// Get the app container
const appContainer = document.getElementById('app');
if (!appContainer) {
  throw new Error('App container not found');
}

// Create the main canvas
const canvas = document.createElement('canvas');
appContainer.appendChild(canvas);

// Create the renderer
const renderer = new TableRenderer(canvas);

// Resize the canvas to fill the window
renderer.resize();

// Subscribe to store changes and redraw
store.subscribe(() => {
  const state = store.getState();
  renderer.drawTable(state.table.dimensions);
});

// Initial draw
const state = store.getState();
renderer.drawTable(state.table.dimensions);

// Handle window resize
window.addEventListener('resize', () => {
  renderer.resize();
  const state = store.getState();
  renderer.drawTable(state.table.dimensions);
});
