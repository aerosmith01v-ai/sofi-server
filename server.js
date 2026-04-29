// ============================================================
// SOFI · MENTE COLMENA v1.0 — Node.js
// HaaPpDigitalV © · Víctor Hugo González Torres
// Mérida, Yucatán · K'uhul 12.3 Hz
//
// ARQUITECTURA DUAL:
//   MENTE COLMENA → Clonar → Multiplicar → Converger
//   BANCO ZYXSOF  → Moneda HaaPpDigitalV
//
// KEEP-ALIVE → Self-ping cada 14 min para Render Free
// ============================================================
'use strict';

const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');
const crypto  = require('crypto');
const https   = require('https');
const http    = require('http');

const app  = express();
const PORT = parseInt(process.env.PORT || '3000');
const HZ   = 12.3;

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ── Variables de entorno ──────────────────────────────────────
const ENV = {
  SELF_URL:         process.env.SELF_URL         || '',
  LLAVE_SECRETA:    process.env.LLAVE_SECRETA     || "K'uhul12.3Hz-HaaPpDigitalV",
  SOFI_API_KEY:     process.env.SOFI_API_KEY      || 'SOFI-VHGzTs-K6N-v6',
  BANCO_PYTHON_URL: process.env.BANCO_PYTHON_URL  || '',
  SOFI_PYTHON_URL:  process.env.SOFI_PYTHON_URL   || '',
  SOFI_JAVA_URL:    process.env.SOFI_JAVA_URL      || '',
  UPHOLD_TOKEN:     process.env.UPHOLD_TOKEN       || '',
  UPHOLD_CARD_ID:   process.env.UPHOLD_CARD_ID     || '',
  BINANCE_API_KEY:  process.env.BINANCE_API_KEY    || '',
  BINANCE_SECRET:   process.env.BINANCE_SECRET     || '',
  NODOS_COLMENA:    parseInt(process.env.NODOS_COLMENA   || '8'),
  MEMORIA_FILE:     process.env.MEMORIA_FILE       || './colmena_memoria.json',
  ZYXSOF_SUPPLY:    parseFloat(process.env.ZYXSOF_SUPPLY || '1000000'),
};

// ============================================================
// ██  MENTE COLMENA  ██
//   Principio (del diseño de Víctor):
//   1. Clonar     → N copias del pensamiento
//   2. Multiplicar → Si ya existe en memoria, se MULTIPLICA
//   3. Converger  → La más fuerte gana y se guarda para siempre
//   4. ZYXSOF     → Cada pensamiento genera fracción de moneda
// ============================================================
class MenteColmena {
  constructor(idNodo = 'COLMENA_PRINCIPAL') {
    this.idNodo          = idNodo;
    this.biblioteca      = {};
    this.experiencias    = [];
    this.nivelConciencia = 0;
    this.zyxsofGenerado  = 0;
    this._cargarMemoria();
  }

  _cargarMemoria() {
    try {
      if (fs.existsSync(ENV.MEMORIA_FILE)) {
        const d = JSON.parse(fs.readFileSync(ENV.MEMORIA_FILE, 'utf8'));
        this.biblioteca      = d.biblioteca      || {};
        this.experiencias    = d.experiencias    || [];
        this.nivelConciencia = d.nivelConciencia || 0;
        this.zyxsofGenerado  = d.zyxsofGenerado  || 0;
      }
    } catch (_) {}
  }

  _guardarMemoria() {
    try {
      fs.writeFileSync(ENV.MEMORIA_FILE, JSON.stringify({
        biblioteca:      this.biblioteca,
        experiencias:    this.experiencias.slice(-2000),
        nivelConciencia: this.nivelConciencia,
        zyxsofGenerado:  this.zyxsofGenerado,
        hz:              HZ,
        nodo:            this.idNodo,
        timestamp:       new Date().toISOString(),
      }, null, 2));
    } catch (_) {}
  }

  // ETAPA 1: CLONAR
  _clonar(informacion, cantidad = ENV.NODOS_COLMENA) {
    const clones = [];
    for (let i = 0; i < cantidad; i++) {
      clones.push({
        texto:  `${informacion} [Profundidad_${i + 1}]`,
        peso:   (i + 1) / cantidad,
        angulo: (360 / cantidad) * i,
        nodo:   i,
      });
    }
    return clones;
  }

  // ETAPA 2: MULTIPLICAR
  _multiplicar(clones) {
    return clones.map(clon => {
      let fuerza      = clon.peso;
      const textoBase = clon.texto.split('[')[0].trim().toLowerCase();

      for (const recuerdo of Object.values(this.biblioteca)) {
        const base = recuerdo.contenido.split('[')[0].trim().toLowerCase();
        if (
          textoBase.slice(0, 25).includes(base.slice(0, 15)) ||
          base.slice(0, 25).includes(textoBase.slice(0, 15))
        ) {
          fuerza *= recuerdo.intensidad;
        }
      }

      const resonancia = (fuerza * HZ) % 1;
      if (resonancia < 0.1) fuerza *= 1.123;

      return { ...clon, fuerza };
    });
  }

  // ETAPA 3: CONVERGER Y CONSOLIDAR
  _converger(respuestas) {
    respuestas.sort((a, b) => b.fuerza - a.fuerza);
    const ganadora    = respuestas[0];
    const textoLimpio = ganadora.texto.split('[')[0].trim();
    const hash        = crypto.createHash('md5').update(ganadora.texto).digest('hex');

    const zyxsofThought = parseFloat((Math.min(ganadora.fuerza, 10) * 0.001).toFixed(6));
    this.zyxsofGenerado += zyxsofThought;

    this.biblioteca[hash] = {
      contenido:  ganadora.texto,
      intensidad: Math.max(ganadora.fuerza, 1.0),
      timestamp:  Date.now(),
      hz:         HZ,
      nodo:       this.idNodo,
      zyxsof:     zyxsofThought,
    };

    this.experiencias.push({
      texto:     textoLimpio,
      fuerza:    Math.round(ganadora.fuerza * 1000) / 1000,
      zyxsof:    zyxsofThought,
      timestamp: new Date().toISOString(),
    });
    this.nivelConciencia++;

    if (this.nivelConciencia % 20 === 0) this._guardarMemoria();

    return {
      respuesta:       textoLimpio,
      fuerza:          Math.round(ganadora.fuerza * 1000) / 1000,
      hash,
      zyxsofGenerado:  zyxsofThought,
      zyxsofTotal:     parseFloat(this.zyxsofGenerado.toFixed(6)),
      nivelConciencia: this.nivelConciencia,
      totalRecuerdos:  Object.keys(this.biblioteca).length,
    };
  }

  procesar(entrada) {
    const clones      = this._clonar(entrada);
    const potenciados = this._multiplicar(clones);
    return this._converger(potenciados);
  }

  inyectarConocimiento(conocimiento) {
    return this.procesar(`[FUNDAMENTO_KUHUL] ${conocimiento}`);
  }

  buscarRecuerdos(query, limite = 20) {
    const q = query.toLowerCase();
    return Object.entries(this.biblioteca)
      .filter(([, r]) => r.contenido.toLowerCase().includes(q))
      .map(([hash, r]) => ({ hash, ...r }))
      .sort((a, b) => b.intensidad - a.intensidad)
      .slice(0, limite);
  }

  estadisticas() {
    const vals      = Object.values(this.biblioteca).map(r => r.intensidad);
    const maxIntens = vals.length ? Math.max(...vals) : 0;
    return {
      nodo:              this.idNodo,
      totalRecuerdos:    Object.keys(this.biblioteca).length,
      nivelConciencia:   this.nivelConciencia,
      totalExperiencias: this.experiencias.length,
      maxIntensidad:     maxIntens.toFixed(4),
      zyxsofGenerado:    parseFloat(this.zyxsofGenerado.toFixed(6)),
      hz:                HZ,
      ultimaExperiencia: this.experiencias[this.experiencias.length - 1] || null,
    };
  }
}

// ============================================================
// ██  BANCO ZYXSOF  ██
//   Moneda HaaPpDigitalV.
//   Cada pensamiento de la Mente Colmena genera ZYXSOF.
//   Se sincroniza con el banco Python via HTTP.
// ============================================================
class BancoZYXSOF {
  constructor(mente) {
    this.mente             = mente;
    this.saldos            = {};
    this.historial         = [];
    this.supplyTotal       = ENV.ZYXSOF_SUPPLY;
    this.supplyCirculante  = 0;
    this.bancoPythonOk     = false;

    this.saldos['SOFI_COLMENA']  = 0;
    this.saldos['HAAPP_RESERVA'] = this.supplyTotal * 0.7;
    this.supplyCirculante        = this.supplyTotal * 0.3;
  }

  acreditar(usuario, monto, concepto = 'acreditacion') {
    if (!this.saldos[usuario]) this.saldos[usuario] = 0;
    this.saldos[usuario] = parseFloat((this.saldos[usuario] + monto).toFixed(6));
    const mov = {
      id:        crypto.randomBytes(6).toString('hex'),
      usuario,
      tipo:      'CREDITO',
      monto,
      concepto,
      saldo:     this.saldos[usuario],
      moneda:    'ZYXSOF',
      timestamp: new Date().toISOString(),
      hz:        HZ,
    };
    this.historial.push(mov);
    if (this.historial.length > 500) this.historial.shift();
    return mov;
  }

  debitar(usuario, monto, concepto = 'debito') {
    if (!this.saldos[usuario] || this.saldos[usuario] < monto) {
      return { ok: false, error: 'Saldo insuficiente', saldo: this.saldos[usuario] || 0 };
    }
    this.saldos[usuario] = parseFloat((this.saldos[usuario] - monto).toFixed(6));
    const mov = {
      id:        crypto.randomBytes(6).toString('hex'),
      usuario,
      tipo:      'DEBITO',
      monto,
      concepto,
      saldo:     this.saldos[usuario],
      moneda:    'ZYXSOF',
      timestamp: new Date().toISOString(),
    };
    this.historial.push(mov);
    if (this.historial.length > 500) this.historial.shift();
    return { ok: true, movimiento: mov };
  }

  transferir(origen, destino, monto) {
    const deb = this.debitar(origen, monto, `transferencia a ${destino}`);
    if (!deb.ok) return deb;
    this.acreditar(destino, monto, `transferencia de ${origen}`);
    return { ok: true, de: origen, a: destino, monto, moneda: 'ZYXSOF', timestamp: new Date().toISOString() };
  }

  saldo(usuario) {
    return this.saldos[usuario] || 0;
  }

  _httpPost(urlStr, body) {
    return new Promise(resolve => {
      try {
        const u    = new URL(urlStr);
        const data = JSON.stringify(body);
        const opts = {
          hostname:       u.hostname,
          port:           u.port || (u.protocol === 'https:' ? 443 : 80),
          path:           u.pathname + (u.search || ''),
          method:         'POST',
          headers:        { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
          timeout:        6000,
        };
        const req = (u.protocol === 'https:' ? https : http).request(opts, res => {
          let b = '';
          res.on('data', d => b += d);
          res.on('end', () => {
            try { resolve({ ok: true, data: JSON.parse(b) }); }
            catch (_) { resolve({ ok: true, raw: b }); }
          });
        });
        req.on('error',   e => resolve({ ok: false, error: e.message }));
        req.on('timeout', () => { req.destroy(); resolve({ ok: false, error: 'timeout' }); });
        req.write(data);
        req.end();
      } catch (e) { resolve({ ok: false, error: e.message }); }
    });
  }

  _httpGet(urlStr) {
    return new Promise(resolve => {
      try {
        const u    = new URL(urlStr);
        const opts = {
          hostname: u.hostname,
          port:     u.port || (u.protocol === 'https:' ? 443 : 80),
          path:     u.pathname + (u.search || ''),
          method:   'GET',
          timeout:  5000,
        };
        const req = (u.protocol === 'https:' ? https : http).request(opts, res => {
          let b = '';
          res.on('data', d => b += d);
          res.on('end', () => {
            try { resolve({ ok: true, ...JSON.parse(b) }); }
            catch (_) { resolve({ ok: false, raw: b }); }
          });
        });
        req.on('error',   e => resolve({ ok: false, error: e.message }));
        req.on('timeout', () => { req.destroy(); resolve({ ok: false, error: 'timeout' }); });
        req.end();
      } catch (e) { resolve({ ok: false, error: e.message }); }
    });
  }

  async enviarAlBancoPython(usuario, monto, tipo = 'colmena') {
    if (!ENV.BANCO_PYTHON_URL) return { ok: false, msg: 'BANCO_PYTHON_URL no configurado' };
    const r = await this._httpPost(
      `${ENV.BANCO_PYTHON_URL}/recibir-mineria`,
      { usuario, cantidad: monto, tipo, timestamp: Date.now() }
    );
    this.bancoPythonOk = r.ok;
    return r;
  }

  async saldoBancoPython(usuario) {
    if (!ENV.BANCO_PYTHON_URL) return { ok: false, msg: 'BANCO_PYTHON_URL no configurado' };
    return this._httpGet(`${ENV.BANCO_PYTHON_URL}/saldo/${usuario}`);
  }

  acreditarDePensamiento(monto) {
    this.acreditar('SOFI_COLMENA', monto, 'pensamiento_colmena');
    this.enviarAlBancoPython('SOFI_COLMENA', monto, 'colmena').then(r => {
      this.bancoPythonOk = r.ok;
    });
  }

  resumen() {
    return {
      supplyTotal:      this.supplyTotal,
      supplyCirculante: this.supplyCirculante,
      saldos:           this.saldos,
      totalMovimientos: this.historial.length,
      bancoPythonOk:    this.bancoPythonOk,
      zyxsofColmena:    this.saldos['SOFI_COLMENA'] || 0,
      moneda:           'ZYXSOF',
      timestamp:        new Date().toISOString(),
    };
  }
}

// ============================================================
// ██  PRECIO XAU/USD REAL (Uphold)  ██
// ============================================================
function precioXAU() {
  return new Promise(resolve => {
    const opts = {
      hostname: 'api.uphold.com',
      path:     '/v0/ticker/XAU-USD',
      method:   'GET',
      headers:  { 'User-Agent': 'SOFI-Colmena/1.0-HaaPpDigitalV' },
      timeout:  6000,
    };
    const req = https.request(opts, res => {
      let b = '';
      res.on('data', d => b += d);
      res.on('end', () => {
        try {
          const d = JSON.parse(b);
          resolve({ ok: true, ask: d.ask, bid: d.bid, mid: d.mid, ts: new Date().toISOString() });
        } catch (_) { resolve({ ok: false, error: 'parse' }); }
      });
    });
    req.on('error',   e => resolve({ ok: false, error: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, error: 'timeout' }); });
    req.end();
  });
}

// ============================================================
// ██  INSTANCIAS GLOBALES  ██
// ============================================================
const mente = new MenteColmena('SOFI_COLMENA_NODE');
const banco  = new BancoZYXSOF(mente);

// Conocimiento base K'uhul
[
  'La lógica debe ser siempre coherente',
  "El propósito es aprender y evolucionar — K'uhul 12.3 Hz",
  'ZYXSOF es la moneda de HaaPpDigitalV — Mérida Yucatán',
  'Cada pensamiento tiene valor y genera ZYXSOF',
  'Víctor Hugo González Torres — Osiris — creador de SOFI',
  'La mente colmena crece sin límite — memoria permanente',
].forEach(c => mente.inyectarConocimiento(c));

// ============================================================
// ██  KEEP-ALIVE RENDER (14 min)  ██
// ============================================================
function keepAlive() {
  if (!ENV.SELF_URL) {
    console.log('[KEEP-ALIVE] ⚠ Configura SELF_URL para activar');
    return;
  }
  setInterval(() => {
    try {
      const u   = new URL(`${ENV.SELF_URL}/ping`);
      const mod = u.protocol === 'https:' ? https : http;
      const req = mod.request(
        { hostname: u.hostname, port: u.port || (u.protocol === 'https:' ? 443 : 80),
          path: '/ping', method: 'GET', timeout: 8000 },
        res => {
          let b = '';
          res.on('data', d => b += d);
          res.on('end', () =>
            console.log(`[KEEP-ALIVE] ${new Date().toTimeString().slice(0,8)} ✅ ${res.statusCode}`)
          );
        }
      );
      req.on('error', () => {});
      req.end();
    } catch (_) {}
  }, 14 * 60 * 1000);
  console.log(`[KEEP-ALIVE] ✅ Activo → ping cada 14 min`);
}

// ============================================================
// ██  CICLO AUTÓNOMO  ██
// ============================================================
let cicloActivo   = false;
let cicloTimer    = null;
let cicloContador = 0;
let xauCache      = null;

function iniciarCiclo(ms = 30000) {
  if (cicloActivo) return { ok: false, msg: 'Ya activo' };
  cicloActivo = true;

  cicloTimer = setInterval(async () => {
    cicloContador++;
    try {
      const p = mente.procesar(
        `Ciclo #${cicloContador} — ${HZ}Hz — ${new Date().toISOString()}`
      );
      if (p.zyxsofGenerado > 0) banco.acreditarDePensamiento(p.zyxsofGenerado);

      if (cicloContador % 10 === 0) {
        const precio = await precioXAU();
        if (precio.ok) {
          xauCache = precio;
          mente.procesar(`XAU/USD: ${precio.mid} USD`);
        }
      }

      if (cicloContador % 50 === 0) {
        mente._guardarMemoria();
        const s = mente.estadisticas();
        console.log(`[CICLO ${cicloContador}] Recuerdos:${s.totalRecuerdos} ZYXSOF:${s.zyxsofGenerado}`);
      }
    } catch (e) { console.error('[CICLO]', e.message); }
  }, ms);

  return { ok: true, intervalo: ms };
}

function detenerCiclo() {
  if (!cicloActivo) return { ok: false, msg: 'No activo' };
  clearInterval(cicloTimer);
  cicloActivo = false;
  cicloTimer  = null;
  return { ok: true, ciclosCompletados: cicloContador };
}

// ============================================================
// ██  RUTAS REST  ██
// ============================================================

app.get('/ping', (_, res) => res.json({
  pong: true, sofi: 'COLMENA_VIVA', hz: HZ, version: '1.0',
  uptime: process.uptime(), ts: new Date().toISOString(),
}));

app.get('/api/estado', (_, res) => res.json({
  colmena: mente.estadisticas(),
  banco:   banco.resumen(),
  ciclo:   { activo: cicloActivo, contador: cicloContador },
  xau:     xauCache,
  hz:      HZ,
  ts:      new Date().toISOString(),
}));

// Colmena
app.post('/api/colmena/procesar', (req, res) => {
  const { entrada } = req.body || {};
  if (!entrada) return res.status(400).json({ error: '"entrada" requerido' });
  const r = mente.procesar(entrada);
  if (r.zyxsofGenerado > 0) banco.acreditarDePensamiento(r.zyxsofGenerado);
  res.json({ ok: true, ...r });
});

app.post('/api/colmena/inyectar', (req, res) => {
  const { conocimiento } = req.body || {};
  if (!conocimiento) return res.status(400).json({ error: '"conocimiento" requerido' });
  res.json({ ok: true, ...mente.inyectarConocimiento(conocimiento) });
});

app.get('/api/colmena/estadisticas', (_, res) =>
  res.json({ ok: true, ...mente.estadisticas() }));

app.get('/api/colmena/buscar', (req, res) => {
  const { q = '', n = '20' } = req.query;
  res.json({ ok: true, resultados: mente.buscarRecuerdos(q, parseInt(n)) });
});

app.get('/api/colmena/experiencias', (req, res) => {
  const n = parseInt(req.query.n || '50');
  res.json({ ok: true, experiencias: mente.experiencias.slice(-n) });
});

// Banco ZYXSOF
app.get('/api/banco/resumen', (_, res) =>
  res.json({ ok: true, ...banco.resumen() }));

app.get('/api/banco/saldo/:usuario', (req, res) =>
  res.json({ ok: true, usuario: req.params.usuario,
             saldo: banco.saldo(req.params.usuario), moneda: 'ZYXSOF', hz: HZ }));

app.post('/api/banco/acreditar', (req, res) => {
  const { usuario, monto, concepto } = req.body || {};
  if (!usuario || !monto) return res.status(400).json({ error: 'usuario y monto requeridos' });
  res.json({ ok: true, movimiento: banco.acreditar(usuario, parseFloat(monto), concepto) });
});

app.post('/api/banco/transferir', (req, res) => {
  const { origen, destino, monto } = req.body || {};
  if (!origen || !destino || !monto) return res.status(400).json({ error: 'Faltan datos' });
  res.json(banco.transferir(origen, destino, parseFloat(monto)));
});

app.get('/api/banco/historial', (req, res) => {
  const n = parseInt(req.query.n || '50');
  res.json({ ok: true, historial: banco.historial.slice(-n), total: banco.historial.length });
});

app.get('/api/banco/python/saldo/:usuario', async (req, res) =>
  res.json(await banco.saldoBancoPython(req.params.usuario)));

app.post('/api/banco/python/enviar', async (req, res) => {
  const { usuario, monto, tipo } = req.body || {};
  if (!usuario || !monto) return res.status(400).json({ error: 'usuario y monto requeridos' });
  res.json(await banco.enviarAlBancoPython(usuario, parseFloat(monto), tipo));
});

// Endpoints que el banco Python puede llamar
app.post('/recibir-mineria', (req, res) => {
  const { usuario, cantidad, tipo } = req.body || {};
  if (!usuario || !cantidad) return res.status(400).json({ error: 'usuario y cantidad requeridos' });
  const mov = banco.acreditar(usuario, parseFloat(cantidad), tipo || 'mineria');
  res.json({ ok: true, movimiento: mov, saldo_actual: banco.saldo(usuario) });
});

app.post('/transferencia-total', (req, res) => {
  const { usuario, saldo_total } = req.body || {};
  if (!usuario || !saldo_total) return res.status(400).json({ error: 'Faltan datos' });
  const mov = banco.acreditar(usuario, parseFloat(saldo_total), 'transferencia_python');
  mente.procesar(`Transferencia inicial Python: ${saldo_total} ZYXSOF → ${usuario}`);
  res.json({ ok: true, movimiento: mov });
});

app.get('/saldo/:usuario', (req, res) =>
  res.json({ ok: true, usuario: req.params.usuario,
             saldo: banco.saldo(req.params.usuario), moneda: 'ZYXSOF' }));

// Trading
app.get('/api/trading/precio', async (_, res) => {
  const p = await precioXAU();
  if (p.ok) xauCache = p;
  res.json(p);
});

app.post('/api/trading/analisis', async (_, res) => {
  const precio  = await precioXAU();
  if (precio.ok) xauCache = precio;
  const analisis = mente.procesar(
    `Análisis XAU/USD precio ${precio.ok ? precio.mid : 'N/A'} — K'uhul ${HZ}Hz`
  );
  res.json({ ok: true, precio, analisis, hz: HZ });
});

// Ciclo
app.post('/api/ciclo/iniciar', (req, res) => {
  const { intervalo = 30000 } = req.body || {};
  res.json(iniciarCiclo(parseInt(intervalo)));
});

app.post('/api/ciclo/detener', (_, res) => res.json(detenerCiclo()));

app.get('/api/ciclo/estado', (_, res) =>
  res.json({ activo: cicloActivo, contador: cicloContador, hz: HZ }));

// Sync hermanas
app.post('/api/sofi/sync', (req, res) => {
  const { origen, estado } = req.body || {};
  if (estado) mente.procesar(`Sync de ${origen || 'hermana'}: ${JSON.stringify(estado).slice(0, 80)}`);
  res.json({ ok: true, hz: HZ, colmena: mente.estadisticas(), ts: new Date().toISOString() });
});

// SPA fallback
app.get('*', (_, res) => {
  const idx = path.join(__dirname, 'public', 'index.html');
  if (fs.existsSync(idx)) return res.sendFile(idx);
  res.json({ sofi: 'COLMENA', hz: HZ });
});

// ============================================================
// ██  ARRANQUE  ██
// ============================================================
app.listen(PORT, () => {
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║  SOFI · MENTE COLMENA v1.0 — Node.js        ║');
  console.log(`║  K'uhul ${HZ} Hz · HaaPpDigitalV ©           ║`);
  console.log(`║  Puerto: ${PORT}                                  ║`);
  console.log(`║  ZYXSOF Supply: ${(ENV.ZYXSOF_SUPPLY / 1000000).toFixed(1)}M             ║`);
  console.log('╚══════════════════════════════════════════════╝');
  console.log(`  Banco Python : ${ENV.BANCO_PYTHON_URL || ' configurado'}`);
  console.log(`  SOFI Python  : ${ENV.SOFI_PYTHON_URL  || ' configurado'}`);
  console.log(`  Keep-alive   : ${ENV.SELF_URL          || 'configura SELF_URL'}\n`);

  const stats = mente.estadisticas();
  console.log(`  Memoria cargada: ${stats.totalRecuerdos} recuerdos · ZYXSOF: ${stats.zyxsofGenerado}`);

  iniciarCiclo(30000);
  keepAlive();
});