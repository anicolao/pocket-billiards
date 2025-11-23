import { TableDimensions } from '../store/tableSlice';

export class TableRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  // Rendering constants
  private static readonly CORNER_POCKET_INSET_RATIO = 0.3;

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
  }

  /**
   * Calculate the table position to center it on the canvas
   */
  private calculateTableBounds(dimensions: TableDimensions): {
    x: number;
    y: number;
    scale: number;
  } {
    const { width, height, railWidth } = dimensions;
    const totalWidth = width + railWidth * 2;
    const totalHeight = height + railWidth * 2;

    // Calculate scale to fit the table in the canvas with some padding
    const padding = 40;
    const scaleX = (this.canvas.width - padding * 2) / totalWidth;
    const scaleY = (this.canvas.height - padding * 2) / totalHeight;
    const scale = Math.min(scaleX, scaleY);

    // Center the table
    const scaledWidth = totalWidth * scale;
    const scaledHeight = totalHeight * scale;
    const x = (this.canvas.width - scaledWidth) / 2;
    const y = (this.canvas.height - scaledHeight) / 2;

    return { x, y, scale };
  }

  /**
   * Draw the pool table with felt and pockets
   */
  drawTable(dimensions: TableDimensions): void {
    const { width, height, pocketRadius, railWidth } = dimensions;
    const { x, y, scale } = this.calculateTableBounds(dimensions);

    // Clear the canvas
    this.ctx.fillStyle = '#1a1a1a'; // Dark background
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.scale(scale, scale);

    // Draw the outer rail (wood)
    this.ctx.fillStyle = '#4a3428'; // Dark wood color
    this.ctx.fillRect(0, 0, width + railWidth * 2, height + railWidth * 2);

    // Draw the playing surface (felt)
    this.ctx.fillStyle = '#0b6623'; // Green felt
    this.ctx.fillRect(railWidth, railWidth, width, height);

    // Draw the pockets
    this.drawPockets(width, height, pocketRadius, railWidth);

    this.ctx.restore();
  }

  /**
   * Draw the six pockets on the table
   */
  private drawPockets(
    width: number,
    height: number,
    pocketRadius: number,
    railWidth: number
  ): void {
    this.ctx.fillStyle = '#000000'; // Black pockets

    // Corner pockets (slightly inset from the corners)
    const cornerInset = pocketRadius * TableRenderer.CORNER_POCKET_INSET_RATIO;
    const pockets = [
      // Top-left
      { x: railWidth + cornerInset, y: railWidth + cornerInset },
      // Top-right
      { x: railWidth + width - cornerInset, y: railWidth + cornerInset },
      // Bottom-left
      { x: railWidth + cornerInset, y: railWidth + height - cornerInset },
      // Bottom-right
      {
        x: railWidth + width - cornerInset,
        y: railWidth + height - cornerInset,
      },
      // Middle-left
      { x: railWidth, y: railWidth + height / 2 },
      // Middle-right
      { x: railWidth + width, y: railWidth + height / 2 },
    ];

    pockets.forEach((pocket) => {
      this.ctx.beginPath();
      this.ctx.arc(pocket.x, pocket.y, pocketRadius, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }

  /**
   * Clear the canvas
   */
  clear(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
