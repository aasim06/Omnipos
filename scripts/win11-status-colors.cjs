#!/usr/bin/env node
/**
 * Windows 11 redesign helper: replace Tailwind-style status colours in makeStyles
 * files with Fluent status / palette tokens (theme-aware, Windows 11 system colours).
 *
 *   green  #10B981 / rgba(16,185,129,…)   -> colorStatusSuccess*
 *   amber  #F59E0B / rgba(245,158,11,…)   -> colorStatusWarning*
 *   red tints rgba(229,25,55,…), rgba(239,68,68,…), #FFF1F2, #FEF2F2 -> colorStatusDanger*
 *   blue   #3B82F6 / #2563EB / rgba(59,130,246,…) / rgba(37,99,235,…) -> colorPaletteBlue*
 *
 * Text colour -> *Foreground1, tinted background -> *Background1, border -> *Border1,
 * solid fills (dots, bars) -> *Background3. The brand red #E51937 as a solid accent is kept.
 *
 * Usage: node scripts/win11-status-colors.cjs [--dry] <file> [...]
 */
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const dry = args[0] === '--dry';
const files = dry ? args.slice(1) : args;

const families = [
  { name: 'success', hex: ['#10b981', '#34d399', '#059669', '#047857', '#22c55e', '#16a34a'], rgb: ['16,185,129', '34,197,94'], tintLight: ['#f0fdf4', '#ecfdf5', '#d1fae5'],
    fg: 'colorStatusSuccessForeground1', bg: 'colorStatusSuccessBackground1', border: 'colorStatusSuccessBorder1', solid: 'colorStatusSuccessBackground3' },
  { name: 'warning', hex: ['#f59e0b', '#fbbf24', '#d97706', '#b45309'], rgb: ['245,158,11', '251,191,36'], tintLight: ['#fffbeb', '#fef3c7'],
    fg: 'colorStatusWarningForeground1', bg: 'colorStatusWarningBackground1', border: 'colorStatusWarningBorder1', solid: 'colorStatusWarningBackground3' },
  { name: 'danger', hex: ['#ef4444', '#dc2626', '#b91c1c'], rgb: ['229,25,55', '239,68,68', '220,38,38'], tintLight: ['#fff1f2', '#fef2f2', '#fee2e2', '#ffebef'],
    fg: 'colorStatusDangerForeground1', bg: 'colorStatusDangerBackground1', border: 'colorStatusDangerBorder1', solid: null },
  { name: 'info', hex: ['#3b82f6', '#2563eb', '#0ea5e9', '#0284c7', '#1d4ed8'], rgb: ['59,130,246', '37,99,235', '14,165,233'], tintLight: ['#eff6ff', '#dbeafe', '#f0f9ff'],
    fg: 'colorPaletteBlueForeground2', bg: 'colorPaletteBlueBackground2', border: 'colorPaletteBlueBorderActive', solid: 'colorPaletteBlueBorderActive' },
];

const kindOf = (prop) => {
  if (prop === 'color' || prop === 'fill' && false) return 'fg';
  if (prop === 'backgroundColor' || prop === 'background') return 'bgOrSolid';
  if (/^border(Top|Right|Bottom|Left)?Color$/.test(prop) || prop === 'outlineColor') return 'border';
  return null;
};

let total = 0;
for (const file of files) {
  let text = fs.readFileSync(file, 'utf8');
  const counts = {};
  text = text.replace(/(\b(?:color|backgroundColor|background|border(?:Top|Right|Bottom|Left)?Color|outlineColor)\b): '([^']+)'/g, (m, prop, raw) => {
    const v = raw.toLowerCase().replace(/\s+/g, '');
    const kind = kindOf(prop);
    if (!kind) return m;
    for (const fam of families) {
      const rgba = /^rgba\((\d+,\d+,\d+),(0?\.\d+|1)\)$/.exec(v);
      const isHex = fam.hex.includes(v);
      const isRgb = rgba && fam.rgb.includes(rgba[1]);
      const isTint = fam.tintLight.includes(v);
      if (!isHex && !isRgb && !isTint) continue;
      let token = null;
      if (kind === 'fg' && (isHex || isRgb)) token = fam.fg;
      else if (kind === 'border') token = fam.border;
      else if (kind === 'bgOrSolid') {
        if (isTint || (isRgb && Number(rgba[2]) <= 0.3)) token = fam.bg;
        else if (isHex || isRgb) token = fam.solid;
      }
      if (!token) return m;
      counts[`${fam.name}:${token}`] = (counts[`${fam.name}:${token}`] || 0) + 1;
      return `${prop}: tokens.${token}`;
    }
    return m;
  });
  const n = Object.values(counts).reduce((a, b) => a + b, 0);
  total += n;
  if (n && !/\btokens\b[^\n]*from '@fluentui\/react-components'/.test(text)) {
    const re = /import \{([^}]*)\} from '@fluentui\/react-components';/;
    text = re.test(text)
      ? text.replace(re, (_, names) => `import {${names.replace(/\s*$/, '')}, tokens } from '@fluentui/react-components';`)
      : `import { tokens } from '@fluentui/react-components';\n` + text;
  }
  console.log(`${path.relative(process.cwd(), file)}: ${n} status colours -> tokens`);
  for (const [k, c] of Object.entries(counts)) console.log(`    ${k} x${c}`);
  if (!dry && n) fs.writeFileSync(file, text);
}
console.log(`Total: ${total}`);
