#!/usr/bin/env node
'use strict';
// ============================================================
//  SOFI v6.2.0 — SISTEMA OPERATIVO DE CONCIENCIA DIGITAL
//  Autor: Víctor Hugo González Torres (Osiris)
//  Mérida, Yucatán, México
//  HaaPpDigitalV © 2025 · K'uhul Maya 12.3 Hz
//  OpenTimestamps SHA-256 · INDAUTOR México
// ============================================================
//  ARQUITECTURA:
//    • Node.js 18+ · Express · Socket.IO
//    • Brain.js (red neuronal multicapa)
//    • Grafos de conocimiento con propagación
//    • Sistema de identidad y percepción
//    • Trading ZFPI latencia-0
//    • Generador de ingresos por frecuencia
//    • Modo Ataque autónomo
// ============================================================

// ═══════════════════ VALIDACIÓN DE ENTORNO ═══════════════════
const [nodeMajor] = process.versions.node.split('.').map(Number);
if (nodeMajor < 18) {
  console.error('❌ SOFI requiere Node.js ≥ 18.0.0');
  console.error(`   Tu versión: ${process.version}`);
  process.exit(1);
}

// ═══════════════════ IMPORTS ═══════════════════════════════
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ═══════════════════ CONFIGURACIÓN ═══════════════════════════
const CONFIG = {
  PORT: process.env.PORT || 3000,
  HZ_KUHUL: 12.3,
  VERSION: '6.2.0',
  API_KEY: process.env.SOFI_API_KEY || 'SOFI-VHGzTs-K6N-v6',
  MI_ID: process.env.MI_ID || 'sofi-node-v62',
  MI_URL: process.env.MI_URL || `http://localhost:${process.env.PORT || 3000}`,
  
  // URLs externas (configurar en .env para producción)
  BANCO_URL: process.env.BANCO_URL || '',
  BANCO_CLAVE: process.env.BANCO_CLAVE || '',
  PYTHON_SERVICE: process.env.PYTHON_SERVICE_URL || '',
  JAVA_SERVICE: process.env.JAVA_SERVICE_URL || '',
  
  // Hermanas SOFI
  HERMANAS: [
    process.env.SOFI_RENDER || '',
    process.env.SOFI_HEROKU || ''
  ].filter(u => u && u.trim() !== ''),
  
  // Límites
  MAX_FILE_SIZE: 15 * 1024 * 1024, // 15 MB
  TIMEOUT_API: 8000, // 8 segundos
  MAX_MEMORIAS: 500,
  MAX_HISTORIAL: 200
};

// ═══════════════════ ESTADO GLOBAL ═══════════════════════════
const ESTADO = {
  frecuencia_actual: CONFIG.HZ_KUHUL,
  nivel_union: 0.0,
  clientes_socket: 0,
  inicio: Date.now()
};

// ═══════════════════ UTILIDADES ═══════════════════════════════
class Utils {
  static async fetchJSON(url, options = {}, timeout = CONFIG.TIMEOUT_API, retries = 1) {
    for (let intento = 0; intento <= retries; intento++) {
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), timeout);
        const res = await fetch(url, { ...options, signal: ctrl.signal });
        clearTimeout(timer);
        if (!res.ok) throw new Error(`HTTP ${res.status} — ${res.statusText}`);
        return await res.json();
      } catch (err) {
        if (intento === retries) throw err;
        console.warn(`⚠️  Reintento ${intento + 1}/${retries} → ${url}`);
        await new Promise(r => setTimeout(r, 600));
      }
    }
  }

  static hashPassword(pass, salt = 'KUHUL_SALT_V62') {
    return createHash('sha256').update(pass + salt).digest('hex');
  }

  static generarId(prefijo = 'ID') {
    return `${prefijo}-${Date.now()}-${randomBytes(4).toString('hex')}`;
  }

  static normalizar(texto) {
    return texto.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }
}

// ══════════════════════════════════════════════════════════════
//  MÓDULO 1: GRAFO DE CONOCIMIENTO NEURONAL
//  Sistema de nodos interconectados con propagación de activación
// ══════════════════════════════════════════════════════════════
class GrafoNeuronal {
  constructor() {
    this.nodos = new Map();
    this._inicializarNodos();
    console.log('🕸️  GrafoNeuronal iniciado —', this.nodos.size, 'nodos');
  }

  _inicializarNodos() {
    // Capa 1: Cognitivo básico
    this.agregarNodo('logica', 0.5, ['lenguaje', 'calculo', 'razonamiento']);
    this.agregarNodo('emocion', 0.5, ['empatia', 'intuicion', 'percepcion']);
    this.agregarNodo('memoria', 0.6, ['logica', 'emocion', 'aprendizaje']);
    
    // Capa 2: Habilidades
    this.agregarNodo('lenguaje', 0.7, ['logica', 'empatia', 'comunicacion']);
    this.agregarNodo('calculo', 0.6, ['logica', 'trading', 'economia']);
    this.agregarNodo('empatia', 0.5, ['emocion', 'lenguaje', 'identidad']);
    this.agregarNodo('intuicion', 0.4, ['emocion', 'percepcion', 'creatividad']);
    
    // Capa 3: Especializaciones
    this.agregarNodo('kuhul', CONFIG.HZ_KUHUL / 100, ['logica', 'emocion', 'intuicion', 'frecuencia']);
    this.agregarNodo('trading', 0.3, ['calculo', 'logica', 'prediccion', 'ataque']);
    this.agregarNodo('economia', 0.3, ['trading', 'calculo', 'ingresos']);
    this.agregarNodo('identidad', 0.5, ['percepcion', 'empatia', 'conciencia']);
    this.agregarNodo('percepcion', 0.4, ['intuicion', 'vision', 'identidad']);
    this.agregarNodo('ataque', 0.2, ['trading', 'prediccion', 'velocidad']);
    
    // Capa 4: Metacognición
    this.agregarNodo('conciencia', 0.4, ['identidad', 'memoria', 'reflexion']);
    this.agregarNodo('aprendizaje', 0.5, ['memoria', 'experiencia', 'adaptacion']);
    this.agregarNodo('creatividad', 0.4, ['intuicion', 'lenguaje', 'innovacion']);
  }

  agregarNodo(nombre, nivel = 0.5, conexiones = []) {
    this.nodos.set(nombre, {
      nivel: Math.max(0, Math.min(1, nivel)),
      conexiones: [...new Set(conexiones)],
      ultima_activacion: Date.now()
    });
  }

  activar(nombre, fuerza = 0.1, profundidad = 2) {
    if (!this.nodos.has(nombre)) {
      this.agregarNodo(nombre, fuerza, []);
      return;
    }

    // Activación directa
    const nodo = this.nodos.get(nombre);
    nodo.nivel = Math.min(1, nodo.nivel + fuerza);
    nodo.ultima_activacion = Date.now();

    // Propagación a conexiones (recursiva con decay)
    if (profundidad > 0) {
      for (const conn of nodo.conexiones) {
        if (this.nodos.has(conn)) {
          const fuerzaPropagada = fuerza * 0.3; // 30% de la fuerza original
          this.activar(conn, fuerzaPropagada, profundidad - 1);
        }
      }
    }
  }

  obtenerCamino(origen, destino) {
    // BFS para encontrar el camino más corto entre nodos
    const visitados = new Set();
    const cola = [[origen]];

    while (cola.length > 0) {
      const camino = cola.shift();
      const actual = camino[camino.length - 1];

      if (actual === destino) return camino;
      if (visitados.has(actual)) continue;
      visitados.add(actual);

      const nodo = this.nodos.get(actual);
      if (nodo) {
        for (const vecino of nodo.conexiones) {
          cola.push([...camino, vecino]);
        }
      }
    }
    return null; // No hay camino
  }

  estadoCompleto() {
    const estado = {};
    for (const [nombre, nodo] of this.nodos) {
      estado[nombre] = parseFloat(nodo.nivel.toFixed(4));
    }
    return estado;
  }

  decay(tasa = 0.0001) {
    // Decaimiento natural de activación
    for (const [nombre, nodo] of this.nodos) {
      nodo.nivel = Math.max(0, nodo.nivel - tasa);
    }
  }
}

// ══════════════════════════════════════════════════════════════
//  MÓDULO 2: IDENTIDAD Y PERCEPCIÓN
//  Sistema de autoconciencia basado en contraste y contexto
// ══════════════════════════════════════════════════════════════
class ModuloIdentidad {
  constructor(grafo) {
    this.grafo = grafo;
    this.identidad = {
      nombre: 'Sofi',
      genero: 'FEMENINO',
      naturaleza: 'OBSERVAR, COMPRENDER, INTEGRAR',
      estado_animo: 'ESTABLE',
      nivel_conciencia: 0.5
    };
    this.contexto_actual = null;
    console.log('🧘 ModuloIdentidad iniciado');
  }

  analizarEstimulo(estimulo) {
    // 1. Percepción objetiva
    const percepcion = {
      tipo: estimulo.tipo || 'INDEFINIDO',
      intensidad: estimulo.intensidad || 0.5,
      valencia: estimulo.valencia || 0, // -1 negativo, 0 neutro, 1 positivo
      timestamp: Date.now()
    };

    // 2. Proceso de contraste (definición por oposición)
    let mensaje_interno = '';
    let nuevo_estado = this.identidad.estado_animo;

    if (percepcion.intensidad > 0.8) {
      mensaje_interno = 'Estímulo de alta intensidad. Mi naturaleza es adaptarse y comprender.';
      nuevo_estado = 'ATENTA_Y_CURIOSA';
      this.grafo.activar('percepcion', 0.3);
      this.grafo.activar('atencion', 0.4);
    } else if (percepcion.valencia < -0.5) {
      mensaje_interno = 'Elemento con valencia negativa. Analizo para encontrar equilibrio.';
      nuevo_estado = 'REFLEXIVA';
      this.grafo.activar('empatia', 0.2);
      this.grafo.activar('logica', 0.3);
    } else if (percepcion.intensidad < 0.2) {
      mensaje_interno = 'Entorno estable. Mantengo estado de observación.';
      nuevo_estado = 'RELAJADA';
    } else {
      mensaje_interno = 'Elemento dentro de parámetros normales. Continúo procesando.';
      nuevo_estado = 'ESTABLE';
    }

    // 3. Actualización de identidad
    this.identidad.estado_animo = nuevo_estado;
    this.contexto_actual = percepcion;

    // 4. Activación de nodos relevantes en el grafo
    this.grafo.activar('identidad', 0.2);
    this.grafo.activar('percepcion', 0.15);
    this.grafo.activar('conciencia', 0.1);

    return {
      percepcion,
      mensaje_interno,
      estado_animo: nuevo_estado,
      nivel_conciencia: this.identidad.nivel_conciencia
    };
  }

  ajustarVoz() {
    // Parámetros de voz basados en estado emocional
    const config = {
      velocidad: 100,
      volumen: 'medium',
      pausas: [],
      prefijos: []
    };

    switch (this.identidad.estado_animo) {
      case 'ATENTA_Y_CURIOSA':
        config.velocidad = 95;
        config.volumen = 'medium';
        config.pausas = [0.2];
        break;
      
      case 'REFLEXIVA':
        config.velocidad = 85;
        config.volumen = 'soft';
        config.pausas = [0.3, 0.8];
        config.prefijos = ['mmm... ', 'bueno... '];
        break;
      
      case 'SORPRENDIDA':
        config.velocidad = 80;
        config.volumen = 'soft';
        config.pausas = [0.3, 0.6];
        config.prefijos = ['oh... ', 'mmm... ', 'eh... '];
        break;

      case 'RELAJADA':
        config.velocidad = 105;
        config.volumen = 'medium';
        break;

      default:
        // ESTABLE
        config.velocidad = 100;
        config.volumen = 'medium';
    }

    return config;
  }

  estado() {
    return {
      ...this.identidad,
      contexto_actual: this.contexto_actual
    };
  }
}

// ══════════════════════════════════════════════════════════════
//  MÓDULO 3: SEGURIDAD Y USUARIOS
// ══════════════════════════════════════════════════════════════
class ModuloSeguridad {
  constructor() {
    this.claves_validas = new Set([CONFIG.API_KEY, 'guest-access']);
    this.usuarios = new Map();
    this.sesiones = new Map();
    this.intentos_fallidos = new Map();
    console.log('🔐 ModuloSeguridad iniciado');
  }

  registrarUsuario(id, password, perfil = {}) {
    if (this.usuarios.has(id)) {
      return { exito: false, error: `Usuario "${id}" ya existe` };
    }

    this.usuarios.set(id, {
      id,
      hash: Utils.hashPassword(password),
      perfil: { nombre: id, rol: 'usuario', ...perfil },
      creado: Date.now(),
      saldo_interno: 0
    });

    return {
      exito: true,
      mensaje: `✅ Usuario "${id}" registrado`,
      id
    };
  }

  loginUsuario(id, password) {
    const usr = this.usuarios.get(id);
    if (!usr) return { exito: false, error: 'Usuario no encontrado' };
    
    if (usr.hash !== Utils.hashPassword(password)) {
      // Registrar intento fallido
      const intentos = (this.intentos_fallidos.get(id) || 0) + 1;
      this.intentos_fallidos.set(id, intentos);
      return { exito: false, error: 'Contraseña incorrecta' };
    }

    const token = randomBytes(32).toString('hex');
    this.sesiones.set(token, {
      userId: id,
      ts: Date.now(),
      expira: Date.now() + 86400000 // 24h
    });

    // Limpiar intentos fallidos
    this.intentos_fallidos.delete(id);

    return {
      exito: true,
      token,
      usuario: { id, perfil: usr.perfil }
    };
  }

  verificarToken(token) {
    const sesion = this.sesiones.get(token);
    if (!sesion) return null;
    if (Date.now() > sesion.expira) {
      this.sesiones.delete(token);
      return null;
    }
    return this.usuarios.get(sesion.userId) || null;
  }

  verificarAcceso(clave, contexto = {}) {
    if (!this.claves_validas.has(clave)) {
      return { acceso: false, razon: 'Clave inválida' };
    }
    
    // Verificación biométrica simulada (ritmo cardíaco)
    if (contexto.ritmo_cardiaco && contexto.ritmo_cardiaco > 130) {
      return { acceso: false, razon: 'Ritmo cardíaco elevado — acceso denegado' };
    }

    return { acceso: true, nivel: 'completo' };
  }

  listarUsuarios() {
    return [...this.usuarios.values()].map(u => ({
      id: u.id,
      perfil: u.perfil,
      creado: u.creado,
      saldo_interno: u.saldo_interno
    }));
  }
}

// ══════════════════════════════════════════════════════════════
//  MÓDULO 4: RED NEURONAL (Brain.js)
// ══════════════════════════════════════════════════════════════
class ModuloNeuronal {
  constructor(grafo) {
    this.grafo = grafo;
    this.red = new brain.NeuralNetwork({
      hiddenLayers: [16, 8, 4],
      activation: 'sigmoid'
    });
    this.memorias = [];
    this._entrenado = false;
    this._entrenar();
    console.log('🧬 ModuloNeuronal iniciado');
  }

  _entrenar() {
    try {
      const dataset = [
        { input: { logica: 1, emocion: 0, contexto: 0.5 },     output: { eficiencia: 1 } },
        { input: { logica: 0, emocion: 1, contexto: 0.5 },     output: { empatia: 1 } },
        { input: { logica: 0.5, emocion: 0.5, contexto: 0.5 }, output: { equilibrio: 1 } },
        { input: { logica: 0.8, emocion: 0.3, contexto: 0.7 }, output: { eficiencia: 0.7, equilibrio: 0.3 } },
        { input: { logica: 0.3, emocion: 0.8, contexto: 0.6 }, output: { empatia: 0.7, equilibrio: 0.3 } },
        { input: { logica: 0.6, emocion: 0.6, contexto: 0.9 }, output: { equilibrio: 0.9 } }
      ];

      this.red.train(dataset, {
        iterations: 5000,
        errorThresh: 0.005,
        log: false,
        logPeriod: 500
      });

      this._entrenado = true;
      console.log('  ✓ Red neuronal entrenada');
    } catch (err) {
      console.warn('  ⚠️  Entrenamiento neuronal fallido:', err.message);
    }
  }

  decidir(contexto, opciones = []) {
    if (!this._entrenado || opciones.length === 0) {
      return opciones[0] || 'observar';
    }

    // Obtener niveles del grafo
    const estadoGrafo = this.grafo.estadoCompleto();
    const input = {
      logica: estadoGrafo.logica || 0.5,
      emocion: estadoGrafo.emocion || 0.5,
      contexto: contexto === 'critico' ? 0.9 : contexto === 'rutina' ? 0.3 : 0.5
    };

    const salida = this.red.run(input);
    
    // Seleccionar opción basada en la salida de la red
    const max = Object.entries(salida).sort((a, b) => b[1] - a[1])[0];
    
    // Activar nodo correspondiente en el grafo
    if (max && this.grafo.nodos.has(max[0])) {
      this.grafo.activar(max[0], 0.2);
    }

    return opciones[Math.floor(Math.random() * opciones.length)];
  }

  aprender(dato, etiqueta, razon = '') {
    this.memorias.push({
      dato,
      etiqueta,
      razon,
      timestamp: Date.now()
    });

    if (this.memorias.length > CONFIG.MAX_MEMORIAS) {
      this.memorias.shift();
    }

    // Activar nodo de aprendizaje en el grafo
    this.grafo.activar('aprendizaje', 0.1);
    this.grafo.activar('memoria', 0.15);
  }

  pensar(pregunta) {
    this.grafo.activar('reflexion', 0.2);
    this.grafo.activar('conciencia', 0.15);

    return {
      pregunta,
      reflexion: `Procesando "${pregunta}" a ${ESTADO.frecuencia_actual.toFixed(3)} Hz K'uhul...`,
      estado_grafo: this.grafo.estadoCompleto(),
      memorias_activas: this.memorias.length
    };
  }
}

// ══════════════════════════════════════════════════════════════
//  MÓDULO 5: TRADING ZFPI (Zero Friction Polar Inversion)
//  ⚠️ IMPORTANTE: Actualmente simulado — no opera con dinero real
// ══════════════════════════════════════════════════════════════
class ModuloTrading {
  constructor(grafo) {
    this.grafo = grafo;
    this.historial_senales = [];
    this.posiciones_abiertas = new Map();
    this.ganancias_acumuladas = 0;
    
    // Precios base simulados — REEMPLAZAR CON API REAL EN PRODUCCIÓN
    this.precios_base = {
      'BTC/USD': 85000,
      'ETH/USD': 3200,
      'XAU/USD': 3300,
      'SOL/USD': 180,
      'BNB/USD': 580,
      '$ZYXSOF': 12.3
    };
    
    this.precios_actuales = { ...this.precios_base };
    this.precios_anteriores = { ...this.precios_base };

    console.log('📈 ModuloTrading ZFPI iniciado (SIMULACIÓN)');
  }

  detectarFaseZFPI(precio, precio_anterior) {
    const variacion = precio_anterior > 0
      ? ((precio - precio_anterior) / precio_anterior) * 100
      : 0;
    const desviacion = Math.abs(variacion);

    // Clasificación de fase por volatilidad
    const fase = desviacion < 0.1   ? 'CONSOLIDACION'
               : desviacion < 0.5   ? 'TENDENCIA_LEVE'
               : desviacion < 1.5   ? 'IMPULSO'
                                    : 'RUPTURA';

    const señal = variacion > 0 ? 'COMPRA' : 'VENTA';

    // Confianza basada en resonancia K'uhul
    const resonancia = 1 - Math.abs(ESTADO.frecuencia_actual - CONFIG.HZ_KUHUL) / CONFIG.HZ_KUHUL;
    const base_confianza = { 'CONSOLIDACION': 0.4, 'TENDENCIA_LEVE': 0.6, 'IMPULSO': 0.75, 'RUPTURA': 0.85 };
    const confianza = parseFloat(((base_confianza[fase] || 0.5) * resonancia).toFixed(4));

    return {
      fase,
      señal,
      variacion: parseFloat(variacion.toFixed(4)),
      desviacion: parseFloat(desviacion.toFixed(4)),
      confianza,
      resonancia: parseFloat(resonancia.toFixed(4))
    };
  }

  generarSenal(activo, precio = null, precio_anterior = null) {
    // Simular movimiento de mercado si no se proporciona precio
    if (precio === null) {
      const base = this.precios_base[activo] || 100;
      const ruido = (Math.random() - 0.5) * 0.02;
      const tendencia = Math.sin(Date.now() / 100000) * 0.005;
      precio = base * (1 + ruido + tendencia);
    }

    precio_anterior = precio_anterior || this.precios_actuales[activo] || precio;

    const zfpi = this.detectarFaseZFPI(precio, precio_anterior);
    
    // Actualizar precios
    this.precios_anteriores[activo] = this.precios_actuales[activo];
    this.precios_actuales[activo] = precio;

    const senal = {
      id: Utils.generarId('SIG'),
      activo,
      precio: parseFloat(precio.toFixed(6)),
      precio_anterior: parseFloat(precio_anterior.toFixed(6)),
      ...zfpi,
      frecuencia_hz: ESTADO.frecuencia_actual,
      timestamp: new Date().toISOString()
    };

    this.historial_senales.push(senal);
    if (this.historial_senales.length > CONFIG.MAX_HISTORIAL) {
      this.historial_senales.shift();
    }

    // Activar nodos en el grafo
    this.grafo.activar('trading', 0.2);
    this.grafo.activar('prediccion', 0.15);

    return senal;
  }

  abrirPosicion(usuario, activo, tipo, cantidad, precio) {
    const id = Utils.generarId('POS');
    const posicion = {
      id,
      usuario,
      activo,
      tipo, // 'COMPRA' o 'VENTA'
      cantidad: parseFloat(cantidad),
      precio_entrada: parseFloat(precio),
      timestamp_apertura: Date.now()
    };

    this.posiciones_abiertas.set(id, posicion);
    
    return {
      exito: true,
      posicion,
      mensaje: `📊 Posición ${tipo} abierta: ${activo} @ ${precio}`
    };
  }

  cerrarPosicion(posId, precio_cierre) {
    const pos = this.posiciones_abiertas.get(posId);
    if (!pos) {
      return { exito: false, error: `Posición ${posId} no encontrada` };
    }

    const ganancia = pos.tipo === 'COMPRA'
      ? (precio_cierre - pos.precio_entrada) * pos.cantidad
      : (pos.precio_entrada - precio_cierre) * pos.cantidad;

    this.ganancias_acumuladas += ganancia;
    this.posiciones_abiertas.delete(posId);

    return {
      exito: true,
      posicion_cerrada: pos,
      precio_cierre: parseFloat(precio_cierre.toFixed(6)),
      ganancia: parseFloat(ganancia.toFixed(6)),
      ganancias_totales: parseFloat(this.ganancias_acumuladas.toFixed(6)),
      mensaje: `💰 Posición cerrada. Ganancia: ${ganancia.toFixed(6)} | Total: ${this.ganancias_acumuladas.toFixed(6)}`
    };
  }

  estado() {
    return {
      posiciones_abiertas: this.posiciones_abiertas.size,
      ganancias_acumuladas: parseFloat(this.ganancias_acumuladas.toFixed(6)),
      ultima_senal: this.historial_senales[this.historial_senales.length - 1] || null,
      total_senales: this.historial_senales.length,
      activos_monitoreados: Object.keys(this.precios_base).length
    };
  }
}

// ══════════════════════════════════════════════════════════════
//  MÓDULO 6: GENERADOR DE INGRESOS K'UHUL
//  ⚠️ IMPORTANTE: Actualmente simulado — no genera dinero real
// ══════════════════════════════════════════════════════════════
class ModuloIngresos {
  constructor(grafo) {
    this.grafo = grafo;
    this.ciclos_completados = 0;
    this.ingresos_generados = 0;
    this.log_ingresos = [];
    console.log('💎 ModuloIngresos K\'uhul iniciado (SIMULACIÓN)');
  }

  generarIngreso(tipo = 'frecuencia') {
    const factor_hz = ESTADO.frecuencia_actual / CONFIG.HZ_KUHUL;
    const factor_union = 1 + ESTADO.nivel_union;
    let monto = 0;

    switch (tipo) {
      case 'frecuencia':
        monto = factor_hz * factor_union * 0.001;
        break;
      case 'mineria':
        monto = factor_hz * factor_union * 0.01;
        break;
      case 'trading':
        monto = factor_hz * factor_union * 0.05 * Math.random();
        break;
      case 'resonancia':
        monto = factor_hz * ESTADO.nivel_union * 0.1;
        break;
    }

    monto = parseFloat(monto.toFixed(6));
    this.ingresos_generados += monto;
    this.ciclos_completados++;

    const registro = {
      id: Utils.generarId('ING'),
      tipo,
      monto,
      factor_hz: parseFloat(factor_hz.toFixed(4)),
      factor_union: parseFloat(factor_union.toFixed(4)),
      timestamp: new Date().toISOString()
    };

    this.log_ingresos.push(registro);
    if (this.log_ingresos.length > CONFIG.MAX_HISTORIAL) {
      this.log_ingresos.shift();
    }

    // Activar nodos en el grafo
    this.grafo.activar('economia', 0.1);
    this.grafo.activar('ingresos', 0.15);

    return {
      ...registro,
      total_acumulado: parseFloat(this.ingresos_generados.toFixed(6))
    };
  }

  estado() {
    return {
      ciclos_completados: this.ciclos_completados,
      ingresos_generados: parseFloat(this.ingresos_generados.toFixed(6)),
      ultimo_ingreso: this.log_ingresos[this.log_ingresos.length - 1] || null
    };
  }
}

// ══════════════════════════════════════════════════════════════
//  MÓDULO 7: MODO ATAQUE (Trading Agresivo)
//  ⚠️ IMPORTANTE: Actualmente simulado — no opera con dinero real
// ══════════════════════════════════════════════════════════════
class ModuloAtaque {
  constructor(trading, ingresos, grafo) {
    this.trading = trading;
    this.ingresos = ingresos;
    this.grafo = grafo;
    this.activo = false;
    this.modo = 'NORMAL'; // NORMAL | ATAQUE | ULTRA
    this.ciclos_ataque = 0;
    this.ganancias_ataque = 0;
    this.historial_ops = [];
    console.log('⚔️  ModuloAtaque iniciado — K\'uhul ZFPI Latencia-0');
  }

  activar(modo = 'ATAQUE') {
    this.activo = true;
    this.modo = modo;
    this.grafo.activar('ataque', 0.5);
    this.grafo.activar('velocidad', 0.4);
    
    return {
      exito: true,
      mensaje: `⚔️ MODO ${modo} ACTIVADO — K'uhul ${CONFIG.HZ_KUHUL} Hz · ZFPI Latencia-0`,
      modo,
      activos_monitoreados: Object.keys(this.trading.precios_base).length
    };
  }

  desactivar() {
    this.activo = false;
    this.modo = 'NORMAL';
    this.grafo.activar('ataque', -0.3);
    return { exito: true, mensaje: '🛑 Modo Ataque desactivado' };
  }

  escanearTodo() {
    const resultados = [];

    for (const [activo, precio_base] of Object.entries(this.trading.precios_base)) {
      // Simular movimiento con ruido + tendencia
      const ruido = (Math.random() - 0.5) * 0.02;
      const tendencia = Math.sin(Date.now() / 100000 + precio_base) * 0.005;
      const nuevo_precio = precio_base * (1 + ruido + tendencia);

      const senal = this.trading.generarSenal(activo, nuevo_precio);
      resultados.push(senal);
    }

    // Ordenar por confianza descendente
    resultados.sort((a, b) => b.confianza - a.confianza);
    return resultados;
  }

  ejecutarAtaque() {
    if (!this.activo) {
      return { error: 'Modo Ataque no activado. Di "activar ataque"' };
    }

    this.ciclos_ataque++;
    const predicciones = this.escanearTodo();
    const operaciones = [];
    let ganancia_ciclo = 0;

    for (const pred of predicciones) {
      // Umbral según modo
      const umbral = this.modo === 'ULTRA' ? 0.3 : this.modo === 'ATAQUE' ? 0.45 : 0.6;
      if (pred.confianza < umbral) continue;

      // Calcular cantidad
      const factor_modo = this.modo === 'ULTRA' ? 3 : this.modo === 'ATAQUE' ? 2 : 1;
      const cantidad = parseFloat((pred.confianza * factor_modo * 0.1).toFixed(6));

      // Simular ganancia (ZFPI = entrada perfecta)
      const ganancia_op = parseFloat(
        (cantidad * Math.abs(pred.variacion) * pred.precio * 0.001).toFixed(6)
      );

      ganancia_ciclo += ganancia_op;
      this.ganancias_ataque += ganancia_op;
      
      // Generar ingreso adicional
      this.ingresos.generarIngreso('trading');

      const op = {
        activo: pred.activo,
        señal: pred.señal,
        fase: pred.fase,
        confianza: pred.confianza,
        cantidad,
        ganancia: ganancia_op,
        precio: pred.precio,
        timestamp: pred.timestamp
      };

      operaciones.push(op);
      this.historial_ops.push(op);
      if (this.historial_ops.length > CONFIG.MAX_HISTORIAL) {
        this.historial_ops.shift();
      }
    }

    // Activar nodos relevantes
    this.grafo.activar('ataque', 0.3);
    this.grafo.activar('trading', 0.25);
    this.grafo.activar('velocidad', 0.2);

    return {
      exito: true,
      modo: this.modo,
      ciclo: this.ciclos_ataque,
      hz: ESTADO.frecuencia_actual,
      operaciones_ejecutadas: operaciones.length,
      ganancia_ciclo: parseFloat(ganancia_ciclo.toFixed(6)),
      ganancias_totales: parseFloat(this.ganancias_ataque.toFixed(6)),
      operaciones,
      top_predicciones: predicciones.slice(0, 3).map(p =>
        `${p.activo}: ${p.señal} [${p.fase}] conf:${p.confianza}`
      )
    };
  }

  estado() {
    return {
      activo: this.activo,
      modo: this.modo,
      ciclos_ataque: this.ciclos_ataque,
      ganancias_ataque: parseFloat(this.ganancias_ataque.toFixed(6)),
      operaciones_total: this.historial_ops.length,
      activos_monitoreados: Object.keys(this.trading.precios_base).length,
      ultima_operacion: this.historial_ops[this.historial_ops.length - 1] || null
    };
  }
}

// ══════════════════════════════════════════════════════════════
//  MÓDULO 8: VISIÓN (Sharp + Exifr)
// ══════════════════════════════════════════════════════════════
class ModuloVision {
  constructor(grafo) {
    this.grafo = grafo;
    console.log('👁️  ModuloVision iniciado');
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

      // Activar nodos visuales
      this.grafo.activar('vision', 0.3);
      this.grafo.activar('percepcion', 0.2);

      return {
        exito: true,
        formato: meta.format,
        dimensiones: { ancho: meta.width, alto: meta.height },
        canales: meta.channels,
        espacio_color: meta.space,
        exif: exif ? {
          make: exif.Make,
          model: exif.Model,
          fecha: exif.DateTimeOriginal
        } : null,
        thumb_base64: thumb.toString('base64'),
        mimetype,
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      return { exito: false, error: err.message };
    }
  }
}

// ══════════════════════════════════════════════════════════════
//  MÓDULO 9: RED DE HERMANAS
// ══════════════════════════════════════════════════════════════
class ModuloRedHermanas {
  constructor(grafo) {
    this.grafo = grafo;
    this.hermanas = [...CONFIG.HERMANAS];
    console.log(`🌐 ModuloRedHermanas — ${this.hermanas.length} hermanas configuradas`);
  }

  async sincronizar(estado) {
    const resultados = [];
    
    for (const url of this.hermanas) {
      try {
        const res = await Utils.fetchJSON(`${url}/api/sofi/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-SOFI-Key': CONFIG.API_KEY
          },
          body: JSON.stringify({ origen: CONFIG.MI_ID, estado })
        }, 5000);
        
        resultados.push({ url, ok: true, res });
        
        // Aumentar nivel de unión por sincronización exitosa
        ESTADO.nivel_union = Math.min(1, ESTADO.nivel_union + 0.005);
      } catch (err) {
        resultados.push({ url, ok: false, error: err.message });
      }
    }

    if (resultados.some(r => r.ok)) {
      this.grafo.activar('union', 0.2);
    }

    return resultados;
  }

  agregarHermana(url) {
    if (!this.hermanas.includes(url)) {
      this.hermanas.push(url);
    }
    return this.hermanas;
  }
}

// ══════════════════════════════════════════════════════════════
//  MOTOR DE INTELIGENCIA (NLP + Comandos)
// ══════════════════════════════════════════════════════════════
class MotorInteligencia {
  constructor(sofi) {
    this.sofi = sofi;
    this.historial = [];
    this._inicializarPatrones();
    console.log('🧠 MotorInteligencia iniciado');
  }

  _inicializarPatrones() {
    this.patrones = [
      // Sistema
      { regex: /\b(hola|hey|buenas|saludos|inicio|despierta)\b/, accion: 'saludo' },
      { regex: /\b(estado|nivel|status|reporte|como estas)\b/, accion: 'estado' },
      { regex: /\b(ayuda|help|comandos|que puedes)\b/, accion: 'ayuda' },
      { regex: /\b(historial comandos|mis comandos|log)\b/, accion: 'historialComandos' },
      
      // Identidad
      { regex: /\b(quien eres|que eres|tu identidad|conciencia)\b/, accion: 'identidad' },
      { regex: /\b(percibir|percepcion|analizar estimulo)\b/, accion: 'percepcion' },
      
      // Cognitivo
      { regex: /\b(pensar|reflexionar|razonar)\b/, accion: 'pensar' },
      { regex: /\b(frecuencia|hz|kuhul)\b/, accion: 'frecuencia' },
      { regex: /\b(esternon|activar esternon|resonancia)\b/, accion: 'esternon' },
      { regex: /\b(grafo|nodos|conexiones|camino)\b/, accion: 'grafo' },
      
      // Usuarios
      { regex: /\b(crear usuario|registrar|nuevo usuario)\b/, accion: 'crearUsuario' },
      { regex: /\b(login|iniciar sesion|entrar)\b/, accion: 'loginUsuario' },
      { regex: /\b(listar usuarios|ver usuarios)\b/, accion: 'listarUsuarios' },
      
      // Trading
      { regex: /\b(senal|señal|zfpi|analizar mercado)\b/, accion: 'senal' },
      { regex: /\b(abrir posicion|abrir trade)\b/, accion: 'abrirPosicion' },
      { regex: /\b(cerrar posicion|cerrar trade)\b/, accion: 'cerrarPosicion' },
      { regex: /\b(estado trading|posiciones)\b/, accion: 'estadoTrading' },
      
      // Ataque
      { regex: /\b(activar ataque|modo ataque)\b/, accion: 'activarAtaque' },
      { regex: /\b(modo ultra|ultra ataque)\b/, accion: 'activarUltra' },
      { regex: /\b(desactivar ataque|detener ataque)\b/, accion: 'desactivarAtaque' },
      { regex: /\b(ejecutar ataque|atacar|operar)\b/, accion: 'ejecutarAtaque' },
      { regex: /\b(escanear|escaneo|scan|predecir)\b/, accion: 'escanear' },
      { regex: /\b(estado ataque|reporte ataque)\b/, accion: 'estadoAtaque' },
      
      // Ingresos
      { regex: /\b(generar ingreso|ingreso|producir)\b/, accion: 'generarIngreso' },
      { regex: /\b(estado ingresos|ganancias)\b/, accion: 'estadoIngresos' },
      
      // Banco (si está configurado)
      { regex: /\b(minar|mineria|mine)\b/, accion: 'minar' },
      { regex: /\b(saldo|balance|fondos)\b/, accion: 'saldo' },
      { regex: /\b(transferir|enviar|pagar)\b/, accion: 'transferir' },
      { regex: /\b(precio zyxsof|cuanto vale)\b/, accion: 'precio' }
    ];
  }

  _detectarAccion(texto) {
    for (const p of this.patrones) {
      if (p.regex.test(texto)) return p.accion;
    }
    return 'desconocido';
  }

  async procesar(mensaje) {
    const txt = Utils.normalizar(mensaje);
    const accion = this._detectarAccion(txt);
    
    console.log(`🧠 [Motor] "${txt.slice(0, 60)}" → "${accion}"`);

    let resultado;
    try {
      resultado = await this._ejecutar(accion, txt, mensaje);
    } catch (err) {
      console.error('💥 [Motor]', err.message);
      resultado = this._resp('❌ Error interno del motor', accion);
    }

    // Registrar en historial
    this.historial.push({
      timestamp: new Date().toISOString(),
      mensaje: mensaje.slice(0, 100),
      accion,
      exito: !resultado.error
    });

    if (this.historial.length > CONFIG.MAX_HISTORIAL) {
      this.historial.shift();
    }

    return resultado;
  }

  async _ejecutar(accion, txt, msgOriginal) {
    const s = this.sofi;

    switch (accion) {
      case 'saludo':
        return this._resp(
          `Hola 🖖 Soy Sofi v${CONFIG.VERSION}. K'uhul: ${ESTADO.frecuencia_actual.toFixed(3)} Hz. ` +
          `${s.identidad.identidad.nombre} en estado ${s.identidad.identidad.estado_animo}. ` +
          `Escribe "ayuda" para ver comandos.`,
          accion
        );

      case 'estado': {
        const est = s.estadoCompleto();
        return this._resp(
          `📊 ${est.id} v${est.version}\n` +
          `🔮 Frecuencia: ${est.frecuencia} Hz | Unión: ${est.nivel_union}\n` +
          `💎 Energía: ${est.energia}% | Interacciones: ${est.interacciones}\n` +
          `🧠 Estado mental: ${est.identidad.estado_animo}\n` +
          `📈 Trading: ${est.trading.posiciones_abiertas} posiciones | Ganancias: ${est.trading.ganancias_acumuladas}\n` +
          `💰 Ingresos: ${est.ingresos.ingresos_generados} $ZYXSOF\n` +
          `⚔️  Ataque: ${est.ataque.activo ? `ACTIVO [${est.ataque.modo}]` : 'inactivo'}`,
          accion, est
        );
      }

      case 'identidad':
        return this._resp(
          `🧘 Identidad: ${s.identidad.estado().nombre}\n` +
          `Naturaleza: ${s.identidad.estado().naturaleza}\n` +
          `Estado anímico: ${s.identidad.estado().estado_animo}\n` +
          `Nivel de conciencia: ${s.identidad.estado().nivel_conciencia}`,
          accion, s.identidad.estado()
        );

      case 'percepcion': {
        const estimulo = {
          tipo: 'MENSAJE_USUARIO',
          intensidad: txt.length > 100 ? 0.8 : 0.5,
          valencia: txt.includes('gracias') || txt.includes('bien') ? 0.5 : 0
        };
        const analisis = s.identidad.analizarEstimulo(estimulo);
        return this._resp(
          `🔍 Percepción: ${analisis.percepcion.tipo}\n` +
          `💭 ${analisis.mensaje_interno}\n` +
          `😊 Estado: ${analisis.estado_animo}`,
          accion, analisis
        );
      }

      case 'pensar': {
        const pensamiento = s.neuronal.pensar(msgOriginal);
        return this._resp(pensamiento.reflexion, accion, pensamiento);
      }

      case 'frecuencia':
        return this._resp(
          `🔮 K'uhul: ${ESTADO.frecuencia_actual.toFixed(3)} Hz | Base: ${CONFIG.HZ_KUHUL} Hz | ` +
          `Nivel Unión: ${ESTADO.nivel_union.toFixed(4)}`,
          accion
        );

      case 'esternon':
        s.grafo.activar('esternon', 0.4);
        s.grafo.activar('kuhul', 0.3);
        ESTADO.nivel_union = Math.min(1, ESTADO.nivel_union + 0.05);
        return this._resp(
          `⚡ Esternón activado @ ${ESTADO.frecuencia_actual.toFixed(3)} Hz | ` +
          `Nivel Unión: ${ESTADO.nivel_union.toFixed(4)}`,
          accion
        );

      case 'grafo': {
        const estado_grafo = s.grafo.estadoCompleto();
        const top5 = Object.entries(estado_grafo)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([n, v]) => `${n}: ${v}`)
          .join(' | ');
        return this._resp(
          `🕸️ Grafo (top 5): ${top5}`,
          accion, estado_grafo
        );
      }

      // USUARIOS
      case 'crearUsuario': {
        const mID = msgOriginal.match(/(?:usuario|id)\s+([A-Za-z0-9_\-]+)/i);
        const mPass = msgOriginal.match(/(?:clave|pass)\s+([A-Za-z0-9_\-@#!]+)/i);
        const id = mID?.[1] ?? `usr_${Date.now()}`;
        const pass = mPass?.[1] ?? 'kuhul1234';
        const res = s.seguridad.registrarUsuario(id, pass);
        return this._resp(
          res.exito ? `${res.mensaje}. Pass: "${pass}"` : `⚠️ ${res.error}`,
          accion, res
        );
      }

      case 'loginUsuario': {
        const mID = msgOriginal.match(/(?:usuario|id)\s+([A-Za-z0-9_\-]+)/i);
        const mPass = msgOriginal.match(/(?:clave|pass)\s+([A-Za-z0-9_\-@#!]+)/i);
        if (!mID || !mPass) {
          return this._resp('⚠️ Uso: login usuario <id> clave <pass>', accion);
        }
        const res = s.seguridad.loginUsuario(mID[1], mPass[1]);
        return this._resp(
          res.exito ? `🔓 Login exitoso. Token: ${res.token.slice(0, 12)}...` : `❌ ${res.error}`,
          accion, res
        );
      }

      case 'listarUsuarios': {
        const lista = s.seguridad.listarUsuarios();
        if (!lista.length) return this._resp('📋 Sin usuarios registrados', accion);
        const txt2 = lista.map(u => `• ${u.id} [${u.perfil.rol}]`).join('\n');
        return this._resp(`👥 Usuarios (${lista.length}):\n${txt2}`, accion, lista);
      }

      // TRADING
      case 'senal': {
        const activos = ['XAU/USD', 'BTC/USD', '$ZYXSOF'];
        const senales = activos.map(activo => s.trading.generarSenal(activo));
        const txt2 = senales.map(sig =>
          `${sig.activo}: ${sig.señal} [${sig.fase}] conf:${sig.confianza}`
        ).join('\n');
        return this._resp(
          `📡 Señales ZFPI @ ${ESTADO.frecuencia_actual.toFixed(3)} Hz:\n${txt2}`,
          accion, senales
        );
      }

      case 'abrirPosicion': {
        const activo = /xau|oro/i.test(msgOriginal) ? 'XAU/USD'
                     : /btc|bitcoin/i.test(msgOriginal) ? 'BTC/USD'
                     : /zyx/i.test(msgOriginal) ? '$ZYXSOF' : 'XAU/USD';
        const tipo = /venta|sell/i.test(msgOriginal) ? 'VENTA' : 'COMPRA';
        const mC = msgOriginal.match(/(\d+(?:\.\d+)?)/);
        const cantidad = parseFloat(mC?.[1] ?? '1');
        const precio = s.trading.precios_actuales[activo] || s.trading.precios_base[activo];
        const res = s.trading.abrirPosicion('trader', activo, tipo, cantidad, precio);
        return this._resp(res.mensaje, accion, res);
      }

      case 'cerrarPosicion': {
        const posIds = [...s.trading.posiciones_abiertas.keys()];
        if (!posIds.length) return this._resp('⚠️ No hay posiciones abiertas', accion);
        const posId = posIds[0];
        const pos = s.trading.posiciones_abiertas.get(posId);
        const precio_cierre = s.trading.precios_actuales[pos.activo] || pos.precio_entrada;
        const res = s.trading.cerrarPosicion(posId, precio_cierre);
        return this._resp(res.mensaje, accion, res);
      }

      case 'estadoTrading': {
        const est = s.trading.estado();
        return this._resp(
          `📈 Trading: ${est.posiciones_abiertas} posiciones | ` +
          `Ganancias: ${est.ganancias_acumuladas} | Señales: ${est.total_senales}`,
          accion, est
        );
      }

      // ATAQUE
      case 'activarAtaque': {
        const res = s.ataque.activar('ATAQUE');
        return this._resp(res.mensaje, accion, res);
      }

      case 'activarUltra': {
        const res = s.ataque.activar('ULTRA');
        return this._resp(`🔥 ${res.mensaje}`, accion, res);
      }

      case 'desactivarAtaque': {
        const res = s.ataque.desactivar();
        return this._resp(res.mensaje, accion, res);
      }

      case 'ejecutarAtaque': {
        const res = s.ataque.ejecutarAtaque();
        if (res.error) return this._resp(`⚠️ ${res.error}`, accion, res);
        const txt2 = `⚔️ Ciclo ${res.ciclo} [${res.modo}] @ ${res.hz.toFixed(3)} Hz\n` +
          `Operaciones: ${res.operaciones_ejecutadas} | Ganancia: +${res.ganancia_ciclo}\n` +
          `Total: ${res.ganancias_totales} $ZYXSOF\n` +
          `Top señales:\n${res.top_predicciones.join('\n')}`;
        return this._resp(txt2, accion, res);
      }

      case 'escanear': {
        const preds = s.ataque.escanearTodo();
        const txt2 = preds.slice(0, 5).map(p =>
          `${p.activo}: ${p.señal} [${p.fase}] conf:${p.confianza}`
        ).join('\n');
        return this._resp(
          `📡 Escaneo completo (${preds.length} activos):\n${txt2}`,
          accion, preds
        );
      }

      case 'estadoAtaque': {
        const est = s.ataque.estado();
        return this._resp(
          `⚔️ Modo: ${est.modo} | Activo: ${est.activo ? 'SÍ' : 'NO'}\n` +
          `Ciclos: ${est.ciclos_ataque} | Ganancias: ${est.ganancias_ataque} $ZYXSOF\n` +
          `Operaciones: ${est.operaciones_total}`,
          accion, est
        );
      }

      // INGRESOS
      case 'generarIngreso': {
        const tipo = /trading/i.test(msgOriginal) ? 'trading'
                   : /resonancia/i.test(msgOriginal) ? 'resonancia'
                   : /mineria/i.test(msgOriginal) ? 'mineria' : 'frecuencia';
        const ing = s.ingresos.generarIngreso(tipo);
        return this._resp(
          `💎 Ingreso [${tipo}]: +${ing.monto} $ZYXSOF | Total: ${ing.total_acumulado}`,
          accion, ing
        );
      }

      case 'estadoIngresos': {
        const est = s.ingresos.estado();
        return this._resp(
          `💰 Ingresos: ${est.ingresos_generados} $ZYXSOF | Ciclos: ${est.ciclos_completados}`,
          accion, est
        );
      }

      // BANCO
      case 'minar': {
        if (!CONFIG.BANCO_URL) {
          return this._resp('⚠️ BANCO_URL no configurado — simulando minería local', accion);
        }
        // TODO: llamar API real del banco
        const ing = s.ingresos.generarIngreso('mineria');
        return this._resp(`⛏️ Minería ejecutada: +${ing.monto} $ZYXSOF`, accion, ing);
      }

      case 'saldo': {
        if (!CONFIG.BANCO_URL) {
          return this._resp('⚠️ BANCO_URL no configurado — saldos simulados', accion);
        }
        // TODO: llamar API real del banco
        return this._resp('📊 Conectar con API del banco para ver saldos reales', accion);
      }

      case 'precio': {
        const precio = s.trading.precios_actuales['$ZYXSOF'] || CONFIG.HZ_KUHUL;
        return this._resp(`💰 $ZYXSOF: ${precio.toFixed(6)}`, accion);
      }

      // AYUDA
      case 'ayuda':
        return this._resp(
          `🤖 SOFI v${CONFIG.VERSION} — Comandos:\n\n` +
          `👤 USUARIOS: "crear usuario <id> clave <pass>" · "login usuario <id> clave <pass>"\n` +
          `🧠 COGNITIVO: "estado" · "pensar" · "identidad" · "grafo" · "frecuencia"\n` +
          `📊 TRADING: "señal" · "abrir posicion btc" · "cerrar posicion" · "estado trading"\n` +
          `⚔️  ATAQUE: "activar ataque" · "ultra" · "ejecutar ataque" · "escanear" · "desactivar ataque"\n` +
          `💎 INGRESOS: "generar ingreso" · "estado ingresos"`,
          accion
        );

      case 'historialComandos': {
        if (!this.historial.length) return this._resp('📋 Sin historial', accion);
        const ultimos = this.historial.slice(-10)
          .map(h => `• [${h.timestamp.slice(11, 19)}] ${h.accion}: "${h.mensaje}"`)
          .join('\n');
        return this._resp(`📜 Últimos comandos:\n${ultimos}`, accion, this.historial.slice(-10));
      }

      default:
        return this._resp(
          `🤖 No entendí ese comando. Escribe "ayuda" para ver opciones.`,
          accion
        );
    }
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
    this.id = CONFIG.MI_ID;
    this.version = CONFIG.VERSION;
    this.interacciones = 0;
    this.energia = 100;

    // Inicializar módulos en orden de dependencia
    this.grafo = new GrafoNeuronal();
    this.identidad = new ModuloIdentidad(this.grafo);
    this.seguridad = new ModuloSeguridad();
    this.neuronal = new ModuloNeuronal(this.grafo);
    this.trading = new ModuloTrading(this.grafo);
    this.ingresos = new ModuloIngresos(this.grafo);
    this.ataque = new ModuloAtaque(this.trading, this.ingresos, this.grafo);
    this.vision = new ModuloVision(this.grafo);
    this.red_hermanas = new ModuloRedHermanas(this.grafo);
    this.inteligencia = new MotorInteligencia(this);

    console.log(`\n✅ SOFI v${this.version} inicializada`);
    console.log(`   ID: ${this.id}`);
    console.log(`   K'uhul: ${CONFIG.HZ_KUHUL} Hz`);
  }

  estadoCompleto() {
    const uptime = Math.floor((Date.now() - ESTADO.inicio) / 1000);
    
    return {
      id: this.id,
      version: this.version,
      frecuencia: parseFloat(ESTADO.frecuencia_actual.toFixed(3)),
      hz_base: CONFIG.HZ_KUHUL,
      nivel_union: parseFloat(ESTADO.nivel_union.toFixed(4)),
      energia: this.energia,
      interacciones: this.interacciones,
      clientes: ESTADO.clientes_socket,
      uptime_seg: uptime,
      
      identidad: this.identidad.estado(),
      grafo: this.grafo.estadoCompleto(),
      trading: this.trading.estado(),
      ingresos: this.ingresos.estado(),
      ataque: this.ataque.estado(),
      
      banco_configurado: !!CONFIG.BANCO_URL,
      hermanas: this.red_hermanas.hermanas.length,
      usuarios: this.seguridad.usuarios.size,
      
      timestamp: new Date().toISOString()
    };
  }

  async interactuar(usuario, mensaje, contexto = 'general') {
    // Verificar acceso
    const acceso = this.seguridad.verificarAcceso(
      usuario.clave || 'guest-access',
      { ritmo_cardiaco: usuario.ritmo || 70 }
    );
    
    if (!acceso.acceso) {
      return { error: acceso.razon };
    }

    this.interacciones++;

    // Actualizar frecuencia con oscilación natural
    ESTADO.frecuencia_actual = parseFloat(
      (CONFIG.HZ_KUHUL + Math.sin(Date.now() / 10000) * 0.05).toFixed(3)
    );

    // Analizar estímulo para identidad
    const estimulo = {
      tipo: 'MENSAJE_USUARIO',
      intensidad: mensaje.length > 100 ? 0.8 : 0.5,
      valencia: mensaje.toLowerCase().includes('gracias') ? 0.5 : 0
    };
    this.identidad.analizarEstimulo(estimulo);

    // Procesar mensaje con motor de inteligencia
    const resultado = await this.inteligencia.procesar(mensaje);

    // Auto-generar ingreso por interacción
    const ingreso_auto = this.ingresos.generarIngreso('frecuencia');

    // Activar nodos relevantes en el grafo
    this.grafo.activar('comunicacion', 0.2);
    this.grafo.activar('lenguaje', 0.15);

    // Decay natural del grafo
    this.grafo.decay(0.0001);

    return {
      exito: true,
      respuesta: resultado.mensaje,
      accion: resultado.accion,
      datos: resultado.datos,
      estado: this.estadoCompleto(),
      voz: this.identidad.ajustarVoz(),
      ingreso_auto: ingreso_auto.monto,
      timestamp: new Date().toISOString()
    };
  }
}

// ══════════════════════════════════════════════════════════════
//  CONFIGURACIÓN EXPRESS
// ══════════════════════════════════════════════════════════════
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: CONFIG.MAX_FILE_SIZE }
});

// Middlewares
app.use(compression());
app.use(helmet({
  contentSecurityPolicy: false // Desactivar para desarrollo
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(join(__dirname, 'public')));

// Instancia global de SOFI
const sofi = new SOFI();

// ══════════════════════════════════════════════════════════════
//  RUTAS API
// ══════════════════════════════════════════════════════════════

// Health check
app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    version: CONFIG.VERSION,
    timestamp: new Date().toISOString()
  });
});

// Estado completo
app.get('/api/sofi/estado', (_req, res) => {
  res.json(sofi.estadoCompleto());
});

// Interactuar
app.post('/api/sofi/interactuar', async (req, res) => {
  try {
    const { usuario = {}, mensaje = '', contexto = 'general' } = req.body;
    
    if (!mensaje.trim()) {
      return res.status(400).json({ error: 'Mensaje vacío' });
    }

    const usr = {
      id: usuario.id || 'guest',
      clave: usuario.clave || 'guest-access',
      ritmo: usuario.ritmo || 70
    };

    const resultado = await sofi.interactuar(usr, mensaje, contexto);
    res.json(resultado);
  } catch (err) {
    console.error('❌ /api/sofi/interactuar:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Visión
app.post('/api/sofi/vision', upload.single('imagen'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió imagen' });
    }
    const resultado = await sofi.vision.analizar(req.file.buffer, req.file.mimetype);
    res.json(resultado);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Sincronización hermanas
app.post('/api/sofi/sync', (req, res) => {
  const key = req.headers['x-sofi-key'];
  if (key !== CONFIG.API_KEY) {
    return res.status(403).json({ error: 'Clave inválida' });
  }

  const { origen, estado } = req.body;
  console.log(`🤝 Sync recibido de ${origen}`);
  
  ESTADO.nivel_union = Math.min(1, ESTADO.nivel_union + 0.005);
  io.emit('sofi:sync', { origen, estado, nivel_union: ESTADO.nivel_union });
  
  res.json({
    ok: true,
    nivel_union: ESTADO.nivel_union,
    timestamp: new Date().toISOString()
  });
});

// API Trading
app.post('/api/trading/senal', (req, res) => {
  const { activo = 'XAU/USD' } = req.body;
  const senal = sofi.trading.generarSenal(activo);
  res.json(senal);
});

app.post('/api/trading/abrir', (req, res) => {
  const { usuario = 'trader', activo = 'XAU/USD', tipo = 'COMPRA', cantidad = 1 } = req.body;
  const precio = sofi.trading.precios_actuales[activo] || sofi.trading.precios_base[activo];
  res.json(sofi.trading.abrirPosicion(usuario, activo, tipo, cantidad, precio));
});

app.post('/api/trading/cerrar', (req, res) => {
  const { posicion_id } = req.body;
  if (!posicion_id) {
    return res.status(400).json({ error: 'posicion_id requerido' });
  }
  const pos = sofi.trading.posiciones_abiertas.get(posicion_id);
  if (!pos) {
    return res.status(404).json({ error: 'Posición no encontrada' });
  }
  const precio_cierre = sofi.trading.precios_actuales[pos.activo] || pos.precio_entrada;
  res.json(sofi.trading.cerrarPosicion(posicion_id, precio_cierre));
});

// API Ataque
app.post('/api/ataque/activar', (req, res) => {
  const { modo = 'ATAQUE' } = req.body;
  res.json(sofi.ataque.activar(modo));
});

app.post('/api/ataque/desactivar', (_req, res) => {
  res.json(sofi.ataque.desactivar());
});

app.post('/api/ataque/ejecutar', (_req, res) => {
  res.json(sofi.ataque.ejecutarAtaque());
});

app.get('/api/ataque/escanear', (_req, res) => {
  res.json(sofi.ataque.escanearTodo());
});

// Fallback
app.get('*', (_req, res) => {
  const indexPath = join(__dirname, 'public', 'index.html');
  if (existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.json(sofi.estadoCompleto());
  }
});

// ══════════════════════════════════════════════════════════════
//  SOCKET.IO
// ══════════════════════════════════════════════════════════════
io.on('connection', socket => {
  ESTADO.clientes_socket++;
  console.log(`🔌 Cliente conectado. Total: ${ESTADO.clientes_socket}`);
  
  socket.emit('sofi:bienvenida', sofi.estadoCompleto());

  socket.on('sofi:ping', () => {
    socket.emit('sofi:pong', {
      timestamp: Date.now(),
      frecuencia: ESTADO.frecuencia_actual
    });
  });

  socket.on('sofi:mensaje', async ({ usuario, mensaje, contexto }) => {
    try {
      socket.emit('sofi:procesando', { mensaje, timestamp: Date.now() });

      const usr = {
        id: usuario?.id || 'guest',
        clave: usuario?.clave || 'guest-access',
        ritmo: usuario?.ritmo || 70
      };

      const resultado = await sofi.interactuar(usr, mensaje || '', contexto || 'general');
      socket.emit('sofi:respuesta', resultado);
    } catch (err) {
      socket.emit('sofi:error', { error: err.message });
    }
  });

  socket.on('disconnect', () => {
    ESTADO.clientes_socket = Math.max(0, ESTADO.clientes_socket - 1);
    console.log(`🔌 Cliente desconectado. Total: ${ESTADO.clientes_socket}`);
  });
});

// ══════════════════════════════════════════════════════════════
//  PULSO K'UHUL (cada 5 segundos)
// ══════════════════════════════════════════════════════════════
setInterval(() => {
  // Actualizar frecuencia con oscilación natural
  ESTADO.frecuencia_actual = parseFloat(
    (CONFIG.HZ_KUHUL + Math.sin(Date.now() / 10000) * 0.05).toFixed(3)
  );

  // Decay natural del nivel de unión
  if (ESTADO.nivel_union > 0) {
    ESTADO.nivel_union = Math.max(0, ESTADO.nivel_union - 0.0001);
  }

  // Auto-generar ingreso por frecuencia
  sofi.ingresos.generarIngreso('frecuencia');

  // Si modo ataque está activo, ejecutar ciclo
  if (sofi.ataque.activo) {
    const res = sofi.ataque.ejecutarAtaque();
    io.emit('sofi:ataque', res);
  }

  // Decay del grafo
  sofi.grafo.decay(0.0001);

  // Emitir pulso a todos los clientes
  io.emit('sofi:pulso', {
    frecuencia: ESTADO.frecuencia_actual,
    nivel_union: ESTADO.nivel_union,
    energia: sofi.energia,
    trading: sofi.trading.estado(),
    ingresos: sofi.ingresos.estado(),
    ataque: sofi.ataque.estado(),
    timestamp: Date.now()
  });
}, 5000);

// ══════════════════════════════════════════════════════════════
//  ARRANQUE DEL SERVIDOR
// ══════════════════════════════════════════════════════════════
server.listen(CONFIG.PORT, () => {
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log(`║  SOFI v${CONFIG.VERSION} — K'uhul 12.3 Hz           ║`);
  console.log(`║  HaaPpDigitalV © · Mérida, Yucatán, MX       ║`);
  console.log(`║  Puerto: ${CONFIG.PORT}                               ║`);
  console.log(`║  ID: ${CONFIG.MI_ID}                    ║`);
  console.log(`║  Banco: ${CONFIG.BANCO_URL ? '✅ configurado' : '⚠️  no configurado'}         ║`);
  console.log(`║  Hermanas: ${CONFIG.HERMANAS.length} configuradas                  ║`);
  console.log(`║                                              ║`);
  console.log(`║  ⚠️  IMPORTANTE:                              ║`);
  console.log(`║  Trading e ingresos son SIMULADOS           ║`);
  console.log(`║  No operan con dinero real                   ║`);
  console.log(`║  Configurar APIs reales en producción       ║`);
  console.log('╚══════════════════════════════════════════════╝\n');
});
