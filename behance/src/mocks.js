// Telas ilustrativas do Pinas Kit para o estudo de caso (dados de exemplo).
const WA = `<svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.46-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.63.71.22 1.36.2 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.18-1.41-.08-.13-.27-.2-.57-.35M12.05 21.8a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88a9.82 9.82 0 0 1 9.88 9.89c0 5.45-4.44 9.88-9.89 9.88M20.46 3.49A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.69 1.45c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.17-3.48-8.42Z"/></svg>`;
const LOGO = (c = "#0f172a", k = "#2563eb") => `<span class="logo" style="color:${c}">p<span class="i">ı<svg viewBox="0 0 16 15"><path fill="${k}" d="M8 0a7 6.3 0 1 1-3.4 11.8L1 13.5l1.2-3.4A6.3 6.3 0 0 1 8 0z"/></svg></span>nas<em style="color:${k}">kit</em></span>`;
const MARK = (s = 64) => `<svg viewBox="0 0 64 64" width="${s}" height="${s}"><rect width="64" height="64" rx="14" fill="#0b1018"/><path d="M14 52V12h11a10 10 0 0 1 0 20H14" fill="none" stroke="#ece9e1" stroke-width="7" stroke-linejoin="round"/><path d="M36 12v40M54 12L39 32l16 20" fill="none" stroke="#ece9e1" stroke-width="7"/><path d="M27 38l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#facc15"/></svg>`;
const ICON = {
  home: '<path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z"/>',
  users: '<circle cx="9" cy="8" r="4"/><path d="M2 21c0-4 3-6 7-6s7 2 7 6M16 4a4 4 0 0 1 0 8M22 21c0-3-1.5-5-4-5.6"/>',
  board: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v12"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>',
  click: '<path d="M9 9l11 4-5 2-2 5z"/><path d="M5 3v3M3 5h3M5 11l2-2"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21h4"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.7M12 17h.01"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  tag: '<path d="M3 12V3h9l9 9-9 9z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
};
const I = (n, s = 16) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICON[n]}</svg>`;

const PEOPLE = [
  ["Ana Souza", "Google Ads", "Quente", "#f59e0b"], ["Bruno Lima", "Meta Ads", "Morno", "#3b82f6"], ["Carla Dias", "Instagram", "Quente", "#f59e0b"],
  ["Diego Alves", "Google Ads", "Frio", "#94a3b8"], ["Elisa Rocha", "Acesso direto", "Morno", "#3b82f6"], ["Felipe Nunes", "Meta Ads", "Quente", "#f59e0b"],
  ["Gabi Martins", "Google Ads", "Morno", "#3b82f6"], ["Hugo Prado", "Instagram", "Frio", "#94a3b8"],
];
const AV = ["#2563eb", "#8b5cf6", "#ec4899", "#10b981", "#f59e0b", "#0ea5e9", "#ef4444", "#14b8a6"];
const avatar = (n, i, s = 32) => `<span class="av" style="width:${s}px;height:${s}px;background:${AV[i % AV.length]};font-size:${s * 0.4}px">${n.split(" ").map((x) => x[0]).join("")}</span>`;

function topbar(active = 0, dark = false) {
  const nav = ["Início", "Botões e formulários", "Contatos", "Funil", "Relatórios", "Configurações"];
  return `<div class="tb">${LOGO(dark ? "#e5eaf2" : "#0f172a", dark ? "#60a5fa" : "#2563eb")}
    <div class="pills">${nav.map((n, i) => `<span class="${i === active ? "on" : ""}">${n}</span>`).join("")}</div>
    <div class="tb-r"><span class="circ">${I("help", 17)}</span><span class="circ">${I("bell", 17)}<b>3</b></span>
    <span class="me">${avatar("Pinas", 0, 34)}<span><b>Studio Pinas</b><small>contato@studiopinas.com</small></span></span></div></div>`;
}

function area(w = 560, h = 170, vals = [12, 18, 15, 24, 20, 28, 26, 34, 30, 41, 37, 46, 43, 52], color = "#2563eb", id = "g") {
  const max = Math.max(...vals) * 1.15, step = w / (vals.length - 1);
  const pts = vals.map((v, i) => [i * step, h - (v / max) * h]);
  const d = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}" preserveAspectRatio="none" class="area"><defs><linearGradient id="${id}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".28"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>
    ${[0.25, 0.5, 0.75].map((y) => `<line x1="0" x2="${w}" y1="${h * y}" y2="${h * y}" stroke="currentColor" stroke-opacity=".08" stroke-dasharray="4 6"/>`).join("")}
    <path d="${d} L${w},${h} L0,${h}Z" fill="url(#${id})"/><path class="line" d="${d}" fill="none" stroke="${color}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
    <circle cx="${pts[11][0]}" cy="${pts[11][1]}" r="6" fill="#fff" stroke="${color}" stroke-width="3"/></svg>`;
}

function donut(size = 150, parts = [[46, "#2563eb"], [32, "#8b5cf6"], [14, "#ec4899"], [8, "#94a3b8"]]) {
  const r = 52, c = 2 * Math.PI * r; let off = 0;
  return `<svg viewBox="0 0 130 130" width="${size}" height="${size}" class="donut"><circle cx="65" cy="65" r="${r}" fill="none" stroke="currentColor" stroke-opacity=".08" stroke-width="16"/>
    ${parts.map(([p, col]) => { const s = `<circle cx="65" cy="65" r="${r}" fill="none" stroke="${col}" stroke-width="16" stroke-dasharray="${(p / 100) * c - 3} ${c}" stroke-dashoffset="${-off}" transform="rotate(-90 65 65)" stroke-linecap="round"/>`; off += (p / 100) * c; return s; }).join("")}
    <text x="65" y="62" text-anchor="middle" font-size="22" font-weight="700" fill="currentColor">248</text><text x="65" y="80" text-anchor="middle" font-size="10" fill="currentColor" opacity=".55">contatos</text></svg>`;
}

const kpi = (l, v, sub, col, ic) => `<div class="card kpi"><div class="row"><span class="mute">${l}</span><span class="ic" style="background:${col}1a;color:${col}">${I(ic, 16)}</span></div><b>${v}</b><span class="mute sm">${sub}</span></div>`;

function dashboard(dark = false) {
  return `<div class="app ${dark ? "dark" : ""}">${topbar(0, dark)}<div class="pg">
    <div class="row"><div><h1>Olá, Studio Pinas!</h1><p class="mute">Veja como estão chegando os contatos do seu negócio.</p></div>
    <div class="seg"><span>7 dias</span><span class="on">30 dias</span><span>90 dias</span></div></div>
    <div class="g4">${kpi("Pessoas que viram", "3.912", "Viram seu botão ou formulário", "#0ea5e9", "click")}${kpi("Cliques no WhatsApp", "486", "Taxa de clique: 12,4%", "#8b5cf6", "click")}${kpi("Contatos recebidos", "248", "Viraram contato: 51%", "#2563eb", "users")}${kpi("Vendas registradas", "31", "Concluídas no funil", "#10b981", "chart")}</div>
    <div class="g21"><div class="card"><div class="row"><b>Contatos por dia</b><span class="chip blue">+18% vs. período anterior</span></div>${area(640, 190, undefined, "#2563eb", dark ? "gd" : "gl")}<div class="axis">${["01/10", "05/10", "10/10", "15/10", "20/10", "25/10", "30/10"].map((d) => `<span>${d}</span>`).join("")}</div></div>
    <div class="card"><b>Origem dos contatos</b><div class="dn">${donut(150)}<ul>${[["Google Ads", 46, "#2563eb"], ["Meta Ads", 32, "#8b5cf6"], ["Instagram", 14, "#ec4899"], ["Acesso direto", 8, "#94a3b8"]].map(([n, p, c]) => `<li><i style="background:${c}"></i>${n}<b>${p}%</b></li>`).join("")}</ul></div></div></div>
    <div class="card"><div class="row"><b>Últimos contatos</b><span class="link">Ver todos</span></div><table>${PEOPLE.slice(0, 4).map(([n, s, t, c], i) => `<tr><td>${avatar(n, i, 30)}<b>${n}</b></td><td class="mute">${s}</td><td><span class="chip" style="background:${c}1f;color:${c}">${t}</span></td><td class="mute">há ${i * 7 + 3} min</td><td><span class="wa">${WA} WhatsApp</span></td></tr>`).join("")}</table></div>
  </div></div>`;
}

const STAGES = [["Novo", "#0ea5e9", [0, 1, 7]], ["Em atendimento", "#3b82f6", [2, 4]], ["Proposta enviada", "#8b5cf6", [3, 6]], ["Negociação", "#f59e0b", [5]], ["Venda concluída", "#10b981", [1]]];
const lead = (i, extra = "") => { const [n, s, t, c] = PEOPLE[i]; return `<div class="lead ${extra}"><div class="row">${avatar(n, i, 26)}<b>${n}</b><span class="dot" style="background:${c}"></span></div><span class="mute sm">${s} · promo-outubro</span><div class="row sm"><span class="chip gray">${t}</span><span class="wa sm">${WA}</span></div></div>`; };
function funnel() {
  return `<div class="app">${topbar(3)}<div class="pg"><div class="row"><div><h1>Funil</h1><p class="mute">Arraste os contatos entre as etapas para organizar o atendimento.</p></div><span class="btn ghost">Editar etapas</span></div>
    <div class="filters"><span class="inp">${I("search", 15)} Buscar contato pelo nome</span><span class="inp">Toda temperatura ▾</span><span class="inp">Todas as origens ▾</span></div>
    <div class="kan">${STAGES.map(([t, c, ids]) => `<div class="col"><i style="background:${c}"></i><div class="row"><b>${t}</b><span class="cnt">${ids.length}</span></div>${ids.map((id) => lead(id)).join("")}</div>`).join("")}</div></div></div>`;
}

function contact() {
  return `<div class="app">${topbar(2)}<div class="pg"><div class="g12">
    <div class="card"><div class="row">${avatar("Ana Souza", 0, 56)}<div style="flex:1"><h1>Ana Souza</h1><p class="mute">+55 (11) 9 8765-4321 · ana.souza@email.com</p></div><span class="wa big">${WA} Abrir WhatsApp</span></div>
      <div class="g3 mt">${[["Origem", "Google Ads"], ["Campanha", "promo-outubro"], ["Temperatura", "Quente · 48 pts"]].map(([a, b]) => `<div class="box"><span class="mute sm">${a}</span><b>${b}</b></div>`).join("")}</div>
      <div class="mt"><b>Etapa do funil</b><div class="steps">${STAGES.map(([t, c], i) => `<span class="${i === 2 ? "on" : ""}" style="${i === 2 ? `background:${c};color:#fff` : ""}">${t}</span>`).join("")}</div></div>
      <div class="remind mt">${I("clock", 16)} Retornar hoje às 15:00 · mandar orçamento atualizado</div></div>
    <div class="card"><b>Jornada no site</b><ul class="tl">${[["22/10 · 09:14", "Chegou pelo Google Ads", "/servicos"], ["22/10 · 09:16", "Viu a página", "/precos"], ["24/10 · 18:40", "Voltou pelo Instagram", "/portfolio"], ["24/10 · 18:43", "Preencheu o formulário", "Quer orçamento"], ["24/10 · 18:43", "Abriu o WhatsApp", "Mensagem pronta enviada"]].map(([d, a, b], i) => `<li class="${i === 3 ? "hl" : ""}"><span class="mute sm">${d}</span><b>${a}</b><span class="mute sm">${b}</span></li>`).join("")}</ul>
      <div class="tags mt">${I("tag", 14)}<span class="chip blue">orçamento</span><span class="chip violet">site novo</span><span class="chip gray">+ etiqueta</span></div></div></div></div></div>`;
}

function reports() {
  const rows = [["Google Ads", 112, 14, "R$ 9.800", 92], ["Meta Ads", 80, 9, "R$ 6.300", 66], ["Instagram", 35, 5, "R$ 3.100", 30], ["Acesso direto", 21, 3, "R$ 1.900", 18]];
  return `<div class="app">${topbar(4)}<div class="pg"><div class="row"><div><h1>Relatórios</h1><p class="mute">Qual origem traz contatos — e qual traz vendas.</p></div><span class="btn ghost">Exportar planilha</span></div>
    <div class="card"><table class="rep"><tr class="mute"><td>Origem</td><td>Contatos</td><td>Vendas</td><td>Conversão</td><td>Vendido</td><td style="width:30%"></td></tr>
    ${rows.map(([o, c, v, r, w], i) => `<tr><td><b>${o}</b></td><td>${c}</td><td class="green"><b>${v}</b></td><td>${((v / c) * 100).toFixed(1).replace(".", ",")}%</td><td><b>${r}</b></td><td><div class="bar"><i style="width:${w}%;background:${["#2563eb", "#8b5cf6", "#ec4899", "#94a3b8"][i]}"></i></div></td></tr>`).join("")}</table></div>
    <div class="g2"><div class="card"><b>Vendas por semana</b><div class="bars">${[4, 6, 5, 8, 7, 10, 9, 12].map((h, i) => `<i style="height:${h * 13}px;${i === 7 ? "background:#2563eb" : ""}"></i>`).join("")}</div></div>
    <div class="card"><b>Campanhas que mais vendem</b>${[["promo-outubro", 11], ["black-friday-teaser", 7], ["remarketing-site", 5]].map(([n, v]) => `<div class="row li"><span>${n}</span><b class="green">${v} vendas</b></div>`).join("")}</div></div></div></div>`;
}

function site(open = true) {
  return `<div class="site"><div class="nav"><b>Clínica Sorriso</b><span>Tratamentos</span><span>Equipe</span><span>Contato</span><span class="cta">Agendar</span></div>
    <div class="hero"><div><h2>Seu sorriso merece cuidado de verdade.</h2><p>Avaliação gratuita, atendimento humanizado e parcelamento facilitado.</p><span class="cta big">Quero agendar</span></div><div class="img"></div></div>
    <div class="form"><h3>Fale com a gente</h3><p>Responderemos pelo WhatsApp em poucos minutos.</p><div class="inp">Seu nome</div><div class="row"><div class="inp s">🇧🇷 +55</div><div class="inp">Seu WhatsApp</div></div><div class="inp">Qual tratamento? ▾</div><span class="send">${WA} Continuar no WhatsApp</span></div>
    ${open ? `<div class="bubble"><b>Marina · Clínica Sorriso</b><span>Olá! Posso te ajudar a agendar?</span><span class="send sm">${WA} Iniciar conversa</span></div>` : ""}
    <span class="fab">${WA}<i></i></span></div>`;
}

function phone(inner) { return `<div class="phone"><div class="notch"></div><div class="screen">${inner}</div></div>`; }
const mDash = () => `<div class="m"><div class="row">${LOGO()}<span class="circ sm">${I("bell", 15)}</span></div><h3>Olá, Studio!</h3><div class="g2">${[["Contatos", "248", "#2563eb"], ["Vendas", "31", "#10b981"]].map(([a, b, c]) => `<div class="card s"><span class="mute sm">${a}</span><b style="color:${c}">${b}</b></div>`).join("")}</div><div class="card s">${area(300, 90, undefined, "#2563eb", "gm")}</div>${PEOPLE.slice(0, 3).map(([n, s], i) => `<div class="card s row">${avatar(n, i, 28)}<span style="flex:1"><b>${n}</b><br><span class="mute sm">${s}</span></span><span class="wa sm">${WA}</span></div>`).join("")}<div class="tabs">${["home", "users", "board", "gear"].map((n, i) => `<span class="${i === 0 ? "on" : ""}">${I(n, 19)}</span>`).join("")}</div></div>`;
const mFunnel = () => `<div class="m"><h3>Funil</h3><div class="steps sm">${STAGES.slice(0, 3).map(([t], i) => `<span class="${i === 0 ? "on" : ""}">${t}</span>`).join("")}</div>${[0, 1, 7].map((i) => lead(i)).join("")}<div class="tabs">${["home", "users", "board", "gear"].map((n, i) => `<span class="${i === 2 ? "on" : ""}">${I(n, 19)}</span>`).join("")}</div></div>`;
const mSite = () => `<div class="m site-m"><div class="sh"></div><div class="sl"></div><div class="sl s"></div><div class="form m2"><h3>Fale com a gente</h3><div class="inp">Seu nome</div><div class="inp">Seu WhatsApp</div><span class="send">${WA} Continuar no WhatsApp</span></div><span class="fab sm">${WA}</span></div>`;

Object.assign(window, { WA, LOGO, MARK, I, dashboard, funnel, contact, reports, site, phone, mDash, mFunnel, mSite, area, donut, avatar, PEOPLE, lead, topbar });
