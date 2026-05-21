import fs from 'fs';
import path from 'path';

interface JsonReport {
  suites?: Array<{
    specs?: Array<{
      title?: string;
      ok?: boolean;
      tests?: Array<{ results?: Array<{ status?: string }> }>;
    }>;
  }>;
}

function main(): void {
  const resultsPath = path.join(process.cwd(), 'test-results', 'results.json');
  if (!fs.existsSync(resultsPath)) {
    console.log('No test-results/results.json found. Run tests first.');
    process.exit(1);
  }

  const report = JSON.parse(fs.readFileSync(resultsPath, 'utf-8')) as JsonReport;
  const rows: string[] = ['| Scenario | Status |', '|----------|--------|'];

  for (const suite of report.suites ?? []) {
    for (const spec of suite.specs ?? []) {
      const status = spec.ok ? 'PASS' : 'FAIL';
      rows.push(`| ${spec.title ?? 'unknown'} | ${status} |`);
    }
  }

  const out = ['# Test Run Summary', '', ...rows, ''].join('\n');
  const outPath = path.join(process.cwd(), 'test-results', 'SUMMARY.md');
  fs.writeFileSync(outPath, out);
  console.log(out);
  console.log(`\nWritten to ${outPath}`);
}

main();
