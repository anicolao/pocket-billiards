import { TableDimensions } from '../store/tableSlice';
import { TableTransform } from './tableTransform';

export class TableRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private transform: TableTransform | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not get 2D context');
    }
    this.ctx = context;
  }

  /**
   * Resize the canvas to fill the window
   */
  resize(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    
    // Invalidate transform on resize
    if (this.transform) {
      this.transform.updateScreenSize(this.canvas.width, this.canvas.height);
    }
  }

  /**
   * Get or create the table transform
   */
  private getTransform(dimensions: TableDimensions): TableTransform {
    if (!this.transform) {
      this.transform = new TableTransform(
        this.canvas.width,
        this.canvas.height,
        dimensions
      );
    }
    return this.transform;
  }

  /**
   * Calculate the table position to center it on the canvas
   * @deprecated Use TableTransform instead
   */
  calculateTableBounds(dimensions: TableDimensions): {
    x: number;
    y: number;
    scale: number;
  } {
    const transform = this.getTransform(dimensions);
    const translation = transform.getTranslation();
    const scale = transform.getScale();

    return {
      x: translation.x,
      y: translation.y,
      scale: scale,
    };
  }

  /**
   * Draw the pool table with felt and pockets
   */
  drawTable(dimensions: TableDimensions): void {
    const { width, height, pockets, railWidth } = dimensions;
    const transform = this.getTransform(dimensions);

    // Clear the canvas
    this.ctx.fillStyle = '#1a1a1a'; // Dark background
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.save();
    
    // Apply the table transform
    transform.applyToContext(this.ctx);

    // Draw the outer rail (wood) - extends from -railWidth to +railWidth around playing surface
    this.ctx.fillStyle = '#4a3428'; // Dark wood color
    this.ctx.fillRect(-railWidth, -railWidth, width + railWidth * 2, height + railWidth * 2);

    // Draw the playing surface (felt) - at origin (0, 0)
    this.ctx.fillStyle = '#0b6623'; // Green felt
    this.ctx.fillRect(0, 0, width, height);

    // Draw the pockets
    this.drawPockets(pockets);

    this.ctx.restore();
  }

  /**
   * Draw the pockets on the table
   */
  private drawPockets(pockets: { x: number; y: number; radius: number }[]): void {
    this.ctx.fillStyle = '#000000'; // Black pockets

    pockets.forEach((pocket) => {
      this.ctx.beginPath();
      // Pockets are positioned in table coordinates (relative to playing surface origin)
      this.ctx.arc(pocket.x, pocket.y, pocket.radius, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }

  /**
   * Clear the canvas
   */
  clear(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Get the table transform for use by other renderers
   */
  getTableTransform(dimensions: TableDimensions): TableTransform {
    return this.getTransform(dimensions);
  }
}
