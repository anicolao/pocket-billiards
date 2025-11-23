import { store } from './store';
import { TableRenderer } from './rendering/renderer';
import { BallRenderer } from './rendering/ballRenderer';

// Get the app container
const appContainer = document.getElementById('app');
if (!appContainer) {
  throw new Error('App container not found');
}

// Create the main canvas
const canvas = document.createElement('canvas');
canvas.style.position = 'absolute';
canvas.style.top = '0';
canvas.style.left = '0';
appContainer.appendChild(canvas);

// Create the renderers
const tableRenderer = new TableRenderer(canvas);
const ballRenderer = new BallRenderer(appContainer, tableRenderer);

// Resize the canvas to fill the window
tableRenderer.resize();

// Subscribe to store changes and redraw
store.subscribe(() => {
  const state = store.getState();
  tableRenderer.drawTable(state.table.dimensions);
  ballRenderer.updateBalls(state.balls.balls, state.table.dimensions);
});

// Initial draw
const state = store.getState();
tableRenderer.drawTable(state.table.dimensions);
ballRenderer.updateBalls(state.balls.balls, state.table.dimensions);

// Handle window resize
window.addEventListener('resize', () => {
  tableRenderer.resize();
  const state = store.getState();
  tableRenderer.drawTable(state.table.dimensions);
  ballRenderer.updateBalls(state.balls.balls, state.table.dimensions);
});
