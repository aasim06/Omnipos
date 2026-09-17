const fs = require('fs');
const path = require('path');

const appData = path.join(process.env.APPDATA, 'Omnipos');

function searchDir(dir) {
  if (!fs.existsSync(dir)) return;
  const list = fs.readdirSync(dir);
  for (const item of list) {
    const full = path.join(dir, item);
    try {
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        searchDir(full);
      } else if (stat.size > 0 && stat.size < 50 * 1024 * 1024) {
        if (full.endsWith('.log') || full.endsWith('.ldb') || full.endsWith('.json')) {
          const buf = fs.readFileSync(full);
          const str = buf.toString('latin1');
          if (str.includes('omnipos_products') || str.includes('prod_ff_') || str.includes('prod_mm_') || str.includes('Fast Food')) {
            console.log('Found match in:', full, 'size:', stat.size);
            const idx = str.indexOf('prod_');
            if (idx !== -1) {
              console.log('Snippet around prod_:', JSON.stringify(str.slice(Math.max(0, idx - 40), Math.min(str.length, idx + 100))));
            }
          }
        }
      }
    } catch {}
  }
}

console.log('Searching in', appData);
searchDir(appData);
