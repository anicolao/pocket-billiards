#!/usr/bin/env node

/**
 * Check Redux code coverage
 * 
 * This script validates that all Redux code in src/store/ has 100% coverage
 * (statements, branches, and functions).
 */

const fs = require('fs');
const path = require('path');

const coverageFile = path.join(process.cwd(), 'coverage', 'coverage-final.json');

if (!fs.existsSync(coverageFile)) {
  console.error('❌ Coverage file not found:', coverageFile);
  console.error('Please run tests with coverage first: npm run test:coverage');
  process.exit(1);
}

const coverage = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));

let hasFailure = false;
const results = [];

for (const [file, data] of Object.entries(coverage)) {
  // Check if file is in the store directory (and not a test file)
  if (file.includes('/src/store/') && !file.includes('.test.')) {
    const statements = data.s;
    const branches = data.b;
    const functions = data.f;
    
    // Calculate coverage percentages
    const stmtTotal = Object.keys(statements).length;
    const stmtCovered = Object.values(statements).filter(v => v > 0).length;
    const stmtPct = stmtTotal > 0 ? (stmtCovered / stmtTotal) * 100 : 100;
    
    const flatBranches = [].concat(...Object.values(branches));
    const branchTotal = flatBranches.length;
    const branchCovered = flatBranches.filter(v => v > 0).length;
    const branchPct = branchTotal > 0 ? (branchCovered / branchTotal) * 100 : 100;
    
    const funcTotal = Object.keys(functions).length;
    const funcCovered = Object.values(functions).filter(v => v > 0).length;
    const funcPct = funcTotal > 0 ? (funcCovered / funcTotal) * 100 : 100;
    
    const fileName = file.split('/').pop();
    
    results.push({
      fileName,
      stmtPct,
      branchPct,
      funcPct,
      passed: stmtPct === 100 && branchPct === 100 && funcPct === 100
    });
    
    console.log(`${fileName}:`);
    console.log(`  Statements: ${stmtPct.toFixed(2)}%`);
    console.log(`  Branches:   ${branchPct.toFixed(2)}%`);
    console.log(`  Functions:  ${funcPct.toFixed(2)}%`);
    
    if (stmtPct < 100 || branchPct < 100 || funcPct < 100) {
      console.log(`  ❌ Does not have 100% coverage`);
      hasFailure = true;
    } else {
      console.log(`  ✅ 100% coverage`);
    }
    console.log();
  }
}

if (results.length === 0) {
  console.error('❌ No Redux store files found in coverage report');
  console.error('Please ensure src/store/ files are being tested.');
  process.exit(1);
}

if (hasFailure) {
  console.error('❌ Redux code coverage check failed: Not all store files have 100% coverage');
  console.error('Please ensure all Redux code in src/store/ is fully tested.');
  process.exit(1);
} else {
  console.log('✅ All Redux code has 100% coverage');
  process.exit(0);
}
