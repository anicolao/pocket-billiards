# End-to-End Testing Strategy

## Overview

The end-to-end (e2e) testing strategy for Pocket Billiards is designed to ensure gameplay accuracy, physics reliability, and UI correctness through comprehensive replay and verification capabilities. This document outlines the approach for recording, replaying, and validating complete game sessions.

## Testing Philosophy

The e2e testing framework serves two critical purposes:

1. **Regression Prevention**: Ensure that changes to the physics engine, rendering system, or game logic don't alter the behavior of previously validated gameplay scenarios.

2. **Visual Verification**: Provide human reviewers with clear, documented evidence that the game simulation produces expected results at key moments throughout gameplay.

## Core Testing Approach

### Three-Tier Testing Model

The testing strategy employs three complementary testing modes that validate different aspects of the system and enable precise isolation of issues. Tests should be verified in order from bottom to top of the stack:

#### 1. Physics and State Management Testing (Action Replay without Rendering)

This mode validates the core game simulation and state management by directly replaying recorded player actions into the system.

**Purpose**: Verify that the physics engine, game rules, and state transitions produce consistent, deterministic results.

**How it works**: The test framework injects recorded SHOT actions directly into the Redux store, bypassing the UI and rendering layers entirely. Each SHOT action contains the precise parameters that define a player's shot: power level, direction, and contact point on the cue ball. The system then runs the physics simulation and validates the resulting state programmatically.

**What it validates**:
- Physics engine determinism and accuracy
- Game state transitions and rule enforcement
- Event detection and handling
- Ball behavior and collision responses

**Advantages**: Fastest execution, deterministic results, isolation from rendering and UI concerns.

#### 2. Rendering Verification Testing (Action Replay with Screenshot Validation)

This mode validates that the renderer correctly displays game states by replaying actions and capturing visual output.

**Purpose**: Verify that the rendering system correctly visualizes game states produced by the physics engine and state management.

**How it works**: The test framework injects recorded SHOT actions directly into the Redux store, runs the physics simulation, and captures screenshots at significant moments. These screenshots are compared against baseline images to ensure the renderer produces pixel-perfect output for known game states.

**What it validates**:
- Renderer correctness for all game states
- Visual consistency across code changes
- Proper rendering of balls, table elements, and UI overlays
- Screenshot baseline accuracy

**Advantages**: Fast execution, isolates rendering issues from input handling, establishes visual regression baselines.

#### 3. UI-Driven Testing (Playwright-Based)

This mode validates the complete user interaction flow by simulating actual user inputs through the UI.

**Purpose**: Verify that the touch interface, input handling, and UI-to-state pipeline correctly translate user gestures into the intended game actions.

**How it works**: The test framework uses computed click locations (derived from the recorded SHOT actions) to simulate touch interactions on the game canvas. These interactions trigger the normal input handling pipeline, which generates UI events, processes touch gestures, and ultimately dispatches the same actions to the Redux store.

**What it validates**:
- Touch input processing and gesture recognition
- UI state management and visual feedback
- Coordinate transformations and hit detection
- Complete user interaction flow
- Input-to-action translation accuracy

**Advantages**: End-to-end validation, real-world scenario simulation, UI regression detection.

### Diagnostic Value of the Three-Tier Approach

This three-tier structure enables precise issue isolation when verified bottom-up:

- **If Physics Testing fails**: The issue is in the core physics engine or game logic
- **If Rendering Verification fails but Physics Testing passes**: The issue is in the renderer
- **If UI-Driven Testing fails but Rendering Verification passes**: The issue is in input translation or event handling

This diagnostic capability significantly reduces debugging time by immediately identifying which subsystem contains the defect.

## Game Recording

### SHOT Action Recording

During actual gameplay, the system records every shot taken by players as SHOT actions. Each recorded action captures the complete set of parameters needed to reproduce that exact shot.

**Recorded Parameters**:
- Power level applied to the shot
- Direction of the shot (angle or vector)
- Contact point on the cue ball (for spin and english)
- Game state context (which player, ball positions at shot start)

**Storage Format**: Game recordings are stored as ordered sequences of SHOT actions, preserving the chronological flow of gameplay. This recording serves as the "golden master" reference for that game session.

## Significant Moment Detection

### Event Categories

The testing framework identifies and captures significant moments in the game simulation. These moments represent state changes or interactions that are meaningful for verification purposes.

**Significant Moment Types**:

1. **Ball Collisions**: When two balls make contact
2. **Pocket Events**: When a ball enters a pocket
3. **Rail Impacts**: When a ball strikes a table rail
4. **Turn Transitions**: When control passes between players
5. **Game State Changes**: Fouls, legal shots, win conditions

### Moment Capture

When a significant moment is detected during simulation replay, the testing framework captures the complete game state at that instant. This includes ball positions, velocities, game phase, and any relevant metadata about what just occurred.

## Screenshot Generation

### Visual Documentation

For each significant moment captured during test execution, the framework generates a screenshot showing the table state at that instant.

**Screenshot Content**:
- Complete table view showing all ball positions
- Visual indicators for the significant event (collision points, pocket entries, etc.)
- Game state overlay (scores, current player, ball types)
- Contextual annotations explaining the moment

**Purpose**: Provide human reviewers with visual evidence of simulation behavior, enabling manual verification that the physics and game logic are behaving correctly.

### Screenshot Organization

Each e2e test is organized in its own numbered subdirectory (e.g., `001-initial-setup/`, `002-break-shot/`, etc.), which contains the test file, its README, and its screenshots subdirectory. This organization keeps all artifacts for a single user story test together.

**Directory Structure**:
```
tests/e2e/
├── 001-initial-setup/
│   ├── README.md
│   ├── table.spec.ts
│   └── table.spec.ts-snapshots/
│       ├── screenshots-0000-initial-table-landscape.png
│       └── screenshots-0001-initial-table-portrait.png
├── 002-break-shot/
│   ├── README.md
│   ├── break.spec.ts
│   └── break.spec.ts-snapshots/
│       ├── screenshots-0000-before-break.png
│       ├── screenshots-0001-ball-collision.png
│       └── screenshots-0002-after-break.png
```

Screenshots within each test's snapshots subdirectory (named `<test-file>.spec.ts-snapshots/` by Playwright convention) are named with the prefix `screenshots-` followed by a zero-padded sequence number and description.

**Screenshot Naming Convention**: `screenshots-####-description.png` where `####` is a zero-padded sequence number.

**Examples**:
- `screenshots-0000-breakshot.png` - Initial break shot
- `screenshots-0001-sink-9-ball.png` - Nine ball sinking into pocket
- `screenshots-0002-rail-collision.png` - Ball hitting the rail
- `screenshots-0003-ball-ball-contact.png` - Collision between two balls

Each screenshot corresponds to exactly one significant moment in the simulation, with the sequence number indicating the chronological order of events.

## Test Artifact Generation

### Test README Generation

For each e2e test, the framework automatically generates a README file that serves as a verification guide for human reviewers.

**README Contents**:

1. **Test Overview**: Description of the game being replayed, including player names, game type, and outcome
2. **Chronological Event Log**: Sequential listing of all significant moments
3. **Screenshot Links**: For each moment, an **embedded image link** showing the screenshot directly in the markdown (using `![alt text](path/to/screenshot.png)` syntax), not just file path references
4. **Moment Descriptions**: Text description of what the verifier should observe in each screenshot
5. **Expected State**: Description of the game state that should be visible (ball positions, scores, game phase)

**Purpose**: Enable human reviewers to systematically verify that simulation output matches expectations without needing to run the test themselves or understand the code. The README should be readable as a standalone document with all screenshots visible inline.

**Implementation Requirements**:
- Screenshots must be embedded using markdown image syntax: `![Description](relative/path/to/screenshot.png)`
- Each screenshot should have a descriptive alt text explaining what it shows
- Screenshots should be linked with relative paths from the README location
- The README should be self-contained and readable without needing to open separate image files

### Automated Verification Code

In addition to visual documentation, the framework generates programmatic assertions that validate the simulation state at each significant moment.

**Verification Checks**:
- Ball position assertions (within acceptable tolerance)
- Ball velocity assertions (magnitude and direction)
- Game state assertions (scores, current player, game phase)
- Event occurrence verification (expected collisions, pockets, fouls)

**Purpose**: Provide automated regression detection that catches simulation divergence before it requires human review.

## Test Execution Workflow

### Physics and State Management Test Execution

When executing a physics and state management test:

1. **Load Recording**: Read the sequence of SHOT actions from the game recording
2. **Initialize State**: Set up the initial game state (break position, player assignment)
3. **Replay Actions**: For each SHOT action, inject it into the Redux store
4. **Run Simulation**: Execute the physics simulation until the table reaches a stable state
5. **Capture State**: Record complete game state at each significant moment
6. **Run Assertions**: Execute verification code to check state correctness
7. **Validate Determinism**: Ensure exact reproducibility of physics calculations

### Rendering Verification Test Execution

When executing a rendering verification test:

1. **Load Recording**: Read the sequence of SHOT actions from the game recording
2. **Initialize State**: Set up the initial game state (break position, player assignment)
3. **Replay Actions**: For each SHOT action, inject it into the Redux store
4. **Run Simulation**: Execute the physics simulation until the table reaches a stable state
5. **Capture Moments**: Detect and record all significant moments during simulation
6. **Generate Screenshots**: Create visual captures at each significant moment in `screenshots/` subdirectory
7. **Compare Screenshots**: Perform pixel-perfect comparison against baseline screenshots
8. **Run Assertions**: Execute verification code to check rendering correctness
9. **Generate Documentation**: Produce the test README with screenshots and descriptions

### UI-Driven Test Execution

When executing a UI-driven test:

1. **Load Recording**: Read the sequence of SHOT actions from the game recording
2. **Compute Interactions**: For each SHOT action, calculate the touch locations needed to produce that shot
3. **Initialize UI**: Launch the game in a browser context via Playwright
4. **Simulate Touches**: For each shot, simulate the tap/drag/release gestures at computed locations
5. **Monitor Actions**: Verify that simulated touches generate the expected SHOT actions
6. **Capture Moments**: Detect and record all significant moments during simulation
7. **Generate Screenshots**: Create visual captures via Playwright screenshot API in `screenshots/` subdirectory
8. **Compare Screenshots**: Perform pixel-perfect comparison against baseline screenshots
9. **Run Assertions**: Execute verification code via Playwright assertions
10. **Generate Documentation**: Produce the test README with screenshots and descriptions

## Test Suite Organization

### Test Categories

**Physics Validation Tests**: Action replay tests focused on physics engine correctness. These tests validate state without rendering overhead. Should be verified first.

**Rendering Verification Tests**: Action replay tests focused on validating renderer correctness. Each test replays a game scenario and verifies pixel-perfect screenshot accuracy. Should be verified second.

**UI Integration Tests**: UI-driven tests that validate the complete input-to-action pipeline. These ensure touch gestures produce the correct SHOT actions. Should be verified third.

**Validation Tests**: Short, focused games that test specific scenarios (scratch on break, combination shots, difficult banks). Used for rapid validation during development.

**Regression Tests**: Complete games from actual play sessions. Used to ensure that known-good gameplay continues to work correctly across code changes.

**Edge Case Tests**: Contrived scenarios that exercise unusual physics situations or rule corner cases.

### Test Naming and Discovery

Tests are organized in numbered subdirectories at the top level of `tests/e2e/`, with each directory representing a single user story or test scenario. The directory contains all artifacts for that test: the test spec file, README documentation, and Playwright snapshots subdirectory.

**Directory Naming Convention**: `###-scenario-name/` where `###` is a zero-padded sequence number.

**Examples**:
- `001-initial-setup/` - Initial table rendering verification
- `002-break-shot/` - Break shot physics and rendering test
- `003-ball-collision/` - Ball-to-ball collision test
- `004-pocket-sink/` - Ball pocketing test

Within each test directory:
- Test spec file: `*.spec.ts` (e.g., `table.spec.ts`, `break.spec.ts`)
- Documentation: `README.md` with embedded screenshots
- Snapshots: `*.spec.ts-snapshots/` subdirectory (auto-created by Playwright) containing `screenshots-####-description.png` files

The test framework can discover and execute tests automatically based on directory structure and naming patterns.

## Tolerance and Determinism

### Zero-Tolerance Policy

Since all e2e tests execute exclusively in the GitHub Actions CI environment, the testing framework enforces strict determinism with zero tolerance for variation.

**Physics Determinism**: The physics engine must produce identical numerical results for identical inputs across all test runs. Floating-point calculations must be reproducible down to the exact bit pattern.

**Rendering Determinism**: Screenshots must match baseline images pixel-for-pixel. Any rendering variation, no matter how minor, indicates a regression or platform inconsistency.

**Assertion Precision**: Automated verification uses exact equality checks for all numerical comparisons. Ball positions, velocities, and game state values must match expected values precisely.

### CI Environment Consistency

All tests run in a controlled GitHub Actions environment with:

- Fixed operating system and browser versions
- Consistent rendering context and canvas implementation
- Deterministic floating-point behavior
- Reproducible screenshot capture

This controlled environment eliminates platform variability and enables the strict zero-tolerance policy. Any test failure indicates an actual regression or defect, not environmental differences.

### Baseline Management

Screenshot baselines are stored in the repository and serve as the canonical reference for rendering correctness. When intentional visual changes are made:

1. Review the visual differences carefully
2. Verify the changes are correct and intentional
3. Update the baseline screenshots
4. Document the reason for the baseline update

Baseline updates should be rare and always associated with deliberate rendering improvements or feature additions.

## Benefits and Use Cases

### For Developers

- **Confidence in Changes**: Physics or rendering changes can be validated against extensive real-game scenarios
- **Debugging Aid**: Step through replays to understand unexpected behavior
- **Performance Tracking**: Compare execution time across test suite runs
- **Documentation**: Tests serve as examples of expected system behavior

### For Reviewers

- **Visual Verification**: Non-technical stakeholders can review screenshots to validate correctness
- **Change Impact Assessment**: Before/after screenshot comparisons show effects of code changes
- **Rule Validation**: Confirm that game rules are enforced correctly in various scenarios

### For Regression Prevention

- **Automated Detection**: Catch unintended changes in physics or game logic
- **Baseline Establishment**: Lock in known-good behavior as reference points
- **Continuous Integration**: Run test suite automatically on every commit

## Future Extensibility

The testing framework is designed to support future enhancements:

- **Interactive Replay**: Web-based viewer for stepping through test replays
- **Differential Testing**: Compare replay results across code branches
- **Performance Profiling**: Track physics simulation performance over time
- **Coverage Analysis**: Identify untested game scenarios
- **Test Generation**: Record new tests from actual gameplay sessions

## Summary

This e2e testing strategy provides comprehensive validation of the Pocket Billiards game through three complementary testing approaches. Rendering verification testing validates visual correctness through pixel-perfect screenshot comparison. Physics and state management testing validates core simulation correctness through direct state injection. UI-driven testing validates the complete user interaction pipeline from touch input to action generation. Together with strict zero-tolerance policies enabled by the consistent GitHub Actions CI environment, automated verification, and human-reviewable visual documentation, this approach ensures both technical correctness and qualitative gameplay fidelity while enabling precise isolation of defects to specific subsystems.
