'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const allowed = ['app.js', 'data-loader.js', 'data.json', 'index.html', 'layout.css', 'library.css', 'review.js', 'styles.css'];
function assert(value, message) { if (!value) throw new Error(message); }
const actual = fs.readdirSync('dist').sort();
assert(JSON.stringify(actual) === JSON.stringify(allowed), 'dist must contain exactly the eight approved student files.');
for (const name of actual) {
  const file = path.join('dist', name);
  assert(fs.lstatSync(file).isFile() && !fs.lstatSync(file).isSymbolicLink(), `Not a regular file: ${file}`);
  if (name.endsWith('.js') || name.endsWith('.html')) {
    const content = fs.readFileSync(file, 'utf8');
    assert(!/localStorage|local-preview\.js|admin\.js|admin\.html|admin-draft|backup\.html|manage-words|word-form/.test(content), `Management code in ${file}`);
    assert(!/github_pat_[A-Za-z0-9_]+|gh[pousr]_[A-Za-z0-9]{20,}|-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(content), `Credential pattern in ${file}`);
  }
}
const original = JSON.parse(fs.readFileSync('dist/data.json', 'utf8'));
const context = vm.createContext({});
vm.runInContext(fs.readFileSync('dist/data-loader.js', 'utf8'), context);
context.input = original;
const data = vm.runInContext('validateWordData(input)', context);
assert(JSON.stringify(data) === JSON.stringify(original), 'Publish explicit categories and relations; do not rely on migration during deployment.');
const report = data.levels.map(level => ({
  level: level.title,
  categories: level.categories.length,
  decks: level.topics.length,
  words: level.topics.reduce((total, topic) => total + topic.words.length, 0)
}));
const decks = report.reduce((total, level) => total + level.decks, 0);
const words = report.reduce((total, level) => total + level.words, 0);
assert(decks > 0 && words > 0, 'Refusing an empty collection.');
const html = fs.readFileSync('dist/index.html', 'utf8');
for (const match of html.matchAll(/(?:src|href)="([^"#]+\.(?:js|css))"/g)) assert(allowed.includes(match[1]), `Unknown asset: ${match[1]}`);
console.table(report);
console.log(`Approved student artifact: ${decks} decks, ${words} words. No management files.`);
