const fs = require('fs');
const path = require('path');

const BASE = '/SleepDiaries';
const DOCS = path.join(__dirname, '..', 'docs');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  content = content
    .replace(/src="\/_expo\//g, `src="${BASE}/_expo/`)
    .replace(/href="\/_expo\//g, `href="${BASE}/_expo/`)
    .replace(/href="\/favicon/g, `href="${BASE}/favicon`)
    .replace(/href="\/assets\//g, `href="${BASE}/assets/`)
    .replace(/url\("\/assets\//g, `url("${BASE}/assets/`);
  if (content !== original) { fs.writeFileSync(filePath, content, 'utf8'); console.log('Fixed:', filePath); }
}

function fixJs(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  content = content.replace(/"\/assets\//g, `"${BASE}/assets/`);
  if (content !== original) { fs.writeFileSync(filePath, content, 'utf8'); console.log('Fixed:', filePath); }
}

function walk(dir, fn, ext) {
  fs.readdirSync(dir).forEach(f => {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) walk(full, fn, ext);
    else if (f.endsWith(ext)) fn(full);
  });
}

walk(DOCS, fixFile, '.html');
walk(path.join(DOCS, '_expo'), fixJs, '.js');
console.log('✅ Path fix complete');
