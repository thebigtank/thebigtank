import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(root, rel));
const b64 = (rel) => read(rel).toString('base64');
const write = (rel, svg) => {
  fs.mkdirSync(path.join(root, 'assets'), { recursive: true });
  fs.writeFileSync(path.join(root, rel), svg);
};

const ACCENT = '#ff6a2b';

const THEMES = {
  dark: {
    TEXT: '#e6e8eb',
    MUTED: '#9aa4ae',
    LINE: '#222830',
    OUTLINE: '#3d444d',
    BANNER_BG: '#0a0c0f',
    GRID: '#1a1f26',
    NAME: '#ffffff',
  },
  light: {
    TEXT: '#1f2328',
    MUTED: '#59636e',
    LINE: '#d1d9e0',
    OUTLINE: '#d1d9e0',
    BANNER_BG: '#ffffff',
    GRID: '#eef1f4',
    NAME: '#1f2328',
  },
};

const geist500 = b64('src/fonts/geist-500.woff2');
const geist600 = b64('src/fonts/geist-600.woff2');
const geistMono500 = b64('src/fonts/geist-mono-500.woff2');

const fontFace = (family, weight, data) =>
  `@font-face{font-family:"${family}";font-weight:${weight};src:url(data:font/woff2;base64,${data}) format("woff2")}`;

const faceGeist500 = fontFace('Geist', 500, geist500);
const faceGeist600 = fontFace('Geist', 600, geist600);
const faceGeistMono500 = fontFace('Geist Mono', 500, geistMono500);

const esc = (text) =>
  String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const svgOpen = (w, h, title) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img">\n<title>${esc(title)}</title>\n`;

/* 1a. Banner */

function banner(theme) {
  const t = THEMES[theme];
  return (
    svgOpen(1200, 360, 'theBigTank — design engineer, Nigeria') +
    `<defs>
<style>${faceGeist500}
${faceGeist600}
${faceGeistMono500}</style>
<pattern id="g" width="40" height="40" patternUnits="userSpaceOnUse">
<path d="M40 0H0V40" fill="none" stroke="${t.GRID}" stroke-width="1"/>
</pattern>
<clipPath id="c"><rect x="1" y="1" width="1198" height="358" rx="20"/></clipPath>
</defs>
<g clip-path="url(#c)">
<rect width="1200" height="360" fill="${t.BANNER_BG}"/>
<rect width="1200" height="360" fill="url(#g)"/>
</g>
<rect x="1" y="1" width="1198" height="358" rx="20" fill="none" stroke="${t.LINE}" stroke-width="2"/>
<circle cx="64" cy="66" r="7" fill="${ACCENT}"/>
<text x="84" y="74" font-family="Geist Mono" font-weight="500" font-size="22" letter-spacing="2.5" fill="${t.MUTED}">DESIGN ENGINEER · NIGERIA</text>
<text x="1144" y="74" text-anchor="end" font-family="Geist Mono" font-weight="500" font-size="22" letter-spacing="2.5" fill="${t.MUTED}">EST. 2014</text>
<text x="52" y="300" font-family="Geist" font-weight="600" font-size="150" letter-spacing="-6" fill="${t.NAME}">theBigTank<tspan fill="${ACCENT}">.</tspan></text>
</svg>
`
  );
}

write('assets/banner-dark.svg', banner('dark'));
write('assets/banner-light.svg', banner('light'));

/* 1b. Link pills */

function pill({ label, title, width, fill, textFill, stroke }) {
  const rect = stroke
    ? `<rect x="1" y="1" width="${width - 2}" height="42" rx="21" fill="${fill ?? 'none'}" stroke="${stroke}" stroke-width="2"/>`
    : `<rect width="${width}" height="44" rx="22" fill="${fill}"/>`;
  return (
    svgOpen(width, 44, title) +
    `<defs><style>${faceGeist500}</style></defs>
${rect}
<text x="${width / 2}" y="28" text-anchor="middle" font-family="Geist" font-weight="500" font-size="17" fill="${textFill}">${esc(label)}</text>
</svg>
`
  );
}

write(
  'assets/pill-work.svg',
  pill({ label: 'Work with me ↗', title: 'Work with me', width: 171, fill: ACCENT, textFill: '#0f1216' })
);

const pills = [
  { slug: 'youtube', label: 'YouTube', width: 114 },
  { slug: 'x', label: 'X / Twitter', width: 130 },
  { slug: 'prolific', label: 'Prolific Digital', width: 158 },
  { slug: 'raymanthis', label: 'Raymanthis', width: 140 },
];

// One chip per link for both themes: GitHub breaks a <picture> that sits inside a link.
for (const p of pills) {
  write(
    `assets/pill-${p.slug}.svg`,
    pill({ label: p.label, title: p.label, width: p.width, fill: '#24292f', textFill: '#ffffff', stroke: '#3d444d' })
  );
}

/* 1c. Screenshot frames */

const shots = [
  { slug: 'halvenor', file: 'src/shots/halvenor.jpg', height: 1013, title: 'Halvenor Realty home page' },
  { slug: 'halvorsen', file: 'src/shots/halvorsen.jpg', height: 1125, title: 'Halvorsen Pike Constructors home page' },
  { slug: 'brackwater', file: 'src/shots/brackwater.jpg', height: 1125, title: 'Brackwater Civil Group home page' },
];

for (const shot of shots) {
  const data = b64(shot.file);
  const h = shot.height;
  write(
    `assets/shot-${shot.slug}.svg`,
    svgOpen(1800, h, shot.title) +
      `<defs><clipPath id="c"><rect width="1800" height="${h}" rx="28"/></clipPath></defs>
<image href="data:image/jpeg;base64,${data}" width="1800" height="1125" preserveAspectRatio="xMidYMin slice" clip-path="url(#c)"/>
<rect x="1.5" y="1.5" width="1797" height="${h - 3}" rx="27" fill="none" stroke="#3d444d" stroke-width="3"/>
</svg>
`
  );
}

console.log('wrote assets');
