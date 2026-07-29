/**
 * Anti-spoiler audit for pros/oppose fields only.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadDataFile(filePath, varName) {
  const code = fs.readFileSync(filePath, 'utf8');
  const sandbox = { module: { exports: {} }, exports: {}, console };
  vm.createContext(sandbox);
  // Execute and capture the const
  const wrapped = code + `\n;this.__RESULT__ = (typeof ${varName} !== 'undefined' ? ${varName} : null);`;
  vm.runInContext(wrapped, sandbox);
  return sandbox.__RESULT__;
}

const SPOILER_TERMS = [
  // Party names
  '民進黨', '國民黨', '民眾黨', '台聯', '時代力量', '親民黨',
  'DPP', 'KMT', 'TPP', 'NPP',
  // Color camps
  '綠營', '藍營', '白營', '泛綠', '泛藍', '藍白', '綠白', '藍綠',
  // Nicknames / faction brands
  '綠黨', '藍軍', '白軍', '綠友友', '小草', '小藍', '小綠',
  '柯系', '黃系', '英派', '蘇系', '賴系', '韓粉',
  // DPP politicians
  '蔡英文', '賴清德', '蘇貞昌', '陳建仁', '卓榮泰', '鄭文燦',
  '賴政府', '蔡政府', '柯市長',
  // KMT politicians
  '馬英九', '朱立倫', '侯友宜', '韓國瑜', '江啟臣', '傅崐萁',
  // TPP
  '柯文哲', '黃國昌', '柯P', '民眾黨主席',
  // Mayors
  '蔣萬安', '張善政', '盧秀燕', '黃偉哲', '陳其邁', '高虹安',
  // Phrases
  '藍白合', '藍綠合', '不當黨產',
];

// Build regex: escape special chars, longest first to prefer full matches
// Note: TPP must not match inside CPTPP (trade pact), so handle EN abbrs separately with lookaround
const chineseTerms = SPOILER_TERMS.filter(t => !/^[A-Z]+$/i.test(t));
const sorted = [...chineseTerms].sort((a, b) => b.length - a.length);
const pattern = new RegExp(
  sorted.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'),
  'g'
);

// English party abbreviations as whole words, not as substring of CPTPP etc.
const engPattern = /(?<![A-Za-z])(DPP|KMT|TPP|NPP)(?![A-Za-z])/gi;

function auditArray(policies, source) {
  const leaks = [];
  for (const p of policies) {
    for (const field of ['pros', 'oppose']) {
      const arr = p[field];
      if (!Array.isArray(arr)) continue;
      arr.forEach((str, index) => {
        if (typeof str !== 'string') return;
        const found = new Set();
        pattern.lastIndex = 0;
        let m;
        while ((m = pattern.exec(str)) !== null) {
          found.add(m[0]);
        }
        engPattern.lastIndex = 0;
        while ((m = engPattern.exec(str)) !== null) {
          found.add(m[0]);
        }
        for (const term of found) {
          leaks.push({
            source,
            id: p.id,
            field,
            index,
            term,
            string: str,
          });
        }
      });
    }
  }
  return leaks;
}

const root = __dirname;
const national = loadDataFile(path.join(root, 'national-data.js'), 'POLICIES');
const city = loadDataFile(path.join(root, 'city-data.js'), 'CITY_POLICIES');

if (!national) {
  console.error('Failed to load POLICIES');
  process.exit(1);
}
if (!city) {
  console.error('Failed to load CITY_POLICIES');
  process.exit(1);
}

const leaks = [
  ...auditArray(national, 'national-data.js'),
  ...auditArray(city, 'city-data.js'),
];

console.log('=== ANTI-SPOILER AUDIT (pros/oppose only) ===');
console.log(`POLICIES count: ${national.length}`);
console.log(`CITY_POLICIES count: ${city.length}`);
console.log(`Total leak matches: ${leaks.length}`);
console.log('');

if (leaks.length === 0) {
  console.log('ZERO MATCHES — clean.');
  process.exit(0);
}

// Group by source
const bySource = {};
for (const L of leaks) {
  bySource[L.source] = bySource[L.source] || [];
  bySource[L.source].push(L);
}

for (const [src, list] of Object.entries(bySource)) {
  console.log(`\n--- ${src}: ${list.length} matches ---\n`);
  for (const L of list) {
    console.log(`id=${L.id} | ${L.field}[${L.index}] | term="${L.term}"`);
    console.log(`  "${L.string}"`);
    console.log('');
  }
}

// Unique offending strings for fix planning
console.log('\n=== UNIQUE OFFENDING STRINGS ===\n');
const unique = new Map();
for (const L of leaks) {
  const key = `${L.source}|${L.id}|${L.field}|${L.index}|${L.string}`;
  if (!unique.has(key)) unique.set(key, L);
}
console.log(`Unique strings: ${unique.size}`);
for (const L of unique.values()) {
  console.log(`[${L.source}] ${L.id}.${L.field}[${L.index}]: ${L.string}`);
}

// Write JSON report
fs.writeFileSync(
  path.join(root, 'spoiler-audit-report.json'),
  JSON.stringify({ total: leaks.length, unique: unique.size, leaks: [...unique.values()] }, null, 2),
  'utf8'
);
console.log('\nWrote spoiler-audit-report.json');
process.exit(leaks.length > 0 ? 2 : 0);
