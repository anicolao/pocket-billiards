# End-to-End Testing Strategy

## Overview

The end-to-end (e2e) testing strategy for Pocket Billiards is designed to ensure gameplay accuracy, physics reliability, and UI correctness through comprehensive replay and verification capabilities. This document outlines the approach for recording, replaying, and validating complete game sessions.

## Testing Philosophy

The e2e testing framework serves two critical purposes:

1. **Regression Prevention**: Ensure that changes to the physics engine, rendering system, or game logic don't alter the behavior of previously validated gameplay scenarios.

2. **Visual Verification**: Provide human reviewers with clear, documented evidence that the game simulation produces expected results at key moments throughout gameplay.

## Core Testing Approach

### Two-Tier Testing Model

The testing strategy employs two complementary testing modes that validate different aspects of the system:

#### 1. Action Replay Testing (Redux-Based)

This mode validates the core game simulation and state management by directly replaying recorded player actions into the system.

**Purpose**: Verify that the physics engine, game rules, and state transitions produce consistent, deterministic results.

**How it works**: The test framework injects recorded SHOT actions directly into the Redux store, bypassing the UI layer entirely. Each SHOT action contains the precise parameters that define a player's shot: power level, direction, and contact point on the cue ball. The system then runs the physics simulation and captures the results.

**What it validates**:
- Physics engine determinism and accuracy
- Game state transitions and rule enforcement
- Event detection and handling
- Ball behavior and collision responses

**Advantages**: Fast execution, deterministic results, isolation from UI concerns.

#### 2. UI-Driven Testing (Playwright-Based)

This mode validates the complete user interaction flow by simulating actual user inputs through the UI.

**Purpose**: Verify that the touch interface, input handling, and UI-to-state pipeline correctly translate user gestures into the intended game actions.

**How it works**: The test framework uses computed click locations (derived from the recorded SHOT actions) to simulate touch interactions on the game canvas. These interactions trigger the normal input handling pipeline, which generates UI events, processes touch gestures, and ultimately dispatches the same actions to the Redux store.

**What it validates**:
- Touch input processing and gesture recognition
- UI state management and visual feedback
- Coordinate transformations and hit detection
- Complete user interaction flow

**Advantages**: End-to-end validation, real-world scenario simulation, UI regression detection.

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

Screenshots are organized sequentially within each test, numbered or timestamped to indicate their order in the game flow. Each screenshot corresponds to exactly one significant moment in the simulation.

## Test Artifact Generation

### Test README Generation

For each e2e test, the framework automatically generates a README file that serves as a verification guide for human reviewers.

**README Contents**:

1. **Test Overview**: Description of the game being replayed, including player names, game type, and outcome
2. **Chronological Event Log**: Sequential listing of all significant moments
3. **Screenshot Links**: For each moment, an embedded or linked screenshot image
4. **Moment Descriptions**: Text description of what the verifier should observe in each screenshot
5. **Expected State**: Description of the game state that should be visible (ball positions, scores, game phase)

**Purpose**: Enable human reviewers to systematically verify that simulation output matches expectations without needing to run the test themselves or understand the code.

### Automated Verification Code

In addition to visual documentation, the framework generates programmatic assertions that validate the simulation state at each significant moment.

**Verification Checks**:
- Ball position assertions (within acceptable tolerance)
- Ball velocity assertions (magnitude and direction)
- Game state assertions (scores, current player, game phase)
- Event occurrence verification (expected collisions, pockets, fouls)

**Purpose**: Provide automated regression detection that catches simulation divergence before it requires human review.

## Test Execution Workflow

### Replay Test Execution

When executing an action replay test:

1. **Load Recording**: Read the sequence of SHOT actions from the game recording
2. **Initialize State**: Set up the initial game state (break position, player assignment)
3. **Replay Actions**: For each SHOT action, inject it into the Redux store
4. **Run Simulation**: Execute the physics simulation until the table reaches a stable state
5. **Capture Moments**: Detect and record all significant moments during simulation
6. **Generate Screenshots**: Create visual captures at each significant moment
7. **Run Assertions**: Execute verification code to check state correctness
8. **Generate Documentation**: Produce the test README with screenshots and descriptions

### UI-Driven Test Execution

When executing a UI-driven test:

1. **Load Recording**: Read the sequence of SHOT actions from the game recording
2. **Compute Interactions**: For each SHOT action, calculate the touch locations needed to produce that shot
3. **Initialize UI**: Launch the game in a browser context via Playwright
4. **Simulate Touches**: For each shot, simulate the tap/drag/release gestures at computed locations
5. **Monitor Actions**: Verify that simulated touches generate the expected SHOT actions
6. **Capture Moments**: Detect and record all significant moments during simulation
7. **Generate Screenshots**: Create visual captures via Playwright screenshot API
8. **Run Assertions**: Execute verification code via Playwright assertions
9. **Generate Documentation**: Produce the test README with screenshots and descriptions

## Test Suite Organization

### Test Categories

**Validation Tests**: Short, focused games that test specific scenarios (scratch on break, combination shots, difficult banks). Used for rapid validation during development.

**Regression Tests**: Complete games from actual play sessions. Used to ensure that known-good gameplay continues to work correctly across code changes.

**Edge Case Tests**: Contrived scenarios that exercise unusual physics situations or rule corner cases.

### Test Naming and Discovery

Tests are organized by game type and scenario, with clear naming conventions that indicate their purpose and scope. The test framework can discover and execute tests automatically based on directory structure and naming patterns.

## Tolerance and Determinism

### Physics Tolerance

The physics engine must produce deterministic results for identical inputs. However, screenshots and visual verification acknowledge that minor rendering variations may occur across platforms or configurations.

**Assertion Tolerances**: Automated verification allows small floating-point tolerances when comparing positions and velocities.

**Visual Verification**: Human reviewers focus on qualitative correctness (Did the ball go in the pocket? Did the collision occur?) rather than pixel-perfect matching.

### Platform Considerations

While the core physics must be deterministic, the testing framework acknowledges that screenshot appearance may vary slightly across different rendering contexts. Test documentation emphasizes behavioral correctness over visual exactness.

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

This e2e testing strategy provides comprehensive validation of the Pocket Billiards game through two complementary testing approaches. Action replay testing validates core simulation correctness through direct state injection, while UI-driven testing validates the complete user interaction pipeline. Together with automated verification and human-reviewable visual documentation, this approach ensures both technical correctness and qualitative gameplay fidelity.
