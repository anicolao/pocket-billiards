# Copilot Agent Instructions

## Environment Setup and Baseline

### Copilot Setup Workflow

Before starting any task, **review the output from the `copilot-setup-steps` workflow** to understand the current state of the codebase. This workflow runs automatically on every push and pull request.

**Where to find it:**
- GitHub Actions tab → "Copilot Runner Setup and Test" workflow
- Check the "Summary" section for quick status
- Download the `startup-summary` artifact for detailed environment information

**Expected Clean State:**

The workflow validates that the project is in a clean, working state:

✅ **Unit Tests**: All 41 unit tests must pass (100% pass rate)
✅ **Code Coverage**: Current baseline is ~48% coverage
  - Store modules: 96.87% coverage
  - Table Transform: 84.37% coverage  
  - Renderers: 0% unit test coverage (validated through E2E tests instead)
✅ **E2E Tests**: All 6 E2E tests must pass with zero screenshot differences
✅ **Build**: Application must build successfully

**What This Means:**

- If the workflow shows all green checkmarks, the codebase is healthy
- If unit tests fail, there's a regression in core logic
- If E2E tests fail, there's a rendering regression or screenshot needs updating
- If coverage drops, new code lacks tests or existing tests were removed

**Important**: The 48% code coverage is the **current baseline**, not a target. Renderers are intentionally tested through E2E screenshot validation rather than unit tests, following the testing philosophy in E2E_TESTING.md.

### When Starting a New Task

1. **Check the workflow summary** to confirm the project state
2. **Review any test failures** - do not assume the codebase is broken without cause
3. **Understand the baseline** - if something is failing in the workflow, determine if it's related to your task
4. **Do not introduce new test failures** - all changes must maintain the clean state
5. **Screenshot regeneration** - E2E tests should NOT need screenshot updates unless you're intentionally changing rendering

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
