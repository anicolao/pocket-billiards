import { TableDimensions } from '../store/tableSlice';

/**
 * Manages coordinate transformations between table space and screen space.
 * Implements the design specified in TABLE_TRANSFORM.md.
 */
export class TableTransform {
  private screenWidth: number;
  private screenHeight: number;
  private tableDimensions: TableDimensions;
  private padding: number;

  // Cached transform values
  private cachedIsPortrait: boolean | null = null;
  private cachedScale: number | null = null;
  private cachedTranslationX: number | null = null;
  private cachedTranslationY: number | null = null;
  private cachedTransform: DOMMatrix | null = null;
  private cachedInverseTransform: DOMMatrix | null = null;

  constructor(
    screenWidth: number,
    screenHeight: number,
    tableDimensions: TableDimensions,
    padding: number = 40
  ) {
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
    this.tableDimensions = tableDimensions;
    this.padding = padding;
  }

  /**
   * Update screen dimensions and invalidate cache
   */
  updateScreenSize(width: number, height: number): void {
    this.screenWidth = width;
    this.screenHeight = height;
    this.invalidateCache();
  }

  /**
   * Update table dimensions and invalidate cache
   */
  updateTableDimensions(dimensions: TableDimensions): void {
    this.tableDimensions = dimensions;
    this.invalidateCache();
  }

  /**
   * Invalidate all cached transform values
   */
  private invalidateCache(): void {
    this.cachedIsPortrait = null;
    this.cachedScale = null;
    this.cachedTranslationX = null;
    this.cachedTranslationY = null;
    this.cachedTransform = null;
    this.cachedInverseTransform = null;
  }

  /**
   * Determine if screen is in portrait orientation
   */
  isPortrait(): boolean {
    if (this.cachedIsPortrait === null) {
      this.cachedIsPortrait = this.screenWidth < this.screenHeight;
    }
    return this.cachedIsPortrait;
  }

  /**
   * Calculate the total renderable table dimensions (including rails)
   */
  private getTotalTableDimensions(): { width: number; height: number } {
    const { width, height, railWidth } = this.tableDimensions;
    return {
      width: width + 2 * railWidth,
      height: height + 2 * railWidth,
    };
  }

  /**
   * Calculate the uniform scale factor
   */
  getScale(): number {
    if (this.cachedScale === null) {
      const totalTable = this.getTotalTableDimensions();
      const isPortrait = this.isPortrait();

      let scaleX: number;
      let scaleY: number;

      if (isPortrait) {
        // Portrait: table is rotated 90°, so dimensions swap
        scaleX = (this.screenWidth - 2 * this.padding) / totalTable.height;
        scaleY = (this.screenHeight - 2 * this.padding) / totalTable.width;
      } else {
        // Landscape: no rotation
        scaleX = (this.screenWidth - 2 * this.padding) / totalTable.width;
        scaleY = (this.screenHeight - 2 * this.padding) / totalTable.height;
      }

      this.cachedScale = Math.min(scaleX, scaleY);
    }
    return this.cachedScale;
  }

  /**
   * Calculate translation for centering the table
   */
  getTranslation(): { x: number; y: number } {
    if (this.cachedTranslationX === null || this.cachedTranslationY === null) {
      const totalTable = this.getTotalTableDimensions();
      const scale = this.getScale();
      const isPortrait = this.isPortrait();

      if (isPortrait) {
        // Portrait: dimensions swap after rotation
        this.cachedTranslationX =
          (this.screenWidth - totalTable.height * scale) / 2;
        this.cachedTranslationY =
          (this.screenHeight - totalTable.width * scale) / 2;
      } else {
        // Landscape: no rotation
        this.cachedTranslationX =
          (this.screenWidth - totalTable.width * scale) / 2;
        this.cachedTranslationY =
          (this.screenHeight - totalTable.height * scale) / 2;
      }
    }
    return {
      x: this.cachedTranslationX,
      y: this.cachedTranslationY,
    };
  }

  /**
   * Build the transformation matrix from table coordinates to screen coordinates.
   * This transform positions the table's playing surface origin (0,0) correctly.
   */
  getTransform(): DOMMatrix {
    if (this.cachedTransform === null) {
      const matrix = new DOMMatrix();
      const isPortrait = this.isPortrait();
      const scale = this.getScale();
      const translation = this.getTranslation();
      const { railWidth } = this.tableDimensions;
      const totalTable = this.getTotalTableDimensions();

      if (isPortrait) {
        // Portrait: translate, rotate, scale, offset for playing surface
        const offsetX = translation.x;
        const offsetY = translation.y + totalTable.width * scale;
        matrix.translateSelf(offsetX, offsetY);
        matrix.rotateSelf(-90); // 90° clockwise (negative for clockwise rotation)
        matrix.scaleSelf(scale, scale);
        matrix.translateSelf(railWidth, railWidth);
      } else {
        // Landscape: translate, scale, offset for playing surface
        matrix.translateSelf(translation.x, translation.y);
        matrix.scaleSelf(scale, scale);
        matrix.translateSelf(railWidth, railWidth);
      }

      this.cachedTransform = matrix;
    }
    return this.cachedTransform;
  }

  /**
   * Get the inverse transformation matrix for converting screen coordinates to table coordinates
   */
  getInverseTransform(): DOMMatrix {
    if (this.cachedInverseTransform === null) {
      const transform = this.getTransform();
      this.cachedInverseTransform = transform.inverse();
    }
    return this.cachedInverseTransform;
  }

  /**
   * Convert screen coordinates to table coordinates
   */
  screenToTable(screenX: number, screenY: number): { x: number; y: number } {
    const inverseTransform = this.getInverseTransform();
    const point = new DOMPoint(screenX, screenY);
    const tablePoint = point.matrixTransform(inverseTransform);

    return { x: tablePoint.x, y: tablePoint.y };
  }

  /**
   * Convert table coordinates to screen coordinates
   */
  tableToScreen(tableX: number, tableY: number): { x: number; y: number } {
    const transform = this.getTransform();
    const point = new DOMPoint(tableX, tableY);
    const screenPoint = point.matrixTransform(transform);

    return { x: screenPoint.x, y: screenPoint.y };
  }

  /**
   * Check if table coordinates are on the playing surface
   */
  isOnPlayingSurface(tableX: number, tableY: number): boolean {
    const { width, height } = this.tableDimensions;
    return tableX >= 0 && tableX <= width && tableY >= 0 && tableY <= height;
  }

  /**
   * Check if table coordinates are on the table (including rails)
   */
  isOnTable(tableX: number, tableY: number): boolean {
    const { width, height, railWidth } = this.tableDimensions;
    return (
      tableX >= -railWidth &&
      tableX <= width + railWidth &&
      tableY >= -railWidth &&
      tableY <= height + railWidth
    );
  }

  /**
   * Apply the transform to a canvas context for rendering
   */
  applyToContext(ctx: CanvasRenderingContext2D): void {
    const isPortrait = this.isPortrait();
    const scale = this.getScale();
    const translation = this.getTranslation();
    const { railWidth } = this.tableDimensions;
    const totalTable = this.getTotalTableDimensions();

    if (isPortrait) {
      // Portrait transformation
      const offsetX = translation.x;
      const offsetY = translation.y + totalTable.width * scale;
      ctx.translate(offsetX, offsetY);
      ctx.rotate(-Math.PI / 2); // 90° clockwise (negative for clockwise)
      ctx.scale(scale, scale);
      ctx.translate(railWidth, railWidth);
    } else {
      // Landscape transformation
      ctx.translate(translation.x, translation.y);
      ctx.scale(scale, scale);
      ctx.translate(railWidth, railWidth);
    }
  }
}
