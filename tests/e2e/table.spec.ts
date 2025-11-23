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
