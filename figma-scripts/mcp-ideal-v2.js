// MCP Trigger HTTP — Drawer Ideal v2
// Abordagem: posicionamento manual (x,y) dentro de um frame fixo

const purple      = { r: 0.557, g: 0.235, b: 0.796 };
const purpleDark  = { r: 0.38, g: 0.14, b: 0.58 };
const purpleLight = { r: 0.95, g: 0.91, b: 0.99 };
const white       = { r: 1, g: 1, b: 1 };
const black       = { r: 0.12, g: 0.12, b: 0.12 };
const gray600     = { r: 0.30, g: 0.30, b: 0.30 };
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

// ── primitivos ────────────────────────────────────────────

function tx(str, size, color, weight = 'Regular') {
  const t = figma.createText();
  t.fontName = { family: 'Inter', style: weight };
  t.characters = String(str);
  t.fontSize = size;
  t.fills = [{ type: 'SOLID', color }];
  return t;
}

function box(w, h, fill, radius = 0, name = '') {
  const r = figma.createRectangle();
  r.resize(w, h);
  r.fills = fill ? [{ type: 'SOLID', color: fill }] : [];
  r.cornerRadius = radius;
  if (name) r.name = name;
  return r;
}

function frm(name, w, h, fill = null) {
  const f = figma.createFrame();
  f.name = name; f.resize(w, h);
  f.fills = fill ? [{ type: 'SOLID', color: fill }] : [];
  f.clipsContent = false;
  return f;
}

function row(name, w, h, fill = null) {
  const f = frm(name, w, h, fill);
  f.layoutMode = 'HORIZONTAL';
  f.counterAxisAlignItems = 'CENTER';
  f.itemSpacing = 8;
  f.primaryAxisSizingMode = 'FIXED';
  f.counterAxisSizingMode = 'FIXED';
  return f;
}

function col(name, w, fill = null) {
  const f = frm(name, w, 10, fill);
  f.layoutMode = 'VERTICAL';
  f.itemSpacing = 6;
  f.primaryAxisSizingMode = 'AUTO';
  f.counterAxisSizingMode = 'FIXED';
  return f;
}

function input(val, placeholder, w, h = 34) {
  const f = frm('Input', w, h, white);
  f.layoutMode = 'HORIZONTAL';
  f.counterAxisAlignItems = 'CENTER';
  f.paddingLeft = 12; f.paddingRight = 12;
  f.strokes = [{ type: 'SOLID', color: gray200 }];
  f.strokeWeight = 1; f.cornerRadius = 6;
  f.clipsContent = true;
  f.primaryAxisSizingMode = 'FIXED';
  f.counterAxisSizingMode = 'FIXED';
  f.appendChild(tx(val || placeholder, 13, val ? black : gray300));
  return f;
}

function dd(val, w, h = 34) {
  const f = frm('Dropdown', w, h, white);
  f.layoutMode = 'HORIZONTAL';
  f.primaryAxisAlignItems = 'SPACE_BETWEEN';
  f.counterAxisAlignItems = 'CENTER';
  f.paddingLeft = 12; f.paddingRight = 10;
  f.strokes = [{ type: 'SOLID', color: gray200 }];
  f.strokeWeight = 1; f.cornerRadius = 6;
  f.primaryAxisSizingMode = 'FIXED';
  f.counterAxisSizingMode = 'FIXED';
  f.appendChild(tx(val, 13, black));
  f.appendChild(tx('⌄', 13, gray500));
  return f;
}

function radio(label, active) {
  const f = frm(`Radio — ${label}`, 10, 20);
  f.layoutMode = 'HORIZONTAL';
  f.counterAxisAlignItems = 'CENTER';
  f.itemSpacing = 7;
  f.primaryAxisSizingMode = 'AUTO';
  f.counterAxisSizingMode = 'FIXED';
  const circle = figma.createEllipse();
  circle.resize(16, 16);
  circle.fills = [{ type: 'SOLID', color: white }];
  circle.strokes = [{ type: 'SOLID', color: active ? purple : gray200 }];
  circle.strokeWeight = active ? 4 : 1.5;
  f.appendChild(circle);
  f.appendChild(tx(label, 13, active ? black : gray600, active ? 'Medium' : 'Regular'));
  return f;
}

function chip(label, active) {
  const f = frm(`Chip — ${label}`, 10, 28);
  f.layoutMode = 'HORIZONTAL';
  f.counterAxisAlignItems = 'CENTER';
  f.paddingLeft = 12; f.paddingRight = 12;
  f.cornerRadius = 20;
  f.primaryAxisSizingMode = 'AUTO';
  f.counterAxisSizingMode = 'FIXED';
  f.fills = [{ type: 'SOLID', color: active ? purpleLight : gray100 }];
  f.strokes = [{ type: 'SOLID', color: active ? purple : gray200 }];
  f.strokeWeight = 1;
  f.appendChild(tx(label, 12, active ? purple : gray500, active ? 'Medium' : 'Regular'));
  return f;
}

function sectionLabel(label, action = null) {
  const f = row('Section Label', W - 32, 18);
  f.primaryAxisAlignItems = 'SPACE_BETWEEN';
  f.appendChild(tx(label.toUpperCase(), 10, gray500, 'Semi Bold'));
  if (action) f.appendChild(tx(action, 11, purple, 'Medium'));
  return f;
}

function fieldLabel(label) {
  return tx(label, 12, gray500, 'Medium');
}

function divider() {
  const r = box(W - 32, 1, gray200, 0, 'Divider');
  return r;
}

function urlRow(label, url, badgeTxt, badgeColor, badgeBg) {
  const wrap = col(`URL — ${label}`, W - 32);
  wrap.itemSpacing = 6;

  const topRow = row('Top', W - 32, 16);
  topRow.primaryAxisAlignItems = 'SPACE_BETWEEN';
  topRow.appendChild(tx(label, 10, gray500, 'Semi Bold'));
  const badge = frm('Badge', 10, 18);
  badge.layoutMode = 'HORIZONTAL';
  badge.counterAxisAlignItems = 'CENTER';
  badge.paddingLeft = 8; badge.paddingRight = 8;
  badge.cornerRadius = 9;
  badge.primaryAxisSizingMode = 'AUTO';
  badge.counterAxisSizingMode = 'FIXED';
  badge.fills = [{ type: 'SOLID', color: badgeBg }];
  badge.appendChild(tx(badgeTxt, 10, badgeColor, 'Medium'));
  topRow.appendChild(badge);
  wrap.appendChild(topRow);

  const urlF = row('URL Row', W - 32, 34, gray100);
  urlF.primaryAxisAlignItems = 'SPACE_BETWEEN';
  urlF.paddingLeft = 12; urlF.paddingRight = 12;
  urlF.strokes = [{ type: 'SOLID', color: gray200 }];
  urlF.strokeWeight = 1; urlF.cornerRadius = 6;
  urlF.clipsContent = true;
  urlF.appendChild(tx(url, 12, purple));
  urlF.appendChild(tx('⧉', 14, gray500));
  wrap.appendChild(urlF);

  return wrap;
}

// ── MONTAR O DRAWER ───────────────────────────────────────

const drawer = frm('MCP Trigger HTTP — Ideal', W, 10, white);
drawer.layoutMode = 'VERTICAL';
drawer.primaryAxisSizingMode = 'AUTO';
drawer.counterAxisSizingMode = 'FIXED';
drawer.cornerRadius = 10;
drawer.clipsContent = true;
drawer.effects = [{
  type: 'DROP_SHADOW',
  color: { r: 0, g: 0, b: 0, a: 0.18 },
  offset: { x: 0, y: 8 }, radius: 32, spread: 0,
  visible: true, blendMode: 'NORMAL'
}];

// ── HEADER ────────────────────────────────────────────────
{
  const h = row('Header', W, 60, null);
  h.fills = [{ type: 'SOLID', color: purple }];
  h.primaryAxisAlignItems = 'SPACE_BETWEEN';
  h.paddingLeft = 20; h.paddingRight = 20;
  h.counterAxisSizingMode = 'FIXED';
  h.primaryAxisSizingMode = 'FIXED';

  const left = frm('Left', 10, 40);
  left.layoutMode = 'HORIZONTAL';
  left.counterAxisAlignItems = 'CENTER';
  left.itemSpacing = 10;
  left.primaryAxisSizingMode = 'AUTO';
  left.counterAxisSizingMode = 'FIXED';

  const icon = frm('Icon', 32, 32, purpleDark);
  icon.cornerRadius = 8;
  icon.layoutMode = 'HORIZONTAL';
  icon.primaryAxisAlignItems = 'CENTER';
  icon.counterAxisAlignItems = 'CENTER';
  icon.appendChild(tx('⚡', 16, white));
  left.appendChild(icon);

  const titles = col('Titles', 10);
  titles.itemSpacing = 2;
  titles.appendChild(tx('MCP Trigger HTTP', 14, white, 'Semi Bold'));
  titles.appendChild(tx('Expõe workflows como tools para agentes AI', 11, { r: 0.82, g: 0.72, b: 0.92 }));
  left.appendChild(titles);
  h.appendChild(left);
  h.appendChild(tx('✕', 16, white));
  drawer.appendChild(h);
}

// ── BODY ──────────────────────────────────────────────────
{
  const body = frm('Body', W, 10, white);
  body.layoutMode = 'VERTICAL';
  body.primaryAxisSizingMode = 'AUTO';
  body.counterAxisSizingMode = 'FIXED';
  body.paddingLeft = 16; body.paddingRight = 16;
  body.paddingTop = 20; body.paddingBottom = 20;
  body.itemSpacing = 20;

  // ── 1. Configuração Básica ────────────────────────────
  {
    const s = col('Basic Section', W - 32);
    s.itemSpacing = 10;
    s.appendChild(sectionLabel('Configuração Básica'));

    const r = row('Name + Version', W - 32, 34 + 20);
    r.counterAxisAlignItems = 'MIN';
    r.itemSpacing = 10;

    const nw = col('F-Name', 220);
    nw.appendChild(fieldLabel('Nome do servidor'));
    nw.appendChild(input('Atendimento XYZ', '', 220));
    r.appendChild(nw);

    const vw = col('F-Version', 114);
    vw.appendChild(fieldLabel('Versão'));
    vw.appendChild(input('1.0', '', 114));
    r.appendChild(vw);

    s.appendChild(r);
    body.appendChild(s);
    body.appendChild(divider());
  }

  // ── 2. Tools ──────────────────────────────────────────
  {
    const s = col('Tools Section', W - 32);
    s.itemSpacing = 10;
    s.appendChild(sectionLabel('Tools', '+ Add Tool'));

    // tool card
    const card = frm('Tool Card', W - 32, 10, white);
    card.layoutMode = 'VERTICAL';
    card.primaryAxisSizingMode = 'AUTO';
    card.counterAxisSizingMode = 'FIXED';
    card.itemSpacing = 12;
    card.paddingTop = 14; card.paddingBottom = 14;
    card.paddingLeft = 14; card.paddingRight = 14;
    card.strokes = [{ type: 'SOLID', color: gray200 }];
    card.strokeWeight = 1; card.cornerRadius = 8;
    card.clipsContent = false;

    const cw = W - 32 - 28; // card inner width

    // nome
    const fn = col('F-ToolName', cw);
    fn.appendChild(fieldLabel('Nome'));
    fn.appendChild(input('consultar_pedido', '', cw));
    card.appendChild(fn);

    // descricao + AI btn
    const fd = col('F-Desc', cw);
    const dl = row('Desc Label Row', cw, 16);
    dl.primaryAxisAlignItems = 'SPACE_BETWEEN';
    dl.appendChild(fieldLabel('Descrição'));
    const aib = frm('AI Btn', 10, 20);
    aib.layoutMode = 'HORIZONTAL';
    aib.counterAxisAlignItems = 'CENTER';
    aib.paddingLeft = 8; aib.paddingRight = 8;
    aib.cornerRadius = 10;
    aib.primaryAxisSizingMode = 'AUTO';
    aib.counterAxisSizingMode = 'FIXED';
    aib.fills = [{ type: 'SOLID', color: purpleLight }];
    aib.appendChild(tx('✦ Gerar com IA', 10, purple, 'Medium'));
    dl.appendChild(aib);
    fd.appendChild(dl);
    fd.appendChild(input('Consulta o status de um pedido', '', cw));
    card.appendChild(fd);

    card.appendChild(box(cw, 1, gray200, 0, 'Divider'));

    // properties header
    const ph = row('Props Header', cw, 18);
    ph.primaryAxisAlignItems = 'SPACE_BETWEEN';
    ph.appendChild(tx('PROPERTIES', 10, gray500, 'Semi Bold'));
    ph.appendChild(tx('+ Adicionar', 11, purple, 'Medium'));
    card.appendChild(ph);

    // col headers
    const ch = row('Col H', cw, 14);
    ch.itemSpacing = 6;
    const nc = tx('name', 10, gray500); nc.resize(148, nc.height);
    ch.appendChild(nc);
    ch.appendChild(tx('type', 10, gray500));
    card.appendChild(ch);

    // property rows
    function propRow(n, t) {
      const r = row(`Prop — ${n}`, cw, 32);
      r.itemSpacing = 6;
      r.appendChild(input(n, '', 148, 32));
      r.appendChild(dd(t, 96, 32));
      r.appendChild(tx('×', 15, gray300));
      return r;
    }
    card.appendChild(propRow('pedido_id', 'string'));
    card.appendChild(propRow('email', 'string'));

    card.appendChild(box(cw, 1, gray200, 0, 'Divider2'));

    // required
    const rh = row('Req Header', cw, 16);
    rh.itemSpacing = 6;
    rh.appendChild(tx('REQUIRED', 10, gray500, 'Semi Bold'));
    rh.appendChild(tx('— marque os campos obrigatórios', 10, gray300));
    card.appendChild(rh);

    const chips = row('Chips', cw, 28);
    chips.itemSpacing = 6;
    chips.appendChild(chip('pedido_id', true));
    chips.appendChild(chip('email', false));
    card.appendChild(chips);

    s.appendChild(card);
    body.appendChild(s);
    body.appendChild(divider());
  }

  // ── 3. Autenticação ───────────────────────────────────
  {
    const s = col('Auth Section', W - 32);
    s.itemSpacing = 10;
    s.appendChild(sectionLabel('Autenticação'));

    const opts = row('Auth Options', W - 32, 20);
    opts.itemSpacing = 24;
    opts.appendChild(radio('Nenhuma', true));
    opts.appendChild(radio('Bearer Token', false));
    opts.appendChild(radio('API Key', false));
    s.appendChild(opts);

    // warning
    const warn = row('Warning', W - 32, 20);
    warn.itemSpacing = 6;
    const dot = figma.createEllipse();
    dot.resize(7, 7); dot.name = 'Dot';
    dot.fills = [{ type: 'SOLID', color: orange }];
    warn.appendChild(dot);
    warn.appendChild(tx('Nenhuma autenticação — não recomendado em produção', 11, orange));
    s.appendChild(warn);

    body.appendChild(s);
    body.appendChild(divider());
  }

  // ── 4. Endpoint ───────────────────────────────────────
  {
    const s = col('Endpoint Section', W - 32);
    s.itemSpacing = 12;
    s.appendChild(sectionLabel('Endpoint'));

    s.appendChild(urlRow('TEST URL', 'https://ipaas.io/mcp/test/abc123', 'inativo', orange, orangeLight));
    s.appendChild(urlRow('PRODUCTION URL', 'https://ipaas.io/mcp/abc123', '● ativo', green, greenLight));

    const clientRow = row('Clients', W - 32, 18);
    clientRow.itemSpacing = 6;
    const dot = figma.createEllipse();
    dot.resize(8, 8); dot.name = 'Dot';
    dot.fills = [{ type: 'SOLID', color: green }];
    clientRow.appendChild(dot);
    clientRow.appendChild(tx('1 cliente conectado agora', 12, gray500));
    s.appendChild(clientRow);

    body.appendChild(s);
  }

  drawer.appendChild(body);
}

// ── FOOTER ────────────────────────────────────────────────
{
  const footer = row('Footer', W, 60, white);
  footer.primaryAxisAlignItems = 'MAX';
  footer.paddingLeft = 16; footer.paddingRight = 16;
  footer.itemSpacing = 8;
  footer.primaryAxisSizingMode = 'FIXED';
  footer.counterAxisSizingMode = 'FIXED';
  footer.strokes = [{ type: 'SOLID', color: gray200 }];
  footer.strokeTopWeight = 1;
  footer.strokeBottomWeight = 0;
  footer.strokeLeftWeight = 0;
  footer.strokeRightWeight = 0;

  const cancelBtn = frm('Cancel', 10, 36, white);
  cancelBtn.layoutMode = 'HORIZONTAL';
  cancelBtn.primaryAxisAlignItems = 'CENTER';
  cancelBtn.counterAxisAlignItems = 'CENTER';
  cancelBtn.paddingLeft = 20; cancelBtn.paddingRight = 20;
  cancelBtn.cornerRadius = 6;
  cancelBtn.primaryAxisSizingMode = 'AUTO';
  cancelBtn.counterAxisSizingMode = 'FIXED';
  cancelBtn.strokes = [{ type: 'SOLID', color: gray200 }];
  cancelBtn.strokeWeight = 1;
  cancelBtn.appendChild(tx('Cancelar', 13, black, 'Medium'));

  const saveBtn = frm('Save', 10, 36, purple);
  saveBtn.layoutMode = 'HORIZONTAL';
  saveBtn.primaryAxisAlignItems = 'CENTER';
  saveBtn.counterAxisAlignItems = 'CENTER';
  saveBtn.paddingLeft = 20; saveBtn.paddingRight = 20;
  saveBtn.cornerRadius = 6;
  saveBtn.primaryAxisSizingMode = 'AUTO';
  saveBtn.counterAxisSizingMode = 'FIXED';
  saveBtn.appendChild(tx('Salvar', 13, white, 'Medium'));

  footer.appendChild(cancelBtn);
  footer.appendChild(saveBtn);
  drawer.appendChild(footer);
}

// ── posicionar ────────────────────────────────────────────
const vp = figma.viewport.center;
drawer.x = vp.x + 520;
drawer.y = vp.y - 500;
figma.currentPage.appendChild(drawer);
figma.currentPage.selection = [drawer];
figma.viewport.scrollAndZoomIntoView([drawer]);
figma.notify('Drawer ideal v2 criado!');
