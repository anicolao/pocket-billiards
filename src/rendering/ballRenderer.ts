import { Ball } from '../store/ballSlice';
import { TableDimensions } from '../store/tableSlice';

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
  };

  constructor(
    container: HTMLElement,
    tableRenderer: {
      calculateTableBounds: (dimensions: TableDimensions) => {
        x: number;
        y: number;
        scale: number;
      };
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
    const { x: tableX, y: tableY, scale } = this.tableRenderer.calculateTableBounds(tableDimensions);
    const railWidth = tableDimensions.railWidth;

    // Update each ball canvas
    balls.forEach((ball, index) => {
      if (index >= this.canvases.length) return;

      const canvas = this.canvases[index];
      const ctx = this.contexts[index];

      if (!ball.active) {
        canvas.style.display = 'none';
        return;
      }

      // Calculate screen position
      // Ball position is relative to playing surface (felt)
      // Add rail offset to get position relative to table origin
      const screenX = tableX + (railWidth + ball.position.x) * scale;
      const screenY = tableY + (railWidth + ball.position.y) * scale;
      const screenRadius = ball.radius * scale;

      // Size canvas to fit ball with some padding
      const canvasSize = Math.ceil(screenRadius * 2.5);
      canvas.width = canvasSize;
      canvas.height = canvasSize;

      // Position canvas centered on ball
      const canvasX = screenX - canvasSize / 2;
      const canvasY = screenY - canvasSize / 2;
      canvas.style.transform = `translate3d(${canvasX}px, ${canvasY}px, 0)`;
      canvas.style.display = 'block';

      // Draw the ball
      this.drawBall(ctx, canvasSize / 2, canvasSize / 2, screenRadius, ball.type);
    });

    // Hide unused canvases
    for (let i = balls.length; i < this.canvases.length; i++) {
      this.canvases[i].style.display = 'none';
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
