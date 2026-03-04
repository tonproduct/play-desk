// Fix — separa `required` das properties
// Schema: properties[]{name, type} + required:[string] são campos distintos do tool

const purple      = { r: 0.557, g: 0.235, b: 0.796 };
const white       = { r: 1, g: 1, b: 1 };
const black       = { r: 0.12, g: 0.12, b: 0.12 };
const gray500     = { r: 0.43, g: 0.43, b: 0.43 };
const gray200     = { r: 0.88, g: 0.88, b: 0.88 };
const gray100     = { r: 0.96, g: 0.96, b: 0.96 };
const purpleLight = { r: 0.95, g: 0.91, b: 0.99 };

await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
await figma.loadFontAsync({ family: 'Inter', style: 'Medium' });
await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });

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

// Property row: só name + type + delete (sem required aqui)
function propertyRow(nameVal, typeVal) {
  const row = figma.createFrame();
  row.name = `Property — ${nameVal}`;
  row.layoutMode = 'HORIZONTAL';
  row.counterAxisAlignItems = 'CENTER';
  row.itemSpacing = 6;
  row.fills = [];
  row.primaryAxisSizingMode = 'AUTO';
  row.counterAxisSizingMode = 'AUTO';

  row.appendChild(inputBox(nameVal, 150));
  row.appendChild(dropdown(typeVal, 100));

  const del = text('×', 16, gray500);
  del.name = 'Delete';
  row.appendChild(del);

  return row;
}

// Chip de campo required
function requiredChip(name, active) {
  const chip = figma.createFrame();
  chip.name = `Chip — ${name}`;
  chip.layoutMode = 'HORIZONTAL';
  chip.counterAxisAlignItems = 'CENTER';
  chip.itemSpacing = 5;
  chip.paddingLeft = 10;
  chip.paddingRight = 10;
  chip.paddingTop = 5;
  chip.paddingBottom = 5;
  chip.cornerRadius = 20;
  chip.primaryAxisSizingMode = 'AUTO';
  chip.counterAxisSizingMode = 'AUTO';
  chip.fills = active
    ? [{ type: 'SOLID', color: purpleLight }]
    : [{ type: 'SOLID', color: gray100 }];
  chip.strokes = [{ type: 'SOLID', color: active ? purple : gray200 }];
  chip.strokeWeight = 1;

  const dot = figma.createEllipse();
  dot.resize(6, 6);
  dot.fills = [{ type: 'SOLID', color: active ? purple : gray500 }];
  dot.name = 'Dot';
  chip.appendChild(dot);
  chip.appendChild(text(name, 12, active ? purple : gray500, active ? 'Medium' : 'Regular'));

  return chip;
}

// ── localiza o Tool Card ──────────────────────────────────

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

// Remove tudo que é de params/required antigo
const toRemove = toolCard.children.filter(n =>
  n.name === 'Params Header' ||
  n.name === 'Col Headers' ||
  n.name.startsWith('Param —') ||
  n.name.startsWith('Property —') ||
  n.name === 'Required Section'
);
toRemove.forEach(n => n.remove());

const cardInnerW = toolCard.width - 28;

// ── PROPERTIES section ───────────────────────────────────

const propertiesHeader = figma.createFrame();
propertiesHeader.name = 'Properties Header';
propertiesHeader.resize(cardInnerW, 20);
propertiesHeader.layoutMode = 'HORIZONTAL';
propertiesHeader.primaryAxisAlignItems = 'SPACE_BETWEEN';
propertiesHeader.counterAxisAlignItems = 'CENTER';
propertiesHeader.fills = [];

propertiesHeader.appendChild(text('properties', 11, gray500, 'Semi Bold'));
propertiesHeader.appendChild(text('+ Property', 11, purple, 'Medium'));
toolCard.appendChild(propertiesHeader);

// Col headers
const colRow = figma.createFrame();
colRow.name = 'Col Headers';
colRow.layoutMode = 'HORIZONTAL';
colRow.counterAxisAlignItems = 'CENTER';
colRow.itemSpacing = 6;
colRow.fills = [];
colRow.primaryAxisSizingMode = 'AUTO';
colRow.counterAxisSizingMode = 'AUTO';
colRow.appendChild(text('name', 10, gray500));
const typeColLabel = text('type', 10, gray500);
typeColLabel.x = 156;
colRow.appendChild(typeColLabel);
toolCard.appendChild(colRow);

// Property rows (só name + type)
toolCard.appendChild(propertyRow('pedido_id', 'string'));
toolCard.appendChild(propertyRow('email', 'string'));

// Divider interno
const innerDivider = figma.createRectangle();
innerDivider.name = 'Divider';
innerDivider.resize(cardInnerW, 1);
innerDivider.fills = [{ type: 'SOLID', color: gray200 }];
toolCard.appendChild(innerDivider);

// ── REQUIRED section ─────────────────────────────────────

const requiredSection = figma.createFrame();
requiredSection.name = 'Required Section';
requiredSection.layoutMode = 'VERTICAL';
requiredSection.itemSpacing = 8;
requiredSection.fills = [];
requiredSection.primaryAxisSizingMode = 'AUTO';
requiredSection.counterAxisSizingMode = 'FIXED';
requiredSection.resize(cardInnerW, 20);

const reqHeader = figma.createFrame();
reqHeader.name = 'Required Header';
reqHeader.resize(cardInnerW, 16);
reqHeader.layoutMode = 'HORIZONTAL';
reqHeader.counterAxisAlignItems = 'CENTER';
reqHeader.itemSpacing = 6;
reqHeader.fills = [];

reqHeader.appendChild(text('required', 11, gray500, 'Semi Bold'));
const hint = text('— clique para marcar os campos obrigatórios', 10, gray500);
reqHeader.appendChild(hint);
requiredSection.appendChild(reqHeader);

// Chips — pedido_id ativo, email inativo
const chipsRow = figma.createFrame();
chipsRow.name = 'Chips';
chipsRow.layoutMode = 'HORIZONTAL';
chipsRow.itemSpacing = 6;
chipsRow.fills = [];
chipsRow.primaryAxisSizingMode = 'AUTO';
chipsRow.counterAxisSizingMode = 'AUTO';
chipsRow.appendChild(requiredChip('pedido_id', true));
chipsRow.appendChild(requiredChip('email', false));
requiredSection.appendChild(chipsRow);

toolCard.appendChild(requiredSection);

figma.viewport.scrollAndZoomIntoView([drawer]);
figma.notify('required separado das properties!');
