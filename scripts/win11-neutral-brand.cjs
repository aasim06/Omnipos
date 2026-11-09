#!/usr/bin/env node
/**
 * Windows 11 redesign helper for files that are already theme-token based:
 *  1. Single hard-coded LIGHT-theme neutrals (Tailwind slate) are a dark-mode bug,
 *     because the same value is used in both themes. Map them to neutral tokens.
 *  2. Brand red #E51937 as text / fill / border -> Fluent brand tokens, which keep the
 *     brand but adjust contrast per theme (text is darker on light, lighter on dark).
 *
 * Only values in style objects (`prop: '<value>'`) are touched. `#FFFFFF` is left alone
 * on purpose (it is usually text on an accent fill).
 *
 * Usage: node scripts/win11-neutral-brand.cjs [--dry] <file> [...]
 */
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const dry = args[0] === '--dry';
const files = dry ? args.slice(1) : args;

const TEXT = {
  '#0f172a': 'colorNeutralForeground1', '#1e293b': 'colorNeutralForeground1', '#111827': 'colorNeutralForeground1',
  '#334155': 'colorNeutralForeground2', '#475569': 'colorNeutralForeground2', '#64748b': 'colorNeutralForeground2', '#4b5563': 'colorNeutralForeground2',
  '#605e5c': 'colorNeutralForeground2', '#323130': 'colorNeutralForeground1',
  '#94a3b8': 'colorNeutralForeground3', '#a19f9d': 'colorNeutralForeground3', '#9ca3af': 'colorNeutralForeground3', '#cbd5e1': 'colorNeutralForeground4',
  '#e51937': 'colorBrandForeground1', '#c6172e': 'colorBrandForeground2',
};
const BG = {
  '#f8fafc': 'colorNeutralBackground2', '#fafbfd': 'colorNeutralBackground2', '#f9fafb': 'colorNeutralBackground2',
  '#f8f9fa': 'colorNeutralBackground3', '#fdfcf7': 'colorNeutralBackground3', '#faf9f8': 'colorNeutralBackground3', '#f3f2f1': 'colorNeutralBackground3',
  '#f1f5f9': 'colorNeutralBackground3', '#e2e8f0': 'colorNeutralBackground5', '#f3f4f6': 'colorNeutralBackground3',
  '#e51937': 'colorBrandBackground', '#c6172e': 'colorBrandBackgroundHover', '#a71527': 'colorBrandBackgroundPressed',
};
const STROKE = {
  '#e2e8f0': 'colorNeutralStroke2', '#f1f5f9': 'colorNeutralStroke2', '#e5e7eb': 'colorNeutralStroke2',
  '#edebe9': 'colorNeutralStroke2', '#e1dfdd': 'colorNeutralStroke2', '#c8c6c4': 'colorNeutralStroke1',
  '#cbd5e1': 'colorNeutralStroke1', '#d1d5db': 'colorNeutralStroke1', '#94a3b8': 'colorNeutralStrokeAccessible',
  '#e51937': 'colorCompoundBrandStroke',
};

let total = 0;
for (const file of files) {
  let text = fs.readFileSync(file, 'utf8');
  const counts = {};
  text = text.replace(/(\b(?:color|backgroundColor|background|border(?:Top|Right|Bottom|Left)?Color|outlineColor)\b): '(#[0-9A-Fa-f]{6})'/g, (m, prop, hex) => {
    const v = hex.toLowerCase();
    const table = prop === 'color' ? TEXT : prop === 'backgroundColor' || prop === 'background' ? BG : STROKE;
    const token = table[v];
    if (!token) return m;
    counts[token] = (counts[token] || 0) + 1;
    return `${prop}: tokens.${token}`;
  });
  const n = Object.values(counts).reduce((a, b) => a + b, 0);
  total += n;
  if (n && !/import \{[^}]*\btokens\b[^}]*\} from '@fluentui\/react-components'/.test(text)) {
    const re = /import \{([^}]*)\} from '@fluentui\/react-components';/;
    text = re.test(text)
      ? text.replace(re, (_, names) => `import {${names.replace(/[\s,]*$/, '')}, tokens } from '@fluentui/react-components';`)
      : `import { tokens } from '@fluentui/react-components';\n` + text;
  }
  console.log(`${path.relative(process.cwd(), file)}: ${n} -> tokens ${JSON.stringify(counts)}`);
  if (!dry && n) fs.writeFileSync(file, text);
}
console.log(`Total: ${total}`);
