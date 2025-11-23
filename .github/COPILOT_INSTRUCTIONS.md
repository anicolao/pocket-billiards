# Copilot Agent Instructions

## Testing Rules

### STRICT RULES for Test Timing

**NEVER use hardcoded timeout values in tests.** Tests must wait for specific events rather than arbitrary time periods.

#### ❌ FORBIDDEN
```typescript
await page.waitForTimeout(500); // NEVER DO THIS
await new Promise(resolve => setTimeout(resolve, 1000)); // NEVER DO THIS
```

#### ✅ REQUIRED
Tests must wait for specific conditions or events:

**For Playwright E2E tests:**
```typescript
// Wait for next animation frame (rendering complete)
// IMPORTANT: Wait for AT MOST ONE animation frame when taking screenshots
await page.evaluate(() => {
  return new Promise((resolve) => {
    requestAnimationFrame(resolve);
  });
});

// Wait for specific element state
await expect(element).toBeVisible();
await element.waitFor({ state: 'attached' });

// Wait for network idle
await page.waitForLoadState('networkidle');
```

**Screenshot Timing:**
- **ALWAYS wait for AT MOST ONE animation frame** before taking screenshots
- This ensures rendering is complete without introducing unnecessary delays
- Never chain multiple requestAnimationFrame calls for screenshots

**For unit tests:**
- Redux actions are **ALWAYS SYNCHRONOUS** - no waiting needed
- If testing async operations, use proper async/await patterns
- Use `waitFor` utilities from testing libraries when needed

### Rationale

Hardcoded timeouts:
- Make tests flaky and unreliable
- Slow down test execution unnecessarily
- Don't actually verify the condition you care about
- Can pass even when the feature is broken (if timeout is too short)
- Can waste time (if timeout is too long)

Event-based waiting:
- Tests only wait as long as necessary
- Verifies the actual condition/event occurred
- More reliable across different environments
- Faster test execution
