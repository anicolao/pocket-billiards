import { store } from './store';
import { TableRenderer } from './rendering/renderer';
import { BallRenderer } from './rendering/ballRenderer';
import { physicsEngine } from './physicsEngine';
import { shot } from './store/ballSlice';

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
  
  // Start physics simulation if any ball is moving and simulation is not already running
  const ballsMoving = state.balls.balls.some(b => b.active && (b.velocity.x !== 0 || b.velocity.y !== 0));
  if (ballsMoving && !physicsEngine.isRunning()) {
    physicsEngine.start();
  }
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

// Expose store and physicsEngine for testing/debugging
declare global {
  interface Window {
    store: typeof store;
    physicsEngine: typeof physicsEngine;
    shot: typeof shot;
  }
}

window.store = store;
window.physicsEngine = physicsEngine;
window.shot = shot;
