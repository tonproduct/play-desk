// MCP Trigger HTTP — Drawer Ideal
// Baseado no benchmarking: n8n, Node-RED, Digibee + design system DHuO

const purple      = { r: 0.557, g: 0.235, b: 0.796 };
const purpleDark  = { r: 0.42, g: 0.16, b: 0.62 };
const purpleLight = { r: 0.95, g: 0.91, b: 0.99 };
const white       = { r: 1, g: 1, b: 1 };
const black       = { r: 0.12, g: 0.12, b: 0.12 };
const gray600     = { r: 0.30, g: 0.30, b: 0.30 };
const gray500     = { r: 0.43, g: 0.43, b: 0.43 };
const gray200     = { r: 0.88, g: 0.88, b: 0.88 };
const gray100     = { r: 0.96, g: 0.96, b: 0.96 };
const green       = { r: 0.13, g: 0.55, b: 0.27 };
const greenLight  = { r: 0.90, g: 0.97, b: 0.92 };
const orange      = { r: 0.90, g: 0.55, b: 0.0 };
const orangeLight = { r: 0.99, g: 0.95, b: 0.88 };

const W = 400;

await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
await figma.loadFontAsync({ family: 'Inter', style: 'Medium' });
await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });
await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });

// ── helpers ──────────────────────────────────────────────

function text(content, size, color, weight = 'Regular') {
  const t = figma.createText();
  t.fontName = { family: 'Inter', style: weight };
  t.characters = String(content);
  t.fontSize = size;
  t.fills = [{ type: 'SOLID', color }];
  return t;
}

function rect(name, w, h, fill, radius = 0) {
  const r = figma.createRectangle();
  r.name = name; r.resize(w, h);
  r.fills = [{ type: 'SOLID', color: fill }];
  r.cornerRadius = radius;
  return r;
}

function divider(w = W - 32) {
  return rect('Divider', w, 1, gray200);
}

function hstack(name, spacing = 8, align = 'CENTER') {
  const f = figma.createFrame();
  f.name = name; f.layoutMode = 'HORIZONTAL';
  f.itemSpacing = spacing; f.counterAxisAlignItems = align;
  f.fills = []; f.primaryAxisSizingMode = 'AUTO';
  f.counterAxisSizingMode = 'AUTO';
  return f;
}

function vstack(name, spacing = 8) {
  const f = figma.createFrame();
  f.name = name; f.layoutMode = 'VERTICAL';
  f.itemSpacing = spacing; f.fills = [];
  f.primaryAxisSizingMode = 'AUTO';
  f.counterAxisSizingMode = 'AUTO';
  return f;
}

function input(value, placeholder, w, h = 34) {
  const f = figma.createFrame();
  f.name = 'Input'; f.resize(w, h);
  f.layoutMode = 'HORIZONTAL';
  f.counterAxisAlignItems = 'CENTER';
  f.paddingLeft = 12; f.paddingRight = 12;
  f.fills = [{ type: 'SOLID', color: white }];
  f.strokes = [{ type: 'SOLID', color: gray200 }];
  f.strokeWeight = 1; f.cornerRadius = 6;
  f.primaryAxisSizingMode = 'FIXED';
  f.counterAxisSizingMode = 'FIXED';
  f.clipsContent = true;
  const t = text(value || placeholder, 13, value ? black : gray500);
  f.appendChild(t);
  return f;
}

function dropdown(value, w, h = 34) {
  const f = figma.createFrame();
  f.name = 'Dropdown'; f.resize(w, h);
  f.layoutMode = 'HORIZONTAL';
  f.primaryAxisAlignItems = 'SPACE_BETWEEN';
  f.counterAxisAlignItems = 'CENTER';
  f.paddingLeft = 12; f.paddingRight = 10;
  f.fills = [{ type: 'SOLID', color: white }];
  f.strokes = [{ type: 'SOLID', color: gray200 }];
  f.strokeWeight = 1; f.cornerRadius = 6;
  f.primaryAxisSizingMode = 'FIXED';
  f.counterAxisSizingMode = 'FIXED';
  f.appendChild(text(value, 13, black));
  f.appendChild(text('⌄', 13, gray500));
  return f;
}

function radio(label, selected) {
  const row = hstack(`Radio — ${label}`, 8);
  const circle = figma.createEllipse();
  circle.resize(16, 16);
  circle.fills = [{ type: 'SOLID', color: selected ? white : white }];
  circle.strokes = [{ type: 'SOLID', color: selected ? purple : gray200 }];
  circle.strokeWeight = selected ? 4 : 1.5;
  circle.name = 'Circle';
  row.appendChild(circle);
  row.appendChild(text(label, 13, selected ? black : gray600, selected ? 'Medium' : 'Regular'));
  return row;
}

function fieldLabel(content) {
  return text(content, 12, gray500, 'Medium');
}

function sectionTitle(content, action = null) {
  const row = figma.createFrame();
  row.name = 'Section Title';
  row.resize(W - 32, 18);
  row.layoutMode = 'HORIZONTAL';
  row.primaryAxisAlignItems = 'SPACE_BETWEEN';
  row.counterAxisAlignItems = 'CENTER';
  row.fills = [];
  const t = text(content.toUpperCase(), 10, gray500, 'Semi Bold');
  row.appendChild(t);
  if (action) {
    const a = text(action, 11, purple, 'Medium');
    row.appendChild(a);
  }
  return row;
}

function chip(label, active) {
  const f = figma.createFrame();
  f.name = `Chip — ${label}`;
  f.layoutMode = 'HORIZONTAL';
  f.counterAxisAlignItems = 'CENTER';
  f.paddingLeft = 10; f.paddingRight = 10;
  f.paddingTop = 4; f.paddingBottom = 4;
  f.cornerRadius = 20;
  f.primaryAxisSizingMode = 'AUTO';
  f.counterAxisSizingMode = 'AUTO';
  f.fills = [{ type: 'SOLID', color: active ? purpleLight : gray100 }];
  f.strokes = [{ type: 'SOLID', color: active ? purple : gray200 }];
  f.strokeWeight = 1;
  f.appendChild(text(label, 12, active ? purple : gray500, active ? 'Medium' : 'Regular'));
  return f;
}

function urlBox(label, url, badgeText, badgeColor, badgeBg) {
  const wrap = vstack(`URL Box — ${label}`, 6);
  wrap.counterAxisSizingMode = 'FIXED';
  wrap.resize(W - 32, 10);

  // label + badge
  const top = hstack('Top', 6);
  top.appendChild(text(label, 11, gray500, 'Semi Bold'));
  const badge = figma.createFrame();
  badge.name = 'Badge';
  badge.layoutMode = 'HORIZONTAL';
  badge.paddingLeft = 8; badge.paddingRight = 8;
  badge.paddingTop = 2; badge.paddingBottom = 2;
  badge.cornerRadius = 10;
  badge.primaryAxisSizingMode = 'AUTO';
  badge.counterAxisSizingMode = 'AUTO';
  badge.fills = [{ type: 'SOLID', color: badgeBg }];
  badge.appendChild(text(badgeText, 10, badgeColor, 'Medium'));
  top.appendChild(badge);
  wrap.appendChild(top);

  // url row
  const urlRow = figma.createFrame();
  urlRow.name = 'URL Row';
  urlRow.resize(W - 32, 34);
  urlRow.layoutMode = 'HORIZONTAL';
  urlRow.primaryAxisAlignItems = 'SPACE_BETWEEN';
  urlRow.counterAxisAlignItems = 'CENTER';
  urlRow.paddingLeft = 12; urlRow.paddingRight = 12;
  urlRow.fills = [{ type: 'SOLID', color: gray100 }];
  urlRow.strokes = [{ type: 'SOLID', color: gray200 }];
  urlRow.strokeWeight = 1;
  urlRow.cornerRadius = 6;
  urlRow.clipsContent = true;
  urlRow.appendChild(text(url, 12, purple));
  urlRow.appendChild(text('⧉', 14, gray500));
  wrap.appendChild(urlRow);

  return wrap;
}

// ── property row ─────────────────────────────────────────

function propertyRow(nameVal, typeVal) {
  const row = hstack(`Property — ${nameVal}`, 6);
  row.appendChild(input(nameVal, '', 148, 32));
  row.appendChild(dropdown(typeVal, 98, 32));
  row.appendChild(text('×', 16, gray500));
  return row;
}

// ── tool card ────────────────────────────────────────────

function toolCard() {
  const card = figma.createFrame();
  card.name = 'Tool Card';
  card.layoutMode = 'VERTICAL';
  card.itemSpacing = 12;
  card.paddingTop = 14; card.paddingBottom = 14;
  card.paddingLeft = 14; card.paddingRight = 14;
  card.fills = [{ type: 'SOLID', color: white }];
  card.strokes = [{ type: 'SOLID', color: gray200 }];
  card.strokeWeight = 1;
  card.cornerRadius = 8;
  card.primaryAxisSizingMode = 'AUTO';
  card.counterAxisSizingMode = 'FIXED';
  card.resize(W - 32, 10);

  // tool name
  const nameWrap = vstack('Field — name', 5);
  nameWrap.counterAxisSizingMode = 'FIXED';
  nameWrap.resize(W - 60, 10);
  nameWrap.appendChild(fieldLabel('Nome'));
  nameWrap.appendChild(input('consultar_pedido', '', W - 60, 34));
  card.appendChild(nameWrap);

  // description + AI button
  const descWrap = vstack('Field — description', 5);
  descWrap.counterAxisSizingMode = 'FIXED';
  descWrap.resize(W - 60, 10);

  const descLabel = hstack('Desc Label', 6);
  descLabel.appendChild(fieldLabel('Descrição'));
  const aiBtn = figma.createFrame();
  aiBtn.name = 'AI Button';
  aiBtn.layoutMode = 'HORIZONTAL';
  aiBtn.counterAxisAlignItems = 'CENTER';
  aiBtn.paddingLeft = 8; aiBtn.paddingRight = 8;
  aiBtn.paddingTop = 3; aiBtn.paddingBottom = 3;
  aiBtn.cornerRadius = 20;
  aiBtn.primaryAxisSizingMode = 'AUTO';
  aiBtn.counterAxisSizingMode = 'AUTO';
  aiBtn.fills = [{ type: 'SOLID', color: purpleLight }];
  aiBtn.appendChild(text('✦ Gerar com IA', 10, purple, 'Medium'));
  descLabel.appendChild(aiBtn);
  descWrap.appendChild(descLabel);
  descWrap.appendChild(input('Consulta o status de um pedido pelo ID', '', W - 60, 34));
  card.appendChild(descWrap);

  // divider
  card.appendChild(rect('Divider', W - 60, 1, gray200));

  // properties
  const propsHeader = figma.createFrame();
  propsHeader.name = 'Props Header';
  propsHeader.resize(W - 60, 18);
  propsHeader.layoutMode = 'HORIZONTAL';
  propsHeader.primaryAxisAlignItems = 'SPACE_BETWEEN';
  propsHeader.counterAxisAlignItems = 'CENTER';
  propsHeader.fills = [];
  propsHeader.appendChild(text('PROPERTIES', 10, gray500, 'Semi Bold'));
  propsHeader.appendChild(text('+ Adicionar', 11, purple, 'Medium'));
  card.appendChild(propsHeader);

  // col headers
  const cols = hstack('Col Headers', 6);
  const nameCol = text('name', 10, gray500);
  nameCol.resize(148, nameCol.height);
  cols.appendChild(nameCol);
  cols.appendChild(text('type', 10, gray500));
  card.appendChild(cols);

  card.appendChild(propertyRow('pedido_id', 'string'));
  card.appendChild(propertyRow('email', 'string'));

  // divider
  card.appendChild(rect('Divider', W - 60, 1, gray200));

  // required
  const reqHeader = hstack('Required Header', 6);
  reqHeader.appendChild(text('REQUIRED', 10, gray500, 'Semi Bold'));
  const reqHint = text('selecione os campos obrigatórios', 10, gray500);
  reqHeader.appendChild(reqHint);
  card.appendChild(reqHeader);

  const chipsRow = hstack('Chips', 6);
  chipsRow.appendChild(chip('pedido_id', true));
  chipsRow.appendChild(chip('email', false));
  card.appendChild(chipsRow);

  return card;
}

// ── accordion section ─────────────────────────────────────

function accordion(title, expanded = false) {
  const wrap = figma.createFrame();
  wrap.name = `Accordion — ${title}`;
  wrap.resize(W - 32, expanded ? 10 : 40);
  wrap.layoutMode = 'VERTICAL';
  wrap.fills = [];
  wrap.primaryAxisSizingMode = expanded ? 'AUTO' : 'FIXED';

  const header = figma.createFrame();
  header.name = 'Accordion Header';
  header.resize(W - 32, 40);
  header.layoutMode = 'HORIZONTAL';
  header.primaryAxisAlignItems = 'SPACE_BETWEEN';
  header.counterAxisAlignItems = 'CENTER';
  header.fills = [];
  header.appendChild(text(title, 13, black, 'Medium'));
  header.appendChild(text(expanded ? '∧' : '∨', 13, gray500));
  wrap.appendChild(header);

  return wrap;
}

// ── BUILD DRAWER ──────────────────────────────────────────

const drawer = figma.createFrame();
drawer.name = 'MCP Trigger HTTP — Ideal';
drawer.resize(W, 100);
drawer.layoutMode = 'VERTICAL';
drawer.fills = [{ type: 'SOLID', color: white }];
drawer.cornerRadius = 10;
drawer.clipsContent = false;
drawer.primaryAxisSizingMode = 'AUTO';
drawer.effects = [{
  type: 'DROP_SHADOW',
  color: { r: 0, g: 0, b: 0, a: 0.18 },
  offset: { x: 0, y: 8 },
  radius: 32, spread: 0,
  visible: true, blendMode: 'NORMAL'
}];

// ── HEADER ────────────────────────────────────────────────

const header = figma.createFrame();
header.name = 'Header';
header.resize(W, 56);
header.layoutMode = 'HORIZONTAL';
header.primaryAxisAlignItems = 'SPACE_BETWEEN';
header.counterAxisAlignItems = 'CENTER';
header.paddingLeft = 20; header.paddingRight = 20;
header.fills = [{ type: 'SOLID', color: purple }];

const headerLeft = hstack('Header Left', 10);
const iconBox = figma.createFrame();
iconBox.resize(28, 28);
iconBox.cornerRadius = 6;
iconBox.fills = [{ type: 'SOLID', color: purpleDark }];
iconBox.layoutMode = 'HORIZONTAL';
iconBox.primaryAxisAlignItems = 'CENTER';
iconBox.counterAxisAlignItems = 'CENTER';
iconBox.appendChild(text('⚡', 14, white));
headerLeft.appendChild(iconBox);

const headerTexts = vstack('Header Texts', 2);
headerTexts.appendChild(text('MCP Trigger HTTP', 14, white, 'Semi Bold'));
headerTexts.appendChild(text('Expõe workflows como tools para agentes AI', 11, { r: 0.85, g: 0.75, b: 0.95 }));
headerLeft.appendChild(headerTexts);
header.appendChild(headerLeft);
header.appendChild(text('✕', 16, white));
drawer.appendChild(header);

// ── BODY ──────────────────────────────────────────────────

const body = figma.createFrame();
body.name = 'Body';
body.resize(W, 100);
body.layoutMode = 'VERTICAL';
body.paddingLeft = 16; body.paddingRight = 16;
body.paddingTop = 20; body.paddingBottom = 20;
body.itemSpacing = 20;
body.fills = [{ type: 'SOLID', color: white }];
body.primaryAxisSizingMode = 'AUTO';

// ── Seção 1: Configuração Básica ──────────────────────────

const basicSection = vstack('Basic Section', 12);
basicSection.counterAxisSizingMode = 'FIXED';
basicSection.resize(W - 32, 10);

basicSection.appendChild(sectionTitle('Configuração Básica'));

const row12 = hstack('Name + Version Row', 10);
const nameWrap = vstack('Field — Name', 5);
nameWrap.counterAxisSizingMode = 'FIXED'; nameWrap.resize(220, 10);
nameWrap.appendChild(fieldLabel('Nome do servidor'));
nameWrap.appendChild(input('Atendimento XYZ', '', 220, 34));
row12.appendChild(nameWrap);

const verWrap = vstack('Field — Version', 5);
verWrap.counterAxisSizingMode = 'FIXED'; verWrap.resize(106, 10);
verWrap.appendChild(fieldLabel('Versão'));
verWrap.appendChild(input('1.0', '', 106, 34));
row12.appendChild(verWrap);

basicSection.appendChild(row12);
body.appendChild(basicSection);
body.appendChild(divider());

// ── Seção 2: Tools ────────────────────────────────────────

const toolsSection = vstack('Tools Section', 12);
toolsSection.counterAxisSizingMode = 'FIXED';
toolsSection.resize(W - 32, 10);

toolsSection.appendChild(sectionTitle('Tools', '+ Add Tool'));
toolsSection.appendChild(toolCard());

body.appendChild(toolsSection);
body.appendChild(divider());

// ── Seção 3: Autenticação ─────────────────────────────────

const authSection = vstack('Auth Section', 12);
authSection.counterAxisSizingMode = 'FIXED';
authSection.resize(W - 32, 10);

authSection.appendChild(sectionTitle('Autenticação'));

const authOptions = hstack('Auth Options', 20);
authOptions.appendChild(radio('Nenhuma', true));
authOptions.appendChild(radio('Bearer Token', false));
authOptions.appendChild(radio('API Key', false));
authSection.appendChild(authOptions);

// note
const authNote = hstack('Auth Note', 6);
const noteDot = figma.createEllipse();
noteDot.resize(6, 6);
noteDot.fills = [{ type: 'SOLID', color: orange }];
authNote.appendChild(noteDot);
authNote.appendChild(text('Sem autenticação — não recomendado em produção', 11, orange));
authSection.appendChild(authNote);

body.appendChild(authSection);
body.appendChild(divider());

// ── Seção 4: Endpoint ─────────────────────────────────────

const endpointSection = vstack('Endpoint Section', 12);
endpointSection.counterAxisSizingMode = 'FIXED';
endpointSection.resize(W - 32, 10);

endpointSection.appendChild(sectionTitle('Endpoint'));

// Test URL
endpointSection.appendChild(urlBox(
  'TEST URL',
  'https://ipaas.io/mcp/test/abc123',
  'inativo',
  orange,
  orangeLight
));

// Production URL
endpointSection.appendChild(urlBox(
  'PRODUCTION URL',
  'https://ipaas.io/mcp/abc123',
  '● ativo',
  green,
  greenLight
));

// status connected clients
const clientsRow = hstack('Clients', 8);
const dot = figma.createEllipse();
dot.resize(8, 8);
dot.fills = [{ type: 'SOLID', color: green }];
clientsRow.appendChild(dot);
clientsRow.appendChild(text('1 cliente conectado', 12, gray500));
endpointSection.appendChild(clientsRow);

body.appendChild(endpointSection);
drawer.appendChild(body);

// ── FOOTER ────────────────────────────────────────────────

const footer = figma.createFrame();
footer.name = 'Footer';
footer.resize(W, 60);
footer.layoutMode = 'HORIZONTAL';
footer.primaryAxisAlignItems = 'MAX';
footer.counterAxisAlignItems = 'CENTER';
footer.paddingLeft = 16; footer.paddingRight = 16;
footer.itemSpacing = 8;
footer.fills = [{ type: 'SOLID', color: white }];
footer.strokes = [{ type: 'SOLID', color: gray200 }];
footer.strokeTopWeight = 1;
footer.strokeBottomWeight = 0;
footer.strokeLeftWeight = 0;
footer.strokeRightWeight = 0;

const cancelBtn = figma.createFrame();
cancelBtn.name = 'Cancel';
cancelBtn.layoutMode = 'HORIZONTAL';
cancelBtn.counterAxisAlignItems = 'CENTER';
cancelBtn.primaryAxisAlignItems = 'CENTER';
cancelBtn.paddingLeft = 20; cancelBtn.paddingRight = 20;
cancelBtn.paddingTop = 10; cancelBtn.paddingBottom = 10;
cancelBtn.cornerRadius = 6;
cancelBtn.fills = [{ type: 'SOLID', color: white }];
cancelBtn.strokes = [{ type: 'SOLID', color: gray200 }];
cancelBtn.strokeWeight = 1;
cancelBtn.primaryAxisSizingMode = 'AUTO';
cancelBtn.counterAxisSizingMode = 'AUTO';
cancelBtn.appendChild(text('Cancelar', 13, black, 'Medium'));

const saveBtn = figma.createFrame();
saveBtn.name = 'Save';
saveBtn.layoutMode = 'HORIZONTAL';
saveBtn.counterAxisAlignItems = 'CENTER';
saveBtn.primaryAxisAlignItems = 'CENTER';
saveBtn.paddingLeft = 20; saveBtn.paddingRight = 20;
saveBtn.paddingTop = 10; saveBtn.paddingBottom = 10;
saveBtn.cornerRadius = 6;
saveBtn.fills = [{ type: 'SOLID', color: purple }];
saveBtn.primaryAxisSizingMode = 'AUTO';
saveBtn.counterAxisSizingMode = 'AUTO';
saveBtn.appendChild(text('Salvar', 13, white, 'Medium'));

footer.appendChild(cancelBtn);
footer.appendChild(saveBtn);
drawer.appendChild(footer);

// ── posicionar ────────────────────────────────────────────

const vp = figma.viewport.center;
drawer.x = vp.x + 500;
drawer.y = vp.y - 400;

figma.currentPage.appendChild(drawer);
figma.currentPage.selection = [drawer];
figma.viewport.scrollAndZoomIntoView([drawer]);
figma.notify('Drawer ideal criado!');
