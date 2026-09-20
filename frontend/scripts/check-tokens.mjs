import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const srcRoot = join(here, '..', 'src');
const extensions = new Set(['.js', '.jsx', '.ts', '.tsx']);

const rules = [
  {
    pattern:
      /\b(?:bg|text|border|from|to|via|ring|fill|stroke|divide|placeholder|outline|shadow|accent|caret|decoration)-(?:gray|slate|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/g,
    label: 'raw Tailwind palette color — use a Kiln semantic token',
  },
  {
    pattern: /\b(?:bg|text|border|ring|fill|stroke)-(?:black|white)\b/g,
    label: 'black/white utility — use foreground/background/surface tokens',
  },
  {
    pattern: /\b(?:bg|text|border|shadow|ring)-\[(?:#|rgba?\()/g,
    label: 'arbitrary color class — use a Kiln semantic token',
  },
  {
    pattern: /\bwindow\.confirm\s*\(/g,
    label: 'window.confirm — use AlertDialog',
  },
  {
    pattern: /\bwindow\.location\.reload\s*\(/g,
    label: 'window.location.reload — update state instead',
  },
];

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) {
      walk(full, files);
    } else if (extensions.has(extname(entry))) {
      files.push(full);
    }
  }
  return files;
}

const violations = [];

for (const file of walk(srcRoot)) {
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, index) => {
    for (const rule of rules) {
      rule.pattern.lastIndex = 0;
      if (rule.pattern.test(line)) {
        violations.push({
          file: relative(join(here, '..'), file).replace(/\\/g, '/'),
          line: index + 1,
          label: rule.label,
          snippet: line.trim().slice(0, 120),
        });
      }
    }
  });
}

if (violations.length === 0) {
  console.log('✓ Kiln token check passed — no raw palette classes, window.confirm, or reloads.');
  process.exit(0);
}

console.error(`✗ Kiln token check found ${violations.length} violation(s):\n`);
for (const violation of violations) {
  console.error(`  ${violation.file}:${violation.line}  ${violation.label}`);
  console.error(`    ${violation.snippet}\n`);
}
process.exit(1);
