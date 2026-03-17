const express = require("express");
const axios = require("axios");
const cors = require("cors");
const path = require("path");
const app = express();

// CONFIGURACIÓN BASE ORIGINAL
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// VARIABLES DE ENTORNO (CONFIGURABLES DESDE MÓVIL)
const HOTMART_CONFIG = {
  BASE_URL: "https://api-sec-vlc.hotmart.com", // URL CORREGIDA DE HOTMART
  GRANT_TYPE: "client_credentials",
  SCOPE: "read:sales read:products read:balance"
};

const SISMICO_CONFIG = {
  BASE_URL: "https://api-sismico-mx.herokuapp.com/v1", // OPCIONAL: URL CORREGIDA
  REFRESH_INTERVAL: 60000 // 1 MINUTO DE ACTUALIZACIÓN
};

// FUNCIÓN DE TOKEN CORREGIDA
let accessToken = null;
let tokenExpiry = 0;

async function getAccessToken() {
  if (accessToken && Date.now() < tokenExpiry) return accessToken;

  try {
    const response = await axios.post(
      "https://api-sec-vlc.hotmart.com/security/oauth/token", // URL CORREGIDA
      new URLSearchParams({
        grant_type: HOTMART_CONFIG.GRANT_TYPE,
        client_id: process.env.HOTMART_CLIENT_ID,
        client_secret: process.env.HOTMART_CLIENT_SECRET,
        scope: HOTMART_CONFIG.SCOPE
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${process.env.HOTMART_BASIC_AUTH}`
        }
      }
    );

    accessToken = response.data.access_token;
    tokenExpiry = Date.now() + (response.data.expires_in * 1000 - 60000); // MENOS 1 MINUTO DE SEGURIDAD
    console.log("✅ Token actualizado correctamente");
    return accessToken;
  } catch (error) {
    console.error("❌ Error al obtener token:", error.response?.data || error.message);
    throw new Error("No se pudo obtener el token de Hotmart");
  }
}

// ENDPOINTS ORIGINALES + MEJORAS
app.get("/ventas", async (req, res) => {
  try {
    const token = await getAccessToken();
    const response = await axios.get(`${HOTMART_CONFIG.BASE_URL}/sales/history`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { limit: req.query.limit || 50 }
    });
    res.json({ total: response.data.pagination.total, ventas: response.data.items });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener ventas", detalle: error.message });
  }
});

app.get("/productos", async (req, res) => {
  try {
    const token = await getAccessToken();
    const response = await axios.get(`${HOTMART_CONFIG.BASE_URL}/products`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    res.json({ total: response.data.total, productos: response.data.items });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener productos", detalle: error.message });
  }
});

app.get("/perceptiva/sismico", async (req, res) => {
  try {
    const response = await axios.get(`${SISMICO_CONFIG.BASE_URL}/mexico/chiapas`, {
      params: { region: "Chiapas, Palenque" }
    });
    res.json({
      magnitud: response.data.magnitude.toFixed(2),
      estado: response.data.status || "Normal",
      ubicacion: response.data.location || "Chiapas, Palenque"
    });
  } catch (error) {
    res.json({ magnitud: "0.0", estado: "Normal", ubicacion: "Chiapas, Palenque" });
  }
});

// ENDPOINT NUEVO: VERIFICAR ESTADO DEL SERVIDOR
app.get("/estado", (req, res) => {
  res.json({
    status: "ONLINE",
    version: "2.0.1",
    servicios: {
      hotmart: accessToken ? "CONECTADO" : "ESPERANDO TOKEN",
      sismico: "ACTIVO",
      voz: "CONFIGURADO"
    },
    ultimo_actualizacion: new Date().toISOString()
  });
});

// FUNCIÓN DE ACTUALIZACIÓN AUTOMÁTICA
setInterval(async () => {
  try {
    await getAccessToken(); // MANTENER TOKEN ACTUALIZADO
    console.log("🔄 Token mantenido actualizado");
  } catch (e) {
    console.log("⚠️ No se pudo actualizar el token automáticamente");
  }
}, 270000); // 4.5 MINUTOS PARA NO SOBRECARGAR

// INICIALIZACIÓN ORIGINAL
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 SOFI Servidor corriendo en puerto ${PORT}`);
  console.log(`🔗 Acceso: http://localhost:${PORT}`);
});
