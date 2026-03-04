// MCP Trigger HTTP — Drawer Ideal v3
// Posicionamento absoluto — sem auto-sizing aninhado

const purple      = { r: 0.557, g: 0.235, b: 0.796 };
const purpleDark  = { r: 0.38, g: 0.14, b: 0.58 };
const purpleLight = { r: 0.95, g: 0.91, b: 0.99 };
const white       = { r: 1, g: 1, b: 1 };
const black       = { r: 0.12, g: 0.12, b: 0.12 };
const gray500     = { r: 0.43, g: 0.43, b: 0.43 };
const gray300     = { r: 0.70, g: 0.70, b: 0.70 };
const gray200     = { r: 0.88, g: 0.88, b: 0.88 };
const gray100     = { r: 0.96, g: 0.96, b: 0.96 };
const green       = { r: 0.13, g: 0.55, b: 0.27 };
const greenLight  = { r: 0.90, g: 0.97, b: 0.92 };
const orange      = { r: 0.80, g: 0.45, b: 0.0 };
const orangeLight = { r: 0.99, g: 0.95, b: 0.88 };

await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
await figma.loadFontAsync({ family: 'Inter', style: 'Medium' });
await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });
await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });

const W = 400;
const PAD = 16;
const IW = W - PAD * 2; // inner width = 368

// ── primitivos ────────────────────────────────────────────

function tx(str, size, color, weight = 'Regular') {
  const t = figma.createText();
  t.fontName = { family: 'Inter', style: weight };
  t.characters = String(str);
  t.fontSize = size;
  t.fills = [{ type: 'SOLID', color }];
  return t;
}

function makeFrame(w, h, fill, name = '') {
  const f = figma.createFrame();
  if (name) f.name = name;
  f.resize(w, h);
  f.fills = fill ? [{ type: 'SOLID', color: fill }] : [];
  f.clipsContent = false;
  return f;
}

function input(val, placeholder, w, h = 34) {
  const f = makeFrame(w, h, white, 'Input');
  f.layoutMode = 'HORIZONTAL';
  f.counterAxisAlignItems = 'CENTER';
  f.paddingLeft = 12; f.paddingRight = 12;
  f.strokes = [{ type: 'SOLID', color: gray200 }];
  f.strokeWeight = 1; f.cornerRadius = 6;
  f.primaryAxisSizingMode = 'FIXED';
  f.counterAxisSizingMode = 'FIXED';
  f.clipsContent = true;
  f.appendChild(tx(val || placeholder, 13, val ? black : gray300));
  return f;
}

function dropdown(val, w, h = 34) {
  const f = makeFrame(w, h, white, 'Dropdown');
  f.layoutMode = 'HORIZONTAL';
  f.primaryAxisAlignItems = 'SPACE_BETWEEN';
  f.counterAxisAlignItems = 'CENTER';
  f.paddingLeft = 12; f.paddingRight = 10;
  f.strokes = [{ type: 'SOLID', color: gray200 }];
  f.strokeWeight = 1; f.cornerRadius = 6;
  f.primaryAxisSizingMode = 'FIXED';
  f.counterAxisSizingMode = 'FIXED';
  f.clipsContent = true;
  f.appendChild(tx(val, 13, black));
  f.appendChild(tx('⌄', 13, gray500));
  return f;
}

function chip(label, active) {
  const f = figma.createFrame();
  f.name = `Chip — ${label}`;
  f.layoutMode = 'HORIZONTAL';
  f.counterAxisAlignItems = 'CENTER';
  f.paddingLeft = 12; f.paddingRight = 12;
  f.paddingTop = 5; f.paddingBottom = 5;
  f.cornerRadius = 20;
  f.primaryAxisSizingMode = 'AUTO';
  f.counterAxisSizingMode = 'AUTO';
  f.fills = [{ type: 'SOLID', color: active ? purpleLight : gray100 }];
  f.strokes = [{ type: 'SOLID', color: active ? purple : gray200 }];
  f.strokeWeight = 1;
  f.appendChild(tx(label, 12, active ? purple : gray500, active ? 'Medium' : 'Regular'));
  return f;
}

// Adiciona elemento num frame pai em posição y, retorna bottom y
function place(parent, child, x, y) {
  parent.appendChild(child);
  child.x = x; child.y = y;
  return y + child.height;
}

// Label de seção
function sectionLbl(parent, label, action, y) {
  const lbl = tx(label.toUpperCase(), 10, gray500, 'Semi Bold');
  place(parent, lbl, PAD, y);
  if (action) {
    const act = tx(action, 11, purple, 'Medium');
    place(parent, act, W - PAD - act.width, y);
  }
  return y + 16;
}

// Label de campo
function fieldLbl(parent, label, x, y) {
  const l = tx(label, 12, gray500, 'Medium');
  place(parent, l, x, y);
  return y + l.height + 5;
}

// Linha divisória
function divLine(parent, y) {
  const r = figma.createRectangle();
  r.resize(IW, 1);
  r.fills = [{ type: 'SOLID', color: gray200 }];
  r.name = 'Divider';
  place(parent, r, PAD, y);
  return y + 1;
}

// ── CALCULAR ALTURA TOTAL ─────────────────────────────────

// Header:        60
// Body start:    20 (paddingTop)
// S1 Basic:      16 (title) + 8 + 60 (row name+ver) = 84
// gap:           20
// Divider:        1
// gap:           20
// S2 Tools:      16 (title) + 10 + card
//   card:        14 (pad) + 18 (fn) + 8 + 34 (input) + 12 + 18 (fd label) + 8 + 34 (input) + 12 + 1 (div) + 12 + 16 (ph) + 8 + 14 (col h) + 8 + 32 + 8 + 32 (proprows) + 12 + 1 (div) + 12 + 14 (req h) + 8 + 26 (chips) + 14 (pad)
//   = 14+18+8+34+12+18+8+34+12+1+12+16+8+14+8+32+8+32+12+1+12+14+8+26+14 = 366
//   card total = 366
// S2 total = 16+10+366 = 392
// gap: 20
// Divider: 1
// gap: 20
// S3 Auth: 16 + 8 + 20 (radios) + 10 + 18 (warning) = 72
// gap: 20
// Divider: 1
// gap: 20
// S4 Endpoint: 16 + 12 + (16+6+34) + 12 + (16+6+34) + 12 + 16 = 180
// Body end: 20 (paddingBottom)
// Footer: 60

// Total ≈ 60 + 20 + 84 + 20 + 1 + 20 + 392 + 20 + 1 + 20 + 72 + 20 + 1 + 20 + 180 + 20 + 60 = 1011

const TOTAL_H = 1020;

const drawer = makeFrame(W, TOTAL_H, white, 'MCP Trigger HTTP — Ideal');
drawer.cornerRadius = 10;
drawer.clipsContent = false;
drawer.effects = [{
  type: 'DROP_SHADOW',
  color: { r: 0, g: 0, b: 0, a: 0.18 },
  offset: { x: 0, y: 8 }, radius: 32, spread: 0,
  visible: true, blendMode: 'NORMAL'
}];

// ── HEADER ────────────────────────────────────────────────
{
  const hdr = makeFrame(W, 60, null, 'Header');
  hdr.fills = [{ type: 'SOLID', color: purple }];

  // icon
  const icon = makeFrame(32, 32, purpleDark, 'Icon');
  icon.cornerRadius = 8;
  icon.layoutMode = 'HORIZONTAL';
  icon.primaryAxisAlignItems = 'CENTER';
  icon.counterAxisAlignItems = 'CENTER';
  icon.appendChild(tx('⚡', 16, white));
  place(hdr, icon, 20, 14);

  // title
  const title = tx('MCP Trigger HTTP', 14, white, 'Semi Bold');
  place(hdr, title, 62, 13);

  // subtitle
  const sub = tx('Expõe workflows como tools para agentes AI', 11, { r: 0.82, g: 0.72, b: 0.92 });
  place(hdr, sub, 62, 33);

  // close
  const close = tx('✕', 16, white);
  place(hdr, close, W - 32, 22);

  place(drawer, hdr, 0, 0);
}

let y = 60; // current y position in drawer

// ── BODY ──────────────────────────────────────────────────

y += 20; // padding top

// ── Seção 1: Configuração Básica ──────────────────────────
{
  y = sectionLbl(drawer, 'Configuração Básica', null, y);
  y += 10;

  // nome do servidor
  y = fieldLbl(drawer, 'Nome do servidor', PAD, y);
  const nameInput = input('Atendimento XYZ', '', 230, 34);
  place(drawer, nameInput, PAD, y);

  // versao (ao lado)
  const verLbl = tx('Versão', 12, gray500, 'Medium');
  place(drawer, verLbl, PAD + 230 + 10, y - 19);
  const verInput = input('1.0', '', IW - 230 - 10, 34);
  place(drawer, verInput, PAD + 230 + 10, y);

  y += 34;
}

y += 20;
y = divLine(drawer, y);
y += 20;

// ── Seção 2: Tools ────────────────────────────────────────
{
  y = sectionLbl(drawer, 'Tools', '+ Add Tool', y);
  y += 10;

  // Tool card
  const CW = IW;       // card width
  const CPAD = 14;     // card padding
  const CIW = CW - CPAD * 2; // card inner width

  // measure card height
  let cy = CPAD;

  // nome da tool
  cy += 16 + 6 + 34 + 12; // label + gap + input + bottom gap

  // descricao (com AI btn inline)
  cy += 16 + 6 + 34 + 12;

  // divider
  cy += 1 + 12;

  // properties header
  cy += 16 + 8;

  // col headers
  cy += 14 + 8;

  // 2 property rows
  cy += 32 + 8 + 32 + 12;

  // divider
  cy += 1 + 12;

  // required header
  cy += 14 + 8;

  // chips
  cy += 26;

  cy += CPAD; // bottom pad

  const card = makeFrame(CW, cy, white, 'Tool Card');
  card.strokes = [{ type: 'SOLID', color: gray200 }];
  card.strokeWeight = 1;
  card.cornerRadius = 8;

  let iy = CPAD; // y inside card

  // nome da tool
  const fnLbl = tx('Nome', 12, gray500, 'Medium');
  place(card, fnLbl, CPAD, iy); iy += fnLbl.height + 6;
  const fnInput = input('consultar_pedido', '', CIW, 34);
  place(card, fnInput, CPAD, iy); iy += 34 + 12;

  // descricao
  const fdLbl = tx('Descrição', 12, gray500, 'Medium');
  place(card, fdLbl, CPAD, iy);
  // AI btn ao lado
  const aiBtn = figma.createFrame();
  aiBtn.name = 'AI Btn';
  aiBtn.layoutMode = 'HORIZONTAL';
  aiBtn.counterAxisAlignItems = 'CENTER';
  aiBtn.paddingLeft = 8; aiBtn.paddingRight = 8;
  aiBtn.paddingTop = 3; aiBtn.paddingBottom = 3;
  aiBtn.cornerRadius = 10;
  aiBtn.primaryAxisSizingMode = 'AUTO';
  aiBtn.counterAxisSizingMode = 'AUTO';
  aiBtn.fills = [{ type: 'SOLID', color: purpleLight }];
  aiBtn.appendChild(tx('✦ Gerar com IA', 10, purple, 'Medium'));
  card.appendChild(aiBtn);
  aiBtn.x = CPAD + 70; aiBtn.y = iy;
  iy += fdLbl.height + 6;

  const fdInput = input('Consulta o status de um pedido', '', CIW, 34);
  place(card, fdInput, CPAD, iy); iy += 34 + 12;

  // div
  const div1 = figma.createRectangle();
  div1.resize(CIW, 1); div1.fills = [{ type: 'SOLID', color: gray200 }];
  place(card, div1, CPAD, iy); iy += 1 + 12;

  // properties header
  const phLbl = tx('PROPERTIES', 10, gray500, 'Semi Bold');
  place(card, phLbl, CPAD, iy);
  const addProp = tx('+ Adicionar', 11, purple, 'Medium');
  place(card, addProp, CPAD + CIW - addProp.width, iy);
  iy += 16 + 8;

  // col headers
  const chName = tx('name', 10, gray500);
  place(card, chName, CPAD, iy);
  const chType = tx('type', 10, gray500);
  place(card, chType, CPAD + 152, iy);
  iy += 14 + 8;

  // property rows
  function propRow(n, t, cardRef, iy) {
    const ni = input(n, '', 148, 32);
    place(cardRef, ni, CPAD, iy);
    const ti = dropdown(t, 100, 32);
    place(cardRef, ti, CPAD + 148 + 6, iy);
    const del = tx('×', 16, gray300);
    place(cardRef, del, CPAD + 148 + 6 + 100 + 8, iy + 8);
    return iy + 32 + 8;
  }
  iy = propRow('pedido_id', 'string', card, iy);
  iy = propRow('email', 'string', card, iy);
  iy += 4;

  // div
  const div2 = figma.createRectangle();
  div2.resize(CIW, 1); div2.fills = [{ type: 'SOLID', color: gray200 }];
  place(card, div2, CPAD, iy); iy += 1 + 12;

  // required header
  const reqLbl = tx('REQUIRED', 10, gray500, 'Semi Bold');
  place(card, reqLbl, CPAD, iy);
  const reqHint = tx('— marque os campos obrigatórios', 10, gray300);
  place(card, reqHint, CPAD + 70, iy);
  iy += 14 + 8;

  // chips
  const ch1 = chip('pedido_id', true);
  place(card, ch1, CPAD, iy);
  const ch2 = chip('email', false);
  place(card, ch2, CPAD + ch1.width + 6, iy);

  place(drawer, card, PAD, y);
  y += cy;
}

y += 20;
y = divLine(drawer, y);
y += 20;

// ── Seção 3: Autenticação ─────────────────────────────────
{
  y = sectionLbl(drawer, 'Autenticação', null, y);
  y += 10;

  function radioItem(label, active, xPos) {
    const circle = figma.createEllipse();
    circle.resize(16, 16);
    circle.fills = [{ type: 'SOLID', color: white }];
    circle.strokes = [{ type: 'SOLID', color: active ? purple : gray200 }];
    circle.strokeWeight = active ? 4 : 1.5;
    place(drawer, circle, xPos, y + 2);

    const lbl = tx(label, 13, active ? black : gray500, active ? 'Medium' : 'Regular');
    place(drawer, lbl, xPos + 22, y + 1);
    return lbl.width + 22 + 16;
  }

  let rx = PAD;
  rx += radioItem('Nenhuma', true, rx);
  rx += radioItem('Bearer Token', false, rx);
  rx += radioItem('API Key', false, rx);
  y += 20 + 10;

  // warning
  const dot = figma.createEllipse();
  dot.resize(7, 7);
  dot.fills = [{ type: 'SOLID', color: orange }];
  place(drawer, dot, PAD, y + 3);
  const warnTxt = tx('Nenhuma autenticação — não recomendado em produção', 11, orange);
  place(drawer, warnTxt, PAD + 12, y);
  y += 18;
}

y += 20;
y = divLine(drawer, y);
y += 20;

// ── Seção 4: Endpoint ─────────────────────────────────────
{
  y = sectionLbl(drawer, 'Endpoint', null, y);
  y += 14;

  function urlBlock(label, url, badgeTxt, badgeColor, badgeBg) {
    const lbl = tx(label, 10, gray500, 'Semi Bold');
    place(drawer, lbl, PAD, y);

    // badge
    const badge = figma.createFrame();
    badge.name = 'Badge';
    badge.layoutMode = 'HORIZONTAL';
    badge.counterAxisAlignItems = 'CENTER';
    badge.paddingLeft = 8; badge.paddingRight = 8;
    badge.paddingTop = 2; badge.paddingBottom = 2;
    badge.cornerRadius = 9;
    badge.primaryAxisSizingMode = 'AUTO';
    badge.counterAxisSizingMode = 'AUTO';
    badge.fills = [{ type: 'SOLID', color: badgeBg }];
    badge.appendChild(tx(badgeTxt, 10, badgeColor, 'Medium'));
    drawer.appendChild(badge);
    badge.x = PAD + lbl.width + 8; badge.y = y;

    const urlF = makeFrame(IW, 34, gray100, 'URL Row');
    urlF.strokes = [{ type: 'SOLID', color: gray200 }];
    urlF.strokeWeight = 1; urlF.cornerRadius = 6;
    urlF.clipsContent = true;
    const urlTxt = tx(url, 12, purple);
    place(urlF, urlTxt, 12, 9);
    const copyTxt = tx('⧉', 14, gray500);
    place(urlF, copyTxt, IW - 28, 10);
    place(drawer, urlF, PAD, y + 20);

    return y + 20 + 34 + 14;
  }

  y = urlBlock('TEST URL', 'https://ipaas.io/mcp/test/abc123', 'inativo', orange, orangeLight);
  y = urlBlock('PRODUCTION URL', 'https://ipaas.io/mcp/abc123', '● ativo', green, greenLight);

  // connected clients
  const dot = figma.createEllipse();
  dot.resize(8, 8);
  dot.fills = [{ type: 'SOLID', color: green }];
  place(drawer, dot, PAD, y + 3);
  const clientTxt = tx('1 cliente conectado agora', 12, gray500);
  place(drawer, clientTxt, PAD + 13, y);
  y += 18;
}

y += 20; // padding bottom

// ── Ajusta altura final do drawer ─────────────────────────
const FOOTER_H = 60;
drawer.resize(W, y + FOOTER_H);

// ── FOOTER ────────────────────────────────────────────────
{
  const footerY = y;
  const footerBg = makeFrame(W, FOOTER_H, white, 'Footer');
  const topLine = figma.createRectangle();
  topLine.resize(W, 1); topLine.fills = [{ type: 'SOLID', color: gray200 }];
  place(footerBg, topLine, 0, 0);

  const cancelBtn = figma.createFrame();
  cancelBtn.name = 'Cancel';
  cancelBtn.layoutMode = 'HORIZONTAL';
  cancelBtn.primaryAxisAlignItems = 'CENTER';
  cancelBtn.counterAxisAlignItems = 'CENTER';
  cancelBtn.paddingLeft = 20; cancelBtn.paddingRight = 20;
  cancelBtn.paddingTop = 10; cancelBtn.paddingBottom = 10;
  cancelBtn.cornerRadius = 6;
  cancelBtn.primaryAxisSizingMode = 'AUTO';
  cancelBtn.counterAxisSizingMode = 'AUTO';
  cancelBtn.fills = [{ type: 'SOLID', color: white }];
  cancelBtn.strokes = [{ type: 'SOLID', color: gray200 }];
  cancelBtn.strokeWeight = 1;
  cancelBtn.appendChild(tx('Cancelar', 13, black, 'Medium'));
  footerBg.appendChild(cancelBtn);

  const saveBtn = figma.createFrame();
  saveBtn.name = 'Save';
  saveBtn.layoutMode = 'HORIZONTAL';
  saveBtn.primaryAxisAlignItems = 'CENTER';
  saveBtn.counterAxisAlignItems = 'CENTER';
  saveBtn.paddingLeft = 20; saveBtn.paddingRight = 20;
  saveBtn.paddingTop = 10; saveBtn.paddingBottom = 10;
  saveBtn.cornerRadius = 6;
  saveBtn.primaryAxisSizingMode = 'AUTO';
  saveBtn.counterAxisSizingMode = 'AUTO';
  saveBtn.fills = [{ type: 'SOLID', color: purple }];
  saveBtn.appendChild(tx('Salvar', 13, white, 'Medium'));
  footerBg.appendChild(saveBtn);

  // position buttons right-aligned
  cancelBtn.x = W - PAD - saveBtn.width - 8 - cancelBtn.width;
  cancelBtn.y = (FOOTER_H - cancelBtn.height) / 2;
  saveBtn.x = W - PAD - saveBtn.width;
  saveBtn.y = (FOOTER_H - saveBtn.height) / 2;

  place(drawer, footerBg, 0, footerY);
}

// ── posicionar no canvas ──────────────────────────────────
const vp = figma.viewport.center;
drawer.x = vp.x + 500;
drawer.y = vp.y - drawer.height / 2;

figma.currentPage.appendChild(drawer);
figma.currentPage.selection = [drawer];
figma.viewport.scrollAndZoomIntoView([drawer]);
figma.notify('Drawer ideal v3 — h: ' + Math.round(drawer.height));
