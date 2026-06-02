/**
 * Biljetter — Component Sheet
 * Plugins → Development → Open Console → paste → Enter
 */
(async () => {

// ─── PAGE ────────────────────────────────────────────────────────────────────
const page = figma.root.children.find(p => p.name.includes('UI'));
if (!page) { console.error('UI page not found'); return; }
await figma.setCurrentPageAsync(page);
console.log('on page:', page.name);

// ─── FONTS ───────────────────────────────────────────────────────────────────
const fonts = await figma.listAvailableFontsAsync();
const pick  = (fam, ...opts) => opts.find(s => fonts.some(f => f.fontName.family === fam && f.fontName.style === s)) ?? null;

const M       = 'Montserrat';
const MR      = pick(M, 'Regular');
const MS      = pick(M, 'SemiBold', 'Semi Bold', 'Bold');
const MB      = pick(M, 'Bold', 'SemiBold', 'Semi Bold');
const CF      = fonts.some(f => f.fontName.family === 'Cormorant Garamond') ? 'Cormorant Garamond' : 'Cormorant';
const CR      = pick(CF, 'Regular', 'Light');

const needed  = [...new Set([[M,MR],[M,MS],[M,MB],[CF,CR]].filter(([,s])=>s).map(p=>JSON.stringify({family:p[0],style:p[1]})))];
await Promise.all(needed.map(f => figma.loadFontAsync(JSON.parse(f))));
console.log('fonts ok  MR=%s MS=%s MB=%s CF=%s CR=%s', MR, MS, MB, CF, CR);

// ─── VARIABLES ───────────────────────────────────────────────────────────────
const localVars = await figma.variables.getLocalVariablesAsync();
const V = Object.fromEntries(localVars.map(v => [v.name, v]));

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const h2rgb = h => { const n=parseInt(h.replace('#',''),16); return {r:((n>>16)&255)/255,g:((n>>8)&255)/255,b:(n&255)/255}; };
const fill  = hex  => [{ type:'SOLID', color: h2rgb(hex) }];
const NONE  = [];

function bindFill(node, varName) {
  const v = V[varName]; if (!v) return;
  node.fills = [figma.variables.setBoundVariableForPaint({type:'SOLID',color:{r:0,g:0,b:0}},'color',v)];
}

function T(str, fam, sty, sz, hex, opts={}) {
  const t = figma.createText();
  t.fontName = { family:fam, style:sty };
  t.fontSize = sz;
  t.characters = str;
  t.fills = fill(hex);
  if (opts.upper)    t.textCase = 'UPPER';
  if (opts.tracking) t.letterSpacing = { value:opts.tracking, unit:'PERCENT' };
  return t;
}

// Auto-layout frame — does NOT append to parent; call parent.appendChild() yourself
function AL(dir='H', gap=0, pad=[0,0,0,0]) {
  const f = figma.createFrame();
  f.layoutMode          = dir==='H' ? 'HORIZONTAL' : 'VERTICAL';
  f.primaryAxisSizingMode   = 'AUTO';
  f.counterAxisSizingMode   = 'AUTO';
  f.itemSpacing         = gap;
  f.paddingTop    = pad[0]; f.paddingRight = pad[1];
  f.paddingBottom = pad[2]; f.paddingLeft  = pad[3];
  f.fills = NONE;
  return f;
}

// ─── FIND CLEAR CANVAS POSITION ──────────────────────────────────────────────
let right = 0;
for (const c of page.children) {
  if ('x' in c) right = Math.max(right, c.x + (c.width||0));
}
const OX = right + 200;   // origin X
let   OY = -2400;          // origin Y (track as we add rows)

const SECTION_GAP = 72;
const ITEM_GAP    = 20;

const allNew = [];  // collect everything for viewport zoom

// ─── SECTION LABEL ────────────────────────────────────────────────────────────
function label(text) {
  const t = T(text, M, MB, 10, '#9E9E9E', { upper:true, tracking:8 });
  t.x = OX; t.y = OY;
  page.appendChild(t);
  allNew.push(t);
  OY += t.height + 14;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1  BUTTON
// ─────────────────────────────────────────────────────────────────────────────
label('Button');
{
  function btn(name, bgHex, txtHex, strokeHex) {
    const c = figma.createComponent();
    c.name = name;
    c.layoutMode = 'HORIZONTAL';
    c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'AUTO';
    c.paddingTop=10; c.paddingBottom=10; c.paddingLeft=20; c.paddingRight=20;
    c.primaryAxisAlignItems = 'CENTER'; c.counterAxisAlignItems = 'CENTER';
    c.fills = bgHex ? fill(bgHex) : NONE;
    if (strokeHex) { c.strokes=[{type:'SOLID',color:h2rgb(strokeHex)}]; c.strokeWeight=1; c.strokeAlign='INSIDE'; }
    c.appendChild(T('Biljetter', M, MS, 12, txtHex, { upper:true, tracking:5 }));
    return c;
  }

  const primary  = btn('Button/Primary',  '#E8735B', '#FFFFFF', null);
  const outlined = btn('Button/Outlined', null,       '#1A1A2E', '#1A1A2E');
  bindFill(primary, 'color/accent');

  primary.x  = OX;                          primary.y  = OY;
  outlined.x = OX + primary.width + ITEM_GAP; outlined.y = OY;
  page.appendChild(primary);  allNew.push(primary);
  page.appendChild(outlined); allNew.push(outlined);

  OY += Math.max(primary.height, outlined.height) + SECTION_GAP;
  console.log('✓ Button');
}

// ─────────────────────────────────────────────────────────────────────────────
// 2  TAG / CHIP
// ─────────────────────────────────────────────────────────────────────────────
label('Tag / Chip');
{
  function tag(name, txt, bgHex, txtHex, strokeHex) {
    const c = figma.createComponent();
    c.name = name;
    c.layoutMode = 'HORIZONTAL';
    c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'AUTO';
    c.paddingTop=6; c.paddingBottom=6; c.paddingLeft=14; c.paddingRight=14;
    c.primaryAxisAlignItems = 'CENTER'; c.counterAxisAlignItems = 'CENTER';
    c.cornerRadius = 9999;
    c.fills = bgHex ? fill(bgHex) : NONE;
    if (strokeHex) { c.strokes=[{type:'SOLID',color:h2rgb(strokeHex)}]; c.strokeWeight=1; c.strokeAlign='INSIDE'; }
    c.appendChild(T(txt, M, MR, 12, txtHex));
    return c;
  }

  const tags = [
    tag('Tag/Default', 'Best band', null,      '#1A1A2E', '#D4D4D4'),
    tag('Tag/Active',  'Genre',     '#1A1A2E', '#FFFFFF',  null),
    tag('Tag/Accent',  'Rock',      '#E8735B', '#FFFFFF',  null),
  ];

  let x = OX;
  for (const t of tags) {
    t.x = x; t.y = OY;
    page.appendChild(t); allNew.push(t);
    x += t.width + ITEM_GAP;
  }
  OY += tags[0].height + SECTION_GAP;
  console.log('✓ Tag/Chip');
}

// ─────────────────────────────────────────────────────────────────────────────
// 3  FILTER DROPDOWN
// ─────────────────────────────────────────────────────────────────────────────
label('Filter Dropdown');
{
  const d = figma.createComponent();
  d.name = 'FilterDropdown';
  d.layoutMode = 'HORIZONTAL';
  d.primaryAxisAlignItems = 'SPACE_BETWEEN';
  d.counterAxisAlignItems = 'CENTER';
  d.paddingTop=10; d.paddingBottom=10; d.paddingLeft=14; d.paddingRight=14;
  d.fills = fill('#FFFFFF');
  d.strokes=[{type:'SOLID',color:h2rgb('#D4D4D4')}]; d.strokeWeight=1; d.strokeAlign='INSIDE';
  // resize FIRST, then lock sizing
  d.resize(180, 40);
  d.primaryAxisSizingMode = 'FIXED';
  d.counterAxisSizingMode = 'AUTO';
  d.appendChild(T('All musik', M, MR, 13, '#1A1A2E'));
  d.appendChild(T('∨',         M, MR, 10, '#9E9E9E'));

  d.x = OX; d.y = OY;
  page.appendChild(d); allNew.push(d);
  OY += d.height + SECTION_GAP;
  console.log('✓ FilterDropdown');
}

// ─────────────────────────────────────────────────────────────────────────────
// 4  VIEW TOGGLE
// ─────────────────────────────────────────────────────────────────────────────
label('View Toggle');
{
  const defs = [
    { name:'Toggle/List',     char:'≡', active:false },
    { name:'Toggle/Calendar', char:'▦', active:true  },
    { name:'Toggle/Grid',     char:'⊞', active:false },
  ];

  let x = OX;
  for (const { name, char, active } of defs) {
    const c = figma.createComponent();
    c.name = name;
    c.resize(40, 40);
    c.layoutMode = 'HORIZONTAL';
    c.primaryAxisAlignItems = 'CENTER'; c.counterAxisAlignItems = 'CENTER';
    c.fills = active ? fill('#E8735B') : fill('#FFFFFF');
    c.strokes=[{type:'SOLID',color:h2rgb('#D4D4D4')}]; c.strokeWeight=1; c.strokeAlign='INSIDE';
    if (active) bindFill(c, 'color/accent');
    c.appendChild(T(char, M, MR, 15, active ? '#FFFFFF' : '#1A1A2E'));
    c.x = x; c.y = OY;
    page.appendChild(c); allNew.push(c);
    x += 40;
  }
  OY += 40 + SECTION_GAP;
  console.log('✓ ViewToggle');
}

// ─────────────────────────────────────────────────────────────────────────────
// 5  CALENDAR EVENT ITEM
// ─────────────────────────────────────────────────────────────────────────────
label('Calendar Event Item');
{
  const c = figma.createComponent();
  c.name = 'CalendarEventItem';
  c.layoutMode = 'VERTICAL'; c.itemSpacing = 2;
  c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'AUTO';
  c.fills = NONE;
  c.appendChild(T('Front 242',     M, MS, 13, '#1A1A2E'));
  c.appendChild(T('Pustervik',     M, MR, 12, '#9E9E9E'));
  c.appendChild(T('19:00 – 21:00', M, MR, 12, '#9E9E9E'));
  c.x = OX; c.y = OY;
  page.appendChild(c); allNew.push(c);
  OY += c.height + SECTION_GAP;
  console.log('✓ CalendarEventItem');
}

// ─────────────────────────────────────────────────────────────────────────────
// 6  EVENT CARD
// ─────────────────────────────────────────────────────────────────────────────
label('Event Card');
{
  const CARD_W = 820, CARD_H = 160, PHOTO_W = 148;

  const card = figma.createComponent();
  card.name = 'EventCard';
  card.layoutMode = 'HORIZONTAL'; card.itemSpacing = 0;
  card.fills = fill('#FFFFFF'); card.clipsContent = true;
  // resize THEN lock
  card.resize(CARD_W, CARD_H);
  card.primaryAxisSizingMode = 'FIXED'; card.counterAxisSizingMode = 'FIXED';

  // Photo (left slab)
  const photo = figma.createRectangle();
  photo.name = 'Photo'; photo.resize(PHOTO_W, CARD_H); photo.fills = fill('#D4D4D4');
  card.appendChild(photo);
  photo.layoutSizingVertical = 'FILL';   // ← after appendChild

  // Content column
  const col = figma.createFrame();
  col.name = 'Content'; col.layoutMode = 'VERTICAL'; col.itemSpacing = 6;
  col.paddingTop=16; col.paddingBottom=16; col.paddingLeft=20; col.paddingRight=20;
  col.primaryAxisAlignItems = 'MIN'; col.counterAxisAlignItems = 'MIN';
  col.fills = NONE;
  card.appendChild(col);
  col.layoutSizingHorizontal = 'FILL';   // ← after appendChild
  col.layoutSizingVertical   = 'FILL';

  // Artist name
  const name_ = CR ? T('Haruomi Hosono', CF, CR, 22, '#1A1A2E') : T('Haruomi Hosono', M, MB, 16, '#1A1A2E');
  col.appendChild(name_);

  // Listeners row
  const lisRow = AL('H', 6);
  lisRow.counterAxisAlignItems = 'CENTER';
  lisRow.appendChild(T('144,087',             M, MS, 12, '#1A1A2E'));
  lisRow.appendChild(T('Lyssnare per månad',  M, MR, 12, '#9E9E9E'));
  col.appendChild(lisRow);

  // Spotify
  col.appendChild(T('♫  Lyssna med Spotify', M, MR, 12, '#1DB954'));

  // Bottom row: meta + button
  const bot = figma.createFrame();
  bot.name = 'BottomRow'; bot.layoutMode = 'HORIZONTAL';
  bot.primaryAxisAlignItems = 'SPACE_BETWEEN'; bot.counterAxisAlignItems = 'CENTER';
  bot.primaryAxisSizingMode = 'FIXED'; bot.counterAxisSizingMode = 'AUTO';
  bot.fills = NONE;
  col.appendChild(bot);
  bot.layoutSizingHorizontal = 'FILL';  // ← after appendChild

  // meta left
  const meta = AL('H', 12);
  meta.counterAxisAlignItems = 'CENTER';
  meta.appendChild(T('20:00 – 23:00', M, MR, 13, '#1A1A2E'));
  meta.appendChild(T('Nefertiti',     M, MR, 13, '#9E9E9E'));
  bot.appendChild(meta);

  // Biljetter button (outlined)
  const bBtn = AL('H', 0, [7, 14, 7, 14]);
  bBtn.primaryAxisAlignItems = 'CENTER'; bBtn.counterAxisAlignItems = 'CENTER';
  bBtn.strokes=[{type:'SOLID',color:h2rgb('#1A1A2E')}]; bBtn.strokeWeight=1; bBtn.strokeAlign='INSIDE';
  bBtn.appendChild(T('Biljetter', M, MS, 11, '#1A1A2E', { upper:true, tracking:5 }));
  bot.appendChild(bBtn);

  card.x = OX; card.y = OY;
  page.appendChild(card); allNew.push(card);
  OY += CARD_H + SECTION_GAP;
  console.log('✓ EventCard');
}

// ─── WRAP IN BACKGROUND FRAME ─────────────────────────────────────────────────
// Build a background plate around all components (purely cosmetic)
const PADDING = 48;
let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
for (const n of allNew) {
  minX = Math.min(minX, n.x); minY = Math.min(minY, n.y);
  maxX = Math.max(maxX, n.x + n.width); maxY = Math.max(maxY, n.y + n.height);
}
const bg = figma.createFrame();
bg.name = 'Komponenter';
bg.x = minX - PADDING; bg.y = minY - PADDING;
bg.resize(maxX - minX + PADDING*2, maxY - minY + PADDING*2);
bg.fills = fill('#F5F3EE');
bg.cornerRadius = 8;
page.insertChild(page.children.indexOf(allNew[0]), bg); // insert BEHIND components

// ─── DONE ────────────────────────────────────────────────────────────────────
figma.viewport.scrollAndZoomIntoView([bg, ...allNew]);

console.log('✅ Done —', allNew.length, 'nodes, background plate added');
return { components: allNew.map(n => n.name) };

})();
