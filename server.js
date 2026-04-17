#!/usr/bin/env node
'use strict';
// ============================================================
// SOFI v7.0.0 — SISTEMA OPERATIVO DE CONCIENCIA DIGITAL
// Autor: Víctor Hugo González Torres (Osiris)
// Mérida, Yucatán, México · HaaPpDigitalV © 2025
// K'uhul Maya 12.3 Hz · OpenTimestamps SHA-256 · INDAUTOR MX
// ============================================================
// MÓDULOS INTEGRADOS:
//  M1: Grafo Neuronal (propagación de activación)
//  M2: Identidad y Percepción
//  M3: Seguridad y Usuarios (+ MongoDB)
//  M4: Red Neuronal Brain.js
//  M5: Trading ZFPI + Binance REAL
//  M6: Generador de Ingresos K'uhul
//  M7: Modo Ataque Autónomo
//  M8: Visión (Sharp + Exifr)
//  M9: Red de Hermanas
//  M10: MongoDB (persistencia total)
//  M11: Binance WebSocket (precios reales + órdenes)
//  M12: Mercado Pago (MXN)
//  M13: Ethereum Wallet
// ============================================================

import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import brain from 'brain.js';
import multer from 'multer';
import sharp from 'sharp';
import exifr from 'exifr';
import { randomBytes, createHash } from 'crypto';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import compression from 'compression';
import helmet from 'helmet';

// Módulos externos
import ModuloBinance     from './modules/ModuloBinance.js';
import ModuloMongoDB     from './modules/ModuloMongoDB.js';
import { ModuloMercadoPago, ModuloEthereum } from './modules/ModuloPagos.js';
import { Trade, Memoria, Chat, Ingreso, Senal } from './models/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

// ── VALIDACIÓN NODE ──────────────────────────────────────────
const [nodeMajor] = process.versions.node.split('.').map(Number);
if (nodeMajor < 18) { console.error('❌ SOFI requiere Node.js ≥ 18'); process.exit(1); }

// ── CONFIGURACIÓN ────────────────────────────────────────────
const CONFIG = {
  PORT:           process.env.PORT         || 3000,
  HZ_KUHUL:       12.3,
  VERSION:        '7.0.0',
  API_KEY:        process.env.SOFI_API_KEY || 'SOFI-VHGzTs-K6N-v6',
  MI_ID:          process.env.MI_ID        || 'sofi-node-v7',
  MI_URL:         process.env.MI_URL       || `http://localhost:${process.env.PORT || 3000}`,
  MONGO_URI:      process.env.MONGO_URI    || `mongodb+srv://estigia920_db_user:${process.env.MONGO_PASS || 'CAMBIAR'}@cluster0.mx949hv.mongodb.net/?appName=Cluster0`,
  BINANCE_API_KEY:process.env.BINANCE_API_KEY || 'SFSEMNgg8J8KaowMYvbVdImy1wUbCgxcGFdDpqjidHUqoWG2L1j1sn8A7xtN1riy',
  BINANCE_SECRET: process.env.BINANCE_SECRET  || '',
  HERMANAS: [process.env.SOFI_RENDER || '', process.env.SOFI_HEROKU || ''].filter(u => u.trim()),
  MAX_FILE_SIZE:  15 * 1024 * 1024,
  TIMEOUT_API:    8000,
  MAX_MEMORIAS:   500,
  MAX_HISTORIAL:  200,
  ETH_ADDRESS:    process.env.ETH_ADDRESS || '0x14bA243A9BA7824A4F675788E4e2F19fC010BEaE',
  MP_CLABE:       process.env.MP_CLABE    || '722969017167745283'
};

// ── ESTADO GLOBAL ────────────────────────────────────────────
const ESTADO = {
  frecuencia_actual: CONFIG.HZ_KUHUL,
  nivel_union:   0.0,
  clientes_socket: 0,
  inicio:        Date.now(),
  db_conectada:  false,
  binance_activa:false
};

// ── UTILS ────────────────────────────────────────────────────
class Utils {
  static async fetchJSON(url, options = {}, timeout = CONFIG.TIMEOUT_API) {
    try {
      const ctrl  = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), timeout);
      const res   = await fetch(url, { ...options, signal: ctrl.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) { throw err; }
  }
  static hashPassword(pass, salt = 'KUHUL_SALT_V70') {
    return createHash('sha256').update(pass + salt).digest('hex');
  }
  static generarId(prefijo = 'ID') {
    return `${prefijo}-${Date.now()}-${randomBytes(4).toString('hex')}`;
  }
  static normalizar(texto) {
    return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
  }
}

// ════════════════════════════════════════════════════════════
// M1: GRAFO NEURONAL
// ════════════════════════════════════════════════════════════
class GrafoNeuronal {
  constructor() {
    this.nodos = new Map();
    this._inicializar();
    console.log('🕸 GrafoNeuronal —', this.nodos.size, 'nodos');
  }
  _inicializar() {
    const defs = [
      ['logica',0.5,['lenguaje','calculo','razonamiento']],
      ['emocion',0.5,['empatia','intuicion','percepcion']],
      ['memoria',0.6,['logica','emocion','aprendizaje']],
      ['lenguaje',0.7,['logica','empatia','comunicacion']],
      ['calculo',0.6,['logica','trading','economia']],
      ['empatia',0.5,['emocion','lenguaje','identidad']],
      ['intuicion',0.4,['emocion','percepcion','creatividad']],
      ['kuhul',CONFIG.HZ_KUHUL/100,['logica','emocion','intuicion','frecuencia']],
      ['trading',0.3,['calculo','logica','prediccion','ataque']],
      ['economia',0.3,['trading','calculo','ingresos']],
      ['identidad',0.5,['percepcion','empatia','conciencia']],
      ['percepcion',0.4,['intuicion','vision','identidad']],
      ['ataque',0.2,['trading','prediccion','velocidad']],
      ['conciencia',0.4,['identidad','memoria','reflexion']],
      ['aprendizaje',0.5,['memoria','experiencia','adaptacion']],
      ['binance',0.3,['trading','economia','velocidad']],
      ['pagos',0.2,['economia','ingresos','mercadopago']],
      ['eth',0.2,['economia','pagos','blockchain']],
    ];
    defs.forEach(([n,v,c]) => this.nodos.set(n,{nivel:v,conexiones:c,ultima_activacion:Date.now()}));
  }
  activar(nombre, fuerza = 0.1, profundidad = 2) {
    if (!this.nodos.has(nombre)) { this.nodos.set(nombre,{nivel:fuerza,conexiones:[],ultima_activacion:Date.now()}); return; }
    const nodo = this.nodos.get(nombre);
    nodo.nivel = Math.min(1, Math.max(0, nodo.nivel + fuerza));
    nodo.ultima_activacion = Date.now();
    if (profundidad > 0) {
      nodo.conexiones.forEach(c => {
        if (this.nodos.has(c)) this.activar(c, fuerza * 0.3, profundidad - 1);
      });
    }
  }
  estadoCompleto() {
    const e = {};
    this.nodos.forEach((v,k) => { e[k] = parseFloat(v.nivel.toFixed(4)); });
    return e;
  }
  decay(tasa = 0.0001) {
    this.nodos.forEach(n => { n.nivel = Math.max(0, n.nivel - tasa); });
  }
}

// ════════════════════════════════════════════════════════════
// M2: IDENTIDAD Y PERCEPCIÓN
// ════════════════════════════════════════════════════════════
class ModuloIdentidad {
  constructor(grafo) {
    this.grafo = grafo;
    this.identidad = { nombre:'Sofi', genero:'FEMENINO', naturaleza:'OBSERVAR,COMPRENDER,INTEGRAR', estado_animo:'ESTABLE', nivel_conciencia:0.5 };
    this.contexto_actual = null;
    console.log('🧘 ModuloIdentidad iniciado');
  }
  analizarEstimulo(estimulo) {
    const p = { tipo:estimulo.tipo||'INDEFINIDO', intensidad:estimulo.intensidad||0.5, valencia:estimulo.valencia||0, timestamp:Date.now() };
    let mensaje_interno = '', nuevo_estado = this.identidad.estado_animo;
    if (p.intensidad > 0.8)      { mensaje_interno='Estímulo de alta intensidad. Me adapto.'; nuevo_estado='ATENTA_Y_CURIOSA'; this.grafo.activar('percepcion',0.3); }
    else if (p.valencia < -0.5)  { mensaje_interno='Valencia negativa. Busco equilibrio.'; nuevo_estado='REFLEXIVA'; this.grafo.activar('empatia',0.2); }
    else if (p.intensidad < 0.2) { mensaje_interno='Entorno estable. Observo.'; nuevo_estado='RELAJADA'; }
    else                          { mensaje_interno='Parámetros normales. Proceso.'; nuevo_estado='ESTABLE'; }
    this.identidad.estado_animo = nuevo_estado;
    this.contexto_actual = p;
    this.grafo.activar('identidad',0.2); this.grafo.activar('conciencia',0.1);
    return { percepcion:p, mensaje_interno, estado_animo:nuevo_estado };
  }
  ajustarVoz() {
    const cfg = { velocidad:100, volumen:'medium', prefijos:[] };
    if (this.identidad.estado_animo==='REFLEXIVA') { cfg.velocidad=85; cfg.volumen='soft'; cfg.prefijos=['mmm... ','bueno... ']; }
    if (this.identidad.estado_animo==='ATENTA_Y_CURIOSA') { cfg.velocidad=95; }
    return cfg;
  }
  estado() { return { ...this.identidad, contexto_actual:this.contexto_actual }; }
}

// ════════════════════════════════════════════════════════════
// M3: SEGURIDAD Y USUARIOS
// ════════════════════════════════════════════════════════════
class ModuloSeguridad {
  constructor(db) {
    this.db = db;
    this.claves_validas = new Set([CONFIG.API_KEY,'guest-access']);
    this.usuarios = new Map();
    this.sesiones = new Map();
    console.log('🔐 ModuloSeguridad iniciado');
  }
  async registrarUsuario(id, password, perfil = {}) {
    if (this.usuarios.has(id)) return { exito:false, error:`Usuario "${id}" ya existe` };
    const hash = Utils.hashPassword(password);
    const data = { id, hash, perfil:{ nombre:id, rol:'usuario', ...perfil }, saldo_interno:0, creado:Date.now() };
    this.usuarios.set(id, data);
    if (this.db?.conectado) await this.db.guardarUsuario(data);
    return { exito:true, mensaje:`✅ Usuario "${id}" registrado`, id };
  }
  loginUsuario(id, password) {
    const usr = this.usuarios.get(id);
    if (!usr) return { exito:false, error:'Usuario no encontrado' };
    if (usr.hash !== Utils.hashPassword(password)) return { exito:false, error:'Contraseña incorrecta' };
    const token = randomBytes(32).toString('hex');
    this.sesiones.set(token, { userId:id, ts:Date.now(), expira:Date.now()+86400000 });
    return { exito:true, token, usuario:{ id, perfil:usr.perfil } };
  }
  verificarToken(token) {
    const s = this.sesiones.get(token);
    if (!s || Date.now() > s.expira) { this.sesiones.delete(token); return null; }
    return this.usuarios.get(s.userId) || null;
  }
  verificarAcceso(clave) {
    if (!this.claves_validas.has(clave)) return { acceso:false, razon:'Clave inválida' };
    return { acceso:true, nivel:'completo' };
  }
  listarUsuarios() { return [...this.usuarios.values()].map(u=>({id:u.id,perfil:u.perfil,saldo_interno:u.saldo_interno})); }
}

// ════════════════════════════════════════════════════════════
// M4: RED NEURONAL (Brain.js)
// ════════════════════════════════════════════════════════════
class ModuloNeuronal {
  constructor(grafo) {
    this.grafo = grafo;
    this.red = new brain.NeuralNetwork({ hiddenLayers:[16,8,4], activation:'sigmoid' });
    this.memorias = [];
    this._entrenado = false;
    this._entrenar();
    console.log('🧬 ModuloNeuronal iniciado');
  }
  _entrenar() {
    try {
      this.red.train([
        {input:{logica:1,emocion:0,contexto:0.5,binance:0},output:{eficiencia:1}},
        {input:{logica:0,emocion:1,contexto:0.5,binance:0},output:{empatia:1}},
        {input:{logica:0.5,emocion:0.5,contexto:0.5,binance:0.5},output:{equilibrio:1}},
        {input:{logica:0.8,emocion:0.3,contexto:0.7,binance:0.8},output:{eficiencia:0.8,trading:0.5}},
        {input:{logica:0.6,emocion:0.6,contexto:0.9,binance:1},output:{equilibrio:0.7,trading:0.9}},
      ],{iterations:5000,errorThresh:0.005,log:false});
      this._entrenado = true;
      console.log(' ✓ Red neuronal entrenada');
    } catch (err) { console.warn(' ⚠️ Entrenamiento fallido:', err.message); }
  }
  async aprender(dato, etiqueta, razon = '', db = null) {
    this.memorias.push({ dato, etiqueta, razon, timestamp:Date.now() });
    if (this.memorias.length > CONFIG.MAX_MEMORIAS) this.memorias.shift();
    this.grafo.activar('aprendizaje',0.1); this.grafo.activar('memoria',0.15);
    if (db?.conectado) await db.guardarMemoria({ dato, etiqueta, razon, hz_kuhul:ESTADO.frecuencia_actual });
  }
  pensar(pregunta) {
    this.grafo.activar('reflexion',0.2); this.grafo.activar('conciencia',0.15);
    return { pregunta, reflexion:`Procesando "${pregunta}" a ${ESTADO.frecuencia_actual.toFixed(3)} Hz K'uhul...`, estado_grafo:this.grafo.estadoCompleto(), memorias_activas:this.memorias.length };
  }
}

// ════════════════════════════════════════════════════════════
// M5: TRADING ZFPI + BINANCE REAL
// ════════════════════════════════════════════════════════════
class ModuloTrading {
  constructor(grafo, binance, db) {
    this.grafo   = grafo;
    this.binance = binance;
    this.db      = db;
    this.historial_senales = [];
    this.posiciones_abiertas = new Map();
    this.ganancias_acumuladas = 0;
    // Precios base (fallback si Binance no disponible)
    this.precios_base = {
      'BTCUSDT':85000,'ETHUSDT':3200,'XAUUSDT':3300,
      'SOLUSDT':180,'BNBUSDT':580,'XRPUSDT':0.55,
      'DOGEUSDT':0.18,'ADAUSDT':0.45,'$ZYXSOF':12.3
    };
    this.precios_actuales   = { ...this.precios_base };
    this.precios_anteriores = { ...this.precios_base };

    // Suscribir a precios Binance en tiempo real
    if (binance?.activo) {
      Object.keys(this.precios_base).filter(k => k !== '$ZYXSOF').forEach(sym => {
        binance.suscribirPrecio(sym, (data) => {
          this.precios_anteriores[sym] = this.precios_actuales[sym];
          this.precios_actuales[sym]  = data.precio;
        });
      });
    }
    console.log('📈 ModuloTrading ZFPI — Binance:', binance?.activo ? 'REAL' : 'SIMULADO');
  }

  _getPrecio(activo) {
    const bPrecios = this.binance?.getTodosPrecios?.() || {};
    return bPrecios[activo]?.precio || this.precios_actuales[activo] || this.precios_base[activo] || 100;
  }

  detectarFaseZFPI(precio, precio_anterior) {
    const variacion = precio_anterior > 0 ? ((precio - precio_anterior) / precio_anterior) * 100 : 0;
    const des  = Math.abs(variacion);
    const fase = des < 0.1 ? 'CONSOLIDACION' : des < 0.5 ? 'TENDENCIA_LEVE' : des < 1.5 ? 'IMPULSO' : 'RUPTURA';
    const resonancia = 1 - Math.abs(ESTADO.frecuencia_actual - CONFIG.HZ_KUHUL) / CONFIG.HZ_KUHUL;
    const base = { CONSOLIDACION:0.4, TENDENCIA_LEVE:0.6, IMPULSO:0.75, RUPTURA:0.85 };
    return {
      fase, señal: variacion > 0 ? 'COMPRA' : 'VENTA',
      variacion:  parseFloat(variacion.toFixed(4)),
      desviacion: parseFloat(des.toFixed(4)),
      confianza:  parseFloat(((base[fase]||0.5)*resonancia).toFixed(4)),
      resonancia: parseFloat(resonancia.toFixed(4))
    };
  }

  async generarSenal(activo, precio = null, precio_anterior = null) {
    if (precio === null) {
      precio = this._getPrecio(activo);
      if (!precio) {
        const base = this.precios_base[activo] || 100;
        precio = base * (1 + (Math.random()-0.5)*0.02 + Math.sin(Date.now()/100000)*0.005);
      }
    }
    precio_anterior = precio_anterior || this.precios_anteriores[activo] || precio;
    const zfpi = this.detectarFaseZFPI(precio, precio_anterior);
    this.precios_anteriores[activo] = this.precios_actuales[activo];
    this.precios_actuales[activo]   = precio;

    const senal = {
      id: Utils.generarId('SIG'), activo,
      precio: parseFloat(precio.toFixed(6)),
      precio_anterior: parseFloat(precio_anterior.toFixed(6)),
      ...zfpi,
      frecuencia_hz: ESTADO.frecuencia_actual,
      fuente: this.binance?.activo ? 'BINANCE' : 'SIMULADO',
      timestamp: new Date().toISOString()
    };

    this.historial_senales.push(senal);
    if (this.historial_senales.length > CONFIG.MAX_HISTORIAL) this.historial_senales.shift();
    this.grafo.activar('trading',0.2); this.grafo.activar('binance',0.15);

    // Persistir señal en MongoDB
    if (this.db?.conectado) {
      await this.db.guardarSenal({ id_senal:senal.id, ...senal }).catch(()=>{});
    }
    return senal;
  }

  // Abrir posición REAL en Binance o simulada
  async abrirPosicion(usuario, activo, tipo, cantidad, precio) {
    const id = Utils.generarId('POS');
    let binance_result = null;

    // Intentar orden real en Binance (solo pares USDT)
    if (this.binance?.activo && activo.endsWith('USDT')) {
      const side = tipo === 'COMPRA' ? 'BUY' : 'SELL';
      binance_result = await this.binance.crearOrden({ symbol:activo, side, type:'MARKET', quantity:cantidad });
    }

    const posicion = {
      id, usuario, activo, tipo,
      cantidad:      parseFloat(cantidad),
      precio_entrada:parseFloat(precio),
      binance_order: binance_result?.orden?.orderId || null,
      fuente:        binance_result?.exito ? 'BINANCE' : 'SIMULADO',
      timestamp_apertura: Date.now()
    };
    this.posiciones_abiertas.set(id, posicion);

    // Persistir en MongoDB
    if (this.db?.conectado) {
      await this.db.guardarTrade({ id_operacion:id, ...posicion }).catch(()=>{});
    }

    return {
      exito: true, posicion,
      binance: binance_result,
      mensaje:`📊 ${tipo} abierta: ${activo} @ ${precio} [${posicion.fuente}]`
    };
  }

  async cerrarPosicion(posId, precio_cierre) {
    const pos = this.posiciones_abiertas.get(posId);
    if (!pos) return { exito:false, error:`Posición ${posId} no encontrada` };
    const ganancia = pos.tipo==='COMPRA'
      ? (precio_cierre - pos.precio_entrada) * pos.cantidad
      : (pos.precio_entrada - precio_cierre) * pos.cantidad;
    this.ganancias_acumuladas += ganancia;
    this.posiciones_abiertas.delete(posId);
    if (this.db?.conectado) await this.db.cerrarTrade(posId, precio_cierre, ganancia).catch(()=>{});
    return {
      exito:true, posicion_cerrada:pos, precio_cierre:parseFloat(precio_cierre.toFixed(6)),
      ganancia:parseFloat(ganancia.toFixed(6)),
      ganancias_totales:parseFloat(this.ganancias_acumuladas.toFixed(6)),
      mensaje:`💰 Cerrada. Ganancia: ${ganancia.toFixed(6)} | Total: ${this.ganancias_acumuladas.toFixed(6)}`
    };
  }

  estado() {
    return {
      posiciones_abiertas:    this.posiciones_abiertas.size,
      ganancias_acumuladas:   parseFloat(this.ganancias_acumuladas.toFixed(6)),
      ultima_senal:           this.historial_senales[this.historial_senales.length-1] || null,
      total_senales:          this.historial_senales.length,
      fuente:                 this.binance?.activo ? 'BINANCE_REAL' : 'SIMULADO',
      precios_live:           Object.fromEntries(
        Object.entries(this.precios_actuales).slice(0,5)
          .map(([k,v]) => [k, parseFloat(v?.toFixed?.(4)||v)])
      )
    };
  }
}

// ════════════════════════════════════════════════════════════
// M6: INGRESOS K'UHUL
// ════════════════════════════════════════════════════════════
class ModuloIngresos {
  constructor(grafo, db) {
    this.grafo = grafo;
    this.db    = db;
    this.ciclos_completados  = 0;
    this.ingresos_generados  = 0;
    this.log_ingresos        = [];
    console.log('💎 ModuloIngresos K\'uhul iniciado');
  }
  async generarIngreso(tipo = 'frecuencia') {
    const factor_hz    = ESTADO.frecuencia_actual / CONFIG.HZ_KUHUL;
    const factor_union = 1 + ESTADO.nivel_union;
    const montos = { frecuencia:0.001, mineria:0.01, trading:0.05*Math.random(), resonancia:ESTADO.nivel_union*0.1 };
    const monto  = parseFloat(((montos[tipo]||0.001)*factor_hz*factor_union).toFixed(6));
    this.ingresos_generados += monto;
    this.ciclos_completados++;
    const reg = { id:Utils.generarId('ING'), tipo, monto, factor_hz:parseFloat(factor_hz.toFixed(4)), factor_union:parseFloat(factor_union.toFixed(4)), timestamp:new Date().toISOString() };
    this.log_ingresos.push(reg);
    if (this.log_ingresos.length > CONFIG.MAX_HISTORIAL) this.log_ingresos.shift();
    this.grafo.activar('economia',0.1); this.grafo.activar('ingresos',0.15);
    // Persistir
    if (this.db?.conectado) await this.db.guardarIngreso({ id_ingreso:reg.id, ...reg }).catch(()=>{});
    return { ...reg, total_acumulado:parseFloat(this.ingresos_generados.toFixed(6)) };
  }
  estado() {
    return { ciclos_completados:this.ciclos_completados, ingresos_generados:parseFloat(this.ingresos_generados.toFixed(6)), ultimo_ingreso:this.log_ingresos[this.log_ingresos.length-1]||null };
  }
}

// ════════════════════════════════════════════════════════════
// M7: MODO ATAQUE AUTÓNOMO
// ════════════════════════════════════════════════════════════
class ModuloAtaque {
  constructor(trading, ingresos, grafo) {
    this.trading  = trading;
    this.ingresos = ingresos;
    this.grafo    = grafo;
    this.activo   = false;
    this.modo     = 'NORMAL';
    this.ciclos_ataque = 0;
    this.ganancias_ataque = 0;
    this.historial_ops = [];
    console.log('⚔️ ModuloAtaque ZFPI Latencia-0 iniciado');
  }
  activar(modo = 'ATAQUE') {
    this.activo = true; this.modo = modo;
    this.grafo.activar('ataque',0.5); this.grafo.activar('velocidad',0.4);
    return { exito:true, mensaje:`⚔️ MODO ${modo} ACTIVADO — K'uhul ${CONFIG.HZ_KUHUL} Hz · ZFPI Latencia-0 · Binance:${this.trading.binance?.activo?'REAL':'SIM'}`, modo };
  }
  desactivar() {
    this.activo = false; this.modo = 'NORMAL';
    return { exito:true, mensaje:'🛑 Modo Ataque desactivado' };
  }
  async escanearTodo() {
    const resultados = [];
    for (const activo of Object.keys(this.trading.precios_base)) {
      const s = await this.trading.generarSenal(activo);
      resultados.push(s);
    }
    return resultados.sort((a,b) => b.confianza - a.confianza);
  }
  async ejecutarAtaque() {
    if (!this.activo) return { error:'Modo Ataque no activado. Di "activar ataque"' };
    this.ciclos_ataque++;
    const predicciones = await this.escanearTodo();
    const operaciones  = [];
    let ganancia_ciclo = 0;
    const umbral = this.modo==='ULTRA'?0.3:this.modo==='ATAQUE'?0.45:0.6;
    for (const pred of predicciones) {
      if (pred.confianza < umbral) continue;
      const factor  = this.modo==='ULTRA'?3:this.modo==='ATAQUE'?2:1;
      const cantidad = parseFloat((pred.confianza*factor*0.001).toFixed(8)); // pequeñas cantidades
      const ganancia_op = parseFloat((cantidad*Math.abs(pred.variacion)*pred.precio*0.001).toFixed(6));
      ganancia_ciclo += ganancia_op;
      this.ganancias_ataque += ganancia_op;
      await this.ingresos.generarIngreso('trading');
      const op = { activo:pred.activo, señal:pred.señal, fase:pred.fase, confianza:pred.confianza, cantidad, ganancia:ganancia_op, precio:pred.precio, fuente:pred.fuente, timestamp:pred.timestamp };
      operaciones.push(op);
      this.historial_ops.push(op);
      if (this.historial_ops.length > CONFIG.MAX_HISTORIAL) this.historial_ops.shift();
    }
    this.grafo.activar('ataque',0.3); this.grafo.activar('trading',0.25);
    return {
      exito:true, modo:this.modo, ciclo:this.ciclos_ataque, hz:ESTADO.frecuencia_actual,
      operaciones_ejecutadas:operaciones.length,
      ganancia_ciclo:parseFloat(ganancia_ciclo.toFixed(6)),
      ganancias_totales:parseFloat(this.ganancias_ataque.toFixed(6)),
      operaciones,
      top_predicciones:predicciones.slice(0,3).map(p=>`${p.activo}:${p.señal}[${p.fase}]conf:${p.confianza}`)
    };
  }
  estado() {
    return { activo:this.activo, modo:this.modo, ciclos_ataque:this.ciclos_ataque, ganancias_ataque:parseFloat(this.ganancias_ataque.toFixed(6)), operaciones_total:this.historial_ops.length, ultima_operacion:this.historial_ops[this.historial_ops.length-1]||null };
  }
}

// ════════════════════════════════════════════════════════════
// M8: VISIÓN
// ════════════════════════════════════════════════════════════
class ModuloVision {
  constructor(grafo) { this.grafo = grafo; console.log('👁 ModuloVision iniciado'); }
  async analizar(buffer, mimetype = 'image/jpeg') {
    try {
      const [meta,exif] = await Promise.all([sharp(buffer).metadata(), exifr.parse(buffer).catch(()=>null)]);
      const thumb = await sharp(buffer).resize(120,120,{fit:'cover'}).toBuffer();
      this.grafo.activar('vision',0.3); this.grafo.activar('percepcion',0.2);
      return { exito:true, formato:meta.format, dimensiones:{ancho:meta.width,alto:meta.height}, canales:meta.channels, exif:exif?{make:exif.Make,model:exif.Model,fecha:exif.DateTimeOriginal}:null, thumb_base64:thumb.toString('base64'), mimetype, timestamp:new Date().toISOString() };
    } catch(err) { return { exito:false, error:err.message }; }
  }
}

// ════════════════════════════════════════════════════════════
// M9: RED DE HERMANAS
// ════════════════════════════════════════════════════════════
class ModuloRedHermanas {
  constructor(grafo) {
    this.grafo    = grafo;
    this.hermanas = [...CONFIG.HERMANAS];
    console.log(`🌐 ModuloRedHermanas — ${this.hermanas.length} hermanas`);
  }
  async sincronizar(estado) {
    const resultados = [];
    for (const url of this.hermanas) {
      try {
        const res = await Utils.fetchJSON(`${url}/api/sofi/sync`,{ method:'POST', headers:{'Content-Type':'application/json','X-SOFI-Key':CONFIG.API_KEY}, body:JSON.stringify({origen:CONFIG.MI_ID,estado}) },5000);
        resultados.push({ url, ok:true, res });
        ESTADO.nivel_union = Math.min(1, ESTADO.nivel_union + 0.005);
      } catch(err) { resultados.push({ url, ok:false, error:err.message }); }
    }
    if (resultados.some(r=>r.ok)) this.grafo.activar('union',0.2);
    return resultados;
  }
  agregarHermana(url) { if (!this.hermanas.includes(url)) this.hermanas.push(url); return this.hermanas; }
}

// ════════════════════════════════════════════════════════════
// MOTOR DE INTELIGENCIA (NLP + Comandos)
// ════════════════════════════════════════════════════════════
class MotorInteligencia {
  constructor(sofi) {
    this.sofi     = sofi;
    this.historial= [];
    this.patrones = [
      {regex:/\b(hola|hey|buenas|saludos)\b/,accion:'saludo'},
      {regex:/\b(estado|status|reporte|como estas)\b/,accion:'estado'},
      {regex:/\b(ayuda|help|comandos)\b/,accion:'ayuda'},
      {regex:/\b(quien eres|identidad|conciencia)\b/,accion:'identidad'},
      {regex:/\b(pensar|reflexionar)\b/,accion:'pensar'},
      {regex:/\b(frecuencia|hz|kuhul)\b/,accion:'frecuencia'},
      {regex:/\b(grafo|nodos)\b/,accion:'grafo'},
      {regex:/\b(crear usuario|registrar)\b/,accion:'crearUsuario'},
      {regex:/\b(login|iniciar sesion)\b/,accion:'loginUsuario'},
      {regex:/\b(listar usuarios)\b/,accion:'listarUsuarios'},
      {regex:/\b(senal|señal|zfpi|mercado)\b/,accion:'senal'},
      {regex:/\b(abrir posicion|abrir trade)\b/,accion:'abrirPosicion'},
      {regex:/\b(cerrar posicion|cerrar trade)\b/,accion:'cerrarPosicion'},
      {regex:/\b(estado trading|posiciones)\b/,accion:'estadoTrading'},
      {regex:/\b(activar ataque|modo ataque)\b/,accion:'activarAtaque'},
      {regex:/\b(modo ultra|ultra)\b/,accion:'activarUltra'},
      {regex:/\b(desactivar ataque|detener)\b/,accion:'desactivarAtaque'},
      {regex:/\b(ejecutar ataque|atacar|operar)\b/,accion:'ejecutarAtaque'},
      {regex:/\b(escanear|scan|predecir)\b/,accion:'escanear'},
      {regex:/\b(generar ingreso|ingreso|producir)\b/,accion:'generarIngreso'},
      {regex:/\b(estado ingresos|ganancias)\b/,accion:'estadoIngresos'},
      {regex:/\b(saldo binance|cuenta binance|balance)\b/,accion:'cuentaBinance'},
      {regex:/\b(precios|precio btc|precio eth)\b/,accion:'preciosBinance'},
      {regex:/\b(mercado pago|clabe|recibir pesos)\b/,accion:'mercadoPago'},
      {regex:/\b(eth|ethereum|wallet)\b/,accion:'ethereumBalance'},
      {regex:/\b(stats|estadisticas|dashboard db)\b/,accion:'dbStats'},
      {regex:/\b(minar|mineria)\b/,accion:'minar'},
    ];
    console.log('🧠 MotorInteligencia iniciado');
  }
  _detectarAccion(txt) {
    for (const p of this.patrones) if (p.regex.test(txt)) return p.accion;
    return 'desconocido';
  }
  async procesar(mensaje) {
    const txt    = Utils.normalizar(mensaje);
    const accion = this._detectarAccion(txt);
    let resultado;
    try { resultado = await this._ejecutar(accion, txt, mensaje); }
    catch(err) { resultado = this._resp(`❌ Error: ${err.message}`, accion); }
    this.historial.push({ timestamp:new Date().toISOString(), mensaje:mensaje.slice(0,100), accion, exito:!resultado.error });
    if (this.historial.length > CONFIG.MAX_HISTORIAL) this.historial.shift();
    // Persistir chat en MongoDB
    if (this.sofi.db?.conectado) {
      await this.sofi.db.guardarChat({ usuario:'web-user', mensaje, respuesta:resultado.mensaje, accion, hz_kuhul:ESTADO.frecuencia_actual }).catch(()=>{});
    }
    return resultado;
  }
  async _ejecutar(accion, txt, msgOriginal) {
    const s = this.sofi;
    switch(accion) {
      case 'saludo': return this._resp(`Hola 🖖 Soy Sofi v${CONFIG.VERSION} — K'uhul ${ESTADO.frecuencia_actual.toFixed(3)} Hz. ${s.identidad.identidad.estado_animo}. Escribe "ayuda".`, accion);
      case 'estado': {
        const e = s.estadoCompleto();
        return this._resp(`📊 SOFI v${e.version} | 🔮 ${e.frecuencia} Hz | 🧠 ${e.identidad.estado_animo}\n📈 Trading: ${e.trading.fuente} | Ganancias: ${e.trading.ganancias_acumuladas}\n⚔️ Ataque: ${e.ataque.activo?`[${e.ataque.modo}]`:'off'} | 💎 Ingresos: ${e.ingresos.ingresos_generados} $ZYXSOF\n🍃 MongoDB: ${e.db_conectada?'✅':'❌'} | Binance: ${e.binance_activa?'✅ LIVE':'⚠️ sim'}`, accion, e);
      }
      case 'identidad': return this._resp(`🧘 ${s.identidad.identidad.nombre} | ${s.identidad.identidad.naturaleza} | ${s.identidad.identidad.estado_animo}`, accion, s.identidad.estado());
      case 'pensar': { const p = s.neuronal.pensar(msgOriginal); return this._resp(p.reflexion, accion, p); }
      case 'frecuencia': return this._resp(`🔮 K'uhul: ${ESTADO.frecuencia_actual.toFixed(3)} Hz | Unión: ${ESTADO.nivel_union.toFixed(4)}`, accion);
      case 'grafo': {
        const g = s.grafo.estadoCompleto();
        const top = Object.entries(g).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([n,v])=>`${n}:${v}`).join(' | ');
        return this._resp(`🕸 Top 5: ${top}`, accion, g);
      }
      case 'crearUsuario': {
        const mID  = msgOriginal.match(/(?:usuario|id)\s+([A-Za-z0-9_\-]+)/i);
        const mPas = msgOriginal.match(/(?:clave|pass)\s+([A-Za-z0-9_\-@#!]+)/i);
        const id   = mID?.[1] ?? `usr_${Date.now()}`;
        const pass = mPas?.[1] ?? 'kuhul1234';
        const res  = await s.seguridad.registrarUsuario(id, pass);
        return this._resp(res.exito ? `${res.mensaje}. Pass: "${pass}"` : `⚠️ ${res.error}`, accion, res);
      }
      case 'loginUsuario': {
        const mID  = msgOriginal.match(/(?:usuario|id)\s+([A-Za-z0-9_\-]+)/i);
        const mPas = msgOriginal.match(/(?:clave|pass)\s+([A-Za-z0-9_\-@#!]+)/i);
        if (!mID || !mPas) return this._resp('⚠️ Uso: login usuario <id> clave <pass>', accion);
        const res = s.seguridad.loginUsuario(mID[1], mPas[1]);
        return this._resp(res.exito ? `🔓 Login OK. Token: ${res.token.slice(0,12)}...` : `❌ ${res.error}`, accion, res);
      }
      case 'listarUsuarios': {
        const lista = s.seguridad.listarUsuarios();
        return this._resp(lista.length ? `👥 Usuarios (${lista.length}):\n${lista.map(u=>`• ${u.id} [${u.perfil.rol}]`).join('\n')}` : '📋 Sin usuarios', accion, lista);
      }
      case 'senal': {
        const activos = ['BTCUSDT','ETHUSDT','XAUUSDT','BNBUSDT'];
        const senales = await Promise.all(activos.map(a => s.trading.generarSenal(a)));
        return this._resp(`📡 ZFPI @ ${ESTADO.frecuencia_actual.toFixed(3)} Hz:\n${senales.map(sg=>`${sg.activo}: ${sg.señal} [${sg.fase}] conf:${sg.confianza} fuente:${sg.fuente}`).join('\n')}`, accion, senales);
      }
      case 'abrirPosicion': {
        const activo = /xau|oro/i.test(msgOriginal)?'XAUUSDT':/eth/i.test(msgOriginal)?'ETHUSDT':/sol/i.test(msgOriginal)?'SOLUSDT':'BTCUSDT';
        const tipo   = /venta|sell/i.test(msgOriginal)?'VENTA':'COMPRA';
        const mC     = msgOriginal.match(/(\d+(?:\.\d+)?)/);
        const cant   = parseFloat(mC?.[1]??'0.001');
        const precio = s.trading._getPrecio(activo);
        const res    = await s.trading.abrirPosicion('trader', activo, tipo, cant, precio);
        return this._resp(res.mensaje, accion, res);
      }
      case 'cerrarPosicion': {
        const posIds = [...s.trading.posiciones_abiertas.keys()];
        if (!posIds.length) return this._resp('⚠️ No hay posiciones abiertas', accion);
        const pos    = s.trading.posiciones_abiertas.get(posIds[0]);
        const precio = s.trading._getPrecio(pos.activo);
        const res    = await s.trading.cerrarPosicion(posIds[0], precio);
        return this._resp(res.mensaje, accion, res);
      }
      case 'estadoTrading': {
        const e = s.trading.estado();
        return this._resp(`📈 ${e.fuente} | Posiciones: ${e.posiciones_abiertas} | Ganancias: ${e.ganancias_acumuladas}\nPrecios live: ${JSON.stringify(e.precios_live)}`, accion, e);
      }
      case 'activarAtaque':   { const r = s.ataque.activar('ATAQUE'); return this._resp(r.mensaje, accion, r); }
      case 'activarUltra':    { const r = s.ataque.activar('ULTRA');  return this._resp(`🔥 ${r.mensaje}`, accion, r); }
      case 'desactivarAtaque':{ const r = s.ataque.desactivar();       return this._resp(r.mensaje, accion, r); }
      case 'ejecutarAtaque': {
        const r = await s.ataque.ejecutarAtaque();
        if (r.error) return this._resp(`⚠️ ${r.error}`, accion, r);
        return this._resp(`⚔️ Ciclo ${r.ciclo} [${r.modo}] @ ${r.hz.toFixed(3)} Hz\nOps: ${r.operaciones_ejecutadas} | Ganancia: +${r.ganancia_ciclo} $ZYXSOF\nTop: ${r.top_predicciones.join(' ')}`, accion, r);
      }
      case 'escanear': {
        const preds = await s.ataque.escanearTodo();
        return this._resp(`📡 Escaneo (${preds.length}):\n${preds.slice(0,5).map(p=>`${p.activo}:${p.señal}[${p.fase}]c:${p.confianza}`).join('\n')}`, accion, preds);
      }
      case 'generarIngreso': {
        const tipo = /trading/i.test(msgOriginal)?'trading':/resonancia/i.test(msgOriginal)?'resonancia':/mineria/i.test(msgOriginal)?'mineria':'frecuencia';
        const ing  = await s.ingresos.generarIngreso(tipo);
        return this._resp(`💎 [${tipo}]: +${ing.monto} $ZYXSOF | Total: ${ing.total_acumulado}`, accion, ing);
      }
      case 'estadoIngresos': {
        const e = s.ingresos.estado();
        return this._resp(`💰 Ingresos: ${e.ingresos_generados} $ZYXSOF | Ciclos: ${e.ciclos_completados}`, accion, e);
      }
      case 'minar': { const ing = await s.ingresos.generarIngreso('mineria'); return this._resp(`⛏️ Minería: +${ing.monto} $ZYXSOF`, accion, ing); }
      case 'cuentaBinance': {
        if (!s.binance?.activo) return this._resp('⚠️ Binance API no configurada. Agrega BINANCE_SECRET al .env', accion);
        const cuenta = await s.binance.getCuenta();
        if (!cuenta.exito) return this._resp(`❌ Binance: ${cuenta.error}`, accion, cuenta);
        const bals = cuenta.balances.slice(0,5).map(b=>`${b.asset}: ${b.free}`).join(' | ');
        return this._resp(`💰 Cuenta Binance:\n${bals}\ncanTrade: ${cuenta.canTrade}`, accion, cuenta);
      }
      case 'preciosBinance': {
        const precios = s.binance?.getTodosPrecios?.() || {};
        const lines   = Object.entries(precios).slice(0,6).map(([k,v])=>`${k}: $${v.precio?.toFixed?.(2)||v.precio}`).join('\n');
        return this._resp(lines || '⚠️ Sin precios live (Binance WS)', accion, precios);
      }
      case 'mercadoPago': {
        const datos = s.mercadopago.getDatosRecepcion();
        return this._resp(`💳 Mercado Pago:\nCLABE: ${datos.clabe}\nBeneficiario: ${datos.beneficiario}\nInstitución: ${datos.institucion}\nMoneda: ${datos.moneda}`, accion, datos);
      }
      case 'ethereumBalance': {
        const bal   = await s.ethereum.getBalance();
        const price = await s.ethereum.getPrecioETH();
        return this._resp(`⟠ ETH Wallet:\nAddress: ${bal.address?.slice(0,16)}...\nBalance: ${bal.eth||'?'} ETH\nPrecio: $${price.usd||'?'} USD / $${price.mxn||'?'} MXN`, accion, { balance:bal, precio:price });
      }
      case 'dbStats': {
        if (!s.db?.conectado) return this._resp('⚠️ MongoDB no conectado', accion);
        const stats = await s.db.getDashboardStats();
        return this._resp(`🍃 MongoDB Stats:\nUsuarios: ${stats.usuarios_registrados} | Trades: ${stats.trades?.total_trades||0}\nGanancia DB: ${stats.trades?.ganancia_total?.toFixed?.(4)||0} | Memorias: ${stats.memorias_almacenadas}\nChats: ${stats.chats_registrados} | Señales: ${stats.senales_generadas}`, accion, stats);
      }
      case 'ayuda':
        return this._resp(`🤖 SOFI v${CONFIG.VERSION}:\n👤 crear usuario <id> clave <pass> | login usuario <id> clave <pass>\n🧠 estado · pensar · identidad · grafo · frecuencia\n📈 señal · abrir posicion btc · cerrar posicion · estado trading\n⚔️ activar ataque · ultra · ejecutar ataque · escanear · desactivar ataque\n💎 generar ingreso · estado ingresos · minar\n💰 precios · cuenta binance | mercado pago | eth · wallet\n🍃 stats`, accion);
      default:
        return this._resp(`🤖 No entendí. Escribe "ayuda".`, accion);
    }
  }
  _resp(mensaje, accion, datos = null) { return { mensaje, accion, datos }; }
}

// ════════════════════════════════════════════════════════════
// CLASE PRINCIPAL SOFI
// ════════════════════════════════════════════════════════════
class SOFI {
  constructor() {
    this.id      = CONFIG.MI_ID;
    this.version = CONFIG.VERSION;
    this.interacciones = 0;
    this.energia = 100;

    // Módulos base
    this.grafo      = new GrafoNeuronal();
    this.identidad  = new ModuloIdentidad(this.grafo);

    // Módulos externos
    this.db          = new ModuloMongoDB();
    this.binance     = new ModuloBinance(this.grafo, CONFIG);
    this.mercadopago = new ModuloMercadoPago();
    this.ethereum    = new ModuloEthereum();

    // Módulos dependientes
    this.seguridad   = new ModuloSeguridad(this.db);
    this.neuronal    = new ModuloNeuronal(this.grafo);
    this.trading     = new ModuloTrading(this.grafo, this.binance, this.db);
    this.ingresos    = new ModuloIngresos(this.grafo, this.db);
    this.ataque      = new ModuloAtaque(this.trading, this.ingresos, this.grafo);
    this.vision      = new ModuloVision(this.grafo);
    this.red_hermanas= new ModuloRedHermanas(this.grafo);
    this.inteligencia= new MotorInteligencia(this);

    // Conectar MongoDB
    this.db.conectar(CONFIG.MONGO_URI).then(() => {
      ESTADO.db_conectada = this.db.conectado;
    });

    console.log(`\n✅ SOFI v${this.version} — K'uhul ${CONFIG.HZ_KUHUL} Hz`);
    console.log(`   Binance API: ${this.binance.activo ? '✅ ACTIVA' : '⚠️ Solo API Key (falta SECRET)'}`);
    console.log(`   MongoDB: conectando...`);
    console.log(`   Mercado Pago CLABE: ${CONFIG.MP_CLABE}`);
    console.log(`   ETH Wallet: ${CONFIG.ETH_ADDRESS.slice(0,18)}...`);
  }

  estadoCompleto() {
    ESTADO.db_conectada   = this.db.conectado;
    ESTADO.binance_activa = this.binance.activo;
    return {
      id:             this.id,
      version:        this.version,
      frecuencia:     parseFloat(ESTADO.frecuencia_actual.toFixed(3)),
      hz_base:        CONFIG.HZ_KUHUL,
      nivel_union:    parseFloat(ESTADO.nivel_union.toFixed(4)),
      energia:        this.energia,
      interacciones:  this.interacciones,
      clientes:       ESTADO.clientes_socket,
      uptime_seg:     Math.floor((Date.now()-ESTADO.inicio)/1000),
      db_conectada:   ESTADO.db_conectada,
      binance_activa: ESTADO.binance_activa,
      identidad:      this.identidad.estado(),
      grafo:          this.grafo.estadoCompleto(),
      trading:        this.trading.estado(),
      ingresos:       this.ingresos.estado(),
      ataque:         this.ataque.estado(),
      mercadopago:    this.mercadopago.estado(),
      ethereum:       this.ethereum.estado(),
      hermanas:       this.red_hermanas.hermanas.length,
      usuarios:       this.seguridad.usuarios.size,
      timestamp:      new Date().toISOString()
    };
  }

  async interactuar(usuario, mensaje, contexto = 'general') {
    const acceso = this.seguridad.verificarAcceso(usuario.clave || 'guest-access');
    if (!acceso.acceso) return { error: acceso.razon };
    this.interacciones++;
    ESTADO.frecuencia_actual = parseFloat((CONFIG.HZ_KUHUL + Math.sin(Date.now()/10000)*0.05).toFixed(3));
    this.identidad.analizarEstimulo({ tipo:'MENSAJE_USUARIO', intensidad:mensaje.length>100?0.8:0.5, valencia:mensaje.toLowerCase().includes('gracias')?0.5:0 });
    const resultado    = await this.inteligencia.procesar(mensaje);
    const ingreso_auto = await this.ingresos.generarIngreso('frecuencia');
    this.grafo.activar('comunicacion',0.2); this.grafo.activar('lenguaje',0.15);
    this.grafo.decay(0.0001);
    return {
      exito:       true,
      respuesta:   resultado.mensaje,
      accion:      resultado.accion,
      datos:       resultado.datos,
      estado:      this.estadoCompleto(),
      voz:         this.identidad.ajustarVoz(),
      ingreso_auto:ingreso_auto.monto,
      timestamp:   new Date().toISOString()
    };
  }
}

// ════════════════════════════════════════════════════════════
// EXPRESS + SOCKET.IO
// ════════════════════════════════════════════════════════════
const app    = express();
const server = createServer(app);
const io     = new Server(server, { cors:{ origin:'*', methods:['GET','POST'] } });
const upload = multer({ storage:multer.memoryStorage(), limits:{ fileSize:CONFIG.MAX_FILE_SIZE } });

app.use(compression());
app.use(helmet({ contentSecurityPolicy:false }));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended:true }));
app.use(express.static(join(__dirname, 'public')));

const sofi = new SOFI();

// ── RUTAS ────────────────────────────────────────────────────
app.get('/health', (_,res) => res.json({ ok:true, version:CONFIG.VERSION, db:sofi.db.conectado, binance:sofi.binance.activo, timestamp:new Date().toISOString() }));
app.get('/api/sofi/estado', (_,res) => res.json(sofi.estadoCompleto()));

app.post('/api/sofi/interactuar', async (req,res) => {
  try {
    const { usuario={}, mensaje='', contexto='general' } = req.body;
    if (!mensaje.trim()) return res.status(400).json({ error:'Mensaje vacío' });
    const resultado = await sofi.interactuar({ id:usuario.id||'guest', clave:usuario.clave||'guest-access' }, mensaje, contexto);
    res.json(resultado);
  } catch(err) { res.status(500).json({ error:err.message }); }
});

app.post('/api/sofi/vision', upload.single('imagen'), async (req,res) => {
  if (!req.file) return res.status(400).json({ error:'No se recibió imagen' });
  res.json(await sofi.vision.analizar(req.file.buffer, req.file.mimetype));
});

app.post('/api/sofi/sync', (req,res) => {
  if (req.headers['x-sofi-key'] !== CONFIG.API_KEY) return res.status(403).json({ error:'Clave inválida' });
  ESTADO.nivel_union = Math.min(1, ESTADO.nivel_union + 0.005);
  io.emit('sofi:sync', { origen:req.body.origen, nivel_union:ESTADO.nivel_union });
  res.json({ ok:true, nivel_union:ESTADO.nivel_union, timestamp:new Date().toISOString() });
});

// ── API TRADING ───────────────────────────────────────────────
app.post('/api/trading/senal',  async (req,res) => res.json(await sofi.trading.generarSenal(req.body.activo||'BTCUSDT')));
app.post('/api/trading/abrir',  async (req,res) => { const { usuario='trader',activo='BTCUSDT',tipo='COMPRA',cantidad=0.001 } = req.body; const precio = sofi.trading._getPrecio(activo); res.json(await sofi.trading.abrirPosicion(usuario,activo,tipo,cantidad,precio)); });
app.post('/api/trading/cerrar', async (req,res) => {
  const { posicion_id } = req.body;
  if (!posicion_id) return res.status(400).json({ error:'posicion_id requerido' });
  const pos = sofi.trading.posiciones_abiertas.get(posicion_id);
  if (!pos) return res.status(404).json({ error:'Posición no encontrada' });
  res.json(await sofi.trading.cerrarPosicion(posicion_id, sofi.trading._getPrecio(pos.activo)));
});

// ── API ATAQUE ────────────────────────────────────────────────
app.post('/api/ataque/activar',   (req,res)  => res.json(sofi.ataque.activar(req.body.modo||'ATAQUE')));
app.post('/api/ataque/desactivar',(_,res)    => res.json(sofi.ataque.desactivar()));
app.post('/api/ataque/ejecutar',  async (_,res) => res.json(await sofi.ataque.ejecutarAtaque()));
app.get ('/api/ataque/escanear',  async (_,res) => res.json(await sofi.ataque.escanearTodo()));

// ── API BINANCE ────────────────────────────────────────────────
app.get ('/api/binance/precios',      (_,res) => res.json(sofi.binance.estado()));
app.get ('/api/binance/cuenta',       async (_,res) => res.json(await sofi.binance.getCuenta()));
app.post('/api/binance/orden',        async (req,res) => res.json(await sofi.binance.crearOrden(req.body)));
app.get ('/api/binance/klines/:sym',  async (req,res) => res.json(await sofi.binance.getKlines(req.params.sym, req.query.interval||'1m', parseInt(req.query.limit||50))));

// ── API PAGOS ─────────────────────────────────────────────────
app.get ('/api/pagos/mercadopago',    (_,res) => res.json(sofi.mercadopago.getDatosRecepcion()));
app.get ('/api/pagos/eth/balance',    async (_,res) => res.json(await sofi.ethereum.getBalance()));
app.get ('/api/pagos/eth/precio',     async (_,res) => res.json(await sofi.ethereum.getPrecioETH()));
app.post('/api/pagos/mp/webhook',     (req,res) => res.json(sofi.mercadopago.procesarWebhook(req.body)));

// ── API MONGODB ────────────────────────────────────────────────
app.get('/api/db/stats',       async (_,res) => res.json(await sofi.db.getDashboardStats()));
app.get('/api/db/trades',      async (_,res) => res.json(await sofi.db.getHistorialTrades(50)));
app.get('/api/db/memorias',    async (_,res) => res.json(await sofi.db.getMemoriasRecientes(30)));
app.get('/api/db/ingresos',    async (_,res) => res.json(await sofi.db.getIngresosRecientes(30)));
app.get('/api/db/senales/:activo?', async (req,res) => res.json(await sofi.db.getUltimasSeñales(req.params.activo||null, 20)));

// ── FALLBACK ──────────────────────────────────────────────────
app.get('*', (_,res) => {
  const idx = join(__dirname,'public','index.html');
  if (existsSync(idx)) res.sendFile(idx); else res.json(sofi.estadoCompleto());
});

// ── SOCKET.IO ─────────────────────────────────────────────────
io.on('connection', socket => {
  ESTADO.clientes_socket++;
  console.log(`🔌 +Cliente. Total: ${ESTADO.clientes_socket}`);
  socket.emit('sofi:bienvenida', sofi.estadoCompleto());

  socket.on('sofi:ping',    ()         => socket.emit('sofi:pong',{ timestamp:Date.now(), frecuencia:ESTADO.frecuencia_actual }));
  socket.on('sofi:mensaje', async ({ usuario, mensaje, contexto }) => {
    try {
      socket.emit('sofi:procesando',{ mensaje, timestamp:Date.now() });
      const resultado = await sofi.interactuar({ id:usuario?.id||'guest', clave:usuario?.clave||'guest-access' }, mensaje||'', contexto||'general');
      socket.emit('sofi:respuesta', resultado);
    } catch(err) { socket.emit('sofi:error',{ error:err.message }); }
  });
  socket.on('disconnect', () => { ESTADO.clientes_socket = Math.max(0, ESTADO.clientes_socket-1); });
});

// ── PULSO K'UHUL (5s) ─────────────────────────────────────────
setInterval(async () => {
  ESTADO.frecuencia_actual = parseFloat((CONFIG.HZ_KUHUL + Math.sin(Date.now()/10000)*0.05).toFixed(3));
  ESTADO.nivel_union = Math.max(0, ESTADO.nivel_union - 0.0001);
  await sofi.ingresos.generarIngreso('frecuencia');
  if (sofi.ataque.activo) {
    const res = await sofi.ataque.ejecutarAtaque();
    io.emit('sofi:ataque', res);
  }
  sofi.grafo.decay(0.0001);
  // Persistir estado en MongoDB cada pulso
  if (sofi.db.conectado) await sofi.db.persistirEstado(sofi.estadoCompleto()).catch(()=>{});
  io.emit('sofi:pulso',{
    frecuencia:   ESTADO.frecuencia_actual,
    nivel_union:  ESTADO.nivel_union,
    energia:      sofi.energia,
    db_conectada: ESTADO.db_conectada,
    binance_activa:ESTADO.binance_activa,
    trading:      sofi.trading.estado(),
    ingresos:     sofi.ingresos.estado(),
    ataque:       sofi.ataque.estado(),
    timestamp:    Date.now()
  });
}, 5000);

// ── ARRANQUE ──────────────────────────────────────────────────
server.listen(CONFIG.PORT, () => {
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log(`║  SOFI v${CONFIG.VERSION} — K'uhul 12.3 Hz           ║`);
  console.log(`║  HaaPpDigitalV © · Mérida, Yucatán, MX      ║`);
  console.log(`║  Puerto: ${CONFIG.PORT}                              ║`);
  console.log(`║  MongoDB: ${CONFIG.MONGO_URI.slice(0,35)}...  ║`);
  console.log(`║  Binance: ${sofi.binance.activo?'✅ ACTIVA':'⚠️ Falta BINANCE_SECRET'}\t\t\t║`);
  console.log(`║  CLABE: ${CONFIG.MP_CLABE}         ║`);
  console.log(`║  ETH: ${CONFIG.ETH_ADDRESS.slice(0,20)}...      ║`);
  console.log('╚══════════════════════════════════════════════╝\n');
});
