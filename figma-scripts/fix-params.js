// Fix — reconstrói a seção de Parâmetros no Tool Card
// com campos editáveis: name (input) + type (dropdown) + required (checkbox) + delete

const purple      = { r: 0.557, g: 0.235, b: 0.796 };
const white       = { r: 1, g: 1, b: 1 };
const black       = { r: 0.12, g: 0.12, b: 0.12 };
const gray500     = { r: 0.43, g: 0.43, b: 0.43 };
const gray200     = { r: 0.88, g: 0.88, b: 0.88 };
const gray100     = { r: 0.96, g: 0.96, b: 0.96 };
const purpleLight = { r: 0.95, g: 0.91, b: 0.99 };
const red         = { r: 0.85, g: 0.22, b: 0.22 };

await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
await figma.loadFontAsync({ family: 'Inter', style: 'Medium' });
await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });

// ── helpers ──────────────────────────────────────────────

function text(content, size, color, weight = 'Regular') {
  const t = figma.createText();
  t.fontName = { family: 'Inter', style: weight };
  t.characters = content;
  t.fontSize = size;
  t.fills = [{ type: 'SOLID', color }];
  return t;
}

function inputBox(value, w) {
  const wrap = figma.createFrame();
  wrap.name = 'Input';
  wrap.resize(w, 32);
  wrap.layoutMode = 'HORIZONTAL';
  wrap.counterAxisAlignItems = 'CENTER';
  wrap.fills = [{ type: 'SOLID', color: white }];
  wrap.strokes = [{ type: 'SOLID', color: gray200 }];
  wrap.strokeWeight = 1;
  wrap.cornerRadius = 4;
  wrap.paddingLeft = 10;
  wrap.paddingRight = 10;
  wrap.clipsContent = true;
  wrap.primaryAxisSizingMode = 'FIXED';
  wrap.counterAxisSizingMode = 'FIXED';
  wrap.appendChild(text(value, 12, black));
  return wrap;
}

function dropdown(selected, w) {
  const wrap = figma.createFrame();
  wrap.name = 'Dropdown Type';
  wrap.resize(w, 32);
  wrap.layoutMode = 'HORIZONTAL';
  wrap.primaryAxisAlignItems = 'SPACE_BETWEEN';
  wrap.counterAxisAlignItems = 'CENTER';
  wrap.fills = [{ type: 'SOLID', color: white }];
  wrap.strokes = [{ type: 'SOLID', color: gray200 }];
  wrap.strokeWeight = 1;
  wrap.cornerRadius = 4;
  wrap.paddingLeft = 10;
  wrap.paddingRight = 8;
  wrap.primaryAxisSizingMode = 'FIXED';
  wrap.counterAxisSizingMode = 'FIXED';
  wrap.appendChild(text(selected, 12, black));
  wrap.appendChild(text('⌄', 12, gray500));
  return wrap;
}

function checkbox(checked) {
  const box = figma.createFrame();
  box.name = checked ? 'Checkbox — checked' : 'Checkbox';
  box.resize(16, 16);
  box.cornerRadius = 3;
  box.fills = checked
    ? [{ type: 'SOLID', color: purple }]
    : [{ type: 'SOLID', color: white }];
  box.strokes = [{ type: 'SOLID', color: checked ? purple : gray200 }];
  box.strokeWeight = 1.5;
  if (checked) {
    box.layoutMode = 'HORIZONTAL';
    box.primaryAxisAlignItems = 'CENTER';
    box.counterAxisAlignItems = 'CENTER';
    const check = text('✓', 10, white, 'Medium');
    box.appendChild(check);
  }
  return box;
}

// ── param row ────────────────────────────────────────────
// Layout: [input name] [dropdown type] [checkbox required] [×]

function paramRow(nameVal, typeVal, required) {
  const row = figma.createFrame();
  row.name = `Param — ${nameVal}`;
  row.layoutMode = 'HORIZONTAL';
  row.counterAxisAlignItems = 'CENTER';
  row.itemSpacing = 6;
  row.fills = [];
  row.primaryAxisSizingMode = 'AUTO';
  row.counterAxisSizingMode = 'AUTO';

  // name input (cresce)
  const nameInput = inputBox(nameVal, 130);
  row.appendChild(nameInput);

  // type dropdown
  const typeDD = dropdown(typeVal, 90);
  row.appendChild(typeDD);

  // required checkbox + label
  const reqWrap = figma.createFrame();
  reqWrap.name = 'Required';
  reqWrap.layoutMode = 'HORIZONTAL';
  reqWrap.counterAxisAlignItems = 'CENTER';
  reqWrap.itemSpacing = 4;
  reqWrap.fills = [];
  reqWrap.primaryAxisSizingMode = 'AUTO';
  reqWrap.counterAxisSizingMode = 'AUTO';
  reqWrap.appendChild(checkbox(required));
  const reqLabel = text('required', 11, gray500);
  reqWrap.appendChild(reqLabel);
  row.appendChild(reqWrap);

  // delete
  const del = text('×', 16, gray500);
  del.name = 'Delete';
  row.appendChild(del);

  return row;
}

// ── localiza e reconstrói ─────────────────────────────────

function findByName(node, name) {
  if (node.name === name) return node;
  if ('children' in node) {
    for (const child of node.children) {
      const found = findByName(child, name);
      if (found) return found;
    }
  }
  return null;
}

const drawer = figma.currentPage.children.find(n => n.name === 'MCP Trigger HTTP — Node Config');
if (!drawer) { figma.notify('Drawer não encontrado!'); return; }

const toolCard = findByName(drawer, 'Tool Card');
if (!toolCard) { figma.notify('Tool Card não encontrado!'); return; }

// Remove nodes antigos de params (Params Header, Param —*, Add Param btn)
const toRemove = toolCard.children.filter(n =>
  n.name === 'Params Header' ||
  n.name.startsWith('Param —') ||
  n.name === 'Add Param Row'
);
toRemove.forEach(n => n.remove());

// Seção Parâmetros — header
const paramsHeader = figma.createFrame();
paramsHeader.name = 'Params Header';
paramsHeader.layoutMode = 'HORIZONTAL';
paramsHeader.primaryAxisAlignItems = 'SPACE_BETWEEN';
paramsHeader.counterAxisAlignItems = 'CENTER';
paramsHeader.fills = [];
paramsHeader.primaryAxisSizingMode = 'AUTO';
paramsHeader.counterAxisSizingMode = 'FIXED';
paramsHeader.resize(toolCard.width - 28, 20);

paramsHeader.appendChild(text('Parâmetros', 11, gray500, 'Semi Bold'));
paramsHeader.appendChild(text('+ Parâmetro', 11, purple, 'Medium'));
toolCard.appendChild(paramsHeader);

// Legenda de colunas
const colHeaders = figma.createFrame();
colHeaders.name = 'Col Headers';
colHeaders.layoutMode = 'HORIZONTAL';
colHeaders.counterAxisAlignItems = 'CENTER';
colHeaders.itemSpacing = 6;
colHeaders.fills = [];
colHeaders.primaryAxisSizingMode = 'AUTO';
colHeaders.counterAxisSizingMode = 'AUTO';

const nameCol = text('name', 10, gray500);
nameCol.resize(130, nameCol.height);
const typeCol = text('type', 10, gray500);
typeCol.resize(90, typeCol.height);
const reqCol  = text('required', 10, gray500);

colHeaders.appendChild(nameCol);
colHeaders.appendChild(typeCol);
colHeaders.appendChild(reqCol);
toolCard.appendChild(colHeaders);

// Linhas de parâmetros
toolCard.appendChild(paramRow('pedido_id', 'string', true));
toolCard.appendChild(paramRow('email', 'string', false));

figma.viewport.scrollAndZoomIntoView([drawer]);
figma.notify('Parâmetros corrigidos!');
