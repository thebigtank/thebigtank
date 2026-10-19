import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const ACCENT_LEVELS = {
  dark: ['#161b22', '#683725', '#964627', '#cc5929', '#ff6a2b'],
  light: ['#ebedf0', '#ffd2bf', '#ffa47a', '#ff7a3d', '#e5531a'],
};
const MUTED = { dark: '#9aa4ae', light: '#59636e' };
const FONT = "ui-sans-serif, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif";
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Mon', 'Wed', 'Fri'];

let html;
try {
  const res = await fetch('https://github.com/users/thebigtank/contributions', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; thebigtank-readme/1.0)',
      Accept: 'text/html',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  html = await res.text();
} catch (err) {
  console.error(`Failed to fetch contributions: ${err.message}`);
  process.exit(1);
}

const cells = [];
for (const tag of html.match(/<td\b[^>]*>/g) || []) {
  const date = tag.match(/data-date="(\d{4}-\d{2}-\d{2})"/);
  const level = tag.match(/data-level="(\d+)"/);
  const id = tag.match(/id="contribution-day-component-(\d+)-(\d+)"/);
  if (!date || !level || !id) continue;
  const row = Number(id[1]);
  const col = Number(id[2]);
  if (row < 0 || row > 6) continue;
  cells.push({ date: date[1], level: Number(level[1]), row, col });
}

if (cells.length < 300) {
  console.error(`Only parsed ${cells.length} contribution cells (need at least 300).`);
  process.exit(1);
}

const COLS = Math.max(...cells.map((c) => c.col)) + 1;
const WIDTH = 32 + COLS * 14 - 3;
const HEIGHT = 20 + 7 * 14 - 3 + 34;

const byCol = new Map();
for (const cell of cells) {
  if (!byCol.has(cell.col)) byCol.set(cell.col, []);
  byCol.get(cell.col).push(cell);
}
const earliest = (col) =>
  byCol.get(col)?.reduce((min, c) => (c.date < min ? c.date : min), '9999-99-99');

function render(theme) {
  const levels = ACCENT_LEVELS[theme];
  const muted = MUTED[theme];

  const out = [];
  out.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img">`,
    `<title>theBigTank's contributions in the last year</title>`
  );

  for (const cell of cells) {
    const x = 32 + cell.col * 14;
    const y = 20 + cell.row * 14;
    const fill = levels[cell.level] ?? levels[0];
    if (cell.level === 0 && theme === 'dark') {
      out.push(
        `<rect x="${x + 0.5}" y="${y + 0.5}" width="10" height="10" rx="2" fill="${fill}" stroke="#1f242c" stroke-width="1"/>`
      );
    } else {
      out.push(`<rect x="${x}" y="${y}" width="11" height="11" rx="2" fill="${fill}"/>`);
    }
  }

  for (const row of [1, 3, 5]) {
    const label = DAYS[[1, 3, 5].indexOf(row)];
    out.push(
      `<text x="0" y="${20 + row * 14 + 9}" font-family="${FONT}" font-size="11" fill="${muted}">${label}</text>`
    );
  }

  let prevLabelX = null;
  for (let col = 1; col < COLS; col += 1) {
    const now = earliest(col);
    const before = earliest(col - 1);
    if (now === '9999-99-99' || before === '9999-99-99') continue;
    if (now.slice(0, 7) === before.slice(0, 7)) continue;
    const x = 32 + col * 14;
    if (prevLabelX !== null && x - prevLabelX < 28) continue;
    prevLabelX = x;
    const month = MONTHS[Number(now.slice(5, 7)) - 1];
    out.push(
      `<text x="${x}" y="12" font-family="${FONT}" font-size="11" fill="${muted}">${month}</text>`
    );
  }

  const baseline = HEIGHT - 6;
  const swatchY = HEIGHT - 16;
  const swatchW = 11;
  const gap = 3;
  const totalSwatches = 5 * swatchW + 4 * gap;
  const moreLeft = WIDTH - 28;
  const swatchEnd = moreLeft - 6;
  const swatchStart = swatchEnd - totalSwatches;

  out.push(
    `<text x="${swatchStart - 32}" y="${baseline}" font-family="${FONT}" font-size="11" fill="${muted}">Less</text>`
  );
  for (let level = 0; level < 5; level += 1) {
    const x = swatchStart + level * (swatchW + gap);
    if (level === 0 && theme === 'dark') {
      out.push(
        `<rect x="${x + 0.5}" y="${swatchY + 0.5}" width="10" height="10" rx="2" fill="${levels[0]}" stroke="#1f242c" stroke-width="1"/>`
      );
    } else {
      out.push(`<rect x="${x}" y="${swatchY}" width="11" height="11" rx="2" fill="${levels[level]}"/>`);
    }
  }
  out.push(
    `<text x="${WIDTH}" y="${baseline}" text-anchor="end" font-family="${FONT}" font-size="11" fill="${muted}">More</text>`,
    `<text x="0" y="${baseline}" font-family="${FONT}" font-size="11" fill="${muted}">Updated ${new Date().toISOString().slice(0, 10)}</text>`,
    '</svg>',
    ''
  );

  return out.join('\n');
}

fs.mkdirSync(path.join(root, 'assets'), { recursive: true });
fs.writeFileSync(path.join(root, 'assets/contributions-dark.svg'), render('dark'));
fs.writeFileSync(path.join(root, 'assets/contributions-light.svg'), render('light'));

console.log(`wrote ${cells.length} cells, ${COLS} weeks`);
