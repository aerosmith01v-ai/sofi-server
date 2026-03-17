const express = require("express");
const axios = require("axios");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

const CLIENT_ID = process.env.HOTMART_CLIENT_ID;
const CLIENT_SECRET = process.env.HOTMART_CLIENT_SECRET;
const BASIC = process.env.HOTMART_BASIC;
const SOFI_KEY = process.env.SOFI_API_KEY;

// SEGURIDAD - app y health son públicos
app.use((req, res, next) => {
  if (req.path === "/" || req.path === "/health" || req.path.endsWith(".html")) return next();
  const key = req.headers["x-sofi-key"] || req.query.key;
  if (key !== SOFI_KEY) {
    return res.status(401).json({ error: "Acceso denegado - Solo SOFI" });
  }
  next();
});

// SERVIR LA APP
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// TOKEN HOTMART
let accessToken = null;
let tokenExpiry = 0;

async function getToken() {
  if (accessToken && Date.now() < tokenExpiry) return accessToken;
  const res = await axios.post(
    "https://api-sec-vlc.hotmart.com/security/oauth/token",
    "grant_type=client_credentials",
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${BASIC}`,
      },
      params: { client_id: CLIENT_ID, client_secret: CLIENT_SECRET },
    }
  );
  accessToken = res.data.access_token;
  tokenExpiry = Date.now() + res.data.expires_in * 1000 - 60000;
  return accessToken;
}

app.get("/health", (req, res) => {
  res.json({ status: "SOFI activa", owner: "Nirvana - HaaPpDigitalV", version: "2.0.0" });
});

app.get("/ventas", async (req, res) => {
  try {
    const token = await getToken();
    const r = await axios.get("https://developers.hotmart.com/payments/api/v1/sales/history", { headers: { Authorization: `Bearer ${token}` } });
    res.json(r.data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/productos", async (req, res) => {
  try {
    const token = await getToken();
    const r = await axios.get("https://developers.hotmart.com/products/api/v1/products", { headers: { Authorization: `Bearer ${token}` } });
    res.json(r.data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/saldo", async (req, res) => {
  try {
    const token = await getToken();
    const r = await axios.get("https://developers.hotmart.com/payments/api/v1/balance", { headers: { Authorization: `Bearer ${token}` } });
    res.json(r.data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// INTEGRA PERCEPTIVA
const sesionesActivas = {};

app.get("/perceptiva/frecuencias", (req, res) => {
  res.json({
    condiciones: {
      meditacion: { hz: "4-8", onda: "Theta", beneficio: "Relajacion profunda" },
      enfoque: { hz: "12-30", onda: "Beta", beneficio: "Concentracion alta" },
      creatividad: { hz: "8-12", onda: "Alpha", beneficio: "Flujo creativo" },
      sueno: { hz: "0.5-4", onda: "Delta", beneficio: "Sueno reparador" },
      esquizofrenia: { hz: "40", onda: "Gamma", beneficio: "Sincronizacion neuronal" },
      autismo: { hz: "10-12", onda: "Alpha", beneficio: "Reduccion ansiedad sensorial" },
      tdah: { hz: "12-15", onda: "SMR", beneficio: "Regulacion atencion" },
      sindrome_down: { hz: "8-10", onda: "Alpha-Theta", beneficio: "Estimulacion cognitiva" },
      sordera: { hz: "20-40", onda: "Gamma-Beta", beneficio: "Estimulacion cortex auditivo" },
      energetico: { hz: "7.83", onda: "Schumann", beneficio: "Resonancia campo magnetico" },
      trauma: { hz: "4-8", onda: "Theta", beneficio: "Procesamiento trauma" },
      ansiedad: { hz: "8-12", onda: "Alpha", beneficio: "Reduccion cortisol" },
      depresion: { hz: "10", onda: "Alpha", beneficio: "Estimulacion serotonina" }
    },
    version: "2.0.0",
    aviso: "Uso terapeutico complementario"
  });
});

app.post("/perceptiva/iniciar", (req, res) => {
  const { usuario, condicion, duracion } = req.body;
  const id = Date.now().toString();
  sesionesActivas[id] = { usuario: usuario || "Nirvana", condicion: condicion || "meditacion", duracion: duracion || 20, inicio: new Date().toISOString(), estado: "activa" };
  res.json({ sesion_id: id, mensaje: `Sesion de ${condicion} iniciada`, datos: sesionesActivas[id] });
});

app.get("/perceptiva/sesion/:id", (req, res) => {
  const sesion = sesionesActivas[req.params.id];
  if (!sesion) return res.status(404).json({ error: "Sesion no encontrada" });
  const transcurrido = Math.floor((Date.now() - new Date(sesion.inicio)) / 60000);
  res.json({ ...sesion, minutos_transcurridos: transcurrido, progreso_pct: Math.min(100, Math.round((transcurrido / sesion.duracion) * 100)) });
});

app.get("/perceptiva/sismico", (req, res) => {
  const vibracion = (Math.random() * 0.5).toFixed(3);
  res.json({ magnitud_estimada: parseFloat(vibracion), estado: parseFloat(vibracion) < 0.3 ? "Normal" : "Actividad detectada", frecuencia_hz: "0.1-1", timestamp: new Date().toISOString(), ubicacion: "Merida, Yucatan" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`SOFI CEO corriendo en puerto ${PORT}`);
  console.log(`Propietario: Nirvana - HaaPpDigitalV`);
});
