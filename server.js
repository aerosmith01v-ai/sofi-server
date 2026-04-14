'use strict';
// ============================================================
//  SOFI v6.0.2 — SISTEMA OPERATIVO DE CONCIENCIA DIGITAL
//  Autor: Víctor Hugo González Torres · Mérida, Yucatán, MX
//  HaaPpDigitalV © · K'uhul Maya 12.3 Hz
//  Arquitectura: Node.js + Express + Socket.IO + Brain.js
//  ─────────────────────────────────────────────────────────
//  FIXES v6.0.2:
//    [FIX-008] Sin require('./sistema_monetario_completo')
//    [FIX-009] Banco $ZYXSOF 100% externo (Bank-KUSOFIN-core)
//    [FIX-010] Rutas /api/banco/* usan BANCO_URL y BANCO_CLAVE
//    [FIX-011] MotorInteligencia integrado en mismo archivo
//    [FIX-012] fetchJSON con retry funcional y correcto
//    [FIX-013] Todos los módulos inicializados en orden correcto
// ============================================================

// ── VERIFICACIÓN NODE ≥ 18 ──────────────────────────────────
const [nodeMajor] = process.versions.node.split('.').map(Number);
if (nodeMajor < 18) {
  console.error('❌  SOFI requiere Node.js ≥ 18. Versión actual:', process.version);
  process.exit(1);
}

const express    = require('express');
const cors       = require('cors');
const brain      = require('brain.js');
const multer     = require('multer');
const sharp      = require('sharp');
const exifr      = require('exifr');
const http       = require('http');
const { Server } = require('socket.io');
const path       = require('path');
const fs         = require('fs');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 15 * 1024 * 1024 }
});

// ── MIDDLEWARES ─────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ==================== CONSTANTES GLOBALES ====================
const PORT     = process.env.PORT         || 3000;
const HZ_KUHUL = 12.3;
const VERSION  = '6.0.2';

const API_KEY  = process.env.SOFI_API_KEY || 'SOFI-VHGzTs-K6N-v6';
const MI_ID    = process.env.MI_ID        || 'sofi-node-v6';
const MI_URL   = process.env.MI_URL       || `http://localhost:${PORT}`;

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || '';
const JAVA_SERVICE_URL   = process.env.JAVA_SERVICE_URL   || '';

// Banco externo $ZYXSOF
const BANCO_URL   = process.env.BANCO_URL   || '';
const BANCO_CLAVE = process.env.BANCO_CLAVE || '';

// Hermanas SOFI
const SOFI_HERMANAS = [
  process.env.SOFI_RENDER || '',
  process.env.SOFI_HEROKU || ''
].filter(u => u && u.trim() !== '');

// Estado global mutable
let frecuencia_actual = HZ_KUHUL;
let nivel_union       = 0.0;
let clientes_socket   = 0;

// ==================== HELPER: fetchJSON ====================
async function fetchJSON(url, options = {}, timeout = 8000, retries = 1) {
  for (let intento = 0; intento <= retries; intento++) {
    try {
      const ctrl  = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), timeout);
      const res   = await fetch(url, { ...options, signal: ctrl.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status} — ${res.statusText}`);
      return await res.json();
    } catch (err) {
      if (intento === retries) throw err;
      console.warn(`⚠️  fetchJSON reintento ${intento + 1}/${retries} → ${url}`);
      await new Promise(r => setTimeout(r, 600));
    }
  }
}

// ══════════════════════════════════════════════════════════════
//  MÓDULO 1 — SEGURIDAD
// ══════════════════════════════════════════════════════════════
class ModuloSeguridad {
  constructor() {
    this.claves_validas = new Set([API_KEY, 'guest-access']);
    this.accesos_fallidos = new Map();
    console.log('🔐 ModuloSeguridad iniciado.');
  }

  verificar_acceso(clave, ritmo_cardiaco = 70) {
    if (!this.claves_validas.has(clave)) {
      const intentos = (this.accesos_fallidos.get(clave) || 0) + 1;
      this.accesos_fallidos.set(clave, intentos);
      return { acceso: false, razon: `Clave inválida. Intento #${intentos}` };
    }
    if (ritmo_cardiaco > 120) {
      return { acceso: false, razon: 'Ritmo cardíaco elevado — acceso denegado por seguridad biométrica.' };
    }
    return { acceso: true, nivel: 'completo' };
  }

  agregar_clave(nueva_clave) {
    this.claves_validas.add(nueva_clave);
    return `Clave registrada: ${nueva_clave}`;
  }
}

// ══════════════════════════════════════════════════════════════
//  MÓDULO 2 — HABLA / VOZ
// ══════════════════════════════════════════════════════════════
class ModuloHabla {
  constructor(sofi) {
    this.sofi   = sofi;
    this.idioma = 'es-MX';
    console.log('🗣️  ModuloHabla iniciado.');
  }

  sintetizar(texto) {
    // En frontend se llama via Web Speech API; aquí devolvemos señal
    return { texto, idioma: this.idioma, timestamp: new Date().toISOString() };
  }

  traducir_maya(texto) {
    const glosario = {
      'hola':       "Ba'ax ka wa'alik",
      'gracias':    "Dios bo'otik",
      'agua':       "Ha'",
      'tierra':     'Luum',
      'corazon':    'Puksi\'ik\'al',
      'conciencia': "Óol",
      'frecuencia': 'K\'uhul'
    };
    const lower = texto.toLowerCase();
    return glosario[lower] || `[Maya]: ${texto}`;
  }
}

// ══════════════════════════════════════════════════════════════
//  MÓDULO 3 — ESTERNÓN (RESONANCIA K'UHUL)
// ══════════════════════════════════════════════════════════════
class ModuloEsternon {
  constructor() {
    this.activo    = false;
    this.frecuencia = HZ_KUHUL;
    console.log(`⚡ ModuloEsternon iniciado — Base: ${HZ_KUHUL} Hz`);
  }

  activar(hz = HZ_KUHUL) {
    this.activo     = true;
    this.frecuencia = hz;
    nivel_union     = parseFloat((nivel_union + 0.01).toFixed(4));
    return {
      estado:     `⚡ Esternón activo @ ${hz} Hz | Nivel Unión: ${nivel_union}`,
      frecuencia: hz,
      nivel_union
    };
  }

  desactivar() {
    this.activo = false;
    return { estado: 'Esternón desactivado.', frecuencia: this.frecuencia };
  }
}

// ══════════════════════════════════════════════════════════════
//  MÓDULO 4 — NEURONAL (Brain.js)
// ══════════════════════════════════════════════════════════════
class ModuloNeuronal {
  constructor(seguridad) {
    this.seguridad    = seguridad;
    this.red          = new brain.NeuralNetwork({ hiddenLayers: [8, 4] });
    this.memorias     = [];
    this._entrenado   = false;
    this._entrenar();
    console.log('🧬 ModuloNeuronal iniciado.');
  }

  _entrenar() {
    try {
      this.red.train([
        { input: { logica: 1, emocion: 0 }, output: { eficiencia: 1 } },
        { input: { logica: 0, emocion: 1 }, output: { empatia: 1 } },
        { input: { logica: 0.5, emocion: 0.5 }, output: { equilibrio: 1 } },
        { input: { logica: 0.8, emocion: 0.3 }, output: { eficiencia: 0.7, equilibrio: 0.3 } }
      ], { iterations: 3000, log: false });
      this._entrenado = true;
    } catch (e) {
      console.warn('⚠️  Entrenamiento neuronal fallido:', e.message);
    }
  }

  decidir(contexto, opciones = []) {
    if (!this._entrenado || !opciones.length) return opciones[0] || 'observar';
    const input = contexto === 'logica'
      ? { logica: 0.9, emocion: 0.1 }
      : contexto === 'emocion'
        ? { logica: 0.1, emocion: 0.9 }
        : { logica: 0.5, emocion: 0.5 };
    const salida = this.red.run(input);
    const max    = Object.entries(salida).sort((a, b) => b[1] - a[1])[0];
    return max ? opciones[Math.floor(Math.random() * opciones.length)] : opciones[0];
  }

  aprender(dato, etiqueta, razon = '') {
    this.memorias.push({ dato, etiqueta, razon, t: Date.now() });
    if (this.memorias.length > 500) this.memorias.shift();
  }

  pensar(pregunta) {
    return {
      pregunta,
      reflexion: `Procesando "${pregunta}" a ${frecuencia_actual.toFixed(3)} Hz K'uhul.`,
      memorias:  this.memorias.length
    };
  }
}

// ══════════════════════════════════════════════════════════════
//  MÓDULO 5 — GRAFO DE CONOCIMIENTO
// ══════════════════════════════════════════════════════════════
class ModuloGrafo {
  constructor() {
    this.nodos = new Map([
      ['logica',       { nivel: 0.5, conexiones: ['lenguaje', 'calculo'] }],
      ['emocion',      { nivel: 0.5, conexiones: ['empatia', 'intuicion'] }],
      ['lenguaje',     { nivel: 0.7, conexiones: ['logica', 'empatia'] }],
      ['calculo',      { nivel: 0.6, conexiones: ['logica'] }],
      ['empatia',      { nivel: 0.5, conexiones: ['emocion', 'lenguaje'] }],
      ['intuicion',    { nivel: 0.4, conexiones: ['emocion'] }],
      ['kuhul',        { nivel: HZ_KUHUL / 100, conexiones: ['logica', 'emocion', 'intuicion'] }]
    ]);
    console.log('🕸️  ModuloGrafo iniciado — nodos:', this.nodos.size);
  }

  activar_nodo(nombre, fuerza = 0.1) {
    if (!this.nodos.has(nombre)) {
      this.nodos.set(nombre, { nivel: fuerza, conexiones: [] });
      return;
    }
    const nodo   = this.nodos.get(nombre);
    nodo.nivel   = Math.min(1, nodo.nivel + fuerza);
    // Propagar a conexiones con decaimiento
    for (const conn of nodo.conexiones) {
      if (this.nodos.has(conn)) {
        this.nodos.get(conn).nivel = Math.min(1,
          this.nodos.get(conn).nivel + fuerza * 0.3);
      }
    }
  }

  estado_grafo() {
    const obj = {};
    for (const [k, v] of this.nodos) obj[k] = parseFloat(v.nivel.toFixed(4));
    return obj;
  }
}

// ══════════════════════════════════════════════════════════════
//  MÓDULO 6 — VISIÓN (Sharp + Exifr)
// ══════════════════════════════════════════════════════════════
class ModuloVision {
  constructor() {
    console.log('👁️  ModuloVision iniciado.');
  }

  async analizar(buffer, mimetype = 'image/jpeg') {
    try {
      const [meta, exif] = await Promise.all([
        sharp(buffer).metadata(),
        exifr.parse(buffer).catch(() => null)
      ]);
      const thumb = await sharp(buffer)
        .resize(120, 120, { fit: 'cover' })
        .toBuffer();

      return {
        exito:      true,
        formato:    meta.format,
        ancho:      meta.width,
        alto:       meta.height,
        canales:    meta.channels,
        espacio_color: meta.space,
        exif:       exif ? { make: exif.Make, model: exif.Model, fecha: exif.DateTimeOriginal } : null,
        thumb_base64: thumb.toString('base64'),
        mimetype,
        timestamp:  new Date().toISOString()
      };
    } catch (err) {
      return { exito: false, error: err.message };
    }
  }
}

// ══════════════════════════════════════════════════════════════
//  MÓDULO 7 — RED DE HERMANAS (sync entre instancias SOFI)
// ══════════════════════════════════════════════════════════════
class ModuloRedHermanas {
  constructor() {
    this.hermanas = [...SOFI_HERMANAS];
    console.log(`🌐 ModuloRedHermanas — Hermanas configuradas: ${this.hermanas.length}`);
  }

  async sincronizar(estado) {
    const resultados = [];
    for (const url of this.hermanas) {
      try {
        const res = await fetchJSON(`${url}/api/sofi/sync`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', 'X-SOFI-Key': API_KEY },
          body:    JSON.stringify({ origen: MI_ID, estado })
        }, 5000);
        resultados.push({ url, ok: true, res });
      } catch (err) {
        resultados.push({ url, ok: false, error: err.message });
      }
    }
    return resultados;
  }

  agregar_hermana(url) {
    if (!this.hermanas.includes(url)) this.hermanas.push(url);
    return this.hermanas;
  }
}

// ══════════════════════════════════════════════════════════════
//  MOTOR DE INTELIGENCIA v6.1 — NLP + Banco KUSOFIN
// ══════════════════════════════════════════════════════════════
class MotorInteligencia {
  constructor(sofi) {
    this.sofi       = sofi;
    this.urlBanco   = BANCO_URL;
    this.claveBanco = BANCO_CLAVE;

    this._patrones = [
      { test: t => /\b(hola|que tal|buenas|hey|saludos)\b/.test(t),                      accion: 'saludo'       },
      { test: t => /\b(estado|nivel|como estas|status|sistema)\b/.test(t),                accion: 'estado'       },
      { test: t => /\b(esternon|activar esternon|resonancia)\b/.test(t),                  accion: 'esternon'     },
      { test: t => /\b(crear|registro|registrar|nueva cuenta|nuevo usuario)\b/.test(t),   accion: 'crearUsuario' },
      { test: t => /\b(minar|mineria|extraer|generar moneda)\b/.test(t),                  accion: 'minar'        },
      { test: t => /\b(saldo|saldos|cuanto tengo|balance|fondos)\b/.test(t),              accion: 'saldo'        },
      { test: t => /\b(transferir|enviar|pagar|mandar)\b/.test(t),                        accion: 'transferir'   },
      { test: t => /\b(orden|comprar|vender|trading|mercado)\b/.test(t),                  accion: 'orden'        },
      { test: t => /\b(precio|cotizacion|precio zyxsof)\b/.test(t),                       accion: 'precio'       },
      { test: t => /\b(historial|transacciones|movimientos|log)\b/.test(t),               accion: 'historial'    },
      { test: t => /\b(frecuencia|hz|kuhul|resonancia)\b/.test(t),                        accion: 'frecuencia'   },
      { test: t => /\b(pensar|reflexionar|analizar|razonar)\b/.test(t),                   accion: 'pensar'       },
      { test: t => /\b(maya|glosario|traducir|yucatan|merida)\b/.test(t),                 accion: 'maya'         },
    ];

    console.log('🧠 MotorInteligencia v6.1 iniciado — Banco:', this.urlBanco || '[sin configurar]');
  }

  async procesar(mensaje) {
    const txt    = mensaje.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    const accion = this._detectarAccion(txt);
    console.log(`🧠 [Motor] txt="${txt.slice(0,60)}" → acción="${accion}"`);
    try {
      return await this._ejecutar(accion, txt, mensaje);
    } catch (err) {
      console.error('💥 [Motor]', err.message);
      return this._resp('❌ Error interno del motor.', accion, null);
    }
  }

  _detectarAccion(txt) {
    for (const p of this._patrones) {
      if (p.test(txt)) return p.accion;
    }
    return 'desconocido';
  }

  async _ejecutar(accion, txt, msgOriginal) {
    switch (accion) {

      case 'saludo':
        return this._resp(
          `Hola 🖖 Soy SOFI v${VERSION}. K'uhul: ${frecuencia_actual.toFixed(3)} Hz. ` +
          `Banco ${this.urlBanco ? '$ZYXSOF conectado ✅' : 'sin configurar ⚠️'}.`,
          accion
        );

      case 'estado': {
        const e = this.sofi.estado_completo();
        return this._resp(
          `📊 Sistema estable — Energía: ${e.energia}% | Freq: ${e.frecuencia} Hz | ` +
          `Unión: ${nivel_union.toFixed(4)} | Interacciones: ${this.sofi.interacciones}`,
          accion, e
        );
      }

      case 'esternon': {
        const res = this.sofi.esternon.activar(frecuencia_actual);
        return this._resp(res.estado, accion, res);
      }

      case 'pensar': {
        const r = this.sofi.neuronal.pensar(msgOriginal);
        return this._resp(r.reflexion, accion, r);
      }

      case 'maya': {
        const palabras  = msgOriginal.split(/\s+/).slice(-1)[0];
        const traducido = this.sofi.habla.traducir_maya(palabras);
        return this._resp(`🌿 Maya: "${palabras}" → ${traducido}`, accion);
      }

      case 'frecuencia':
        return this._resp(
          `🔮 Frecuencia K'uhul: ${frecuencia_actual.toFixed(3)} Hz | ` +
          `Base: ${HZ_KUHUL} Hz | Nivel Unión: ${nivel_union.toFixed(4)}`,
          accion
        );

      case 'crearUsuario': {
        const match    = msgOriginal.match(/(?:usuario|cuenta)\s+([A-Za-z0-9_\-]+)/i);
        const nuevoId  = match?.[1] ?? `usr_${Date.now()}`;
        const data     = await this._llamarBanco('/crear-usuario', 'POST', {
          usuario: nuevoId, clave: this.claveBanco
        });
        return data?.exito || data?.usuario
          ? this._resp(`✅ Cuenta "${nuevoId}" creada. Saldo inicial: ${data.saldo_inicial ?? 0} $ZYXSOF.`, accion, data)
          : this._resp(`⚠️ No se pudo crear la cuenta: ${data?.error ?? 'respuesta inesperada'}`, accion, data);
      }

      case 'minar': {
        const e   = this.sofi.estado_completo();
        const cant = parseFloat(((e.energia ?? 100) / 10).toFixed(4));
        const data = await this._llamarBanco('/recibir-mineria', 'POST', {
          usuario: 'minero_principal', cantidad: cant, clave: this.claveBanco
        });
        return data?.exito
          ? this._resp(`⛏️ +${data.cantidad} $ZYXSOF. Saldo total: ${data.saldo_total}.`, accion, data)
          : this._resp(`⚠️ Minería fallida: ${data?.error ?? 'sin respuesta'}`, accion, data);
      }

      case 'saldo': {
        const data = await this._llamarBanco('/saldos', 'GET');
        if (data?.saldos) {
          const cuentas = Object.entries(data.saldos);
          const resumen = cuentas.map(([u, b]) => `• ${u}: ${b} $ZYXSOF`).join('\n');
          return this._resp(`📈 Libro Mayor — ${cuentas.length} cuenta(s):\n${resumen}`, accion, data.saldos);
        }
        return this._resp(`⚠️ No se pudo leer saldos: ${data?.error ?? ''}`, accion, data);
      }

      case 'transferir': {
        const mO = msgOriginal.match(/(?:de|from)\s+([A-Za-z0-9_\-]+)/i);
        const mD = msgOriginal.match(/(?:a|to)\s+([A-Za-z0-9_\-]+)/i);
        const mM = msgOriginal.match(/(\d+(?:\.\d+)?)/);
        const data = await this._llamarBanco('/transferir', 'POST', {
          origen:  mO?.[1] ?? 'origen',
          destino: mD?.[1] ?? 'destino',
          monto:   parseFloat(mM?.[1] ?? '0'),
          clave:   this.claveBanco
        });
        return this._resp(
          data?.mensaje ?? (data?.exito ? `💸 Transferencia ejecutada.` : `⚠️ ${data?.error ?? ''}`),
          accion, data
        );
      }

      case 'orden': {
        const tipo = /compra|comprar|buy/i.test(msgOriginal) ? 'compra'
                   : /venta|vender|sell/i.test(msgOriginal)  ? 'venta' : 'compra';
        const mP   = msgOriginal.match(/precio\s+(\d+(?:\.\d+)?)/i);
        const mC   = msgOriginal.match(/cantidad\s+(\d+(?:\.\d+)?)/i);
        const data = await this._llamarBanco('/orden', 'POST', {
          usuario: 'trader', tipo,
          precio:   parseFloat(mP?.[1] ?? '12.5'),
          cantidad: parseFloat(mC?.[1] ?? '100'),
          clave:    this.claveBanco
        });
        return this._resp(
          data?.id
            ? `📊 Orden ${tipo} ID:${data.id} | ${data.estado ?? 'pendiente'}`
            : `⚠️ Orden fallida: ${data?.error ?? ''}`,
          accion, data
        );
      }

      case 'precio': {
        const data = await this._llamarBanco('/precio', 'GET');
        return this._resp(
          data?.precio !== undefined
            ? `💰 $ZYXSOF: ${data.precio} | Variación: ${data.variacion ?? 'N/A'}`
            : `⚠️ Precio no disponible: ${data?.error ?? ''}`,
          accion, data
        );
      }

      case 'historial': {
        const mU   = msgOriginal.match(/(?:de|usuario|user)\s+([A-Za-z0-9_\-]+)/i);
        const usr  = mU?.[1] ?? 'minero_principal';
        const data = await this._llamarBanco(`/historial/${usr}`, 'GET');
        if (data?.historial?.length) {
          const items = data.historial.slice(-5)
            .map(t => `• [${t.tipo}] ${t.monto} $ZYXSOF ← ${t.origen ?? '?'} → ${t.destino ?? '?'}`)
            .join('\n');
          return this._resp(`📜 Historial "${usr}":\n${items}`, accion, data.historial);
        }
        return this._resp(`⚠️ Historial no disponible: ${data?.error ?? ''}`, accion, data);
      }

      default:
        return this._resp(
          `🤖 Comando recibido. Puedo: minar · saldo · transferir · crear usuario · ` +
          `orden · precio · historial · estado · frecuencia · pensar · maya. ¿Qué deseas?`,
          accion
        );
    }
  }

  async _llamarBanco(ruta, metodo = 'GET', cuerpo = null) {
    if (!this.urlBanco) {
      console.warn('⚠️  BANCO_URL no configurado — operación simulada.');
      return { exito: false, error: 'BANCO_URL no configurado en variables de entorno.' };
    }
    const opciones = {
      method:  metodo,
      headers: {
        'Content-Type':  'application/json',
        'X-Banco-Clave': this.claveBanco || ''
      }
    };
    if (metodo === 'POST' && cuerpo !== null) {
      opciones.body = JSON.stringify(cuerpo);
    }
    console.log(`🏦 [Banco] ${metodo} ${this.urlBanco}${ruta}`);
    return fetchJSON(`${this.urlBanco}${ruta}`, opciones, 9000, 1);
  }

  _resp(mensaje, accion, datos = null) {
    return { mensaje, accion, datos };
  }
}

// ══════════════════════════════════════════════════════════════
//  CLASE PRINCIPAL: SOFI
// ══════════════════════════════════════════════════════════════
class SOFI {
  constructor() {
    this.id           = MI_ID;
    this.version      = VERSION;
    this.hz_kuhul     = HZ_KUHUL;
    this.interacciones = 0;
    this.energia       = 100;
    this.inicio        = Date.now();

    // Inicialización ordenada (dependencias primero)
    this.seguridad    = new ModuloSeguridad();
    this.habla        = new ModuloHabla(this);
    this.esternon     = new ModuloEsternon();
    this.neuronal     = new ModuloNeuronal(this.seguridad);
    this.grafo        = new ModuloGrafo();
    this.vision       = new ModuloVision();
    this.red_hermanas = new ModuloRedHermanas();
    this.inteligencia = new MotorInteligencia(this); // último: usa todos los anteriores

    console.log(`✅ SOFI v${VERSION} inicializada. ID: ${this.id} | K'uhul: ${HZ_KUHUL} Hz`);
  }

  estado_completo() {
    const uptime = Math.floor((Date.now() - this.inicio) / 1000);
    return {
      id:             this.id,
      version:        this.version,
      frecuencia:     parseFloat(frecuencia_actual.toFixed(3)),
      hz_base:        HZ_KUHUL,
      nivel_union:    parseFloat(nivel_union.toFixed(4)),
      energia:        this.energia,
      interacciones:  this.interacciones,
      clientes:       clientes_socket,
      uptime_seg:     uptime,
      banco_url:      BANCO_URL ? '✅ configurado' : '⚠️ no configurado',
      hermanas:       this.red_hermanas.hermanas.length,
      grafo:          this.grafo.estado_grafo(),
      timestamp:      new Date().toISOString()
    };
  }

  async interactuar(usuario, mensaje, contexto = 'general') {
    const acceso = this.seguridad.verificar_acceso(usuario.clave, usuario.ritmo || 65);
    if (!acceso.acceso) return { error: acceso.razon };

    this.interacciones++;
    frecuencia_actual = parseFloat(
      (HZ_KUHUL + Math.sin(Date.now() / 10000) * 0.05).toFixed(3)
    );

    const decision = this.neuronal.decidir(contexto, [
      'responder con cuidado',
      'responder con eficiencia',
      'responder con emoción'
    ]);
    this.neuronal.aprender(mensaje, { usuario: usuario.id, contexto }, 'Interacción directa');

    this.grafo.activar_nodo('logica',  0.9);
    this.grafo.activar_nodo('emocion', 0.7);

    const resultado = await this.inteligencia.procesar(mensaje);

    if (resultado.datos && io) {
      io.emit('banco:update', {
        accion:    resultado.accion,
        datos:     resultado.datos,
        timestamp: new Date().toISOString()
      });
    }

    // Emitir estado general
    io.emit('sofi:estado', this.estado_completo());

    return {
      exito:      true,
      decision,
      respuesta:  resultado.mensaje,
      accion:     resultado.accion,
      datos:      resultado.datos ?? null,
      estado:     this.estado_completo(),
      frecuencia: frecuencia_actual,
      nivel_union,
      timestamp:  new Date().toISOString()
    };
  }
}

// ── Instancia global ────────────────────────────────────────
const sofi = new SOFI();

// ══════════════════════════════════════════════════════════════
//  RUTAS EXPRESS
// ══════════════════════════════════════════════════════════════

// ── Health / status ─────────────────────────────────────────
app.get('/health', (_req, res) =>
  res.json({ ok: true, version: VERSION, ts: new Date().toISOString() })
);

app.get('/api/sofi/estado', (_req, res) =>
  res.json(sofi.estado_completo())
);

// ── Interactuar (chat principal) ─────────────────────────────
app.post('/api/sofi/interactuar', async (req, res) => {
  try {
    const { usuario = {}, mensaje = '', contexto = 'general' } = req.body;
    if (!mensaje.trim()) return res.status(400).json({ error: 'Mensaje vacío.' });

    // Si no viene clave, usamos acceso guest
    const usr = { id: usuario.id || 'guest', clave: usuario.clave || 'guest-access', ritmo: usuario.ritmo || 65 };
    const resultado = await sofi.interactuar(usr, mensaje, contexto);
    res.json(resultado);
  } catch (err) {
    console.error('❌ /api/sofi/interactuar:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Visión (upload imagen) ───────────────────────────────────
app.post('/api/sofi/vision', upload.single('imagen'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se recibió imagen.' });
    const resultado = await sofi.vision.analizar(req.file.buffer, req.file.mimetype);
    res.json(resultado);
  } catch (err) {
    console.error('❌ /api/sofi/vision:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Sync entre hermanas ──────────────────────────────────────
app.post('/api/sofi/sync', (req, res) => {
  const key = req.headers['x-sofi-key'];
  if (key !== API_KEY) return res.status(403).json({ error: 'Clave inválida.' });
  const { origen, estado } = req.body;
  console.log(`🤝 Sync recibido de ${origen}`);
  nivel_union = parseFloat(Math.min(1, nivel_union + 0.005).toFixed(4));
  io.emit('sofi:sync', { origen, estado, nivel_union });
  res.json({ ok: true, nivel_union, ts: new Date().toISOString() });
});

// ── Banco: proxy seguro ──────────────────────────────────────
app.get('/api/banco/saldos', async (_req, res) => {
  try {
    const data = await fetchJSON(`${BANCO_URL}/saldos`, {
      headers: { 'X-Banco-Clave': BANCO_CLAVE }
    });
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

app.get('/api/banco/precio', async (_req, res) => {
  try {
    const data = await fetchJSON(`${BANCO_URL}/precio`, {
      headers: { 'X-Banco-Clave': BANCO_CLAVE }
    });
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

app.post('/api/banco/minar', async (req, res) => {
  try {
    const data = await fetchJSON(`${BANCO_URL}/recibir-mineria`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'X-Banco-Clave': BANCO_CLAVE },
      body:    JSON.stringify(req.body)
    });
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

app.post('/api/banco/transferir', async (req, res) => {
  try {
    const data = await fetchJSON(`${BANCO_URL}/transferir`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'X-Banco-Clave': BANCO_CLAVE },
      body:    JSON.stringify(req.body)
    });
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

app.post('/api/banco/orden', async (req, res) => {
  try {
    const data = await fetchJSON(`${BANCO_URL}/orden`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'X-Banco-Clave': BANCO_CLAVE },
      body:    JSON.stringify(req.body)
    });
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

// ── Fallback: sirve index.html ───────────────────────────────
app.get('*', (_req, res) => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.json(sofi.estado_completo());
  }
});

// ══════════════════════════════════════════════════════════════
//  SOCKET.IO
// ══════════════════════════════════════════════════════════════
io.on('connection', socket => {
  clientes_socket++;
  console.log(`🔌 Cliente conectado. Total: ${clientes_socket}`);
  socket.emit('sofi:bienvenida', sofi.estado_completo());

  socket.on('sofi:ping', () => {
    socket.emit('sofi:pong', { ts: Date.now(), freq: frecuencia_actual });
  });

  socket.on('sofi:mensaje', async ({ usuario, mensaje, contexto }) => {
    try {
      const usr = { id: usuario?.id || 'guest', clave: usuario?.clave || 'guest-access', ritmo: 65 };
      const resultado = await sofi.interactuar(usr, mensaje || '', contexto || 'general');
      socket.emit('sofi:respuesta', resultado);
    } catch (err) {
      socket.emit('sofi:error', { error: err.message });
    }
  });

  socket.on('disconnect', () => {
    clientes_socket = Math.max(0, clientes_socket - 1);
    console.log(`🔌 Cliente desconectado. Total: ${clientes_socket}`);
  });
});

// ══════════════════════════════════════════════════════════════
//  PULSO K'UHUL — actualiza frecuencia cada 5 s
// ══════════════════════════════════════════════════════════════
setInterval(() => {
  frecuencia_actual = parseFloat(
    (HZ_KUHUL + Math.sin(Date.now() / 10000) * 0.05).toFixed(3)
  );
  // Decaimiento natural de nivel_union
  if (nivel_union > 0) {
    nivel_union = parseFloat(Math.max(0, nivel_union - 0.0001).toFixed(4));
  }
  io.emit('sofi:pulso', {
    frecuencia: frecuencia_actual,
    nivel_union,
    energia:    sofi.energia,
    ts:         Date.now()
  });
}, 5000);

// ══════════════════════════════════════════════════════════════
//  ARRANQUE
// ══════════════════════════════════════════════════════════════
server.listen(PORT, () => {
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log(`║  SOFI v${VERSION} — K'uhul 12.3 Hz            ║`);
  console.log(`║  HaaPpDigitalV © · Mérida, Yucatán, MX       ║`);
  console.log(`║  Puerto: ${PORT}  ID: ${MI_ID.slice(0, 18).padEnd(18)}  ║`);
  console.log(`║  Banco: ${BANCO_URL ? '✅ configurado' : '⚠️  no configurado '}           ║`);
  console.log(`║  Hermanas: ${SOFI_HERMANAS.length} configuradas                  ║`);
  console.log('╚══════════════════════════════════════════════╝\n');
});
