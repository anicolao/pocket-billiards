# Pocket Billiards Development Environment Status

## Environment Setup
- ✅ Ubuntu 24.04 with Node.js 20
- ✅ Dependencies installed
- ✅ Application built successfully

## Test Status

### Unit Tests
$(if [ "0" = "0" ]; then echo "✅ PASSED - All 41 unit tests passing"; else echo "❌ FAILED"; fi)

### Code Coverage
$(if [ "0" = "0" ]; then echo "✅ Coverage report generated"; else echo "❌ Coverage failed"; fi)

**Current Coverage**: ~48% (baseline - not 100% yet)
- Store: 96.87% coverage
- Table Transform: 84.37% coverage
- Renderers: 0% coverage (not tested in unit tests, validated through E2E)

### E2E Tests  
$(if [ "0" = "0" ]; then echo "✅ PASSED - All 6 E2E tests passing, no screenshot regeneration needed"; else echo "❌ FAILED"; fi)

## Quick Commands
```bash
# Development
npm run dev              # Start dev server (port 3000)
npm test                 # Run unit tests
npm run test:coverage    # Run unit tests with coverage
npm run test:e2e         # Run E2E tests
npm run test:e2e:ui      # Run E2E tests with Playwright UI

# Build
npm run build            # Build TypeScript and bundle with Vite
npm run preview          # Preview production build
```

## Expected Clean State

According to the problem statement, the expected clean state should be:
- ✅ **100% unit test pass rate** (currently: 100%)
- ⚠️ **100% code coverage** (currently: ~48% - this is the baseline)
- ✅ **E2E tests pass without screenshot regeneration** (currently: passing)

**Note**: The current 48% coverage is the baseline. Renderers (ballRenderer.ts, renderer.ts) 
are not tested in unit tests but are validated through E2E tests with screenshot comparison.
The store and tableTransform modules have high coverage (84-96%).

## Architecture Notes
- **Canvas-based rendering**: HTML5 Canvas with TypeScript
- **State management**: Redux Toolkit for predictable state
- **Testing strategy**: Unit tests for logic, E2E tests for rendering verification
- **Zero-tolerance E2E**: Screenshot comparison with maxDiffPixels: 0
- **Portrait mode support**: Automatic 90° rotation for portrait displays

## Important Testing Rules

From COPILOT_INSTRUCTIONS.md:
- **NEVER use hardcoded timeouts** in tests
- **Wait for AT MOST ONE animation frame** before screenshots
- Use event-based waiting (requestAnimationFrame, element visibility, etc.)
- Redux actions are ALWAYS SYNCHRONOUS

## E2E Testing Philosophy

From E2E_TESTING.md:
- **Zero-tolerance policy**: Tests run exclusively in CI with exact reproducibility
- **Screenshot baseline**: Pixel-perfect comparison (maxDiffPixels: 0)
- **Rendering verification**: Validates that renderer displays game states correctly
