// MCP Trigger HTTP — Node Config Drawer
// Replica o padrão visual do Drawer existente no design system DHuO

const purple      = { r: 0.557, g: 0.235, b: 0.796 };
const white       = { r: 1, g: 1, b: 1 };
const black       = { r: 0.12, g: 0.12, b: 0.12 };
const gray500     = { r: 0.43, g: 0.43, b: 0.43 };
const gray200     = { r: 0.88, g: 0.88, b: 0.88 };
const gray100     = { r: 0.96, g: 0.96, b: 0.96 };
const purpleLight = { r: 0.95, g: 0.91, b: 0.99 };
const greenTag    = { r: 0.87, g: 0.97, b: 0.90 };
const greenText   = { r: 0.13, g: 0.55, b: 0.27 };

const W = 380;

await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
await figma.loadFontAsync({ family: 'Inter', style: 'Medium' });
await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });
await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });

// ── helpers ──────────────────────────────────────────────

function frame(name, w, h, dir = 'VERTICAL') {
  const f = figma.createFrame();
  f.name = name;
  f.resize(w, h);
  f.layoutMode = dir;
  f.fills = [];
  f.clipsContent = false;
  return f;
}

function rect(name, w, h, fill, radius = 0) {
  const r = figma.createRectangle();
  r.name = name;
  r.resize(w, h);
  r.fills = [{ type: 'SOLID', color: fill }];
  r.cornerRadius = radius;
  return r;
}

function text(content, size, color, weight = 'Regular') {
  const t = figma.createText();
  t.fontName = { family: 'Inter', style: weight };
  t.characters = content;
  t.fontSize = size;
  t.fills = [{ type: 'SOLID', color }];
  return t;
}

function divider(w) {
  return rect('Divider', w, 1, gray200);
}

function label(content) {
  return text(content, 12, gray500, 'Regular');
}

function fieldTitle(content) {
  return text(content, 13, black, 'Medium');
}

function inputBox(placeholder, w = W - 32, value = '') {
  const wrap = figma.createFrame();
  wrap.name = 'Input';
  wrap.resize(w, 36);
  wrap.layoutMode = 'HORIZONTAL';
  wrap.primaryAxisAlignItems = 'CENTER';
  wrap.counterAxisAlignItems = 'CENTER';
  wrap.fills = [{ type: 'SOLID', color: white }];
  wrap.strokes = [{ type: 'SOLID', color: gray200 }];
  wrap.strokeWeight = 1;
  wrap.cornerRadius = 4;
  wrap.paddingLeft = 12;
  wrap.paddingRight = 12;
  wrap.clipsContent = true;

  const val = text(value || placeholder, 13, value ? black : gray500);
  val.name = value ? 'Value' : 'Placeholder';
  wrap.appendChild(val);
  return wrap;
}

function dropdown(selected, w = W - 32) {
  const wrap = figma.createFrame();
  wrap.name = 'Dropdown';
  wrap.resize(w, 36);
  wrap.layoutMode = 'HORIZONTAL';
  wrap.primaryAxisAlignItems = 'SPACE_BETWEEN';
  wrap.counterAxisAlignItems = 'CENTER';
  wrap.fills = [{ type: 'SOLID', color: white }];
  wrap.strokes = [{ type: 'SOLID', color: gray200 }];
  wrap.strokeWeight = 1;
  wrap.cornerRadius = 4;
  wrap.paddingLeft = 12;
  wrap.paddingRight = 12;
  wrap.clipsContent = true;

  const val = text(selected, 13, black);
  val.name = 'Value';

  const chevron = text('⌄', 14, gray500);
  chevron.name = 'Chevron';

  wrap.appendChild(val);
  wrap.appendChild(chevron);
  return wrap;
}

function tag(content, bg, color) {
  const wrap = figma.createFrame();
  wrap.name = 'Tag';
  wrap.layoutMode = 'HORIZONTAL';
  wrap.counterAxisAlignItems = 'CENTER';
  wrap.primaryAxisAlignItems = 'CENTER';
  wrap.paddingLeft = 8;
  wrap.paddingRight = 8;
  wrap.paddingTop = 3;
  wrap.paddingBottom = 3;
  wrap.cornerRadius = 4;
  wrap.fills = [{ type: 'SOLID', color: bg }];
  wrap.primaryAxisSizingMode = 'AUTO';
  wrap.counterAxisSizingMode = 'AUTO';
  const t = text(content, 11, color, 'Medium');
  wrap.appendChild(t);
  return wrap;
}

function sectionHeader(title, actionLabel = null) {
  const row = figma.createFrame();
  row.name = 'Section Header';
  row.resize(W - 32, 20);
  row.layoutMode = 'HORIZONTAL';
  row.primaryAxisAlignItems = 'SPACE_BETWEEN';
  row.counterAxisAlignItems = 'CENTER';
  row.fills = [];

  const t = text(title, 11, gray500, 'Semi Bold');
  t.characters = t.characters.toUpperCase();
  row.appendChild(t);

  if (actionLabel) {
    const btn = text(actionLabel, 12, purple, 'Medium');
    row.appendChild(btn);
  }

  return row;
}

function formField(labelText, inputNode) {
  const wrap = figma.createFrame();
  wrap.name = `Field — ${labelText}`;
  wrap.layoutMode = 'VERTICAL';
  wrap.itemSpacing = 6;
  wrap.fills = [];
  wrap.primaryAxisSizingMode = 'AUTO';
  wrap.counterAxisSizingMode = 'FIXED';
  wrap.resize(W - 32, 60);

  const lbl = fieldTitle(labelText);
  wrap.appendChild(lbl);
  wrap.appendChild(inputNode);
  return wrap;
}

// ── param row ────────────────────────────────────────────

function paramRow(name, type, required) {
  const row = figma.createFrame();
  row.name = `Param — ${name}`;
  row.resize(W - 64, 32);
  row.layoutMode = 'HORIZONTAL';
  row.counterAxisAlignItems = 'CENTER';
  row.itemSpacing = 8;
  row.fills = [{ type: 'SOLID', color: gray100 }];
  row.cornerRadius = 4;
  row.paddingLeft = 10;
  row.paddingRight = 10;

  const nameT = text(name, 12, black, 'Medium');
  nameT.layoutGrow = 1;

  const typeT = text(type, 12, gray500);

  row.appendChild(nameT);
  row.appendChild(typeT);

  if (required) {
    const reqTag = tag('required', purpleLight, purple);
    row.appendChild(reqTag);
  }

  return row;
}

// ── tool card ────────────────────────────────────────────

function toolCard() {
  const card = figma.createFrame();
  card.name = 'Tool Card';
  card.resize(W - 32, 200);
  card.layoutMode = 'VERTICAL';
  card.itemSpacing = 10;
  card.paddingTop = 14;
  card.paddingBottom = 14;
  card.paddingLeft = 14;
  card.paddingRight = 14;
  card.fills = [{ type: 'SOLID', color: white }];
  card.strokes = [{ type: 'SOLID', color: gray200 }];
  card.strokeWeight = 1;
  card.cornerRadius = 6;
  card.primaryAxisSizingMode = 'AUTO';

  // Tool name
  const nameField = formField('Nome da Tool', inputBox('ex: consultar_pedido', W - 64, 'consultar_pedido'));
  card.appendChild(nameField);

  // Description
  const descField = formField('Descrição', inputBox('Descreva o que essa tool faz', W - 64, 'Consulta o status de um pedido'));
  card.appendChild(descField);

  // Params header
  const paramHeader = figma.createFrame();
  paramHeader.name = 'Params Header';
  paramHeader.resize(W - 64, 20);
  paramHeader.layoutMode = 'HORIZONTAL';
  paramHeader.primaryAxisAlignItems = 'SPACE_BETWEEN';
  paramHeader.counterAxisAlignItems = 'CENTER';
  paramHeader.fills = [];

  const paramTitle = text('Parâmetros', 11, gray500, 'Semi Bold');
  const addParam = text('+ Parâmetro', 11, purple, 'Medium');
  paramHeader.appendChild(paramTitle);
  paramHeader.appendChild(addParam);
  card.appendChild(paramHeader);

  // Param rows
  card.appendChild(paramRow('pedido_id', 'string', true));
  card.appendChild(paramRow('email', 'string', false));

  return card;
}

// ── endpoint row ─────────────────────────────────────────

function endpointRow() {
  const wrap = figma.createFrame();
  wrap.name = 'Endpoint Row';
  wrap.resize(W - 32, 36);
  wrap.layoutMode = 'HORIZONTAL';
  wrap.primaryAxisAlignItems = 'SPACE_BETWEEN';
  wrap.counterAxisAlignItems = 'CENTER';
  wrap.fills = [{ type: 'SOLID', color: gray100 }];
  wrap.cornerRadius = 4;
  wrap.paddingLeft = 12;
  wrap.paddingRight = 12;
  wrap.strokes = [{ type: 'SOLID', color: gray200 }];
  wrap.strokeWeight = 1;

  const url = text('https://ipaas.io/mcp/abc123', 12, purple);
  const copy = text('⧉ Copiar', 12, gray500, 'Medium');

  wrap.appendChild(url);
  wrap.appendChild(copy);
  return wrap;
}

// ── assemble drawer ───────────────────────────────────────

const drawer = figma.createFrame();
drawer.name = 'MCP Trigger HTTP — Node Config';
drawer.resize(W, 100);
drawer.layoutMode = 'VERTICAL';
drawer.fills = [{ type: 'SOLID', color: white }];
drawer.cornerRadius = 8;
drawer.clipsContent = true;
drawer.primaryAxisSizingMode = 'AUTO';
drawer.effects = [{
  type: 'DROP_SHADOW',
  color: { r: 0, g: 0, b: 0, a: 0.15 },
  offset: { x: 0, y: 4 },
  radius: 20,
  spread: 0,
  visible: true,
  blendMode: 'NORMAL'
}];

// ── HEADER ────────────────────────────────────────────────

const header = figma.createFrame();
header.name = 'Header';
header.resize(W, 52);
header.layoutMode = 'HORIZONTAL';
header.primaryAxisAlignItems = 'SPACE_BETWEEN';
header.counterAxisAlignItems = 'CENTER';
header.paddingLeft = 20;
header.paddingRight = 20;
header.fills = [{ type: 'SOLID', color: purple }];

const titleText = text('MCP Trigger HTTP', 15, white, 'Semi Bold');
const closeBtn = text('✕', 16, white);
header.appendChild(titleText);
header.appendChild(closeBtn);
drawer.appendChild(header);

// ── BODY ──────────────────────────────────────────────────

const body = figma.createFrame();
body.name = 'Body';
body.resize(W, 100);
body.layoutMode = 'VERTICAL';
body.paddingLeft = 16;
body.paddingRight = 16;
body.paddingTop = 20;
body.paddingBottom = 20;
body.itemSpacing = 16;
body.fills = [{ type: 'SOLID', color: white }];
body.primaryAxisSizingMode = 'AUTO';

// — Configuração Básica
body.appendChild(sectionHeader('Configuração Básica'));
body.appendChild(formField('Server Name', inputBox('ex: Atendimento XYZ', W - 32, 'Atendimento XYZ')));
body.appendChild(formField('Version', inputBox('ex: 1.0', W - 32, '1.0')));
body.appendChild(divider(W - 32));

// — Tools
body.appendChild(sectionHeader('Tools', '+ Add Tool'));
body.appendChild(toolCard());
body.appendChild(divider(W - 32));

// — Endpoint gerado
body.appendChild(sectionHeader('Endpoint Gerado'));
body.appendChild(endpointRow());

const statusRow = figma.createFrame();
statusRow.name = 'Status Row';
statusRow.layoutMode = 'HORIZONTAL';
statusRow.itemSpacing = 8;
statusRow.counterAxisAlignItems = 'CENTER';
statusRow.fills = [];
statusRow.primaryAxisSizingMode = 'AUTO';
statusRow.counterAxisSizingMode = 'AUTO';

const statusDot = rect('Dot', 8, 8, greenText, 4);
const statusText = text('Aguardando conexão do cliente MCP', 12, gray500);
statusRow.appendChild(statusDot);
statusRow.appendChild(statusText);
body.appendChild(statusRow);

drawer.appendChild(body);

// ── FOOTER ────────────────────────────────────────────────

const footer = figma.createFrame();
footer.name = 'Footer';
footer.resize(W, 60);
footer.layoutMode = 'HORIZONTAL';
footer.primaryAxisAlignItems = 'MAX';
footer.counterAxisAlignItems = 'CENTER';
footer.paddingLeft = 16;
footer.paddingRight = 16;
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
cancelBtn.paddingLeft = 20;
cancelBtn.paddingRight = 20;
cancelBtn.paddingTop = 10;
cancelBtn.paddingBottom = 10;
cancelBtn.cornerRadius = 4;
cancelBtn.fills = [{ type: 'SOLID', color: white }];
cancelBtn.strokes = [{ type: 'SOLID', color: gray200 }];
cancelBtn.strokeWeight = 1;
cancelBtn.primaryAxisSizingMode = 'AUTO';
cancelBtn.counterAxisSizingMode = 'AUTO';
cancelBtn.appendChild(text('Cancelar', 14, black, 'Medium'));

const addBtn = figma.createFrame();
addBtn.name = 'Add';
addBtn.layoutMode = 'HORIZONTAL';
addBtn.counterAxisAlignItems = 'CENTER';
addBtn.primaryAxisAlignItems = 'CENTER';
addBtn.paddingLeft = 20;
addBtn.paddingRight = 20;
addBtn.paddingTop = 10;
addBtn.paddingBottom = 10;
addBtn.cornerRadius = 4;
addBtn.fills = [{ type: 'SOLID', color: purple }];
addBtn.primaryAxisSizingMode = 'AUTO';
addBtn.counterAxisSizingMode = 'AUTO';
addBtn.appendChild(text('Adicionar', 14, white, 'Medium'));

footer.appendChild(cancelBtn);
footer.appendChild(addBtn);
drawer.appendChild(footer);

// ── posicionar na tela ────────────────────────────────────

const vp = figma.viewport.center;
drawer.x = vp.x - W / 2;
drawer.y = vp.y - 300;

figma.currentPage.appendChild(drawer);
figma.viewport.scrollAndZoomIntoView([drawer]);
figma.notify('MCP Trigger HTTP criado!');
