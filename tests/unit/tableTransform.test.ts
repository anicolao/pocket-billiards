import { describe, it, expect, beforeEach } from 'vitest';
import { TableTransform } from '../../src/rendering/tableTransform';
import { TableDimensions } from '../../src/store/tableSlice';

describe('TableTransform', () => {
  let standardTableDimensions: TableDimensions;

  beforeEach(() => {
    // Standard 1000x500 table with 40 unit rails
    standardTableDimensions = {
      width: 1000,
      height: 500,
      pocketRadius: 25,
      railWidth: 40,
      pockets: [], // Not needed for transform tests
    };
  });

  describe('orientation detection', () => {
    it('should detect landscape orientation when width >= height', () => {
      const transform = new TableTransform(1920, 1080, standardTableDimensions);
      expect(transform.isPortrait()).toBe(false);
    });

    it('should detect portrait orientation when width < height', () => {
      const transform = new TableTransform(1080, 1920, standardTableDimensions);
      expect(transform.isPortrait()).toBe(true);
    });

    it('should treat square as landscape', () => {
      const transform = new TableTransform(1200, 1200, standardTableDimensions);
      expect(transform.isPortrait()).toBe(false);
    });
  });

  describe('scale calculation', () => {
    it('should calculate correct scale for landscape orientation', () => {
      // Total table: 1080x580 (1000+80 x 500+80)
      // Padding: 40 on each side
      const transform = new TableTransform(1920, 1080, standardTableDimensions);
      const scale = transform.getScale();

      // scaleX = (1920 - 80) / 1080 = 1840 / 1080 ≈ 1.7037
      // scaleY = (1080 - 80) / 580 = 1000 / 580 ≈ 1.7241
      // scale = min(1.7037, 1.7241) ≈ 1.7037
      expect(scale).toBeCloseTo(1.7037, 3);
    });

    it('should calculate correct scale for portrait orientation', () => {
      // Total table: 1080x580
      // After rotation: 580x1080
      // Padding: 40 on each side
      const transform = new TableTransform(1080, 1920, standardTableDimensions);
      const scale = transform.getScale();

      // scaleX = (1080 - 80) / 580 = 1000 / 580 ≈ 1.7241
      // scaleY = (1920 - 80) / 1080 = 1840 / 1080 ≈ 1.7037
      // scale = min(1.7241, 1.7037) ≈ 1.7037
      expect(scale).toBeCloseTo(1.7037, 3);
    });

    it('should calculate correct scale for 4K display', () => {
      const transform = new TableTransform(3840, 2160, standardTableDimensions);
      const scale = transform.getScale();

      // scaleX = (3840 - 80) / 1080 = 3760 / 1080 ≈ 3.4815
      // scaleY = (2160 - 80) / 580 = 2080 / 580 ≈ 3.5862
      // scale = min(3.4815, 3.5862) ≈ 3.4815
      expect(scale).toBeCloseTo(3.4815, 3);
    });

    it('should calculate correct scale for square display', () => {
      const transform = new TableTransform(1200, 1200, standardTableDimensions);
      const scale = transform.getScale();

      // scaleX = (1200 - 80) / 1080 = 1120 / 1080 ≈ 1.037
      // scaleY = (1200 - 80) / 580 = 1120 / 580 ≈ 1.931
      // scale = min(1.037, 1.931) ≈ 1.037
      expect(scale).toBeCloseTo(1.037, 3);
    });
  });

  describe('translation calculation', () => {
    it('should center table on landscape screen', () => {
      const transform = new TableTransform(1920, 1080, standardTableDimensions);
      const translation = transform.getTranslation();
      const scale = transform.getScale();

      // Scaled table size: 1080 * 1.7037 ≈ 1840, 580 * 1.7037 ≈ 988
      // translationX = (1920 - 1840) / 2 = 40
      // translationY = (1080 - 988) / 2 = 46
      expect(translation.x).toBeCloseTo(40, 0);
      expect(translation.y).toBeCloseTo(46, 0);
    });

    it('should center table on portrait screen', () => {
      const transform = new TableTransform(1080, 1920, standardTableDimensions);
      const translation = transform.getTranslation();
      const scale = transform.getScale();

      // After rotation, table occupies: 580 * 1.7037 ≈ 988 width, 1080 * 1.7037 ≈ 1840 height
      // translationX = (1080 - 988) / 2 = 46
      // translationY = (1920 - 1840) / 2 = 40
      expect(translation.x).toBeCloseTo(46, 0);
      expect(translation.y).toBeCloseTo(40, 0);
    });
  });

  describe('Scenario 1: Desktop Landscape (1920×1080)', () => {
    it('should match expected values from design doc', () => {
      const transform = new TableTransform(1920, 1080, standardTableDimensions);

      // Orientation
      expect(transform.isPortrait()).toBe(false);

      // Scale
      const scale = transform.getScale();
      expect(scale).toBeCloseTo(1.70, 2);

      // Translation (actual values from calculation)
      // scaleX = 1840/1080 ≈ 1.7037, scaleY = 1000/580 ≈ 1.7241, scale = 1.7037
      // scaledWidth = 1080 * 1.7037 ≈ 1840, scaledHeight = 580 * 1.7037 ≈ 988.15
      // translationX = (1920 - 1840) / 2 = 40, translationY = (1080 - 988.15) / 2 ≈ 45.93
      const translation = transform.getTranslation();
      expect(translation.x).toBeCloseTo(40, 0);
      expect(translation.y).toBeCloseTo(46, 0);
    });
  });

  describe('Scenario 2: Tablet Portrait (1080×1920)', () => {
    it('should match expected values from design doc', () => {
      const transform = new TableTransform(1080, 1920, standardTableDimensions);

      // Orientation
      expect(transform.isPortrait()).toBe(true);

      // Scale
      const scale = transform.getScale();
      expect(scale).toBeCloseTo(1.70, 2);

      // Translation (actual values from calculation)
      // Portrait: dimensions swap, scaleX = 1000/580 ≈ 1.7241, scaleY = 1840/1080 ≈ 1.7037, scale = 1.7037
      // scaledWidth = 580 * 1.7037 ≈ 988.15, scaledHeight = 1080 * 1.7037 ≈ 1840
      // translationX = (1080 - 988.15) / 2 ≈ 45.93, translationY = (1920 - 1840) / 2 = 40
      const translation = transform.getTranslation();
      expect(translation.x).toBeCloseTo(46, 0);
      expect(translation.y).toBeCloseTo(40, 0);
    });
  });

  describe('Scenario 3: Large Touchscreen 4K (3840×2160)', () => {
    it('should match expected values from design doc', () => {
      const transform = new TableTransform(3840, 2160, standardTableDimensions);

      // Orientation
      expect(transform.isPortrait()).toBe(false);

      // Scale
      const scale = transform.getScale();
      expect(scale).toBeCloseTo(3.48, 2);

      // Translation (actual values from calculation)
      // scaleX = 3760/1080 ≈ 3.4815, scaleY = 2080/580 ≈ 3.5862, scale = 3.4815
      // scaledWidth = 1080 * 3.4815 ≈ 3760, scaledHeight = 580 * 3.4815 ≈ 2019.26
      // translationX = (3840 - 3760) / 2 = 40, translationY = (2160 - 2019.26) / 2 ≈ 70.37
      const translation = transform.getTranslation();
      expect(translation.x).toBeCloseTo(40, 0);
      expect(translation.y).toBeCloseTo(70, 0);
    });
  });

  describe('Scenario 4: Square Display (1200×1200)', () => {
    it('should match expected values from design doc', () => {
      const transform = new TableTransform(1200, 1200, standardTableDimensions);

      // Orientation
      expect(transform.isPortrait()).toBe(false);

      // Scale
      const scale = transform.getScale();
      expect(scale).toBeCloseTo(1.04, 2);

      // Translation (actual values from calculation)
      // scaleX = 1120/1080 ≈ 1.037, scaleY = 1120/580 ≈ 1.931, scale = 1.037
      // scaledWidth = 1080 * 1.037 ≈ 1120, scaledHeight = 580 * 1.037 ≈ 601.46
      // translationX = (1200 - 1120) / 2 = 40, translationY = (1200 - 601.46) / 2 ≈ 299.27
      const translation = transform.getTranslation();
      expect(translation.x).toBeCloseTo(40, 0);
      expect(translation.y).toBeCloseTo(299, 0);
    });
  });

  describe('coordinate transformations', () => {
    it('should convert table coordinates to screen coordinates in landscape', () => {
      const transform = new TableTransform(1920, 1080, standardTableDimensions);
      
      // Test center of table (500, 250)
      const screen = transform.tableToScreen(500, 250);
      
      // Center should map to center of screen
      expect(screen.x).toBeCloseTo(960, 1);
      expect(screen.y).toBeCloseTo(540, 1);
    });

    it('should convert table coordinates to screen coordinates in portrait', () => {
      const transform = new TableTransform(1080, 1920, standardTableDimensions);
      
      // Test center of table (500, 250)
      const screen = transform.tableToScreen(500, 250);
      
      // Center should map to center of screen
      expect(screen.x).toBeCloseTo(540, 1);
      expect(screen.y).toBeCloseTo(960, 1);
    });

    it('should convert screen coordinates to table coordinates in landscape', () => {
      const transform = new TableTransform(1920, 1080, standardTableDimensions);
      
      // Test screen center (960, 540)
      const table = transform.screenToTable(960, 540);
      
      // Center should map to center of table
      expect(table.x).toBeCloseTo(500, 1);
      expect(table.y).toBeCloseTo(250, 1);
    });

    it('should convert screen coordinates to table coordinates in portrait', () => {
      const transform = new TableTransform(1080, 1920, standardTableDimensions);
      
      // Test screen center (540, 960)
      const table = transform.screenToTable(540, 960);
      
      // Center should map to center of table
      expect(table.x).toBeCloseTo(500, 1);
      expect(table.y).toBeCloseTo(250, 1);
    });

    it('should round-trip coordinates in landscape', () => {
      const transform = new TableTransform(1920, 1080, standardTableDimensions);
      
      const tableX = 250;
      const tableY = 125;
      
      const screen = transform.tableToScreen(tableX, tableY);
      const tableAgain = transform.screenToTable(screen.x, screen.y);
      
      expect(tableAgain.x).toBeCloseTo(tableX, 1);
      expect(tableAgain.y).toBeCloseTo(tableY, 1);
    });

    it('should round-trip coordinates in portrait', () => {
      const transform = new TableTransform(1080, 1920, standardTableDimensions);
      
      const tableX = 750;
      const tableY = 375;
      
      const screen = transform.tableToScreen(tableX, tableY);
      const tableAgain = transform.screenToTable(screen.x, screen.y);
      
      expect(tableAgain.x).toBeCloseTo(tableX, 1);
      expect(tableAgain.y).toBeCloseTo(tableY, 1);
    });
  });

  describe('bounds checking', () => {
    let transform: TableTransform;

    beforeEach(() => {
      transform = new TableTransform(1920, 1080, standardTableDimensions);
    });

    it('should correctly identify points on playing surface', () => {
      expect(transform.isOnPlayingSurface(0, 0)).toBe(true);
      expect(transform.isOnPlayingSurface(500, 250)).toBe(true);
      expect(transform.isOnPlayingSurface(1000, 500)).toBe(true);
    });

    it('should correctly identify points outside playing surface', () => {
      expect(transform.isOnPlayingSurface(-1, 0)).toBe(false);
      expect(transform.isOnPlayingSurface(0, -1)).toBe(false);
      expect(transform.isOnPlayingSurface(1001, 250)).toBe(false);
      expect(transform.isOnPlayingSurface(500, 501)).toBe(false);
    });

    it('should correctly identify points on table including rails', () => {
      expect(transform.isOnTable(-40, -40)).toBe(true);
      expect(transform.isOnTable(0, 0)).toBe(true);
      expect(transform.isOnTable(1000, 500)).toBe(true);
      expect(transform.isOnTable(1040, 540)).toBe(true);
    });

    it('should correctly identify points outside table', () => {
      expect(transform.isOnTable(-41, 0)).toBe(false);
      expect(transform.isOnTable(0, -41)).toBe(false);
      expect(transform.isOnTable(1041, 250)).toBe(false);
      expect(transform.isOnTable(500, 541)).toBe(false);
    });
  });

  describe('cache invalidation', () => {
    it('should recalculate when screen size changes', () => {
      const transform = new TableTransform(1920, 1080, standardTableDimensions);
      const scale1 = transform.getScale();

      transform.updateScreenSize(1280, 720);
      const scale2 = transform.getScale();

      expect(scale2).not.toBe(scale1);
      // scaleX = (1280 - 80) / 1080 = 1200 / 1080 ≈ 1.1111
      // scaleY = (720 - 80) / 580 = 640 / 580 ≈ 1.1034
      // scale = min(1.1111, 1.1034) ≈ 1.1034
      expect(scale2).toBeCloseTo(1.1034, 3);
    });

    it('should recalculate when table dimensions change', () => {
      const transform = new TableTransform(1920, 1080, standardTableDimensions);
      const scale1 = transform.getScale();

      const newDimensions = { ...standardTableDimensions, railWidth: 50 };
      transform.updateTableDimensions(newDimensions);
      const scale2 = transform.getScale();

      expect(scale2).not.toBe(scale1);
    });

    it('should recalculate orientation when screen size changes', () => {
      const transform = new TableTransform(1920, 1080, standardTableDimensions);
      expect(transform.isPortrait()).toBe(false);

      transform.updateScreenSize(1080, 1920);
      expect(transform.isPortrait()).toBe(true);
    });
  });

  describe('DOMMatrix transformations', () => {
    it('should create valid transform matrix for landscape', () => {
      const transform = new TableTransform(1920, 1080, standardTableDimensions);
      const matrix = transform.getTransform();

      expect(matrix).toBeInstanceOf(DOMMatrix);
      expect(matrix.is2D).toBe(true);
    });

    it('should create valid transform matrix for portrait', () => {
      const transform = new TableTransform(1080, 1920, standardTableDimensions);
      const matrix = transform.getTransform();

      expect(matrix).toBeInstanceOf(DOMMatrix);
      expect(matrix.is2D).toBe(true);
    });

    it('should create valid inverse transform matrix', () => {
      const transform = new TableTransform(1920, 1080, standardTableDimensions);
      const matrix = transform.getTransform();
      const inverse = transform.getInverseTransform();

      expect(inverse).toBeInstanceOf(DOMMatrix);
      
      // Multiplying a matrix by its inverse should give identity
      const identity = matrix.multiply(inverse);
      expect(identity.a).toBeCloseTo(1, 5);
      expect(identity.d).toBeCloseTo(1, 5);
      expect(identity.b).toBeCloseTo(0, 5);
      expect(identity.c).toBeCloseTo(0, 5);
      expect(identity.e).toBeCloseTo(0, 5);
      expect(identity.f).toBeCloseTo(0, 5);
    });
  });

  describe('custom padding', () => {
    it('should respect custom padding value', () => {
      const customPadding = 100;
      const transform = new TableTransform(
        1920,
        1080,
        standardTableDimensions,
        customPadding
      );
      
      const scale = transform.getScale();
      
      // scaleX = (1920 - 200) / 1080 = 1720 / 1080 ≈ 1.5926
      // scaleY = (1080 - 200) / 580 = 880 / 580 ≈ 1.5172
      // scale = min(1.5926, 1.5172) ≈ 1.5172
      expect(scale).toBeCloseTo(1.5172, 3);
    });
  });
});
