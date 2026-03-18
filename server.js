const express = require("express");
const axios = require("axios");
const cors = require("cors");
const { exec } = require("child_process");
const fs = require("fs").promises;
const path = require("path");
const { createServer } = require("http");
const { Server } = require("socket.io");

// SOFI v2.0 - Victor Hugo Gonzalez Torres / HaaPpDigitalV 

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const CONFIG_SOFI = {
  NOMBRE_SISTEMA: "SOFI",
  VERSION: "2.0.0",
  RUTA_PROYECTO: "./sofi-data",
  RUTA_LOGS: "./sofi-data/logs",
  RUTA_PRUEBAS: "./sofi-data/tests",
  RUTA_COMANDOS: "./sofi-data/comandos",
  MODULOS_ACTIVOS: ["gestion_codigo","automatizacion_tareas","comandos_personalizados","monitoreo","base_datos","integraciones"],
  ALERTAS_CONFIG: {
    SLACK_WEBHOOK: process.env.SLACK_WEBHOOK || null
  },
  DB_CONFIG: {
    RUTA_DB: "./sofi-data/db/sofi-db.json"
  }
};

// === MIDDLEWARE API KEY ===
const verificarApiKey = (req, res, next) => {
  if (req.path === "/" || req.path === "/sofi/estado") return next();
  const apiKey = req.headers["x-api-key"];
  const claveValida = process.env.API_KEY;
  if (!claveValida) { console.warn("âš ï¸  API_KEY no configurada."); return next(); }
  if (!apiKey || apiKey !== claveValida) {
    return res.status(401).json({ error: "No autorizado", instruccion: "Header: x-api-key: TU_CLAVE" });
  }
  next();
};
app.use(verificarApiKey);

// === CARPETAS ===
async function inicializarCarpetas() {
  const carpetas = [CONFIG_SOFI.RUTA_PROYECTO, CONFIG_SOFI.RUTA_LOGS, CONFIG_SOFI.RUTA_PRUEBAS, CONFIG_SOFI.RUTA_COMANDOS, path.dirname(CONFIG_SOFI.DB_CONFIG.RUTA_DB)];
  for (const c of carpetas) { try { await fs.access(c); } catch { await fs.mkdir(c, { recursive: true }); } }
  console.log("ðŸ“ Carpetas listas.");
}

// === MÃ“DULO ARCHIVOS ===
const MODULO_ARCHIVOS = {
  leerArchivo: async (ruta, enc = "utf8") => {
    try {
      const r = path.isAbsolute(ruta) ? ruta : path.join(CONFIG_SOFI.RUTA_PROYECTO, ruta);
      return { exito: true, contenido: await fs.readFile(r, enc) };
    } catch (e) { return { exito: false, error: "Archivo no encontrado", detalle: e.message }; }
  },
  escribirArchivo: async (ruta, contenido, sobreescribir = true) => {
    try {
      const r = path.isAbsolute(ruta) ? ruta : path.join(CONFIG_SOFI.RUTA_PROYECTO, ruta);
      await fs.mkdir(path.dirname(r), { recursive: true });
      if (!sobreescribir && await fs.access(r).then(() => true).catch(() => false)) return { exito: false, error: "Ya existe" };
      await fs.writeFile(r, contenido, "utf8");
      return { exito: true, mensaje: "Guardado", ruta };
    } catch (e) { return { exito: false, error: e.message }; }
  },
  listarArchivos: async (carpeta = "") => {
    try {
      const archivos = await fs.readdir(path.join(CONFIG_SOFI.RUTA_PROYECTO, carpeta));
      return { exito: true, archivos };
    } catch (e) { return { exito: false, error: "Carpeta no encontrada" }; }
  }
};

// === MÃ“DULO DB ===
const MODULO_DB = {
  leerDB: async () => {
    try { return JSON.parse(await fs.readFile(CONFIG_SOFI.DB_CONFIG.RUTA_DB, "utf8")); }
    catch { const d = { alertas:[], tareas:[], usuarios:[], correos:[], logs:[] }; await fs.mkdir(path.dirname(CONFIG_SOFI.DB_CONFIG.RUTA_DB), { recursive:true }); await fs.writeFile(CONFIG_SOFI.DB_CONFIG.RUTA_DB, JSON.stringify(d,null,2)); return d; }
  },
  guardarRegistro: async (col, reg) => {
    try {
      const db = await MODULO_DB.leerDB();
      if (!db[col]) db[col] = [];
      const n = { ...reg, id: db[col].length + 1, fecha: new Date().toISOString() };
      db[col].push(n);
      await fs.writeFile(CONFIG_SOFI.DB_CONFIG.RUTA_DB, JSON.stringify(db,null,2));
      return { exito: true, idRegistro: n.id };
    } catch (e) { return { exito: false, error: e.message }; }
  },
  obtenerRegistros: async (col, filtro = {}) => {
    const db = await MODULO_DB.leerDB();
    if (!db[col]) return { exito: false, error: "ColecciÃ³n no existe" };
    const r = Object.keys(filtro).length === 0 ? db[col] : db[col].filter(x => Object.entries(filtro).every(([k,v]) => x[k] === v));
    return { exito: true, registros: r, total: r.length };
  }
};

// === MÃ“DULO TAREAS ===
const MODULO_TAREAS = {
  ejecutarTarea: async (tarea, params = []) => {
    switch (tarea) {
      case "revisar_seguridad": {
        const lista = await MODULO_ARCHIVOS.listarArchivos();
        const riesgos = [];
        if (lista.exito) for (const a of lista.archivos) { const l = await MODULO_ARCHIVOS.leerArchivo(a); if (l.exito) for (const p of ["password","apiKey","secret","token"]) if (l.contenido.includes(p)) { riesgos.push({archivo:a, riesgo:p}); break; } }
        return { exito:true, archivos_revisados: lista.archivos?.length||0, riesgos, estado: riesgos.length===0?"âœ… Limpio":"âš ï¸ Revisar" };
      }
      case "generar_comandos": {
        if (!Array.isArray(params)||params.length===0) return { exito:false, error:"Array de comandos requerido" };
        const cmds = [];
        for (const c of params) { await MODULO_ARCHIVOS.escribirArchivo(path.join("comandos",`${c.nombre}.js`), `// ${c.nombre}\nmodule.exports = async (p) => { ${c.accion||"// lÃ³gica"} };`); cmds.push(c.nombre); }
        return { exito:true, creados: cmds };
      }
      case "generar_pruebas": {
        const m = params[0]; if (!m) return { exito:false, error:"Nombre de mÃ³dulo requerido" };
        await MODULO_ARCHIVOS.escribirArchivo(path.join("tests",`${m}.test.js`), `const m = require('../src/${m}.js');\ntest('${m} definido', () => { expect(m).toBeDefined(); });`);
        return { exito:true, modulo:m };
      }
      default: return { exito:false, mensaje:"Tarea no definida", disponibles:["revisar_seguridad","generar_comandos","generar_pruebas"] };
    }
  },
  ejecutarComandoPersonalizado: async (nombre, params=[]) => {
    try { const r = path.resolve(CONFIG_SOFI.RUTA_COMANDOS,`${nombre}.js`); delete require.cache[r]; return { exito:true, resultado: await require(r)(params) }; }
    catch (e) { return { exito:false, error:e.message }; }
  }
};

// === MÃ“DULO MONITOREO (SIN MEMORY LEAK) ===
const _intervalos = {};
const MODULO_MONITOREO = {
  monitorearLog: async (nombreLog, cfg={}) => {
    if (_intervalos[nombreLog]) clearInterval(_intervalos[nombreLog]);
    const palabras = cfg.palabrasClave || ["ERROR","WARNING"];
    const ms = cfg.intervalo || 10000;
    _intervalos[nombreLog] = setInterval(async () => {
      const l = await MODULO_ARCHIVOS.leerArchivo(path.join(CONFIG_SOFI.RUTA_LOGS, nombreLog));
      if (l.exito && palabras.some(p => l.contenido.includes(p))) {
        const alerta = { tipo:"ALERTA", log:nombreLog, mensaje: cfg.mensajeAlerta||`Alerta en ${nombreLog}`, fecha:new Date().toISOString() };
        io.emit("alerta_sofi", alerta);
        await MODULO_DB.guardarRegistro("alertas", alerta);
        if (CONFIG_SOFI.ALERTAS_CONFIG.SLACK_WEBHOOK) try { await axios.post(CONFIG_SOFI.ALERTAS_CONFIG.SLACK_WEBHOOK, { text:`âš ï¸ SOFI: ${alerta.mensaje}` }); } catch(e) { console.error("Slack:",e.message); }
      }
    }, ms);
    return { exito:true, log:nombreLog, intervalo_ms:ms };
  },
  detenerMonitoreo: (log) => {
    if (_intervalos[log]) { clearInterval(_intervalos[log]); delete _intervalos[log]; return { exito:true }; }
    return { exito:false, error:"No activo" };
  },
  listarMonitoreos: () => ({ exito:true, activos: Object.keys(_intervalos) })
};

// === MÃ“DULO INTEGRACIONES (CORREGIDO) ===
const MODULO_INTEGRACIONES = {
  crearPR: (titulo, descripcion, rama="feature/sofi-update") => new Promise(resolve => {
    // FIX: exec git real, no llamada a server.js
    exec(`git checkout -b ${rama} 2>/dev/null || git checkout ${rama} && git add . && git commit -m "${titulo}" && git push -u origin ${rama}`, { cwd: process.cwd() }, (err, stdout, stderr) => {
      if (err) resolve({ exito:false, error:stderr, sugerencia:"Verificar config git y repo" });
      else resolve({ exito:true, mensaje:`Rama '${rama}' subida. Abre PR en GitHub.`, titulo });
    });
  }),
  enviarCorreo: async (destino, asunto, cuerpo) => {
    await MODULO_DB.guardarRegistro("correos", { destino, asunto, cuerpo });
    return { exito:true, mensaje:"Registrado. Configura Nodemailer para envÃ­o real.", destino };
  }
};

// === ENDPOINTS ===
app.get("/", (req, res) => res.json({ sistema:CONFIG_SOFI.NOMBRE_SISTEMA, version:CONFIG_SOFI.VERSION, estado:"ðŸŸ¢ Operativo", propietario:"VÃ­ctor Hugo GonzÃ¡lez Torres / Happs Digital" }));

app.get("/sofi/estado", async (req, res) => {
  const db = await MODULO_DB.leerDB();
  res.json({ sistema:CONFIG_SOFI.NOMBRE_SISTEMA, version:CONFIG_SOFI.VERSION, modulos:CONFIG_SOFI.MODULOS_ACTIVOS, monitoreos:Object.keys(_intervalos), db:{ alertas:db.alertas?.length||0, tareas:db.tareas?.length||0, correos:db.correos?.length||0 }, ts:new Date().toISOString() });
});

app.post("/sofi/iniciar", async (req, res) => {
  await inicializarCarpetas();
  const { nivel_complejidad, tareas_a_ejecutar=[] } = req.body;
  await MODULO_DB.guardarRegistro("tareas", { tipo:"inicio", nivel:nivel_complejidad });
  res.json({ sistema:CONFIG_SOFI.NOMBRE_SISTEMA, version:CONFIG_SOFI.VERSION, modulo_activado:nivel_complejidad, tareas_programadas:tareas_a_ejecutar.length, estado:"âœ… Listo", propietario:"VÃ­ctor Hugo GonzÃ¡lez Torres" });
});

app.post("/sofi/archivo/gestionar", async (req, res) => {
  const { ruta, accion, contenido, sobreescribir=true } = req.body;
  if (!ruta||!accion) return res.status(400).json({ error:"Faltan: ruta y accion" });
  let r;
  if (accion==="leer") r = await MODULO_ARCHIVOS.leerArchivo(ruta);
  else if (accion==="escribir") r = await MODULO_ARCHIVOS.escribirArchivo(ruta, contenido, sobreescribir);
  else if (accion==="listar") r = await MODULO_ARCHIVOS.listarArchivos(ruta);
  else r = { exito:false, error:"AcciÃ³n invÃ¡lida: leer|escribir|listar" };
  res.json({ accion, resultado:r });
});

app.post("/sofi/tarea/ejecutar", async (req, res) => {
  const { tarea, parametros=[] } = req.body;
  if (!tarea) return res.status(400).json({ error:"Falta: tarea" });
  const r = await MODULO_TAREAS.ejecutarTarea(tarea, parametros);
  await MODULO_DB.guardarRegistro("tareas", { tarea, ok:r.exito });
  res.json({ tarea, resultado:r });
});

app.post("/sofi/comando/ejecutar", async (req, res) => {
  const { nombre, parametros=[] } = req.body;
  if (!nombre) return res.status(400).json({ error:"Falta: nombre" });
  res.json(await MODULO_TAREAS.ejecutarComandoPersonalizado(nombre, parametros));
});

app.post("/sofi/monitoreo/iniciar", async (req, res) => {
  const { log, palabras_clave, intervalo, mensaje_alerta } = req.body;
  if (!log) return res.status(400).json({ error:"Falta: log" });
  res.json(await MODULO_MONITOREO.monitorearLog(log, { palabrasClave:palabras_clave, intervalo, mensajeAlerta:mensaje_alerta }));
});

app.post("/sofi/monitoreo/detener", (req, res) => {
  const { log } = req.body;
  if (!log) return res.status(400).json({ error:"Falta: log" });
  res.json(MODULO_MONITOREO.detenerMonitoreo(log));
});

app.get("/sofi/monitoreo/activos", (req, res) => res.json(MODULO_MONITOREO.listarMonitoreos()));

app.get("/sofi/db/:col", async (req, res) => res.json(await MODULO_DB.obtenerRegistros(req.params.col, req.query)));
app.post("/sofi/db/:col", async (req, res) => {
  if (!req.body||Object.keys(req.body).length===0) return res.status(400).json({ error:"Cuerpo vacÃ­o" });
  res.json(await MODULO_DB.guardarRegistro(req.params.col, req.body));
});

app.post("/sofi/integrar/correo", async (req, res) => {
  const { destino, asunto, cuerpo } = req.body;
  if (!destino||!asunto) return res.status(400).json({ error:"Faltan: destino y asunto" });
  res.json(await MODULO_INTEGRACIONES.enviarCorreo(destino, asunto, cuerpo));
});

app.post("/sofi/integrar/pr", async (req, res) => {
  const { titulo, descripcion, rama } = req.body;
  if (!titulo) return res.status(400).json({ error:"Falta: titulo" });
  res.json(await MODULO_INTEGRACIONES.crearPR(titulo, descripcion, rama));
});

// === SOCKET.IO ===
io.on("connection", socket => {
  console.log(`ðŸ”Œ Socket: ${socket.id}`);
  socket.emit("sofi_conectada", { mensaje:"Conectado a SOFI", ts:new Date().toISOString() });
  socket.on("disconnect", () => console.log(`âŒ Socket off: ${socket.id}`));
});

// === ARRANQUE ===
const PUERTO = process.env.PORT || process.env.PUERTO || 3000;
inicializarCarpetas().then(() => {
  httpServer.listen(PUERTO, () => {
    console.log(`\nâœ… SOFI v${CONFIG_SOFI.VERSION} en puerto ${PUERTO}`);
    console.log(`ðŸ” API Key: ${process.env.API_KEY ? "ACTIVA âœ…" : "âš ï¸  SIN CONFIGURAR (dev)"}`);
    console.log(`ðŸ“¡ Socket.io activo`);
    console.log(`ðŸ’¾ DB: ${CONFIG_SOFI.DB_CONFIG.RUTA_DB}`);
    console.log(`ðŸ‘¤ VÃ­ctor Hugo GonzÃ¡lez Torres / Happs Digital\n`);
  });
});
