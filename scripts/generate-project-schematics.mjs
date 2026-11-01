// Editable schematic interface drawings. No product records or screen captures.
// Generate SVGs with Node. Capture them in a browser at 1536x1024, then encode:
// node scripts/generate-project-schematics.mjs --rasterize path/to/png-directory
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = new URL('../', import.meta.url);
const sources = new URL('docs/project-schematics/', root);
const images = new URL('public/images/projects/', root);
const rasterDirectory = process.argv[2] === '--rasterize' ? process.argv[3] : undefined;
if (process.argv[2] && !rasterDirectory) {
  throw new Error(
    'Usage: node scripts/generate-project-schematics.mjs [--rasterize png-directory]',
  );
}
mkdirSync(sources, { recursive: true });
const c = {
  ink: '#253b3c',
  muted: '#647b7c',
  line: '#cedbd8',
  paper: '#ffffff',
  canvas: '#eef3f0',
  soft: '#f6f9f7',
  teal: '#216c63',
  pale: '#e2efea',
  bar: '#dce5e2',
  amber: '#a27435',
  sand: '#f6ecd9',
};
const esc = (s) => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;');
const rect = (x, y, w, h, fill = c.paper, stroke = c.line, r = 12) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
const text = (x, y, value, size = 24, fill = c.ink, weight = 400) =>
  `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" font-weight="${weight}">${esc(value)}</text>`;
const line = (x1, y1, x2, y2, color = c.line) =>
  `<path d="M${x1} ${y1}H${x2}" transform="translate(0 ${y2 - y1})" stroke="${color}" stroke-width="2" fill="none"/>`;
const arrow = (x1, y1, x2, y2, color = c.teal) =>
  `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${color}" stroke-width="3" fill="none" marker-end="url(#arrow)"/>`;
const bar = (x, y, w, h = 10, color = c.bar) => rect(x, y, w, h, color, color, h / 2);
const bars = (x, y, widths, gap = 25) => widths.map((w, i) => bar(x, y + i * gap, w)).join('');
const pill = (x, y, w, label, active = false) =>
  rect(x, y, w, 38, active ? c.pale : c.soft, active ? c.teal : c.line, 7) +
  text(x + 14, y + 26, label, 20, active ? c.teal : c.muted, 500);
const button = (x, y, w, label, primary = false) =>
  rect(x, y, w, 48, primary ? c.teal : c.paper, primary ? c.teal : c.line, 7) +
  text(x + 18, y + 31, label, 22, primary ? c.paper : c.ink, 500);
const panel = (x, y, w, h, title) =>
  rect(x, y, w, h) +
  text(x + 24, y + 41, title, 25, c.ink, 600) +
  line(x + 24, y + 62, x + w - 24, y + 62);
const marker = (x, y, index, active) =>
  rect(x, y, 30, 30, active ? c.pale : c.soft, active ? c.teal : c.line, 6) +
  text(x + 9, y + 22, index, 20, active ? c.teal : c.muted, 500);

function shell(title, subtitle, name, nav, active) {
  return (
    rect(0, 0, 1536, 1024, c.canvas, c.canvas, 0) +
    text(64, 69, subtitle.toUpperCase(), 20, c.teal, 600) +
    text(64, 124, title, 42, c.ink, 600) +
    rect(48, 174, 1440, 790, c.paper, c.line, 18) +
    text(78, 221, name, 26, c.ink, 600) +
    text(1230, 220, 'Workspace', 22, c.muted) +
    line(48, 246, 1488, 246) +
    rect(49, 247, 233, 716, c.soft, c.soft, 0) +
    nav
      .map((label, i) => {
        const y = 283 + i * 68;
        return (
          (i === active ? rect(65, y - 5, 200, 51, c.pale, c.pale, 7) : '') +
          marker(78, y + 5, i + 1, i === active) +
          text(122, y + 28, label, 21, i === active ? c.teal : c.muted, i === active ? 600 : 400)
        );
      })
      .join('')
  );
}
const imsNav = ['Dashboard', 'Orders', 'Inventory', 'Reports', 'Automation', 'Assistant'];

function abstractTable(x, y, w, headings, selected = 1, count = 4) {
  const col = w / headings.length;
  let s =
    rect(x, y, w, 42, c.soft, c.soft, 5) +
    headings.map((h, i) => text(x + 14 + i * col, y + 28, h, 20, c.muted, 500)).join('');
  for (let row = 0; row < count; row++) {
    const top = y + 54 + row * 57;
    if (row === selected) s += rect(x, top, w, 47, c.pale, c.pale, 5);
    s += headings
      .map((_, i) =>
        bar(
          x + 15 + i * col,
          top + 18,
          Math.min(col - 32, [104, 76, 92, 65][(row + i) % 4]),
          10,
          row === selected ? '#8bb5a7' : c.bar,
        ),
      )
      .join('');
  }
  return s;
}

const scenes = [
  {
    slug: 'inventory-management',
    title: 'Inventory Management System',
    description:
      'Order, inventory and reporting panels with abstract records and links to IMS modules.',
    draw() {
      let s =
        shell(this.title, 'Marketplace operations', 'IMS', imsNav, 0) +
        text(318, 299, 'Operations workspace', 29, c.ink, 600);
      ['Orders', 'Inventory', 'Reports'].forEach((label, i) => {
        const x = 318 + i * 384;
        s +=
          rect(x, 326, 360, 105, c.soft) +
          text(x + 23, 364, label, 24, c.ink, 500) +
          bars(x + 23, 383, [170, 115], 19);
      });
      return (
        s +
        panel(318, 464, 662, 408, 'Order overview') +
        abstractTable(340, 550, 618, ['Order', 'Channel', 'State']) +
        panel(1022, 464, 434, 408, 'Selected order') +
        text(1046, 565, 'Order & warehouse data', 22, c.muted) +
        bars(1046, 588, [310, 234]) +
        pill(1046, 646, 204, 'Review & fulfillment', true) +
        button(1046, 711, 386, 'Open order automation', true) +
        button(1046, 776, 386, 'Ask knowledge assistant') +
        arrow(981, 684, 1019, 684) +
        text(322, 922, 'Amazon   /   Walmart   /   eBay   /   BestBuy   /   Sears', 21, c.muted)
      );
    },
  },
  {
    slug: 'order-processing',
    title: 'Automated Order Processing',
    description: 'IMS queue and fulfillment stages, with an exception routed for human review.',
    draw() {
      let s =
        shell(this.title, 'IMS / Workflow automation', 'IMS', imsNav, 4) +
        text(318, 299, 'Order automation', 29, c.ink, 600);
      [
        ['Prepare', 'Order data'],
        ['Check rules', 'Restrictions'],
        ['Select carrier', 'Shipping'],
        ['Documents', 'Labels & invoices'],
      ].forEach((labels, i) => {
        const x = 318 + i * 290;
        s +=
          rect(x, 337, 266, 132, i === 1 ? c.sand : c.soft, i === 1 ? '#d2b98c' : c.line) +
          text(x + 20, 376, labels[0], 24, c.ink, 600) +
          text(x + 20, 415, labels[1], 21, c.muted);
        if (i < 3) s += arrow(x + 269, 400, x + 287, 400);
      });
      return (
        s +
        panel(318, 522, 662, 350, 'Processing queue') +
        abstractTable(340, 609, 618, ['Order', 'Rule', 'State'], 1, 3) +
        panel(1022, 522, 434, 350, 'Human review') +
        pill(1046, 608, 185, 'Rule exception', true) +
        text(1046, 678, 'Check restrictions', 22, c.muted) +
        bars(1046, 699, [312, 238]) +
        button(1046, 770, 386, 'Review before continuing', true) +
        arrow(980, 742, 1019, 742) +
        button(318, 895, 315, 'Processing settings') +
        button(660, 895, 315, 'Ask knowledge assistant')
      );
    },
  },
  {
    slug: 'company-knowledge-assistant',
    title: 'Company Knowledge Assistant',
    description: 'Company sources and a chat layout connected through RAG, MCP and Skills.',
    draw() {
      let s =
        shell(this.title, 'IMS / Applied AI', 'IMS', imsNav, 5) +
        text(318, 299, 'Company knowledge assistant', 29, c.ink, 600) +
        panel(318, 345, 365, 521, 'Company sources');
      ['Files', 'Business records', 'Vector knowledge base'].forEach((label, i) => {
        const y = 441 + i * 125;
        s +=
          rect(342, y, 317, 100, c.soft) +
          text(360, y + 36, label, 22, c.ink, 500) +
          bars(360, y + 57, [220, 152], 18);
      });
      return (
        s +
        panel(734, 345, 722, 521, 'Employee chat') +
        rect(953, 439, 477, 100, c.soft) +
        text(977, 474, 'Question', 23, c.ink, 500) +
        bars(977, 495, [370, 285], 19) +
        pill(760, 572, 243, 'RAG + MCP + Skills', true) +
        arrow(684, 591, 731, 591) +
        rect(758, 635, 672, 200, c.pale, '#bbd5c9') +
        text(782, 677, 'Answer', 25, c.ink, 600) +
        bars(782, 702, [570, 520, 386], 24) +
        text(782, 805, 'Sources: files / business records', 21, c.teal, 500) +
        button(734, 895, 309, 'Back to operations')
      );
    },
  },
  {
    slug: 'amazon-ads',
    title: 'Amazon Ads Optimization',
    description:
      'Campaign and keyword panels lead to suggestions and a human decision before applying changes.',
    draw() {
      return (
        shell(
          this.title,
          'AI-assisted decisions',
          'Ads workspace',
          ['Overview', 'Campaigns', 'Keywords', 'Suggestions', 'Reports'],
          3,
        ) +
        text(318, 299, 'Review advertising suggestions', 29, c.ink, 600) +
        panel(318, 345, 662, 521, 'Campaigns & keywords') +
        abstractTable(340, 432, 618, ['Campaign', 'Keyword', 'State'], 1, 3) +
        text(342, 711, 'Advertising data', 23, c.ink, 500) +
        ['Spend', 'Sales', 'ACoS', 'ROAS']
          .map((label, i) => {
            const x = 342 + i * 153;
            return (
              rect(x, 737, 138, 99, c.soft) +
              text(x + 14, 771, label, 21, c.muted) +
              bar(x + 15, 794, 82, 11)
            );
          })
          .join('') +
        panel(1022, 345, 434, 521, 'Suggestion review') +
        pill(1046, 437, 186, 'AI suggestion', true) +
        text(1046, 514, 'Keywords / bids / negatives', 22, c.muted) +
        bars(1046, 543, [320, 271, 189], 26) +
        text(1046, 657, 'Human decision', 23, c.ink, 600) +
        button(1046, 685, 123, 'Approve', true) +
        button(1180, 685, 118, 'Adjust') +
        button(1309, 685, 123, 'Reject') +
        arrow(1238, 747, 1238, 778) +
        pill(1046, 797, 386, 'Apply approved changes', true) +
        arrow(981, 566, 1019, 566) +
        text(322, 922, 'Amazon Ads API   /   Helium10   /   AI research', 21, c.muted)
      );
    },
  },
  {
    slug: 'product-content-creation',
    title: 'Product Content Creation',
    description:
      'An abstract catalog, marketplace states, product statistics and editable content fields.',
    draw() {
      let s =
        shell(
          this.title,
          'AI / Marketplace content',
          'Content workspace',
          ['Catalog', 'Content studio', 'Statistics', 'Exports'],
          0,
        ) +
        text(318, 299, 'Catalog & marketplace content', 29, c.ink, 600) +
        panel(318, 345, 662, 331, 'Shared product catalog') +
        abstractTable(340, 432, 618, ['Product', 'Channel', 'Content'], 0, 3) +
        panel(318, 708, 662, 158, 'Product statistics');
      [122, 88, 149, 107].forEach((width, i) => {
        s += bar(343 + i * 153, 810, width, 16, i === 2 ? '#9cc4b5' : c.bar);
      });
      return (
        s +
        panel(1022, 345, 434, 521, 'Channel content') +
        pill(1046, 431, 386, 'Choose marketplace', true) +
        text(1046, 509, 'Title', 22, c.ink, 500) +
        bar(1046, 530, 324) +
        text(1046, 581, 'Key features', 22, c.ink, 500) +
        bars(1046, 603, [312, 270], 23) +
        text(1046, 677, 'Description', 22, c.ink, 500) +
        bars(1046, 697, [320, 283], 23) +
        button(1046, 783, 179, 'Review', true) +
        arrow(1234, 807, 1263, 807) +
        button(1273, 783, 159, 'Export') +
        arrow(981, 510, 1019, 510) +
        text(322, 922, 'Amazon   /   Walmart   /   BestBuy   /   Sears   /   eBay', 21, c.muted)
      );
    },
  },
];

for (const scene of scenes) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1536" height="1024" viewBox="0 0 1536 1024" role="img" aria-labelledby="title desc">
<title id="title">${esc(scene.title)}</title><desc id="desc">${esc(scene.description)}</desc>
<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M1 1L9 5L1 9" fill="none" stroke="${c.teal}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></marker></defs>
<g font-family="Helvetica, Arial, sans-serif">${scene.draw()}</g></svg>\n`;
  const source = new URL(scene.slug + '.svg', sources);
  writeFileSync(source, svg);
  for (const width of rasterDirectory ? [1536, 1024, 768] : []) {
    const output = new URL(scene.slug + (width === 1536 ? '' : '-' + width) + '.webp', images);
    const result = spawnSync(
      'magick',
      [
        resolve(rasterDirectory, scene.slug + '.png'),
        '-resize',
        String(width),
        '-quality',
        '92',
        fileURLToPath(output),
      ],
      { encoding: 'utf8' },
    );
    if (result.error || result.status !== 0)
      throw new Error(result.error?.message || result.stderr);
  }
  console.log((rasterDirectory ? 'Encoded schematic: ' : 'Generated SVG: ') + scene.slug);
}
