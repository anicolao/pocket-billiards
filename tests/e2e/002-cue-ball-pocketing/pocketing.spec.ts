import { test, expect, Page } from '@playwright/test';

/**
 * Rendering Verification Test: Cue Ball Pocketing
 * 
 * This test validates the physics simulation and rendering by shooting the cue ball
 * into the top left corner pocket using a Redux action. It demonstrates manual
 * physics stepping for test control and screenshot capture at various stages.
 * 
 * Per E2E_TESTING.md, this is a "Rendering Verification Test" that validates
 * the renderer correctly displays game states during physics simulation.
 */

/**
 * Helper to manually step the physics simulation one frame
 */
async function stepPhysics(page: Page): Promise<void> {
  await page.evaluate(() => {
    return window.physicsEngine.step();
  });
}

/**
 * Helper to check if physics simulation is complete
 */
async function isSimulationComplete(page: Page): Promise<boolean> {
  return await page.evaluate(() => {
    return window.physicsEngine.isComplete();
  });
}

/**
 * Helper to get the current state of a ball
 */
async function getBallState(page: Page, ballId: number) {
  return await page.evaluate((id) => {
    const state = window.store.getState();
    return state.balls.balls.find(b => b.id === id);
  }, ballId);
}

test.describe('Rendering: Cue Ball Pocketing', () => {
  test('shoots cue ball into top left pocket with manual physics stepping', async ({ page }) => {
    // Navigate to the application
    await page.goto('/');

    // Wait for the main canvas to be present
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();

    // Wait for initial rendering to complete
    await page.evaluate(() => {
      return new Promise((resolve) => {
        requestAnimationFrame(resolve);
      });
    });

    // Take initial screenshot showing cue ball at head spot
    await expect(page).toHaveScreenshot('0000-initial-cue-ball-at-head-spot.png', {
      maxDiffPixels: 0,
    });

    // Get initial ball state to verify starting position
    const initialBall = await getBallState(page, 0);
    expect(initialBall).toBeDefined();
    expect(initialBall.active).toBe(true);

    // Reposition the ball closer to the pocket for testing
    // The default position (250, 250) is too far to reach the pocket at (0, 0)
    // with current friction. Move it to (150, 150) to match the unit test.
    await page.evaluate(() => {
      // Use the setBallPosition action creator
      const setBallPosition = { type: 'balls/setBallPosition', payload: { id: 0, position: { x: 150, y: 150 } } };
      window.store.dispatch(setBallPosition);
    });

    // Wait for rendering to update after position change
    await page.evaluate(() => {
      return new Promise((resolve) => {
        requestAnimationFrame(resolve);
      });
    });

    // Take screenshot showing repositioned ball
    await expect(page).toHaveScreenshot('0001-ball-repositioned-closer-to-pocket.png', {
      maxDiffPixels: 0,
    });

    // Dispatch a shot action to shoot the cue ball toward top-left pocket
    // The cue ball is now at (150, 150) and the top-left pocket is at (0, 0)
    // We calculate the velocity to aim toward the pocket
    await page.evaluate(() => {
      const state = window.store.getState();
      const cueBall = state.balls.balls.find(b => b.id === 0);
      
      if (!cueBall) {
        throw new Error('Cue ball not found');
      }

      // Top left pocket is at (0, 0)
      const targetX = 0;
      const targetY = 0;
      
      // Calculate direction vector
      const dx = targetX - cueBall.position.x;
      const dy = targetY - cueBall.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Use max velocity to ensure ball reaches the pocket
      const maxVelocity = 500; // MAX_SHOT_VELOCITY from physics.ts
      const velocity = {
        x: (dx / distance) * maxVelocity,
        y: (dy / distance) * maxVelocity,
      };

      // Dispatch the shot action
      window.store.dispatch(window.shot({ ballId: 0, velocity }));
    });

    // Wait for one animation frame for rendering to update after action
    await page.evaluate(() => {
      return new Promise((resolve) => {
        requestAnimationFrame(resolve);
      });
    });

    // Take screenshot after shot is initiated
    await expect(page).toHaveScreenshot('0002-ball-velocity-set-after-shot.png', {
      maxDiffPixels: 0,
    });

    // Manually step through physics simulation, taking screenshots at intervals
    let stepCount = 0;
    let screenshotCount = 3; // We've taken 3 screenshots so far
    const maxSteps = 10000; // Prevent infinite loops
    
    while (stepCount < maxSteps) {
      const shouldContinue = await page.evaluate(() => {
        return window.physicsEngine.step();
      });

      stepCount++;

      // Wait for rendering to update after physics step
      await page.evaluate(() => {
        return new Promise((resolve) => {
          requestAnimationFrame(resolve);
        });
      });

      // Take screenshots at regular intervals to show ball movement
      // Take a screenshot every 30 steps (about 0.5 seconds of simulation)
      if (stepCount % 30 === 0) {
        const paddedCount = String(screenshotCount).padStart(4, '0');
        await expect(page).toHaveScreenshot(`${paddedCount}-ball-moving-step-${stepCount}.png`, {
          maxDiffPixels: 0,
        });
        screenshotCount++;
      }

      // If simulation says it's done, break
      if (!shouldContinue) {
        break;
      }

      // Double-check if simulation is complete
      const isComplete = await isSimulationComplete(page);
      if (isComplete) {
        break;
      }
    }

    // Verify we didn't hit max iterations
    expect(stepCount).toBeLessThan(maxSteps);

    // Wait for final rendering update
    await page.evaluate(() => {
      return new Promise((resolve) => {
        requestAnimationFrame(resolve);
      });
    });

    // Take final screenshot showing ball pocketed
    const paddedFinalCount = String(screenshotCount).padStart(4, '0');
    await expect(page).toHaveScreenshot(`${paddedFinalCount}-final-ball-pocketed.png`, {
      maxDiffPixels: 0,
    });

    // Verify final state: ball should be pocketed (inactive)
    const finalBall = await getBallState(page, 0);
    expect(finalBall).toBeDefined();
    expect(finalBall.active).toBe(false);
    expect(finalBall.velocity.x).toBe(0);
    expect(finalBall.velocity.y).toBe(0);

    // Verify simulation completed in reasonable number of steps
    expect(stepCount).toBeGreaterThan(0);
    expect(stepCount).toBeLessThan(1000); // Should complete much faster than max
  });
});
