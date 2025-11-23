# Development Guide

## Getting Started

### Prerequisites
- Node.js 18 or higher
- npm 9 or higher

### Installation

1. Clone the repository:
```bash
git clone https://github.com/anicolao/pocket-billiards.git
cd pocket-billiards
```

2. Install dependencies:
```bash
npm install
```

### Running the Application

#### Development Server
Start the development server with hot reload:
```bash
npm run dev
```
Then open http://localhost:3000 in your browser.

#### Production Build
Build the application for production:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

### Testing

#### Unit Tests
Run unit tests with Vitest:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Run tests with coverage:
```bash
npm run test:coverage
```

#### End-to-End Tests
Run Playwright e2e tests:
```bash
npm run test:e2e
```

Run tests with UI:
```bash
npm run test:e2e:ui
```

Update baseline screenshots:
```bash
npm run test:e2e -- --update-snapshots
```

## Project Structure

```
src/
  ├── main.ts               # Entry point
  ├── store/                # Redux store
  │   ├── index.ts          # Store configuration
  │   └── tableSlice.ts     # Table state management
  └── rendering/            # Canvas rendering
      └── renderer.ts       # Table rendering logic

tests/
  ├── unit/                 # Vitest unit tests
  │   └── tableSlice.test.ts
  └── e2e/                  # Playwright tests
      └── table.spec.ts
```

## Current Version: v0.0.1

This is a minimal proof-of-concept that renders an empty pool table with:
- Green felt playing surface
- Wooden rails
- Six pockets (4 corner, 2 side)

No balls or controls yet - just the table foundation.
