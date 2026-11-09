#!/usr/bin/env node
/**
 * Windows 11 redesign helper: replace hard-coded neutral colours in makeStyles
 * `xxxDark` / `xxxLight` class pairs with Fluent theme tokens.
 *
 * Fluent tokens are CSS variables that already switch with the light/dark theme,
 * so a known neutral pair (e.g. dark '#14161B' + light '#FFFFFF' card background)
 * becomes one token (tokens.colorNeutralBackground1) in both classes.
 * Accent / status colours (red, green, amber, blue…) are left alone.
 *
 * Usage: node scripts/win11-tokenize-styles.cjs [--dry] <file.styles.ts> [...]
 * Prints every replaced pair and every neutral-looking pair it could not map.
 */
const fs = require('fs');
const path = require('path');
const ts = require(require.resolve('typescript', { paths: [process.cwd()] }));

const args = process.argv.slice(2);
const dry = args[0] === '--dry';
const files = dry ? args.slice(1) : args;

const norm = (v) => v.toLowerCase().replace(/\s+/g, '');
const isWhiteA = (v, max = 0.2) => { const m = /^rgba\(255,255,255,(0?\.\d+)\)$/.exec(v); return !!m && Number(m[1]) <= max; };
const isBlackA = (v, max = 0.2) => { const m = /^rgba\(0,0,0,(0?\.\d+)\)$/.exec(v); return !!m && Number(m[1]) <= max; };
const oneOf = (list) => (v) => list.includes(v);

// Dark-theme / light-theme value families (normalised: lowercase, no spaces)
const darkCanvas = oneOf(['#0d0e11', '#0f1012', '#0c0d10', '#0c0d12', '#111215', '#0b0f19', '#09090b', '#0a0a0a', '#0f172a']);
const darkCard = oneOf(['#14161b', '#16171a', '#16181f', '#121316', '#1c1d21', '#1a1b1f', '#18181b', '#111318', '#1e293b', '#1c1f26', '#15171c', '#171a21']);
const darkRaised = (v) => oneOf(['#27272a', '#2d3139', '#24252b', '#2f3038', '#334155', '#1f2937', '#262626', '#232631'])(v) || isWhiteA(v, 0.12);
const lightCanvas = oneOf(['#f8fafc', '#f5f5f5', '#f1f5f9', '#f4f5f8', '#f5f6f8', '#fafafa', '#f9fafb', '#f3f4f6']);
const lightCard = oneOf(['#ffffff', '#fff']);
const lightRaised = (v) => oneOf(['#e2e8f0', '#f1f5f9', '#f8fafc', '#e5e7eb', '#eef2f6', '#f3f4f6', '#f1f1f1', '#cbd5e1'])(v) || isBlackA(v, 0.08);
const darkText1 = oneOf(['#ffffff', '#fff', '#f8fafc', '#f1f5f9', '#e2e8f0', '#fafafa']);
const lightText1 = oneOf(['#0f172a', '#1e293b', '#111827', '#18181b', '#000000', '#1a1a1a', '#0b0f19']);
const darkText2 = oneOf(['#94a3b8', '#cbd5e1', '#a1a1aa', '#9ca3af']);
const lightText2 = oneOf(['#64748b', '#475569', '#334155', '#52525b', '#4b5563']);
const darkText3 = oneOf(['#64748b', '#475569', '#71717a', '#6b7280']);
const lightText3 = oneOf(['#94a3b8', '#a1a1aa', '#9ca3af', '#cbd5e1']);
const darkStroke = (v) => isWhiteA(v, 0.2) || oneOf(['#27272a', '#2d3139', '#1c1f26', '#26272d', '#33343c', '#334155', '#1e293b', '#3f3f46'])(v);
const lightStroke = (v) => isBlackA(v, 0.2) || oneOf(['#e2e8f0', '#f1f5f9', '#cbd5e1', '#e5e7eb', '#d1d5db', '#e4e4e7'])(v);

const isBg = (p) => p === 'backgroundColor' || p === 'background';
const isText = (p) => p === 'color' || p === 'fill';
const isStroke = (p) => /^border(Top|Right|Bottom|Left)?Color$/.test(p) || p === 'outlineColor' || p === 'stroke';

function mapPair(prop, dark, light) {
  if (isBg(prop)) {
    if (darkCanvas(dark) && lightCanvas(light)) return 'colorNeutralBackground2';
    if (darkCard(dark) && lightCard(light)) return 'colorNeutralBackground1';
    if (darkRaised(dark) && (lightRaised(light) || lightCanvas(light))) return 'colorNeutralBackground3';
    if (darkCard(dark) && (lightCanvas(light) || lightRaised(light))) return 'colorNeutralBackground3';
    if (darkCanvas(dark) && lightCard(light)) return 'colorNeutralBackground1';
  }
  if (isText(prop)) {
    if (darkText1(dark) && lightText1(light)) return 'colorNeutralForeground1';
    if (darkText2(dark) && lightText2(light)) return 'colorNeutralForeground2';
    if (darkText3(dark) && lightText3(light)) return 'colorNeutralForeground3';
    if (darkText2(dark) && lightText3(light)) return 'colorNeutralForeground3';
    if (darkText3(dark) && lightText2(light)) return 'colorNeutralForeground3';
  }
  if (isStroke(prop)) {
    if (darkStroke(dark) && lightStroke(light)) return 'colorNeutralStroke2';
  }
  return null;
}
const looksNeutral = (v) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/.test(v) && (() => {
  const h = v.length === 4 ? v.slice(1).split('').map((c) => c + c).join('') : v.slice(1);
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return Math.max(r, g, b) - Math.min(r, g, b) < 40;
})() || isWhiteA(v, 0.3) || isBlackA(v, 0.3);

let grandTotal = 0;
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

  // Find every makeStyles({...}) object literal.
  const styleObjects = [];
  (function walk(n) {
    if (ts.isCallExpression(n) && n.expression.getText(sf) === 'makeStyles' && n.arguments[0] && ts.isObjectLiteralExpression(n.arguments[0])) {
      styleObjects.push(n.arguments[0]);
    }
    ts.forEachChild(n, walk);
  })(sf);

  const edits = []; // { start, end, text }
  const unmapped = [];
  const counts = {};

  const propsOf = (obj, prefix = '') => {
    const out = new Map();
    for (const p of obj.properties) {
      if (!ts.isPropertyAssignment(p)) continue;
      const name = p.name.getText(sf).replace(/^['"]|['"]$/g, '');
      if (ts.isObjectLiteralExpression(p.initializer)) {
        for (const [k, v] of propsOf(p.initializer, `${prefix}${name}/`)) out.set(k, v);
      } else if (ts.isStringLiteral(p.initializer) || ts.isNoSubstitutionTemplateLiteral(p.initializer)) {
        out.set(prefix + name, p.initializer);
      }
    }
    return out;
  };

  for (const obj of styleObjects) {
    const classes = new Map();
    for (const p of obj.properties) {
      if (ts.isPropertyAssignment(p) && ts.isObjectLiteralExpression(p.initializer)) classes.set(p.name.getText(sf), p.initializer);
    }
    for (const [name, darkObj] of classes) {
      const m = /^(.*)Dark$/.exec(name);
      if (!m || !classes.has(`${m[1]}Light`)) continue;
      const lightProps = propsOf(classes.get(`${m[1]}Light`));
      for (const [key, darkLit] of propsOf(darkObj)) {
        const lightLit = lightProps.get(key);
        if (!lightLit) continue;
        const prop = key.split('/').pop();
        const d = norm(darkLit.text);
        const l = norm(lightLit.text);
        if (d === l) continue;
        const token = mapPair(prop, d, l);
        if (token) {
          for (const lit of [darkLit, lightLit]) edits.push({ start: lit.getStart(sf), end: lit.end, text: `tokens.${token}` });
          counts[token] = (counts[token] || 0) + 1;
        } else if (looksNeutral(d) && looksNeutral(l)) {
          unmapped.push(`${m[1]}{Dark,Light}.${key}: '${darkLit.text}' / '${lightLit.text}'`);
        }
      }
    }
  }

  let out = text;
  for (const e of edits.sort((a, b) => b.start - a.start)) out = out.slice(0, e.start) + e.text + out.slice(e.end);

  // Make sure `tokens` is imported from @fluentui/react-components.
  if (edits.length && !/import \{[^}]*\btokens\b[^}]*\} from '@fluentui\/react-components'/.test(out)) {
    const re = /import \{([^}]*)\} from '@fluentui\/react-components';/;
    if (re.test(out)) out = out.replace(re, (_, names) => `import {${names.replace(/[\s,]*$/, '')}, tokens } from '@fluentui/react-components';`);
    else out = `import { tokens } from '@fluentui/react-components';\n` + out;
  }

  const n = edits.length / 2;
  grandTotal += n;
  console.log(`\n${path.relative(process.cwd(), file)}: ${n} pairs -> tokens ${JSON.stringify(counts)}`);
  if (unmapped.length) console.log('  unmapped neutral pairs:\n    ' + unmapped.join('\n    '));
  if (!dry && n) fs.writeFileSync(file, out);
}
console.log(`\nTotal pairs ${dry ? 'that would be ' : ''}tokenised: ${grandTotal}`);
