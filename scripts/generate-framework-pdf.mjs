import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from '@playwright/test';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mdPath = path.join(root, 'docs', 'UASK_FRAMEWORK_OVERVIEW.md');
const pdfPath = path.join(root, 'docs', 'UASK_FRAMEWORK_OVERVIEW.pdf');

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function mdToHtml(src) {
  const lines = src.split('\n');
  const out = [];
  let inCode = false;
  let codeBuf = [];
  let inTable = false;
  let tableRows = [];

  const flushTable = () => {
    if (!tableRows.length) return;
    const [head, ...rest] = tableRows;
    const isSep = (row) => row.every((c) => /^-+$/.test(c));
    const dataRows = rest.filter((r) => !isSep(r));
    out.push('<table>');
    out.push('<thead><tr>' + head.map((c) => `<th>${escapeHtml(c)}</th>`).join('') + '</tr></thead>');
    out.push('<tbody>');
    for (const row of dataRows) {
      out.push('<tr>' + row.map((c) => `<td>${escapeHtml(c)}</td>`).join('') + '</tr>');
    }
    out.push('</tbody></table>');
    tableRows = [];
    inTable = false;
  };

  for (const line of lines) {
    if (line.startsWith('```')) {
      if (inCode) {
        out.push(`<pre><code>${escapeHtml(codeBuf.join('\n'))}</code></pre>`);
        codeBuf = [];
        inCode = false;
      } else {
        flushTable();
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      codeBuf.push(line);
      continue;
    }

    if (line.startsWith('|')) {
      inTable = true;
      tableRows.push(
        line
          .slice(1, -1)
          .split('|')
          .map((c) => c.trim()),
      );
      continue;
    } else if (inTable) {
      flushTable();
    }

    if (line.startsWith('# ')) {
      out.push(`<h1>${escapeHtml(line.slice(2))}</h1>`);
    } else if (line.startsWith('## ')) {
      out.push(`<h2>${escapeHtml(line.slice(3))}</h2>`);
    } else if (line.startsWith('### ')) {
      out.push(`<h3>${escapeHtml(line.slice(4))}</h3>`);
    } else if (line.startsWith('> ')) {
      out.push(`<blockquote><p>${escapeHtml(line.slice(2))}</p></blockquote>`);
    } else if (line === '---') {
      out.push('<hr/>');
    } else if (line.startsWith('- ')) {
      out.push(`<li>${escapeHtml(line.slice(2))}</li>`);
    } else if (line.trim() === '') {
      out.push('');
    } else {
      const t = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      out.push(`<p>${t}</p>`);
    }
  }
  flushTable();
  if (inCode && codeBuf.length) {
    out.push(`<pre><code>${escapeHtml(codeBuf.join('\n'))}</code></pre>`);
  }

  let html = out.join('\n');
  html = html.replace(/(<li>[\s\S]*?<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`);
  return html;
}

const md = fs.readFileSync(mdPath, 'utf8');
const body = mdToHtml(md);

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>U-Ask Framework Overview</title>
  <style>
    @page { size: A4; margin: 18mm 14mm; }
    body {
      font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
      font-size: 10.5pt;
      line-height: 1.5;
      color: #1a1a1a;
    }
    h1 {
      font-size: 20pt;
      color: #0d47a1;
      border-bottom: 2px solid #0d47a1;
      padding-bottom: 6px;
      margin-top: 0;
      page-break-after: avoid;
    }
    h2 {
      font-size: 14pt;
      color: #1565c0;
      margin-top: 20px;
      page-break-after: avoid;
    }
    h3 {
      font-size: 11.5pt;
      color: #333;
      margin-top: 14px;
      page-break-after: avoid;
    }
    blockquote {
      background: #e8f0fe;
      border-left: 4px solid #0d47a1;
      padding: 10px 14px;
      margin: 12px 0;
      font-style: italic;
      page-break-inside: avoid;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
      font-size: 9.5pt;
      page-break-inside: avoid;
    }
    th, td {
      border: 1px solid #bdbdbd;
      padding: 6px 8px;
      text-align: left;
      vertical-align: top;
    }
    th { background: #e3f2fd; }
    pre {
      background: #f5f5f5;
      border: 1px solid #e0e0e0;
      padding: 10px;
      font-size: 8.5pt;
      white-space: pre-wrap;
      word-break: break-word;
      page-break-inside: avoid;
    }
    ul { margin: 8px 0 8px 22px; }
    li { margin: 4px 0; }
    hr { border: none; border-top: 1px solid #ccc; margin: 24px 0; }
    p { margin: 8px 0; }
    strong { color: #0d47a1; }
  </style>
</head>
<body>
${body}
</body>
</html>`;

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent(html, { waitUntil: 'load' });
await page.pdf({
  path: pdfPath,
  format: 'A4',
  printBackground: true,
  margin: { top: '15mm', bottom: '15mm', left: '12mm', right: '12mm' },
});
await browser.close();

console.log(`PDF written to ${pdfPath} (${fs.statSync(pdfPath).size} bytes)`);
