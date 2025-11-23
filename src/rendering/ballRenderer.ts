import { Ball } from '../store/ballSlice';
import { TableDimensions } from '../store/tableSlice';
import { TableTransform } from './tableTransform';

export class BallRenderer {
  private canvases: HTMLCanvasElement[] = [];
  private contexts: CanvasRenderingContext2D[] = [];
  private container: HTMLElement;
  private tableRenderer: {
    calculateTableBounds: (dimensions: TableDimensions) => {
      x: number;
      y: number;
      scale: number;
    };
    getTableTransform: (dimensions: TableDimensions) => TableTransform;
  };
  private lastScale = 0;
  private readonly CANVAS_PADDING_MULTIPLIER = 2.5;
  private canvasVisible: boolean[] = [];

  constructor(
    container: HTMLElement,
    tableRenderer: {
      calculateTableBounds: (dimensions: TableDimensions) => {
        x: number;
        y: number;
        scale: number;
      };
      getTableTransform: (dimensions: TableDimensions) => TableTransform;
    }
  ) {
    this.container = container;
    this.tableRenderer = tableRenderer;
    this.initializeCanvases();
  }

  /**
   * Pre-allocate 16 ball canvases
   */
  private initializeCanvases(): void {
    for (let i = 0; i < 16; i++) {
      const canvas = document.createElement('canvas');
      canvas.style.position = 'absolute';
      canvas.style.pointerEvents = 'none';
      canvas.style.display = 'none'; // Hidden by default
      
      this.container.appendChild(canvas);
      this.canvases.push(canvas);
      this.canvasVisible.push(false);

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error(`Could not get 2D context for ball canvas ${i}`);
      }
      this.contexts.push(ctx);
    }
  }

  /**
   * Update ball rendering based on current state
   */
  updateBalls(balls: Ball[], tableDimensions: TableDimensions): void {
    const transform = this.tableRenderer.getTableTransform(tableDimensions);
    const scale = transform.getScale();

    // Track if scale has changed
    const scaleChanged = scale !== this.lastScale;
    this.lastScale = scale;

    // Update each ball canvas
    balls.forEach((ball, index) => {
      if (index >= this.canvases.length) return;

      const canvas = this.canvases[index];
      const ctx = this.contexts[index];

      if (!ball.active) {
        canvas.style.display = 'none';
        this.canvasVisible[index] = false;
        return;
      }

      // Check if canvas is becoming visible
      const wasHidden = !this.canvasVisible[index];

      // Convert table position to screen position using the transform
      const screenPosition = transform.tableToScreen(ball.position.x, ball.position.y);
      const screenRadius = ball.radius * scale;

      // Size canvas to fit ball with padding (only if scale changed)
      const canvasSize = Math.ceil(screenRadius * this.CANVAS_PADDING_MULTIPLIER);
      if (scaleChanged || canvas.width !== canvasSize) {
        canvas.width = canvasSize;
        canvas.height = canvasSize;
      }

      // Position canvas centered on ball
      const canvasX = screenPosition.x - canvasSize / 2;
      const canvasY = screenPosition.y - canvasSize / 2;
      canvas.style.transform = `translate3d(${canvasX}px, ${canvasY}px, 0)`;
      canvas.style.display = 'block';
      this.canvasVisible[index] = true;

      // Draw the ball (redraw if canvas was resized or was previously hidden)
      if (scaleChanged || canvas.width !== canvasSize || wasHidden) {
        this.drawBall(ctx, canvasSize / 2, canvasSize / 2, screenRadius, ball.type);
      }
    });

    // Hide unused canvases
    for (let i = balls.length; i < this.canvases.length; i++) {
      this.canvases[i].style.display = 'none';
      this.canvasVisible[i] = false;
    }
  }

  /**
   * Draw a ball on its canvas
   */
  private drawBall(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    radius: number,
    type: Ball['type']
  ): void {
    // Clear canvas
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Draw ball based on type
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);

    switch (type) {
      case 'cue':
        ctx.fillStyle = '#ffffff'; // White
        break;
      case 'solid':
        ctx.fillStyle = '#ff0000'; // Red (placeholder)
        break;
      case 'stripe':
        ctx.fillStyle = '#0000ff'; // Blue (placeholder)
        break;
      case 'eight':
        ctx.fillStyle = '#000000'; // Black
        break;
    }

    ctx.fill();

    // Add a subtle border for visibility
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  /**
   * Clean up canvases
   */
  destroy(): void {
    this.canvases.forEach((canvas) => {
      canvas.remove();
    });
    this.canvases = [];
    this.contexts = [];
  }
}
