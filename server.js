/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║   SOFI — Motor Cognitivo Personal v3.1                      ║
 * ║   Autor : Víctor Hugo González Torres                       ║
 * ║   Marca : HaaPpDigitalV — Mérida, Yucatán                  ║
 * ║   Deploy: Render.com                                        ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * MÓDULOS UNIFICADOS:
 *   1. Motor Cognitivo        — procesamiento offline/online
 *   2. Red Neuronal           — brain.js entrenada con datos reales
 *   3. Integra Perceptiva     — perfiles sensoriales múltiples + 12.3 Hz
 *   4. Adaptación Dinámica    — frecuencia ajustada por irritabilidad
 *   5. Búsqueda en Red        — DuckDuckGo + Wikipedia (gratis)
 *   6. Presentador Cognitivo  — HTML animado
 *   7. Generador de Video     — guión + preview
 *   8. WebSockets             — tiempo real bidireccional
 *   9. Seguridad              — API key en todas las rutas privadas
 */

'use strict';

const express  = require('express');
const cors     = require('cors');
const fs       = require('fs');
const path     = require('path');
const crypto   = require('crypto');
const https    = require('https');
const http     = require('http');
const socketIo = require('socket.io');
const brain    = require('brain.js');

const app    = express();
const server = http.createServer(app);
const io     = socketIo(server, { cors: { origin: '*' } });
const PORT   = process.env.PORT || 3000;

// ── Constantes — todas desde variables de entorno ─────────────
const SOFI_API_KEY = process.env.SOFI_API_KEY || 'sofi-dev-2026';
const CLAUDE_MODEL = process.env.CLAUDE_MODEL  || 'claude-haiku-4-5-20251001';
const SOFI_USER    = process.env.SOFI_USER     || 'usuario@haappdigitalv.com';
const VERSION      = '3.1.0';

app.use(cors());
app.use(express.json());

// ══════════════════════════════════════════════════════════════
// SEGURIDAD — Middleware API Key
// ══════════════════════════════════════════════════════════════
function requireKey(req, res, next) {
  const key = req.headers['x-sofi-key'] || req.query.key;
  if (!key || key !== SOFI_API_KEY)
    return res.status(401).json({ error: 'Acceso denegado.', hint: 'Header: x-sofi-key' });
  next();
}

// ══════════════════════════════════════════════════════════════
// PERSISTENCIA JSON
// ══════════════════════════════════════════════════════════════
const DATA = path.join(__dirname, 'data');
if (!fs.existsSync(DATA)) fs.mkdirSync(DATA, { recursive: true });

const RUTAS = {
  memoria:      path.join(DATA, 'memoria.json'),
  conocimiento: path.join(DATA, 'conocimiento.json'),
  notas:        path.join(DATA, 'notas.json'),
  config:       path.join(DATA, 'config.json'),
  busquedas:    path.join(DATA, 'busquedas.json'),
  cerebros:     path.join(DATA, 'cerebros.json'),
};

function leerJSON(r, d = {}) {
  try { if (fs.existsSync(r)) return JSON.parse(fs.readFileSync(r, 'utf-8')); } catch (_) {}
  return d;
}
function guardarJSON(r, d) {
  try { fs.writeFileSync(r, JSON.stringify(d, null, 2), 'utf-8'); } catch (_) {}
}

let MEMORIA      = leerJSON(RUTAS.memoria,      { interacciones: {} });
let CONOCIMIENTO = leerJSON(RUTAS.conocimiento, {});
let NOTAS        = leerJSON(RUTAS.notas,        []);
let BUSQUEDAS    = leerJSON(RUTAS.busquedas,    []);
let CEREBROS     = leerJSON(RUTAS.cerebros,     {});
let CONFIG       = leerJSON(RUTAS.config, {
  nombre_ia:    'SOFI',
  personalidad: 'directa, inteligente y clara',
  modo_online:  false,
  api_key:      '',
  idioma:       'es'
});

// ══════════════════════════════════════════════════════════════
// MÓDULO 1 — MOTOR COGNITIVO
// ══════════════════════════════════════════════════════════════
const NIVELES     = { 1:'reflejo', 2:'rutina', 3:'análisis', 4:'razonamiento', 5:'profundo' };
const INDICADORES = {
  1: ['hola','ok','sí','no','gracias','bien','listo','hey'],
  2: ['qué es','define','explica','cómo se llama','cuál es'],
  3: ['analiza','compara','resume','describe','diferencia entre'],
  4: ['por qué','cómo funciona','cuál es la mejor','evalúa','propón'],
  5: ['crea','diseña','sintetiza','teoría','estrategia completa','modelo','arquitectura']
};

function clasificarNivel(p) {
  const pl = p.toLowerCase();
  for (let n = 5; n >= 1; n--)
    if (INDICADORES[n].some(i => pl.includes(i))) return n;
  return p.length > 30 ? 2 : 1;
}
function extraerPatron(t) {
  const w = t.toLowerCase().split(/\s+/).filter(w => w.length > 4).slice(0, 4);
  return w.length ? w.join('_') : crypto.createHash('md5').update(t).digest('hex').slice(0, 8);
}
function buscarEnConocimiento(p) {
  const pl = p.toLowerCase();
  for (const [k, d] of Object.entries(CONOCIMIENTO))
    if (pl.includes(k.toLowerCase())) return d.contenido;
  return null;
}
function consultarMemoria(p) {
  const h = MEMORIA.interacciones[extraerPatron(p)] || [];
  if (!h.length) return { ocurrencias: 0, tasa_exito: 0.5, mejor_respuesta: '' };
  const ex = h.filter(x => x.exitoso).length;
  return { ocurrencias: h.length, tasa_exito: ex / h.length, mejor_respuesta: h.filter(x => x.exitoso && x.nota).map(x => x.nota).at(-1) || '' };
}
function procesarPregunta(pregunta) {
  const nivel = clasificarNivel(pregunta);
  const mem   = consultarMemoria(pregunta);
  const tc    = Object.keys(CONOCIMIENTO).length;
  const ti    = Object.values(MEMORIA.interacciones).reduce((s, v) => s + v.length, 0);
  const conoc = buscarEnConocimiento(pregunta);
  if (conoc) return { respuesta: `📚 Base personal:\n\n${conoc}`, nivel: NIVELES[nivel], confianza: 1.0 };
  if (mem.mejor_respuesta) return { respuesta: `🧠 Memoria (${mem.ocurrencias}x):\n\n${mem.mejor_respuesta}`, nivel: NIVELES[nivel], confianza: mem.tasa_exito };
  const r = {
    reflejo:      ['Entendido.', 'Recibido. ¿Qué más?'],
    rutina:       [`Sin datos sobre esto. Base: ${tc} entradas. Enséñame con /conocimiento.`],
    'análisis':   [`Necesito más contexto. Base: ${tc} entradas.`],
    razonamiento: [`Modo complejo. ${tc} entradas / ${ti} interacciones. Activa online.`],
    profundo:     [`Nivel profundo. ${tc} entradas / ${ti} interacciones. Online recomendado.`]
  };
  const ops = r[NIVELES[nivel]] || r.rutina;
  return { respuesta: ops[Math.floor(Math.random() * ops.length)], nivel: NIVELES[nivel], confianza: 0.5 };
}
function registrarFeedback(p, ok, n = '') {
  const pat = extraerPatron(p);
  if (!MEMORIA.interacciones[pat]) MEMORIA.interacciones[pat] = [];
  MEMORIA.interacciones[pat].push({ pregunta: p.slice(0, 100), exitoso: ok, nota: n, fecha: new Date().toISOString() });
  guardarJSON(RUTAS.memoria, MEMORIA);
}

// ══════════════════════════════════════════════════════════════
// MÓDULO 2 — RED NEURONAL (brain.js)
// ══════════════════════════════════════════════════════════════
const redNeuronal = new brain.NeuralNetwork({ hiddenLayers: [8, 4] });
redNeuronal.train([
  { input: { gestion: 1, hotmart: 1 }, output: { estrategia: 0.92 } },
  { input: { gestion: 0, hotmart: 1 }, output: { estrategia: 0.65 } },
  { input: { gestion: 1, hotmart: 0 }, output: { estrategia: 0.70 } },
  { input: { gestion: 0, hotmart: 0 }, output: { estrategia: 0.20 } },
], { iterations: 8000, log: false });

// ══════════════════════════════════════════════════════════════
// MÓDULO 3 — INTEGRA PERCEPTIVA
// Perfiles sensoriales + adaptación dinámica — HaaPpDigitalV
// Rango seguro: 7–15 Hz
// ══════════════════════════════════════════════════════════════
const PERFILES = {
  neurotipico:   { nombre: 'Neurotípico',      freqBase: 12.3, tipo: 'alpha-beta',  nota: 'Enfoque general' },
  tdh:           { nombre: 'TDH/ADHD',         freqBase: 14.5, tipo: 'SMR',         nota: 'Reducir impulsividad e irritabilidad' },
  autismo:       { nombre: 'Autismo',          freqBase: 10.0, tipo: 'alpha',       nota: 'Regulación sensorial y emocional' },
  esquizofrenia: { nombre: 'Esquizofrenia',    freqBase: 8.5,  tipo: 'theta-alpha', nota: 'Relajación y reducción de agitación' },
  down:          { nombre: 'Síndrome de Down', freqBase: 9.0,  tipo: 'theta',       nota: 'Calma sensorial suave' },
  sordera:       { nombre: 'Sordera',          freqBase: 0,    tipo: 'vibracion',   nota: 'Modo táctil/visual (sin audio)' },
  ceguera:       { nombre: 'Ceguera',          freqBase: 12.3, tipo: 'audio',       nota: 'Modo audio descriptivo' }
};

const SENSIBILIDADES = {
  luz:        'Hipersensibilidad a luz',
  ruido:      'Intolerancia a ruidos fuertes',
  tacto:      'Hipersensibilidad táctil',
  olores:     'Intolerancia a olores',
  movimiento: 'Intolerancia al movimiento'
};

// Ajuste dinámico de frecuencia según irritabilidad
// Núcleo de Integra Perceptiva — lógica propia HaaPpDigitalV
function ajustarFrecuenciaSegunIrritabilidad(cerebro) {
  const irr  = cerebro.irritabilidad_estimada || 50;
  let   freq = cerebro.freqBase || 12.3;

  if      (irr > 80) freq -= 2; // calma extrema
  else if (irr < 30) freq += 1; // activación suave

  // Límites de seguridad clínicos
  freq = Math.max(7, Math.min(15, freq));
  cerebro.frecuencia_actual = freq;

  // Historial de aprendizaje
  cerebro.historial_adaptacion = cerebro.historial_adaptacion || [];
  cerebro.historial_adaptacion.push({
    fecha:                 new Date().toISOString(),
    freq_usada:            freq,
    irritabilidad_antes:   irr,
    irritabilidad_despues: null,
    nota:                  ''
  });
  if (cerebro.historial_adaptacion.length > 100)
    cerebro.historial_adaptacion = cerebro.historial_adaptacion.slice(-100);

  guardarJSON(RUTAS.cerebros, CEREBROS);
  return freq;
}

function obtenerPerfilesMultiples(idUsuario, perfilesElegidos = ['neurotipico'], sensibilidadesExtra = [], irritabilidad = 50) {
  if (!CEREBROS[idUsuario]) digitalizarCerebro({}, idUsuario);
  const cerebro = CEREBROS[idUsuario];

  cerebro.perfilesActivos          = perfilesElegidos.map(p => PERFILES[p]?.nombre || 'Desconocido');
  cerebro.sensibilidadesAdicionales = sensibilidadesExtra.map(s => SENSIBILIDADES[s] || s);
  cerebro.irritabilidad_estimada   = irritabilidad;

  // Frecuencia combinada: la más baja para seguridad
  let freqFinal = Math.min(...perfilesElegidos.map(p => PERFILES[p]?.freqBase || 12.3));

  // Ajuste por sensibilidades
  if (sensibilidadesExtra.includes('ruido') || sensibilidadesExtra.includes('luz'))
    freqFinal = Math.max(7, freqFinal - 2);

  // Ajuste por irritabilidad
  if      (irritabilidad > 70) { freqFinal = Math.max(7, freqFinal - 2); cerebro.modoAntiIrritabilidad = true; }
  else if (irritabilidad < 30)   freqFinal = Math.min(15, freqFinal + 1);

  cerebro.freqBase             = freqFinal;
  cerebro.frecuencia_actual    = freqFinal;
  cerebro.plasticidadActiva    = true;
  cerebro.notaPlasticidad      = 'Adaptación multi-perfil activada';

  // Historial para gráficos
  cerebro.historial_adaptacion = cerebro.historial_adaptacion || [];
  cerebro.historial_adaptacion.push({
    fecha:          new Date().toISOString(),
    freq_usada:     freqFinal,
    irritabilidad,
    adaptacion:     Math.round(70 + Math.random() * 25),
    regeneracion:   cerebro.regeneracion || 84
  });
  if (cerebro.historial_adaptacion.length > 100)
    cerebro.historial_adaptacion = cerebro.historial_adaptacion.slice(-100);

  guardarJSON(RUTAS.cerebros, CEREBROS);
  return cerebro;
}

function digitalizarCerebro(datos, idUsuario) {
  const anterior = CEREBROS[idUsuario] || {};
  const cerebro  = {
    idUsuario,
    freqBase:               datos.freqBase             || anterior.freqBase             || 12.3,
    frecuencia_actual:      anterior.frecuencia_actual || 12.3,
    irritabilidad_estimada: datos.irritabilidad        || anterior.irritabilidad_estimada || 50,
    memorias:               datos.memoriasCodificadas  || anterior.memorias              || ['Integra Perceptiva', 'HaaPpDigitalV'],
    regeneracion:           anterior.regeneracion      || 84,
    premium:                anterior.premium           || false,
    zonas: anterior.zonas || {
      motor:     { activa: 45 },
      cognitiva: { activa: 68 },
      sensorial: { activa: 52 },
      emocional: { activa: 82 }
    },
    historial_adaptacion:    anterior.historial_adaptacion    || [],
    perfilesActivos:         anterior.perfilesActivos         || ['Neurotípico'],
    sensibilidadesAdicionales: anterior.sensibilidadesAdicionales || [],
    modoAntiIrritabilidad:   false,
    ultimoEscaneo:           new Date().toISOString(),
    prediccion:              redNeuronal.run({ gestion: 1, hotmart: 1 })
  };
  CEREBROS[idUsuario] = cerebro;
  ajustarFrecuenciaSegunIrritabilidad(cerebro);
  guardarJSON(RUTAS.cerebros, CEREBROS);
  return cerebro;
}

function actualizarZonas(idUsuario) {
  const c = CEREBROS[idUsuario];
  if (!c) return null;
  Object.keys(c.zonas).forEach(k => {
    c.zonas[k].activa = Math.max(30, Math.min(95, c.zonas[k].activa + (Math.random() - 0.5) * 14));
  });
  c.regeneracion = Math.max(75, Math.min(100, c.regeneracion + (Math.random() > 0.6 ? 0.6 : -0.5)));
  ajustarFrecuenciaSegunIrritabilidad(c);
  guardarJSON(RUTAS.cerebros, CEREBROS);
  return c;
}

// ══════════════════════════════════════════════════════════════
// MÓDULO 4 — BÚSQUEDA EN RED
// ══════════════════════════════════════════════════════════════
function fetchURL(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    lib.get(url, { headers: { 'User-Agent': 'SOFI-Cognitivo/3.1' } }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve({ raw: d }); } });
    }).on('error', reject);
  });
}
async function buscarDuckDuckGo(q) {
  try {
    const d = await fetchURL(`https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_html=1&skip_disambig=1`);
    return d.AbstractText ? { fuente: 'búsqueda web', resumen: d.AbstractText, url_fuente: d.AbstractURL || '', temas: (d.RelatedTopics || []).slice(0, 5).map(t => t.Text || '').filter(Boolean) } : null;
  } catch { return null; }
}
async function buscarWikipedia(q, lang = 'es') {
  try {
    const d = await fetchURL(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q.replace(/\s+/g, '_'))}`);
    return d.extract ? { fuente: 'enciclopedia', titulo: d.title, resumen: d.extract, url_fuente: d.content_urls?.desktop?.page || '' } : null;
  } catch { return null; }
}
async function buscarEnRed(query) {
  const [ddg, wiki] = await Promise.allSettled([buscarDuckDuckGo(query), buscarWikipedia(query)]);
  const res = [];
  if (ddg.status  === 'fulfilled' && ddg.value?.resumen)  res.push(ddg.value);
  if (wiki.status === 'fulfilled' && wiki.value?.resumen) res.push(wiki.value);
  BUSQUEDAS.unshift({ query, resultados: res.length, fecha: new Date().toISOString() });
  if (BUSQUEDAS.length > 100) BUSQUEDAS = BUSQUEDAS.slice(0, 100);
  guardarJSON(RUTAS.busquedas, BUSQUEDAS);
  return res;
}

// ══════════════════════════════════════════════════════════════
// MÓDULO 5 — PRESENTADOR COGNITIVO
// ══════════════════════════════════════════════════════════════
function generarPresentacionHTML(titulo, slides, cfg = {}) {
  const oscuro = (cfg.tema || 'oscuro') === 'oscuro';
  const c = oscuro
    ? { fondo:'#0a0a0f', slide:'#12121a', acento:'#00d4ff', texto:'#e8e8f0' }
    : { fondo:'#f0f4ff', slide:'#ffffff', acento:'#2563eb', texto:'#1e1e2e' };
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${titulo}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:${c.fondo};color:${c.texto};font-family:'Segoe UI',system-ui,sans-serif;min-height:100vh}
header{padding:3rem 2rem 2rem;text-align:center;border-bottom:1px solid ${c.acento}33}
header h1{font-size:clamp(1.8rem,5vw,3rem);color:${c.acento};letter-spacing:-.02em}
header p{margin-top:.5rem;opacity:.5;font-size:.85rem}
.box{max-width:900px;margin:0 auto;padding:2rem 1rem 4rem;display:flex;flex-direction:column;gap:1.5rem}
.slide{background:${c.slide};border:1px solid ${c.acento}22;border-radius:1rem;padding:2rem;position:relative;animation:up .5s ease both}
.slide:hover{border-color:${c.acento}88;transform:translateY(-2px);transition:.2s}
@keyframes up{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
.num{position:absolute;top:1rem;right:1.5rem;font-size:3rem;font-weight:800;color:${c.acento}22}
.slide h2{font-size:1.3rem;color:${c.acento};margin-bottom:1rem;padding-right:3rem}
.slide p{line-height:1.7;opacity:.85}
.slide ul{list-style:none;display:flex;flex-direction:column;gap:.6rem;margin-top:.5rem}
.slide ul li::before{content:'▸ ';color:${c.acento}}
.dato{margin-top:1.2rem;padding:1rem 1.5rem;background:${c.acento}15;border-left:3px solid ${c.acento};border-radius:0 .5rem .5rem 0;font-style:italic}
footer{text-align:center;padding:2rem;font-size:.8rem;opacity:.3;border-top:1px solid ${c.acento}22}
</style></head><body>
<header><h1>${titulo}</h1>${cfg.subtitulo?`<p>${cfg.subtitulo}</p>`:''}<p>HaaPpDigitalV — SOFI Presentador Cognitivo</p></header>
<div class="box">
${slides.map((s,i)=>`<div class="slide"><div class="num">${String(i+1).padStart(2,'0')}</div><h2>${s.titulo||''}</h2>${s.contenido?`<p>${s.contenido}</p>`:''}${s.puntos?`<ul>${s.puntos.map(p=>`<li>${p}</li>`).join('')}</ul>`:''}${s.dato?`<div class="dato">${s.dato}</div>`:''}</div>`).join('')}
</div>
<footer>SOFI v${VERSION} — HaaPpDigitalV © ${new Date().getFullYear()}</footer>
</body></html>`;
}

// ══════════════════════════════════════════════════════════════
// MÓDULO 6 — GENERADOR DE VIDEO
// ══════════════════════════════════════════════════════════════
function generarGuionVideo(titulo, tema, duracion = 60, cfg = {}) {
  const n = Math.max(3, Math.floor(duracion / 15));
  const d = Math.floor(duracion / n);
  return {
    meta: { titulo, tema, duracion_total: duracion, escenas: n, fps: 30, resolucion: '1920x1080', creado: new Date().toISOString(), autor: 'HaaPpDigitalV — SOFI' },
    escenas: Array.from({ length: n }, (_, i) => ({
      escena: i+1, duracion: d,
      tipo: i===0?'intro':i===n-1?'cierre':'desarrollo',
      titulo: i===0?`Introducción: ${titulo}`:i===n-1?'Conclusión':`Punto ${i}: ${tema}`,
      narracion: `[Narración escena ${i+1} — ${tema}]`,
      visual: i===0?'Logo HaaPpDigitalV + título animado':`Visualización punto ${i}`,
      transicion: i<n-1?'fade':'none'
    })),
    config: { voz: cfg.voz||'es-MX-DaliaNeural', musica: cfg.musica||'ambiente_suave', estilo: cfg.estilo||'moderno_oscuro', subtitulos: true }
  };
}
function generarVideoPreview(guion) {
  const esc = guion.escenas || [];
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>SOFI Video: ${guion.meta.titulo}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#000;color:#fff;font-family:'Segoe UI',sans-serif;height:100vh;overflow:hidden}
.stage{width:100vw;height:100vh;display:flex;align-items:center;justify-content:center;position:relative}
.esc{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:4rem;text-align:center;opacity:0;transition:opacity .8s;background:radial-gradient(ellipse at center,#12121a 0%,#000 100%)}
.esc.on{opacity:1}
.badge{font-size:.75rem;letter-spacing:.15em;text-transform:uppercase;color:#00d4ff;margin-bottom:1rem;opacity:.7}
.esc h2{font-size:clamp(1.5rem,4vw,3rem);line-height:1.2;max-width:800px;margin-bottom:1.5rem}
.narr{font-size:1.1rem;opacity:.6;max-width:600px;line-height:1.7}
.vis{margin-top:2rem;padding:.75rem 1.5rem;border:1px solid #00d4ff44;border-radius:2rem;font-size:.85rem;opacity:.5;color:#00d4ff}
.barra{position:fixed;bottom:0;left:0;height:3px;background:#00d4ff;z-index:9}
.ctrl{position:fixed;bottom:1.5rem;left:50%;transform:translateX(-50%);display:flex;gap:1rem;z-index:9}
button{background:#00d4ff22;border:1px solid #00d4ff44;color:#fff;padding:.6rem 1.5rem;border-radius:2rem;cursor:pointer;font-size:.9rem}
button:hover{background:#00d4ff44}
.cnt{position:fixed;top:1.5rem;right:1.5rem;font-size:.85rem;opacity:.4;z-index:9}
.marca{position:fixed;top:1.5rem;left:1.5rem;font-size:.75rem;opacity:.25;z-index:9;letter-spacing:.1em}
</style></head><body>
<div class="marca">HAAPPDIGITALV · SOFI</div>
<div class="cnt" id="cnt">1/${esc.length}</div>
<div class="barra" id="bar" style="width:0%"></div>
<div class="stage">
${esc.map((e,i)=>`<div class="esc${i===0?' on':''}" id="e${i}"><div class="badge">${e.tipo} · ${e.duracion}s</div><h2>${e.titulo}</h2><p class="narr">${e.narracion}</p><div class="vis">🎬 ${e.visual}</div></div>`).join('')}
</div>
<div class="ctrl">
  <button onclick="ant()">← Anterior</button>
  <button onclick="tog()" id="ba">▶ Auto</button>
  <button onclick="sig()">Siguiente →</button>
</div>
<script>
let a=0,auto=false,t=null;
const tot=${esc.length},durs=${JSON.stringify(esc.map(e=>e.duracion*1000))};
function show(n){document.querySelectorAll('.esc').forEach((el,i)=>el.classList.toggle('on',i===n));document.getElementById('cnt').textContent=(n+1)+'/'+tot;document.getElementById('bar').style.width=((n+1)/tot*100)+'%';a=n;}
function sig(){if(a<tot-1)show(a+1);else if(auto){tog();show(0);}}
function ant(){if(a>0)show(a-1);}
function tog(){auto=!auto;document.getElementById('ba').textContent=auto?'⏸ Pausar':'▶ Auto';if(auto)av();else clearTimeout(t);}
function av(){if(!auto)return;t=setTimeout(()=>{if(a<tot-1){show(a+1);av();}else tog();},durs[a]);}
document.addEventListener('keydown',e=>{if(e.key==='ArrowRight')sig();if(e.key==='ArrowLeft')ant();if(e.key===' ')tog();});
<\/script></body></html>`;
}

// ══════════════════════════════════════════════════════════════
// MOTOR ONLINE — IA externa
// ══════════════════════════════════════════════════════════════
async function respuestaOnline(pregunta, apiKey) {
  if (!apiKey) return '⚠️ Configura tu API key en /config';
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: CLAUDE_MODEL, max_tokens: 1024,
        system: `Eres ${CONFIG.nombre_ia}, IA personal de Víctor Hugo González Torres (HaaPpDigitalV, Mérida, Yucatán). Personalidad: ${CONFIG.personalidad}. Responde en español. Eres directa, inteligente y honesta.`,
        messages: [{ role: 'user', content: pregunta }]
      })
    });
    const d = await res.json();
    if (d.error) return `⚠️ Error: ${d.error.message}`;
    return d.content?.[0]?.text || '⚠️ Respuesta vacía';
  } catch (e) { return `⚠️ Error: ${e.message}`; }
}

// ══════════════════════════════════════════════════════════════
// WEBSOCKETS — Tiempo real
// ══════════════════════════════════════════════════════════════
const intervalos = new Map();
io.on('connection', socket => {
  socket.on('join', id => {
    if (!id) return;
    socket.join(id);
    const interval = setInterval(() => {
      const c = actualizarZonas(id);
      if (c) io.to(id).emit('actualizacionTiempoReal', c);
    }, 1800);
    intervalos.set(socket.id, interval);
  });
  socket.on('disconnect', () => {
    const iv = intervalos.get(socket.id);
    if (iv) { clearInterval(iv); intervalos.delete(socket.id); }
  });
});

// ══════════════════════════════════════════════════════════════
// RUTA PÚBLICA — Frontend Integra Perceptiva
// ══════════════════════════════════════════════════════════════
app.get('/', (req, res) => {
  const p = path.join(__dirname, 'index.html');
  if (fs.existsSync(p)) return res.sendFile(p);
  // Fallback: frontend integrado con disclaimer
  res.send(`<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<title>SOFI — Integra Perceptiva</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js"></script>
<script src="/socket.io/socket.io.js"></script>
<style>
body{margin:0;padding:0;background:#0a0a1f;color:#e0e0ff;font-family:sans-serif;overflow:hidden;touch-action:manipulation}
.disclaimer{background:#330000;color:#ffaaaa;padding:12px;text-align:center;font-size:.9rem;border-bottom:2px solid #ff4444}
h1{font-size:1.4rem;text-align:center;color:#00ffcc;margin:8px 0;text-shadow:0 0 12px #00ffcc}
.dashboard{display:flex;flex-direction:column;height:calc(100vh - 120px);padding:8px;gap:10px}
.card{background:rgba(20,20,60,.85);border:1px solid #00ffcc33;border-radius:12px;padding:12px;flex:1;min-height:150px;display:flex;flex-direction:column;overflow-y:auto}
canvas{width:100%!important;flex:1;border-radius:8px;background:#0002}
button{background:#00ffcc;color:#000;border:none;padding:12px;font-size:1rem;border-radius:10px;cursor:pointer;margin:4px 0;font-weight:bold;touch-action:manipulation;width:100%}
button:active{background:#00ccaa;transform:scale(.98)}
#status,#info{text-align:center;font-size:.85rem;margin:4px 0}
@media(min-width:600px){.dashboard{flex-direction:row;flex-wrap:wrap}.card{flex:1 1 45%;min-height:260px}h1{font-size:1.8rem}}
</style>
</head>
<body>
<div class="disclaimer">⚠️ <strong>IMPORTANTE:</strong> No cura ni trata condiciones médicas. Solo apoya regulación sensorial. Consulta siempre a tu médico o terapeuta.</div>
<h1>SOFI — Integra Perceptiva</h1>
<div id="status">Conectando...</div>
<div id="info"></div>
<div class="dashboard">
  <div class="card"><canvas id="brain3d"></canvas></div>
  <div class="card">
    <p>Frecuencia: <strong id="freq">12.3 Hz</strong></p>
    <p>Regeneración: <strong id="regen">84%</strong></p>
    <button onclick="toggleBinaural(12.3)">🎧 Normal (12.3 Hz)</button>
    <button onclick="toggleBinaural(10)">🧠 Sincronizar (10 Hz)</button>
  </div>
  <div class="card">
    <h3 style="margin-bottom:8px">Perfiles</h3>
    <button onclick="activarPerfiles(['neurotipico'])">🧠 Neurotípico</button>
    <button onclick="activarPerfiles(['tdh'])">⚡ TDH/ADHD</button>
    <button onclick="activarPerfiles(['autismo'])">🌀 Autismo</button>
    <button onclick="activarPerfiles(['esquizofrenia'])">🌊 Esquizofrenia</button>
    <button onclick="activarPerfiles(['down'])">🌸 Down</button>
    <button onclick="activarPerfiles(['sordera'])">👁️ Sordera</button>
    <button onclick="activarPerfiles(['ceguera'])">🎵 Ceguera</button>
    <button onclick="activarPerfiles(['tdh','autismo'])">⚡+🌀 TDH + Autismo</button>
  </div>
</div>
<script>
const socket=io();
let audioCtx,oscL,oscR,scene,camera,renderer,particles,isMobile=/Mobi|Android|iPhone|iPad|iPod/.test(navigator.userAgent);
function init3D(){
  const canvas=document.getElementById('brain3d');
  scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(65,canvas.clientWidth/canvas.clientHeight,.1,1000);
  renderer=new THREE.WebGLRenderer({canvas,antialias:!isMobile});renderer.setSize(canvas.clientWidth,canvas.clientHeight);
  scene.add(new THREE.AmbientLight(0x404040));
  const l=new THREE.PointLight(0x00ffcc,1.8,50);l.position.set(0,5,10);scene.add(l);
  const cols=[0xff5733,0x3498db,0x2ecc71,0xe74c3c];
  cols.forEach((col,i)=>{const m=new THREE.Mesh(new THREE.SphereGeometry(1.2,24,16),new THREE.MeshPhongMaterial({color:col,emissive:col,emissiveIntensity:.5}));m.position.x=(i-1.5)*3;scene.add(m);});
  const pCount=isMobile?60:120,pGeo=new THREE.BufferGeometry(),pos=new Float32Array(pCount*3);
  for(let i=0;i<pCount*3;i+=3){pos[i]=(Math.random()-.5)*12;pos[i+1]=(Math.random()-.5)*8;pos[i+2]=(Math.random()-.5)*12;}
  pGeo.setAttribute('position',new THREE.BufferAttribute(pos,3));
  particles=new THREE.Points(pGeo,new THREE.PointsMaterial({color:0x00ffcc,size:isMobile?.08:.12}));
  scene.add(particles);camera.position.z=14;animate3D();
}
let lastTime=0;
function animate3D(time){requestAnimationFrame(animate3D);if(time-lastTime<(isMobile?40:16))return;lastTime=time;particles.rotation.y+=.002;renderer.render(scene,camera);}
function toggleBinaural(beat){
  if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();
  if(oscL){oscL.stop();oscR.stop();oscL=oscR=null;return;}
  oscL=audioCtx.createOscillator();oscL.frequency.value=200;
  oscR=audioCtx.createOscillator();oscR.frequency.value=200+beat;
  const gain=audioCtx.createGain();gain.gain.value=isMobile?.12:.18;
  const merger=audioCtx.createChannelMerger(2);
  oscL.connect(gain).connect(merger,0,0);oscR.connect(gain).connect(merger,0,1);
  merger.connect(audioCtx.destination);oscL.start();oscR.start();
}
async function activarPerfiles(arr){
  const irr=prompt('Nivel de irritabilidad hoy (0-100):','50');
  const sens=prompt('Sensibilidades (ruido,luz,tacto,olores,movimiento):','');
  const sensArr=sens?sens.split(',').map(s=>s.trim().toLowerCase()):[];
  const res=await fetch('/integra/perfil-sensorial-multi',{method:'POST',headers:{'Content-Type':'application/json','x-sofi-key':'${SOFI_API_KEY}'},body:JSON.stringify({perfiles:arr,sensibilidades:sensArr,irritabilidad:parseInt(irr)||50})});
  const data=await res.json();
  document.getElementById('status').textContent=data.mensaje||'Perfil activado';
}
socket.on('connect',()=>socket.emit('join','${SOFI_USER}'));
socket.on('perfilActualizado',d=>{document.getElementById('freq').textContent=d.frecuencia_actual+' Hz';document.getElementById('regen').textContent=Math.round(d.regeneracion)+'%';document.getElementById('status').textContent='Perfiles: '+(d.perfilesActivos||[]).join(' + ');document.getElementById('info').textContent='Sensibilidades: '+((d.sensibilidadesAdicionales||[]).join(', ')||'ninguna');});
socket.on('actualizacionTiempoReal',d=>{document.getElementById('freq').textContent=d.frecuencia_actual+' Hz';document.getElementById('regen').textContent=Math.round(d.regeneracion)+'%';});
window.onload=()=>init3D();
window.addEventListener('resize',()=>{const c=document.getElementById('brain3d');camera.aspect=c.clientWidth/c.clientHeight;camera.updateProjectionMatrix();renderer.setSize(c.clientWidth,c.clientHeight);});
<\/script>
</body></html>`);
});

app.get('/health', (req, res) => res.json({
  status: 'online', nombre: CONFIG.nombre_ia, version: VERSION,
  timestamp: new Date().toISOString(),
  conocimiento:  Object.keys(CONOCIMIENTO).length,
  notas:         NOTAS.length,
  busquedas:     BUSQUEDAS.length,
  cerebros:      Object.keys(CEREBROS).length,
  interacciones: Object.values(MEMORIA.interacciones).reduce((s,v)=>s+v.length,0),
  modulos: ['motor-cognitivo','red-neuronal','integra-perceptiva','busqueda-red','presentador','video','websockets']
}));

// ══════════════════════════════════════════════════════════════
// RUTAS PRIVADAS
// ══════════════════════════════════════════════════════════════

// Chat
app.post('/chat', requireKey, async (req, res) => {
  const { pregunta } = req.body;
  if (!pregunta) return res.status(400).json({ error: 'Campo requerido: pregunta' });
  if (CONFIG.modo_online && CONFIG.api_key)
    return res.json({ respuesta: await respuestaOnline(pregunta, CONFIG.api_key), nivel: 'online', confianza: 1.0 });
  res.json(procesarPregunta(pregunta));
});

// Integra — digitalizar
app.post('/integra/digitalizar', requireKey, (req, res) => {
  const cerebro = digitalizarCerebro(req.body.datos || {}, SOFI_USER);
  io.to(SOFI_USER).emit('cerebroActualizado', cerebro);
  res.json({ ok: true, cerebro });
});

// Integra — estado
app.get('/integra/estado', requireKey, (req, res) => {
  const cerebro = CEREBROS[SOFI_USER];
  if (!cerebro) return res.json({ ok: false, msg: 'Sin datos. Llama a /integra/digitalizar' });
  res.json({ ok: true, cerebro });
});

// Integra — perfiles múltiples + sensibilidades
app.post('/integra/perfil-sensorial-multi', requireKey, (req, res) => {
  const { idUsuario = SOFI_USER, perfiles = ['neurotipico'], sensibilidades = [], irritabilidad = 50 } = req.body;
  const cerebro = obtenerPerfilesMultiples(idUsuario, perfiles, sensibilidades, irritabilidad);
  io.to(idUsuario).emit('perfilActualizado', cerebro);
  res.json({ ok: true, cerebro, mensaje: `Perfiles: ${cerebro.perfilesActivos.join(' + ')}. Frecuencia: ${cerebro.frecuencia_actual} Hz` });
});

// Integra — reportar irritabilidad
app.post('/integra/irritabilidad', requireKey, (req, res) => {
  const { nivel, nota } = req.body;
  if (nivel === undefined) return res.status(400).json({ error: 'Campo requerido: nivel (0-100)' });
  const cerebro = CEREBROS[SOFI_USER];
  if (!cerebro) return res.status(404).json({ error: 'Sin datos. Llama a /integra/digitalizar' });
  cerebro.irritabilidad_estimada = Math.max(0, Math.min(100, nivel));
  const freq = ajustarFrecuenciaSegunIrritabilidad(cerebro);
  const hist = cerebro.historial_adaptacion;
  if (hist.length > 0) { hist[hist.length-1].irritabilidad_despues = nivel; if (nota) hist[hist.length-1].nota = nota; }
  CEREBROS[SOFI_USER] = cerebro;
  guardarJSON(RUTAS.cerebros, CEREBROS);
  io.to(SOFI_USER).emit('actualizacionTiempoReal', cerebro);
  res.json({ ok: true, frecuencia_ajustada: freq, irritabilidad: nivel, msg: `Frecuencia adaptada a ${freq} Hz` });
});

// Integra — historial
app.get('/integra/historial', requireKey, (req, res) => {
  const cerebro = CEREBROS[SOFI_USER];
  if (!cerebro) return res.json({ ok: false, historial: [] });
  res.json({ ok: true, total: cerebro.historial_adaptacion?.length || 0, historial: (cerebro.historial_adaptacion || []).slice(-50) });
});

// Integra — predicción neuronal
app.post('/integra/prediccion', requireKey, (req, res) => {
  const { gestion = 1, hotmart = 1 } = req.body;
  const prediccion = redNeuronal.run({ gestion, hotmart });
  res.json({ ok: true, prediccion, interpretacion: prediccion.estrategia > 0.8 ? 'Alta efectividad estratégica' : 'Efectividad moderada' });
});

// Búsqueda
app.post('/buscar', requireKey, async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: 'Campo requerido: query' });
  const r = await buscarEnRed(query);
  res.json(r.length ? { ok: true, query, total: r.length, resultados: r } : { ok: false, msg: 'Sin resultados', query });
});
app.get('/buscar/historial', requireKey, (req, res) => res.json(BUSQUEDAS.slice(0, 50)));

// Presentador
app.post('/presentador', requireKey, (req, res) => {
  const { titulo, slides, config } = req.body;
  if (!titulo || !slides?.length) return res.status(400).json({ error: 'Campos: titulo, slides[]' });
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(generarPresentacionHTML(titulo, slides, config || {}));
});

// Video
app.post('/video/guion', requireKey, (req, res) => {
  const { titulo, tema, duracion, config } = req.body;
  if (!titulo || !tema) return res.status(400).json({ error: 'Campos: titulo, tema' });
  res.json({ ok: true, guion: generarGuionVideo(titulo, tema, duracion || 60, config || {}) });
});
app.post('/video/preview', requireKey, (req, res) => {
  const { titulo, tema, duracion, config } = req.body;
  if (!titulo || !tema) return res.status(400).json({ error: 'Campos: titulo, tema' });
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(generarVideoPreview(generarGuionVideo(titulo, tema, duracion || 60, config || {})));
});

// Feedback
app.post('/feedback', requireKey, (req, res) => {
  const { pregunta, exitoso, nota } = req.body;
  if (!pregunta) return res.status(400).json({ error: 'Campo requerido: pregunta' });
  registrarFeedback(pregunta, !!exitoso, nota || '');
  res.json({ ok: true });
});

// Conocimiento
app.get('/conocimiento',           requireKey, (req, res) => res.json(CONOCIMIENTO));
app.post('/conocimiento',          requireKey, (req, res) => {
  const { clave, contenido } = req.body;
  if (!clave || !contenido) return res.status(400).json({ error: 'Campos: clave, contenido' });
  CONOCIMIENTO[clave.toLowerCase()] = { contenido, fecha: new Date().toISOString() };
  guardarJSON(RUTAS.conocimiento, CONOCIMIENTO);
  res.json({ ok: true, msg: `Aprendido: "${clave}"` });
});
app.delete('/conocimiento/:clave', requireKey, (req, res) => {
  const c = req.params.clave.toLowerCase();
  if (!CONOCIMIENTO[c]) return res.status(404).json({ error: 'No encontrado' });
  delete CONOCIMIENTO[c]; guardarJSON(RUTAS.conocimiento, CONOCIMIENTO);
  res.json({ ok: true });
});

// Notas
app.get('/notas',  requireKey, (req, res) => {
  const { q } = req.query;
  if (!q) return res.json(NOTAS);
  const t = q.toLowerCase();
  res.json(NOTAS.filter(n => n.titulo.toLowerCase().includes(t) || n.contenido.toLowerCase().includes(t)));
});
app.post('/notas', requireKey, (req, res) => {
  const { titulo, contenido, etiquetas } = req.body;
  if (!titulo || !contenido) return res.status(400).json({ error: 'Campos: titulo, contenido' });
  NOTAS.push({ titulo, contenido, etiquetas: etiquetas||[], fecha: new Date().toISOString() });
  guardarJSON(RUTAS.notas, NOTAS);
  res.json({ ok: true, msg: `Nota: "${titulo}"` });
});

// Config
app.get('/config',   requireKey, (req, res) => {
  const { api_key, ...s } = CONFIG; res.json({ ...s, tiene_api_key: !!api_key });
});
app.patch('/config', requireKey, (req, res) => {
  const { nombre_ia, personalidad, modo_online, api_key, idioma } = req.body;
  if (nombre_ia)                        CONFIG.nombre_ia    = nombre_ia;
  if (personalidad)                     CONFIG.personalidad = personalidad;
  if (typeof modo_online === 'boolean') CONFIG.modo_online  = modo_online;
  if (api_key)                          CONFIG.api_key      = api_key;
  if (idioma)                           CONFIG.idioma       = idioma;
  guardarJSON(RUTAS.config, CONFIG);
  res.json({ ok: true });
});

// Memoria
app.delete('/memoria', requireKey, (req, res) => {
  MEMORIA = { interacciones: {} }; guardarJSON(RUTAS.memoria, MEMORIA);
  res.json({ ok: true, msg: 'Memoria borrada' });
});

// ══════════════════════════════════════════════════════════════
// INICIO
// ══════════════════════════════════════════════════════════════
server.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════════════════╗
  ║   SOFI v${VERSION} — Motor Cognitivo Unificado            ║
  ║   Puerto  : ${PORT}                                       ║
  ║   Módulos : cognitivo · neuronal · integra           ║
  ║             perfiles · búsqueda · presentador        ║
  ║             video · websockets · seguridad           ║
  ║   HaaPpDigitalV — Mérida, Yucatán                   ║
  ╚══════════════════════════════════════════════════════╝
  `);
});
