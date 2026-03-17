const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// VARIABLES DE ENTORNO
const CLIENT_ID = process.env.HOTMART_CLIENT_ID;
const CLIENT_SECRET = process.env.HOTMART_CLIENT_SECRET;
const BASIC = process.env.HOTMART_BASIC;
const SOFI_KEY = process.env.SOFI_API_KEY;

// SEGURIDAD - Solo SOFI tiene acceso
app.use((req, res, next) => {
  if (req.path === "/health") return next();
  const key = req.headers["x-sofi-key"] || req.query.key;
  if (key !== SOFI_KEY) {
    return res.status(401).json({ error: "Acceso denegado - Solo SOFI" });
  }
  next();
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

// ENDPOINTS
app.get("/health", (req, res) => {
  res.json({ 
    status: "SOFI activa", 
    owner: "Nirvana - HaaPpDigitalV",
    version: "2.0.0"
  });
});

app.get("/ventas", async (req, res) => {
  try {
    const token = await getToken();
    const r = await axios.get(
      "https://developers.hotmart.com/payments/api/v1/sales/history",
      { headers: { Authorization: `Bearer ${token}` } }
    );
    res.json(r.data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/productos", async (req, res) => {
  try {
    const token = await getToken();
    const r = await axios.get(
      "https://developers.hotmart.com/products/api/v1/products",
      { headers: { Authorization: `Bearer ${token}` } }
    );
    res.json(r.data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/saldo", async (req, res) => {
  try {
    const token = await getToken();
    const r = await axios.get(
      "https://developers.hotmart.com/payments/api/v1/balance",
      { headers: { Authorization: `Bearer ${token}` } }
    );
    res.json(r.data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`SOFI CEO corriendo en puerto ${PORT}`);
  console.log(`Propietario: Nirvana - HaaPpDigitalV`);
});
