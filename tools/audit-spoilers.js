/**
 * Anti-spoiler audit for ISSUES topic/simple/stances text.
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

function loadIssues() {
  const code = fs.readFileSync(path.join(__dirname, "..", "data", "issues-data.js"), "utf8");
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(code + "\n;this.__R = ISSUES;", sandbox);
  return sandbox.__R;
}

const TERMS = [
  "民進黨", "國民黨", "民眾黨", "台聯", "時代力量",
  "綠營", "藍營", "白營", "泛綠", "泛藍", "藍白", "藍綠",
  "蔡英文", "賴清德", "蘇貞昌", "柯文哲", "黃國昌", "柯P",
  "朱立倫", "侯友宜", "韓國瑜", "蔣萬安", "馬英九", "卓榮泰",
];
const pattern = new RegExp(TERMS.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"), "g");

const issues = loadIssues();
const leaks = [];
for (const iss of issues) {
  const fields = [
    ["topic", iss.topic],
    ["simple", iss.simple],
    ["dpp", iss.stances.dpp.text],
    ["kmt", iss.stances.kmt.text],
    ["tpp", iss.stances.tpp.text],
  ];
  for (const [field, str] of fields) {
    if (!str) continue;
    pattern.lastIndex = 0;
    const m = str.match(pattern);
    if (m) leaks.push({ id: iss.id, field, terms: [...new Set(m)], str });
  }
}

console.log("ISSUES", issues.length);
console.log("leaks", leaks.length);
if (leaks.length) {
  for (const L of leaks) console.log(L.id, L.field, L.terms.join(","), L.str);
  process.exit(2);
}
console.log("ZERO MATCHES — clean.");
process.exit(0);
