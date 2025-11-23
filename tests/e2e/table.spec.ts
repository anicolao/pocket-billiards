import { test, expect } from '@playwright/test';

/**
 * Rendering Verification Test: Initial Table Setup
 * 
 * This test validates the initial rendering state of the pool table with
 * the cue ball positioned at the head spot (break position).
 * 
 * Per E2E_TESTING.md, this is a "Rendering Verification Test" that validates
 * the renderer correctly displays game states by capturing visual output and
 * comparing against baseline images.
 */

test.describe('Rendering: Initial Table Setup', () => {
  test('renders pool table with cue ball at head spot', async ({ page }) => {
    // Navigate to the application
    await page.goto('/');

    // Wait for the main canvas to be present
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();

    // Wait for rendering to complete (at most one animation frame)
    // Per COPILOT_INSTRUCTIONS.md: "Wait for AT MOST ONE animation frame when taking screenshots"
    await page.evaluate(() => {
      return new Promise((resolve) => {
        requestAnimationFrame(resolve);
      });
    });

    // Take screenshot following the naming convention: ####-description.png
    // Per E2E_TESTING.md: "Screenshots are stored in a screenshots/ subdirectory"
    // This screenshot shows the initial state with cue ball at head spot
    await expect(page).toHaveScreenshot('rendering/screenshots/0000-initial-table-with-cue-ball.png', {
      maxDiffPixels: 0, // Zero-tolerance policy per E2E_TESTING.md
    });
  });

  test('table canvas fills viewport', async ({ page }) => {
    // Navigate to the application
    await page.goto('/');

    // Wait for the main canvas to be present
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();

    // Validate that the main canvas dimensions match the viewport
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).toBeTruthy();
    
    if (canvasBox) {
      const viewportSize = page.viewportSize();
      expect(viewportSize).toBeTruthy();
      
      if (viewportSize) {
        expect(canvasBox.width).toBe(viewportSize.width);
        expect(canvasBox.height).toBe(viewportSize.height);
      }
    }
  });

  test('ball canvas is properly positioned', async ({ page }) => {
    // Navigate to the application
    await page.goto('/');

    // Wait for canvases to be rendered
    const canvases = page.locator('canvas');
    await expect(canvases.first()).toBeVisible();

    // Wait for rendering to complete (at most one animation frame)
    await page.evaluate(() => {
      return new Promise((resolve) => {
        requestAnimationFrame(resolve);
      });
    });

    // Verify that we have more than one canvas (main table + ball canvases)
    const canvasCount = await canvases.count();
    expect(canvasCount).toBeGreaterThan(1);

    // Verify that at least one ball canvas is visible (cue ball)
    const ballCanvas = canvases.nth(1); // Second canvas should be the first ball canvas
    const ballCanvasStyle = await ballCanvas.evaluate((el: HTMLCanvasElement) => {
      return {
        display: window.getComputedStyle(el).display,
        position: window.getComputedStyle(el).position,
      };
    });

    expect(ballCanvasStyle.display).toBe('block');
    expect(ballCanvasStyle.position).toBe('absolute');
  });
});

/**
 * Rendering Verification Test: Portrait Mode Setup
 * 
 * This test validates the portrait mode rendering of the pool table with
 * the cue ball positioned at the head spot. In portrait mode, the table
 * should be rotated 90° clockwise to maximize screen usage.
 * 
 * Per E2E_TESTING.md, this is a "Rendering Verification Test" that validates
 * the renderer correctly displays game states by capturing visual output and
 * comparing against baseline images.
 */
test.describe('Rendering: Portrait Mode Setup', () => {
  test('renders pool table in portrait orientation with 90° rotation', async ({ page }) => {
    // Set viewport to portrait orientation (720x1280)
    await page.setViewportSize({ width: 720, height: 1280 });

    // Navigate to the application
    await page.goto('/');

    // Wait for the main canvas to be present
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();

    // Wait for rendering to complete (at most one animation frame)
    await page.evaluate(() => {
      return new Promise((resolve) => {
        requestAnimationFrame(resolve);
      });
    });

    // Validate that the canvas fills the portrait viewport
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).toBeTruthy();
    
    if (canvasBox) {
      expect(canvasBox.width).toBe(720);
      expect(canvasBox.height).toBe(1280);
    }

    // Take screenshot showing the portrait mode rendering with rotated table
    await expect(page).toHaveScreenshot('rendering/screenshots/0001-portrait-mode-table-with-cue-ball.png', {
      maxDiffPixels: 0, // Zero-tolerance policy per E2E_TESTING.md
    });
  });

  test('ball canvas is properly positioned in portrait mode', async ({ page }) => {
    // Set viewport to portrait orientation
    await page.setViewportSize({ width: 720, height: 1280 });

    // Navigate to the application
    await page.goto('/');

    // Wait for canvases to be rendered
    const canvases = page.locator('canvas');
    await expect(canvases.first()).toBeVisible();

    // Wait for rendering to complete (at most one animation frame)
    await page.evaluate(() => {
      return new Promise((resolve) => {
        requestAnimationFrame(resolve);
      });
    });

    // Verify that we have more than one canvas (main table + ball canvases)
    const canvasCount = await canvases.count();
    expect(canvasCount).toBeGreaterThan(1);

    // Verify that at least one ball canvas is visible (cue ball)
    const ballCanvas = canvases.nth(1);
    const ballCanvasStyle = await ballCanvas.evaluate((el: HTMLCanvasElement) => {
      return {
        display: window.getComputedStyle(el).display,
        position: window.getComputedStyle(el).position,
      };
    });

    expect(ballCanvasStyle.display).toBe('block');
    expect(ballCanvasStyle.position).toBe('absolute');

    // Verify ball canvas is positioned correctly within the portrait viewport
    const ballCanvasBox = await ballCanvas.boundingBox();
    expect(ballCanvasBox).toBeTruthy();
    
    if (ballCanvasBox) {
      // Ball should be visible within the viewport bounds
      expect(ballCanvasBox.x).toBeGreaterThanOrEqual(0);
      expect(ballCanvasBox.y).toBeGreaterThanOrEqual(0);
      expect(ballCanvasBox.x + ballCanvasBox.width).toBeLessThanOrEqual(720);
      expect(ballCanvasBox.y + ballCanvasBox.height).toBeLessThanOrEqual(1280);
    }
  });

  test('table orientation switches correctly on viewport change', async ({ page }) => {
    // Start with landscape orientation
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();

    // Wait for initial rendering
    await page.evaluate(() => {
      return new Promise((resolve) => {
        requestAnimationFrame(resolve);
      });
    });

    // Switch to portrait orientation
    await page.setViewportSize({ width: 720, height: 1280 });

    // Wait for re-render after viewport change
    await page.evaluate(() => {
      return new Promise((resolve) => {
        requestAnimationFrame(resolve);
      });
    });

    // Verify canvas dimensions updated
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).toBeTruthy();
    
    if (canvasBox) {
      expect(canvasBox.width).toBe(720);
      expect(canvasBox.height).toBe(1280);
    }

    // Verify ball canvas is still properly positioned after orientation change
    const ballCanvas = page.locator('canvas').nth(1);
    const ballCanvasStyle = await ballCanvas.evaluate((el: HTMLCanvasElement) => {
      return {
        display: window.getComputedStyle(el).display,
      };
    });

    expect(ballCanvasStyle.display).toBe('block');
  });
});
