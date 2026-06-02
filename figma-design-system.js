/**
 * Biljetter Design System Setup
 * Run in Figma: Plugins → Development → Open Console → paste & run
 *
 * Creates:
 *  - Variable collection "Design Tokens / Colours" (primitives + semantics)
 *  - Variable collection "Design Tokens / Spacing"
 *  - Variable collection "Design Tokens / Radius"
 *  - Text styles (Display, Heading, Body, Label, Caption)
 */

(async () => {

// ─── Helper: hex to Figma RGB (0-1 range) ──────────────────────────────────
function hex(h) {
  const n = parseInt(h.replace('#', ''), 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255, a: 1 };
}

// ─── 1. COLOUR VARIABLES ───────────────────────────────────────────────────

const colourCollection = figma.variables.createVariableCollection("Design Tokens / Colours");
colourCollection.renameMode(colourCollection.modes[0].modeId, "Default");
const colorMode = colourCollection.modes[0].modeId;

// Primitives
const primitives = [
  // name,                  hex,       scopes
  ["cream/50",              "#F5F3EE", ["FRAME_FILL", "SHAPE_FILL"]],
  ["cream/100",             "#EDE9E0", ["FRAME_FILL", "SHAPE_FILL"]],
  ["navy/900",              "#1A1A2E", ["TEXT_FILL", "FRAME_FILL", "SHAPE_FILL"]],
  ["navy/700",              "#2C2C3E", ["TEXT_FILL", "FRAME_FILL", "SHAPE_FILL"]],
  ["coral/400",             "#E8735B", ["TEXT_FILL", "FRAME_FILL", "SHAPE_FILL", "STROKE_COLOR"]],
  ["coral/50",              "#FFF5F2", ["FRAME_FILL", "SHAPE_FILL"]],
  ["coral/600",             "#C95A43", ["TEXT_FILL", "FRAME_FILL", "SHAPE_FILL", "STROKE_COLOR"]],
  ["gray/500",              "#9E9E9E", ["TEXT_FILL", "FRAME_FILL", "SHAPE_FILL"]],
  ["gray/200",              "#D4D4D4", ["FRAME_FILL", "SHAPE_FILL", "STROKE_COLOR"]],
  ["gray/50",               "#FAFAFA", ["FRAME_FILL", "SHAPE_FILL"]],
  ["white",                 "#FFFFFF", ["FRAME_FILL", "SHAPE_FILL"]],
];

const primVars = {};
for (const [name, hexVal, scopes] of primitives) {
  const v = figma.variables.createVariable(name, colourCollection, "COLOR");
  v.setValueForMode(colorMode, hex(hexVal));
  v.scopes = scopes;
  v.setVariableCodeSyntax("WEB", `var(--color-${name.replace(/\//g, '-').toLowerCase()})`);
  primVars[name] = v;
}

// Semantic tokens (alias primitives)
const semantics = [
  // name,                      primitive,        scopes
  ["color/background",          "cream/50",       ["FRAME_FILL", "SHAPE_FILL"]],
  ["color/surface",             "white",          ["FRAME_FILL", "SHAPE_FILL"]],
  ["color/surface-dim",         "gray/50",        ["FRAME_FILL", "SHAPE_FILL"]],
  ["color/foreground",          "navy/900",       ["TEXT_FILL"]],
  ["color/foreground-muted",    "gray/500",       ["TEXT_FILL"]],
  ["color/border",              "gray/200",       ["STROKE_COLOR", "FRAME_FILL", "SHAPE_FILL"]],
  ["color/accent",              "coral/400",      ["TEXT_FILL", "FRAME_FILL", "SHAPE_FILL", "STROKE_COLOR"]],
  ["color/accent-subtle",       "coral/50",       ["FRAME_FILL", "SHAPE_FILL"]],
  ["color/accent-strong",       "coral/600",      ["TEXT_FILL", "FRAME_FILL", "SHAPE_FILL", "STROKE_COLOR"]],
];

for (const [name, primName, scopes] of semantics) {
  const v = figma.variables.createVariable(name, colourCollection, "COLOR");
  v.setValueForMode(colorMode, { type: "VARIABLE_ALIAS", id: primVars[primName].id });
  v.scopes = scopes;
  const cssName = name.replace(/\//g, '-').replace(/\s+/g, '-').toLowerCase();
  v.setVariableCodeSyntax("WEB", `var(--${cssName})`);
}

// ─── 2. SPACING VARIABLES ──────────────────────────────────────────────────

const spacingCollection = figma.variables.createVariableCollection("Design Tokens / Spacing");
spacingCollection.renameMode(spacingCollection.modes[0].modeId, "Default");
const spacingMode = spacingCollection.modes[0].modeId;

const spacingTokens = [
  ["space/1",  4],
  ["space/2",  8],
  ["space/3",  12],
  ["space/4",  16],
  ["space/5",  20],
  ["space/6",  24],
  ["space/8",  32],
  ["space/10", 40],
  ["space/12", 48],
  ["space/16", 64],
];

for (const [name, value] of spacingTokens) {
  const v = figma.variables.createVariable(name, spacingCollection, "FLOAT");
  v.setValueForMode(spacingMode, value);
  v.scopes = ["GAP", "WIDTH_HEIGHT"];
  v.setVariableCodeSyntax("WEB", `var(--${name.replace(/\//g, '-')})`);
}

// ─── 3. RADIUS VARIABLES ───────────────────────────────────────────────────

const radiusCollection = figma.variables.createVariableCollection("Design Tokens / Radius");
radiusCollection.renameMode(radiusCollection.modes[0].modeId, "Default");
const radiusMode = radiusCollection.modes[0].modeId;

const radiusTokens = [
  ["radius/none", 0],
  ["radius/sm",   2],
  ["radius/md",   4],
  ["radius/lg",   8],
  ["radius/xl",   16],
  ["radius/full", 9999],
];

for (const [name, value] of radiusTokens) {
  const v = figma.variables.createVariable(name, radiusCollection, "FLOAT");
  v.setValueForMode(radiusMode, value);
  v.scopes = ["CORNER_RADIUS"];
  v.setVariableCodeSyntax("WEB", `var(--${name.replace(/\//g, '-')})`);
}

// ─── 4. TEXT STYLES ────────────────────────────────────────────────────────
// NOTE: Font styles are auto-detected below — if Cormorant or Montserrat
// aren't available in your Figma plan, swap for installed equivalents.

const allFonts = await figma.listAvailableFontsAsync();

function hasFont(family, style) {
  return allFonts.some(f => f.fontName.family === family && f.fontName.style === style);
}

// Resolve best available style
function resolveStyle(family, preferred, fallback) {
  return hasFont(family, preferred) ? preferred : (hasFont(family, fallback) ? fallback : null);
}

const cormorantRegular   = resolveStyle("Cormorant", "Regular", "Light");
const cormorantGaramond  = hasFont("Cormorant Garamond", "Regular") ? "Cormorant Garamond" : "Cormorant";
const montserratReg      = resolveStyle("Montserrat", "Regular", "Regular");
const montserratMed      = resolveStyle("Montserrat", "Medium", "Regular");
const montserratSemiBold = resolveStyle("Montserrat", "SemiBold", "Semi Bold") || resolveStyle("Montserrat", "Semi Bold", "Medium");
const montserratBold     = resolveStyle("Montserrat", "Bold", "SemiBold");

// Collect unique fonts to load
const fontsToLoad = new Set();
if (cormorantRegular)   fontsToLoad.add(JSON.stringify({ family: cormorantGaramond, style: cormorantRegular }));
if (montserratReg)      fontsToLoad.add(JSON.stringify({ family: "Montserrat", style: montserratReg }));
if (montserratMed)      fontsToLoad.add(JSON.stringify({ family: "Montserrat", style: montserratMed }));
if (montserratSemiBold) fontsToLoad.add(JSON.stringify({ family: "Montserrat", style: montserratSemiBold }));
if (montserratBold)     fontsToLoad.add(JSON.stringify({ family: "Montserrat", style: montserratBold }));

await Promise.all([...fontsToLoad].map(f => figma.loadFontAsync(JSON.parse(f))));

// [name, family, style, size_px, lineHeight]
const textStyleDefs = [
  ["Display/Large",    cormorantGaramond, cormorantRegular,   64, { unit: "PIXELS", value: 70 }],
  ["Display/Medium",   cormorantGaramond, cormorantRegular,   48, { unit: "PIXELS", value: 54 }],
  ["Display/Small",    cormorantGaramond, cormorantRegular,   36, { unit: "PIXELS", value: 42 }],
  ["Heading/Large",    "Montserrat",      montserratBold,     24, { unit: "PIXELS", value: 32 }],
  ["Heading/Medium",   "Montserrat",      montserratBold,     18, { unit: "PIXELS", value: 24 }],
  ["Heading/Small",    "Montserrat",      montserratSemiBold, 15, { unit: "PIXELS", value: 20 }],
  ["Body/Default",     "Montserrat",      montserratReg,      14, { unit: "AUTO" }],
  ["Body/Small",       "Montserrat",      montserratReg,      12, { unit: "AUTO" }],
  ["Label/Default",    "Montserrat",      montserratSemiBold, 11, { unit: "AUTO" }],
  ["Caption",          "Montserrat",      montserratReg,      10, { unit: "AUTO" }],
];

const existing = new Set((await figma.getLocalTextStylesAsync()).map(s => s.name));
const createdStyles = [];
const skippedStyles = [];

for (const [name, family, style, size, lineHeight] of textStyleDefs) {
  if (!style) { skippedStyles.push(`${name} (font not found)`); continue; }
  if (existing.has(name)) { skippedStyles.push(`${name} (already exists)`); continue; }
  const ts = figma.createTextStyle();
  ts.name = name;
  ts.fontName = { family, style };
  ts.fontSize = size;
  ts.lineHeight = lineHeight;
  if (name.startsWith("Label")) {
    ts.textCase = "UPPER";
    ts.letterSpacing = { value: 5, unit: "PERCENT" };
  }
  createdStyles.push(name);
}

// ─── 5. EFFECT STYLES (shadows) ────────────────────────────────────────────

const shadows = [
  { name: "Shadow/Subtle",  color: { r: 0, g: 0, b: 0, a: 0.06 }, y: 2,  r: 8,  spread: 0 },
  { name: "Shadow/Default", color: { r: 0, g: 0, b: 0, a: 0.10 }, y: 4,  r: 16, spread: 0 },
  { name: "Shadow/Strong",  color: { r: 0, g: 0, b: 0, a: 0.16 }, y: 8,  r: 24, spread: 0 },
];

const existingShadows = new Set((await figma.getLocalEffectStylesAsync()).map(s => s.name));
const createdShadows = [];

for (const { name, color, y, r, spread } of shadows) {
  if (existingShadows.has(name)) continue;
  const s = figma.createEffectStyle();
  s.name = name;
  s.effects = [{ type: "DROP_SHADOW", color, offset: { x: 0, y }, radius: r, spread, visible: true, blendMode: "NORMAL" }];
  createdShadows.push(name);
}

console.log("✅ Design system created:", {
  colourVariables: primitives.length + semantics.length,
  spacingVariables: spacingTokens.length,
  radiusVariables: radiusTokens.length,
  textStyles: createdStyles,
  skippedStyles,
  effectStyles: createdShadows,
});

})();
