import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const resultsPath = path.join(root, 'test-results', 'results.json');

if (!fs.existsSync(resultsPath)) {
  console.log('No test-results/results.json found. Run tests first.');
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));
const rows = ['| Scenario | Status |', '|----------|--------|'];

function walkSuites(suites, prefix = '') {
  for (const suite of suites ?? []) {
    const title = prefix ? `${prefix} > ${suite.title}` : suite.title;
    for (const spec of suite.specs ?? []) {
      rows.push(`| ${spec.title ?? title} | ${spec.ok ? 'PASS' : 'FAIL'} |`);
    }
    if (suite.suites) walkSuites(suite.suites, title);
  }
}

walkSuites(report.suites);
const out = ['# Test Run Summary', '', ...rows, ''].join('\n');
const outPath = path.join(root, 'test-results', 'SUMMARY.md');
fs.writeFileSync(outPath, out);
console.log(out);
console.log(`\nWritten to ${outPath}`);
