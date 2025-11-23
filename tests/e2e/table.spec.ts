import { test, expect } from '@playwright/test';

test('renders empty pool table', async ({ page }) => {
  await page.goto('/');

  // Wait for the canvas to be present
  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible();

  // Wait for next animation frame to ensure rendering is complete
  await page.evaluate(() => {
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(resolve);
      });
    });
  });

  // Take a screenshot and compare with baseline (must be 100% identical)
  await expect(page).toHaveScreenshot('empty-table.png');
});

test('table has correct canvas dimensions', async ({ page }) => {
  await page.goto('/');

  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible();

  // Check that canvas fills the viewport
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
