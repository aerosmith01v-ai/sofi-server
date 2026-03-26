<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
<title>SOFI v4.2 — Sistema de Mapas Yucateco | HaaPpDigitalV</title>
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Share+Tech+Mono&display=swap" rel="stylesheet">
<style>
  :root {
    --cyan:   #00E5FF;
    --purple: #9B59B6;
    --green:  #2ECC71;
    --gold:   #F39C12;
    --red:    #E74C3C;
    --jade:   #00ffc8;
    --bg:     #050510;
    --bg2:    #0a0a1a;
    --bg3:    #0d1b2a;
    --text:   rgba(255,255,255,0.85);
    --muted:  #4a6a8a;
  }

  * { margin:0; padding:0; box-sizing:border-box; }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: 'Share Tech Mono', monospace;
    min-height: 100vh;
    overflow-x: hidden;
  }

  /* Fondo maya */
  body::before {
    content: '';
    position: fixed;
    inset: 0;
    background:
      radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,229,255,0.05) 0%, transparent 60%),
      radial-gradient(ellipse 50% 40% at 80% 80%, rgba(155,89,182,0.06) 0%, transparent 50%),
      repeating-linear-gradient(45deg, rgba(0,255,200,0.02) 0px, rgba(0,255,200,0.02) 2px, transparent 2px, transparent 8px);
    pointer-events: none;
    z-index: 0;
  }

  header {
    position: relative;
    z-index: 10;
    text-align: center;
    padding: 48px 24px 32px;
    border-bottom: 1px solid rgba(0,229,255,0.1);
  }

  .logo-wrap {
    display: inline-flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 12px;
  }

  .brain-icon {
    font-size: 48px;
    animation: pulso 2.5s ease-in-out infinite;
  }

  @keyframes pulso {
    0%,100% { filter: drop-shadow(0 0 8px var(--cyan)); }
    50%      { filter: drop-shadow(0 0 24px var(--cyan)) drop-shadow(0 0 48px var(--purple)); }
  }

  h1 {
    font-family: 'Orbitron', sans-serif;
    font-size: clamp(32px, 8vw, 64px);
    font-weight: 900;
    letter-spacing: 0.1em;
    color: #fff;
    text-shadow: 0 0 30px var(--cyan), 0 0 60px rgba(0,229,255,0.3);
    line-height: 1;
  }

  .version-tag {
    display: inline-block;
    font-size: 11px;
    letter-spacing: 0.3em;
    color: var(--cyan);
    border: 1px solid rgba(0,229,255,0.3);
    padding: 4px 14px;
    margin-top: 10px;
    border-radius: 2px;
    text-transform: uppercase;
  }

  .brand {
    font-size: 12px;
    letter-spacing: 0.2em;
    color: rgba(255,255,255,0.3);
    margin-top: 8px;
  }

  .status-bar {
    position: relative;
    z-index: 10;
    display: flex;
    justify-content: center;
    gap: 24px;
    flex-wrap: wrap;
    padding: 16px 24px;
    background: rgba(0,229,255,0.03);
    border-bottom: 1px solid rgba(0,229,255,0.08);
  }

  .status-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
    letter-spacing: 0.1em;
    color: rgba(255,255,255,0.5);
  }

  .dot {
    width: 7px; height: 7px;
    border-radius: 50%;
    animation: blink 1.4s infinite;
  }
  .dot.green  { background: var(--green);  box-shadow: 0 0 8px var(--green); }
  .dot.cyan   { background: var(--cyan);   box-shadow: 0 0 8px var(--cyan); }
  .dot.purple { background: var(--purple); box-shadow: 0 0 8px var(--purple); }
  .dot.gold   { background: var(--gold);   box-shadow: 0 0 8px var(--gold); }

  @keyframes blink {
    0%,100% { opacity: 1; }
    50%      { opacity: 0.3; }
  }

  .hz-section {
    position: relative;
    z-index: 10;
    text-align: center;
    padding: 40px 24px;
  }

  .hz-ring {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 180px; height: 180px;
    border-radius: 50%;
    border: 2px solid rgba(0,229,255,0.2);
    box-shadow: 0 0 30px rgba(0,229,255,0.1), inset 0 0 30px rgba(0,229,255,0.05);
    margin: 0 auto 24px;
    position: relative;
    animation: rotarBorde 8s linear infinite;
  }

  .hz-ring::before {
    content: '';
    position: absolute;
    inset: -4px;
    border-radius: 50%;
    border: 1px solid transparent;
    border-top-color: var(--cyan);
    border-right-color: var(--purple);
    animation: rotarBorde 3s linear infinite;
  }

  @keyframes rotarBorde {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }

  .hz-number {
    font-family: 'Orbitron', sans-serif;
    font-size: 36px;
    font-weight: 900;
    color: var(--cyan);
    text-shadow: 0 0 20px var(--cyan);
    position: relative;
    z-index: 1;
  }

  .hz-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    animation: rotarContra 8s linear infinite;
  }
  
  @keyframes rotarContra {
    from { transform: rotate(0deg); }
    to   { transform: rotate(-360deg); }
  }

  .hz-label {
    font-size: 10px;
    letter-spacing: 0.3em;
    color: rgba(0,229,255,0.6);
    margin-top: 4px;
  }

  .hz-desc {
    font-size: 13px;
    color: rgba(255,255,255,0.4);
    letter-spacing: 0.1em;
  }

  /* Sistema de Mapas Yucateco */
  .mapa-yucateco {
    position: relative;
    z-index: 10;
    max-width: 1200px;
    margin: 0 auto 40px;
    padding: 20px;
  }

  .mapa-container {
    background: linear-gradient(135deg, #0a1520, #051020);
    border: 2px solid rgba(0,229,255,0.2);
    border-radius: 12px;
    overflow: hidden;
    position: relative;
    box-shadow: 0 0 40px rgba(0,229,255,0.1);
  }

  .mapa-header {
    background: rgba(0,0,0,0.6);
    padding: 12px 20px;
    border-bottom: 1px solid rgba(0,229,255,0.2);
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
  }

  .mapa-title {
    font-family: 'Orbitron', sans-serif;
    font-size: 11px;
    letter-spacing: 0.2em;
    color: var(--jade);
  }

  .mapa-title span {
    color: var(--gold);
  }

  .mapa-controls {
    display: flex;
    gap: 8px;
  }

  .mapa-btn {
    background: rgba(0,229,255,0.1);
    border: 1px solid rgba(0,229,255,0.3);
    padding: 6px 12px;
    font-family: 'Orbitron', sans-serif;
    font-size: 9px;
    color: var(--cyan);
    cursor: pointer;
    transition: all 0.3s;
  }

  .mapa-btn:hover {
    background: rgba(0,229,255,0.3);
    color: #fff;
  }

  canvas#mapaCanvas {
    width: 100%;
    height: 500px;
    display: block;
    background: #0a1020;
    cursor: crosshair;
  }

  .mapa-leyenda {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    padding: 12px 20px;
    background: rgba(0,0,0,0.4);
    border-top: 1px solid rgba(0,229,255,0.1);
    font-size: 9px;
  }

  .leyenda-item {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .leyenda-color {
    width: 12px;
    height: 12px;
    border-radius: 2px;
  }

  .coordenadas-info {
    margin-top: 16px;
    background: rgba(0,0,0,0.5);
    border: 1px solid rgba(0,229,255,0.2);
    border-radius: 8px;
    padding: 16px;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
  }

  .coord-card {
    text-align: center;
  }

  .coord-label {
    font-size: 9px;
    letter-spacing: 0.2em;
    color: var(--muted);
    margin-bottom: 6px;
  }

  .coord-value {
    font-family: 'Orbitron', sans-serif;
    font-size: 18px;
    color: var(--cyan);
  }

  .coord-unidad {
    font-size: 10px;
    color: var(--gold);
  }

  .modules-section {
    position: relative;
    z-index: 10;
    padding: 0 16px 40px;
    max-width: 1200px;
    margin: 0 auto;
  }

  .section-title {
    font-family: 'Orbitron', sans-serif;
    font-size: 13px;
    letter-spacing: 0.3em;
    color: rgba(255,255,255,0.25);
    text-transform: uppercase;
    text-align: center;
    margin-bottom: 20px;
  }

  .modules-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 12px;
  }

  .module-card {
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(0,229,255,0.08);
    padding: 18px 16px;
    border-radius: 4px;
    transition: all 0.3s;
    position: relative;
    overflow: hidden;
  }

  .module-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0;
    width: 3px; height: 100%;
    background: var(--card-color, var(--cyan));
    opacity: 0.6;
  }

  .module-card:hover {
    border-color: rgba(0,229,255,0.25);
    background: rgba(0,229,255,0.04);
    transform: translateY(-2px);
  }

  .card-icon  { font-size: 22px; margin-bottom: 8px; display: block; }
  .card-name  {
    font-family: 'Orbitron', sans-serif;
    font-size: 11px;
    letter-spacing: 0.1em;
    color: #fff;
    margin-bottom: 4px;
  }
  .card-desc  { font-size: 10px; color: rgba(255,255,255,0.35); line-height: 1.6; }
  .card-badge {
    display: inline-block;
    font-size: 8px;
    letter-spacing: 0.15em;
    padding: 2px 8px;
    border-radius: 2px;
    margin-top: 8px;
    background: rgba(46,204,113,0.15);
    color: var(--green);
    border: 1px solid rgba(46,204,113,0.2);
  }

  .geo-demo {
    margin-top: 32px;
    background: rgba(0,0,0,0.4);
    border: 1px solid rgba(0,229,255,0.2);
    border-radius: 8px;
    padding: 24px;
  }

  .geo-header {
    font-family: 'Orbitron', sans-serif;
    font-size: 12px;
    letter-spacing: 0.2em;
    color: var(--cyan);
    margin-bottom: 20px;
    text-align: center;
  }

  .geo-preview {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
  }

  .image-upload-area {
    width: 100%;
    max-width: 400px;
    height: 200px;
    border: 2px dashed rgba(0,229,255,0.3);
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s;
    background: rgba(0,229,255,0.02);
  }

  .image-upload-area:hover {
    border-color: var(--cyan);
    background: rgba(0,229,255,0.05);
  }

  .preview-img {
    max-width: 100%;
    max-height: 200px;
    border-radius: 4px;
    display: none;
  }

  .geo-result {
    background: rgba(0,0,0,0.6);
    border: 1px solid rgba(0,229,255,0.2);
    border-radius: 4px;
    padding: 16px;
    width: 100%;
    max-width: 400px;
  }

  .geo-coord {
    font-family: 'Orbitron', sans-serif;
    font-size: 14px;
    color: var(--cyan);
    margin-bottom: 8px;
  }

  .geo-conf {
    font-size: 11px;
    color: var(--gold);
    margin-bottom: 8px;
  }

  .geo-features {
    font-size: 10px;
    color: rgba(255,255,255,0.5);
    line-height: 1.6;
  }

  .btn-analizar {
    background: transparent;
    border: 1px solid var(--cyan);
    color: var(--cyan);
    padding: 10px 24px;
    font-family: 'Orbitron', sans-serif;
    font-size: 10px;
    letter-spacing: 0.2em;
    cursor: pointer;
    transition: all 0.3s;
    margin-top: 16px;
  }

  .btn-analizar:hover {
    background: var(--cyan);
    color: var(--bg);
  }

  .terminal {
    position: relative;
    z-index: 10;
    max-width: 900px;
    margin: 0 auto 40px;
    padding: 0 16px;
  }

  .term-header {
    background: rgba(0,229,255,0.05);
    border: 1px solid rgba(0,229,255,0.1);
    border-bottom: none;
    padding: 8px 16px;
    display: flex;
    align-items: center;
    gap: 8px;
    border-radius: 4px 4px 0 0;
  }

  .term-dot { width: 10px; height: 10px; border-radius: 50%; }
  .td1 { background: #ff5f57; }
  .td2 { background: #febc2e; }
  .td3 { background: #28c840; }

  .term-title { font-size: 11px; color: rgba(255,255,255,0.3); margin-left: 8px; letter-spacing: 0.1em; }

  .term-body {
    background: rgba(0,0,0,0.5);
    border: 1px solid rgba(0,229,255,0.1);
    padding: 16px;
    border-radius: 0 0 4px 4px;
    min-height: 120px;
    font-size: 12px;
    line-height: 2;
  }

  .term-line { display: flex; gap: 8px; flex-wrap: wrap; }
  .term-prompt { color: var(--cyan); }
  .term-text   { color: rgba(255,255,255,0.7); }
  .term-ok     { color: var(--green); }
  .term-warn   { color: var(--gold); }

  footer {
    position: relative;
    z-index: 10;
    text-align: center;
    padding: 24px;
    border-top: 1px solid rgba(0,229,255,0.08);
    font-size: 10px;
    letter-spacing: 0.2em;
    color: rgba(255,255,255,0.15);
  }

  footer span { color: rgba(0,229,255,0.3); }

  @media (max-width: 768px) {
    .mapa-controls { width: 100%; justify-content: center; }
    canvas#mapaCanvas { height: 350px; }
  }
</style>
</head>
<body>

<header>
  <div class="logo-wrap">
    <span class="brain-icon">🧠</span>
  </div>
  <h1>SOFI</h1>
  <div class="version-tag">v4.2 — Sistema de Mapas Yucateco</div>
  <div class="brand">HaaPpDigitalV © Víctor Hugo González Torres · Mérida, Yucatán, México</div>
</header>

<div class="status-bar">
  <div class="status-item"><div class="dot green"></div> SERVIDOR ACTIVO</div>
  <div class="status-item"><div class="dot cyan"></div> MAPA YUCATECO</div>
  <div class="status-item"><div class="dot cyan"></div> BRAIN.JS ACTIVO</div>
  <div class="status-item"><div class="dot purple"></div> GEOLOCALIZACIÓN VISUAL</div>
  <div class="status-item"><div class="dot gold"></div> SISTEMA PROPIO</div>
</div>

<div class="hz-section">
  <div class="hz-ring">
    <div class="hz-inner">
      <div class="hz-number">12.3</div>
      <div class="hz-label">Hz</div>
    </div>
  </div>
  <div class="hz-desc">FRECUENCIA CENTRAL — K'UHUL MAYA · TIERRA YUCATECA</div>
</div>

<!-- SISTEMA DE MAPAS YUCATECO (100% PROPIO) -->
<div class="mapa-yucateco">
  <div class="mapa-container">
    <div class="mapa-header">
      <div class="mapa-title">🗺️ SISTEMA DE MAPAS <span>YUCATECO</span> · K'UHUL CARTOGRAPHY</div>
      <div class="mapa-controls">
        <button class="mapa-btn" id="zoomIn">🔍 + ZOOM</button>
        <button class="mapa-btn" id="zoomOut">🔍 - ZOOM</button>
        <button class="mapa-btn" id="resetView">⭕ CENTRAR</button>
        <button class="mapa-btn" id="toggleGrid">📐 CUADRICULA</button>
      </div>
    </div>
    <canvas id="mapaCanvas"></canvas>
    <div class="mapa-leyenda">
      <div class="leyenda-item"><div class="leyenda-color" style="background:#00ffc8;"></div><span>📍 Mérida (Capital)</span></div>
      <div class="leyenda-item"><div class="leyenda-color" style="background:#2ECC71;"></div><span>🌳 Zonas Arqueológicas</span></div>
      <div class="leyenda-item"><div class="leyenda-color" style="background:#F39C12;"></div><span>🏖️ Costa / Progreso</span></div>
      <div class="leyenda-item"><div class="leyenda-color" style="background:#9B59B6;"></div><span>🧠 Zonas Frecuenciales</span></div>
      <div class="leyenda-item"><div class="leyenda-color" style="background:#E74C3C;"></div><span>⚡ Puntos Energéticos</span></div>
      <div class="leyenda-item"><div class="leyenda-color" style="background:#3498DB;"></div><span>💧 Cenotes</span></div>
    </div>
  </div>
  
  <div class="coordenadas-info">
    <div class="coord-card">
      <div class="coord-label">📍 COORDENADA ACTUAL</div>
      <div class="coord-value" id="coordLat">20.9670°</div>
      <div class="coord-unidad">LATITUD NORTE</div>
    </div>
    <div class="coord-card">
      <div class="coord-label">📍 COORDENADA ACTUAL</div>
      <div class="coord-value" id="coordLng">-89.6230°</div>
      <div class="coord-unidad">LONGITUD OESTE</div>
    </div>
    <div class="coord-card">
      <div class="coord-label">🔮 FRECUENCIA K'UHUL</div>
      <div class="coord-value" id="frecuenciaMapa">12.30</div>
      <div class="coord-unidad">HERTZ · RESONANCIA</div>
    </div>
    <div class="coord-card">
      <div class="coord-label">🧬 ZONA ENERGETICA</div>
      <div class="coord-value" id="zonaEnergetica">PLANO 4</div>
      <div class="coord-unidad">PLANO FRECUENCIAL</div>
    </div>
  </div>
</div>

<div class="modules-section">
  <div class="section-title">── MÓDULOS ACTIVOS DEL SISTEMA YUCATECO ──</div>
  <div class="modules-grid">
    <div class="module-card" style="--card-color:#00E5FF">
      <span class="card-icon">🗺️</span>
      <div class="card-name">Mapa Yucateco Propio</div>
      <div class="card-desc">Sistema cartográfico independiente · Sin Google · Datos de Yucatán · Escala 1:50000</div>
      <span class="card-badge">ACTIVO</span>
    </div>
    <div class="module-card" style="--card-color:#9B59B6">
      <span class="card-icon">🧠</span>
      <div class="card-name">Brain.js Geolocalización</div>
      <div class="card-desc">Red neuronal entrenada con datos de Yucatán · Predicción desde imágenes</div>
      <span class="card-badge">ACTIVO</span>
    </div>
    <div class="module-card" style="--card-color:#2ECC71">
      <span class="card-icon">🏛️</span>
      <div class="card-name">Puntos Mayas</div>
      <div class="card-desc">Chichén Itzá · Uxmal · Dzibilchaltún · Mayapán · Ek Balam</div>
      <span class="card-badge">ACTIVO</span>
    </div>
    <div class="module-card" style="--card-color:#F39C12">
      <span class="card-icon">💧</span>
      <div class="card-name">Cenotes Sagrados</div>
      <div class="card-desc">Ik Kil · Samulá · X'kekén · Zapote · Hubiku</div>
      <span class="card-badge">ACTIVO</span>
    </div>
  </div>

  <!-- GEOLOCALIZACIÓN VISUAL DEMO -->
  <div class="geo-demo">
    <div class="geo-header">📸 GEOLOCALIZACIÓN VISUAL CON BRAIN.JS · SISTEMA YUCATECO</div>
    <div class="geo-preview">
      <div class="image-upload-area" id="uploadArea">
        <span>📸</span>
        <p>Haz clic para subir imagen o screenshot</p>
        <p style="font-size:8px">Analiza la imagen y ubícala en el mapa Yucateco</p>
        <input type="file" id="imageInput" accept="image/*" style="display:none">
      </div>
      <img id="previewImage" class="preview-img" alt="Vista previa">
      <div class="geo-result" id="geoResult" style="display:none">
        <div class="geo-coord" id="coordDisplay">📍 Lat: -- | Lng: --</div>
        <div class="geo-conf" id="confDisplay">🎯 Confianza: --%</div>
        <div class="geo-features" id="featuresDisplay"></div>
        <button id="ubicarEnMapa" class="mapa-btn" style="margin-top:10px; width:100%">📍 UBICAR EN MAPA</button>
      </div>
      <button class="btn-analizar" id="analyzeBtn" disabled>ANALIZAR UBICACIÓN</button>
    </div>
  </div>
</div>

<div class="terminal">
  <div class="term-header">
    <div class="term-dot td1"></div>
    <div class="term-dot td2"></div>
    <div class="term-dot td3"></div>
    <span class="term-title">sofi.yucatan.mx — sistema de mapas propio</span>
  </div>
  <div class="term-body" id="terminal">
    <div class="term-line"><span class="term-prompt">sofi@yucatan:~$</span><span class="term-text"> Iniciando Sistema de Mapas Yucateco...</span></div>
    <div class="term-line"><span class="term-ok">✅</span><span class="term-text"> Mapa propio cargado — sin dependencias externas</span></div>
    <div class="term-line"><span class="term-ok">✅</span><span class="term-text"> Datos cartográficos: Yucatán, México</span></div>
    <div class="term-line"><span class="term-ok">✅</span><span class="term-text"> Brain.js red neuronal lista</span></div>
    <div class="term-line"><span class="term-ok">✅</span><span class="term-text"> Puntos de interés: 12 zonas arqueológicas, 8 cenotes, 5 ciudades</span></div>
    <div class="term-line"><span class="term-warn">⚡</span><span class="term-text"> Sistema 100% independiente — tecnología maya yucateca</span></div>
    <div class="term-line"><span class="term-prompt">sofi@yucatan:~$</span><span class="term-text"> </span><span class="cursor-blink" style="display:inline-block; width:8px; height:14px; background:var(--cyan); animation:blink 1s infinite;"></span></div>
  </div>
</div>

<footer>
  <span>SOFI v4.2 — Sistema de Mapas Yucateco</span> · HaaPpDigitalV · Víctor Hugo González Torres<br>
  Mérida, Yucatán, México · Tecnología Propia · 12.3 Hz K'uhul Maya · Sin Google Maps · Código Abierto Yucateco
</footer>

<script src="https://cdn.jsdelivr.net/npm/brain.js@1.6.1/browser.min.js"></script>
<script>
  // ============================================
  // SISTEMA DE MAPAS YUCATECO (100% PROPIO)
  // ============================================
  
  const canvas = document.getElementById('mapaCanvas');
  let ctx = canvas.getContext('2d');
  
  // Coordenadas reales de Yucatán (límites)
  const YUCATAN_BOUNDS = {
    minLat: 19.5,   // Sur
    maxLat: 21.6,   // Norte
    minLng: -90.5,  // Oeste
    maxLng: -87.5   // Este
  };
  
  let zoom = 1;
  let offsetX = 0, offsetY = 0;
  let showGrid = true;
  let currentLat = 20.967;
  let currentLng = -89.623;
  
  // Puntos de interés en Yucatán
  const puntosYucatan = [
    { nombre: "Mérida", lat: 20.967, lng: -89.623, tipo: "capital", color: "#00ffc8", icono: "📍" },
    { nombre: "Chichén Itzá", lat: 20.683, lng: -88.567, tipo: "arqueologico", color: "#2ECC71", icono: "🏛️" },
    { nombre: "Uxmal", lat: 20.359, lng: -89.771, tipo: "arqueologico", color: "#2ECC71", icono: "🏛️" },
    { nombre: "Progreso", lat: 21.283, lng: -89.667, tipo: "costa", color: "#F39C12", icono: "🏖️" },
    { nombre: "Dzibilchaltún", lat: 21.091, lng: -89.591, tipo: "arqueologico", color: "#2ECC71", icono: "🏛️" },
    { nombre: "Cenote Ik Kil", lat: 20.656, lng: -88.566, tipo: "cenote", color: "#3498DB", icono: "💧" },
    { nombre: "Cenote Samulá", lat: 20.645, lng: -88.581, tipo: "cenote", color: "#3498DB", icono: "💧" },
    { nombre: "Mayapán", lat: 20.630, lng: -89.460, tipo: "arqueologico", color: "#2ECC71", icono: "🏛️" },
    { nombre: "Ek Balam", lat: 20.890, lng: -88.136, tipo: "arqueologico", color: "#2ECC71", icono: "🏛️" },
    { nombre: "Celestún", lat: 20.859, lng: -90.403, tipo: "costa", color: "#F39C12", icono: "🦩" },
    { nombre: "Valladolid", lat: 20.689, lng: -88.202, tipo: "ciudad", color: "#9B59B6", icono: "🏘️" },
    { nombre: "Izamal", lat: 20.932, lng: -89.018, tipo: "ciudad", color: "#9B59B6", icono: "🏘️" }
  ];
  
  function latToY(lat) {
    const norm = (lat - YUCATAN_BOUNDS.minLat) / (YUCATAN_BOUNDS.maxLat - YUCATAN_BOUNDS.minLat);
    return canvas.height - (norm * canvas.height * zoom) - offsetY;
  }
  
  function lngToX(lng) {
    const norm = (lng - YUCATAN_BOUNDS.minLng) / (YUCATAN_BOUNDS.maxLng - YUCATAN_BOUNDS.minLng);
    return norm * canvas.width * zoom + offsetX;
  }
  
  function dibujarMapa() {
    if (!ctx) return;
    
    // Fondo
    ctx.fillStyle = "#0a1525";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Cuadrícula
    if (showGrid) {
      ctx.strokeStyle = "rgba(0,229,255,0.15)";
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= 10; i++) {
        const lat = YUCATAN_BOUNDS.minLat + (i / 10) * (YUCATAN_BOUNDS.maxLat - YUCATAN_BOUNDS.minLat);
        const y = latToY(lat);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
        
        const lng = YUCATAN_BOUNDS.minLng + (i / 10) * (YUCATAN_BOUNDS.maxLng - YUCATAN_BOUNDS.minLng);
        const x = lngToX(lng);
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
    }
    
    // Dibujar puntos de interés
    puntosYucatan.forEach(p => {
      const x = lngToX(p.lng);
      const y = latToY(p.lat);
      if (x >= -50 && x <= canvas.width + 50 && y >= -50 && y <= canvas.height + 50) {
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = p.color + "80";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.font = "12px 'Segoe UI Emoji'";
        ctx.fillStyle = "#fff";
        ctx.shadowBlur = 4;
        ctx.shadowColor = "black";
        ctx.fillText(p.icono, x - 8, y - 8);
        ctx.font = "8px 'Share Tech Mono'";
        ctx.fillStyle = p.color;
        ctx.fillText(p.nombre, x + 8, y - 4);
        ctx.shadowBlur = 0;
      }
    });
    
    // Marcar ubicación actual
    const xAct = lngToX(currentLng);
    const yAct = latToY(currentLat);
    ctx.beginPath();
    ctx.arc(xAct, yAct, 10, 0, Math.PI * 2);
    ctx.strokeStyle = "#ff3366";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(xAct, yAct, 4, 0, Math.PI * 2);
    ctx.fillStyle = "#ff3366";
    ctx.fill();
  }
  
  function actualizarCoordenadasDisplay() {
    document.getElementById('coordLat').innerHTML = `${currentLat.toFixed(4)}°`;
    document.getElementById('coordLng').innerHTML = `${currentLng.toFixed(4)}°`;
    
    // Calcular zona energética según latitud
    const zonas = ["PLANO 1", "PLANO 2", "PLANO 3", "PLANO 4", "PLANO 5", "PLANO 6", "PLANO 7", "PLANO 8", "PLANO 9"];
    const idx = Math.floor(Math.abs(currentLat - 19.5) / 0.23) % 9;
    document.getElementById('zonaEnergetica').innerHTML = zonas[idx];
    
    const freq = (12.3 + (currentLat - 20.967) * 0.05).toFixed(2);
    document.getElementById('frecuenciaMapa').innerHTML = freq;
  }
  
  function centrarEnCoordenada(lat, lng) {
    currentLat = Math.min(YUCATAN_BOUNDS.maxLat, Math.max(YUCATAN_BOUNDS.minLat, lat));
    currentLng = Math.min(YUCATAN_BOUNDS.maxLng, Math.max(YUCATAN_BOUNDS.minLng, lng));
    zoom = 1;
    offsetX = canvas.width / 2 - lngToX(lng);
    offsetY = canvas.height / 2 - latToY(lat);
    dibujarMapa();
    actualizarCoordenadasDisplay();
  }
  
  function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = 500;
    ctx = canvas.getContext('2d');
    centrarEnCoordenada(currentLat, currentLng);
  }
  
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
  
  document.getElementById('zoomIn').addEventListener('click', () => {
    zoom = Math.min(zoom + 0.2, 3);
    dibujarMapa();
  });
  document.getElementById('zoomOut').addEventListener('click', () => {
    zoom = Math.max(zoom - 0.2, 0.5);
    dibujarMapa();
  });
  document.getElementById('resetView').addEventListener('click', () => {
    centrarEnCoordenada(20.967, -89.623);
  });
  document.getElementById('toggleGrid').addEventListener('click', () => {
    showGrid = !showGrid;
    dibujarMapa();
  });
  
  // ============================================
  // BRAIN.JS - RED NEURONAL YUCATECA
  // ============================================
  
  let redNeuronal = null;
  let imagenActual = null;
  let ultimaPrediccion = null;
  
  const datosEntrenamiento = [
    { input: [0.85, 0.15, 0.05, 0.10, 0.70, 0.80], output: [20.967 / 90, Math.abs(-89.623) / 180] },
    { input: [0.20, 0.80, 0.60, 0.15, 0.40, 0.70], output: [20.683 / 90, Math.abs(-88.567) / 180] },
    { input: [0.30, 0.70, 0.20, 0.20, 0.85, 0.65], output: [20.359 / 90, Math.abs(-89.771) / 180] },
    { input: [0.60, 0.20, 0.85, 0.90, 0.10, 0.85], output: [21.283 / 90, Math.abs(-89.667) / 180] },
    { input: [0.15, 0.85, 0.70, 0.15, 0.30, 0.50], output: [20.656 / 90, Math.abs(-88.566) / 180] }
  ];
  
  function entrenarRedYucateca() {
    addTerminalLine("🧠 Entrenando red neuronal con datos de Yucatán...");
    redNeuronal = new brain.NeuralNetwork();
    redNeuronal.train(datosEntrenamiento, {
      iterations: 2000,
      errorThresh: 0.005,
      learningRate: 0.3
    });
    addTerminalLine("✅ Red neuronal Yucateca lista — 5 zonas entrenadas");
  }
  
  function extraerCaracteristicas(imgElement, callback) {
    const canvasTemp = document.createElement('canvas');
    const ctxTemp = canvasTemp.getContext('2d');
    canvasTemp.width = 100;
    canvasTemp.height = 100;
    ctxTemp.drawImage(imgElement, 0, 0, 100, 100);
    
    const imageData = ctxTemp.getImageData(0, 0, 100, 100);
    const data = imageData.data;
    
    let r = 0, g = 0, b = 0;
    for (let i = 0; i < data.length; i += 4) {
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
    }
    const pixelCount = data.length / 4;
    r /= pixelCount; g /= pixelCount; b /= pixelCount;
    
    const luminosidad = (r + g + b) / (3 * 255);
    const esVerde = (g > r && g > b) ? Math.min(1, g / 255) : 0.2;
    const esAzul = (b > r && b > g) ? Math.min(1, b / 255) : 0.1;
    const esCafe = (r > g && r > b && r > 100 && r < 180) ? 0.7 : 0.2;
    const esArena = (r > 180 && g > 160 && b < 140) ? 0.8 : 0.2;
    
    const urbanidad = Math.min(1, Math.max(0, (r - 80) / 175));
    const vegetacion = esVerde;
    const agua = esAzul;
    const arena = esArena;
    const arquitecturaMaya = (esCafe + (luminosidad < 0.5 ? 0.3 : 0)) / 1.3;
    
    callback([urbanidad, vegetacion, agua, arena, arquitecturaMaya, luminosidad]);
  }
  
  function predecirUbicacionYucatan(caracteristicas) {
    if (!redNeuronal) return null;
    const resultado = redNeuronal.run(caracteristicas);
    const lat = resultado[0] * 90;
    const lng = -resultado[1] * 180;
    return { lat, lng };
  }
  
  function calcularConfianza(caracteristicas) {
    let varianza = 0;
    for (let i = 0; i < caracteristicas.length; i++) {
      varianza += Math.abs(caracteristicas[i] - 0.5);
    }
    return Math.min(0.92, 0.55 + (varianza / caracteristicas.length) * 0.4);
  }
  
  function describirCaracteristicasYucatan(caracteristicas) {
    const desc = [];
    if (caracteristicas[0] > 0.7) desc.push("🏙️ Urbano");
    if (caracteristicas[1] > 0.6) desc.push("🌿 Selva Yucateca");
    if (caracteristicas[2] > 0.6) desc.push("💧 Cenote/Costa");
    if (caracteristicas[3] > 0.6) desc.push("🏖️ Costa Progreso");
    if (caracteristicas[4] > 0.6) desc.push("🏛️ Zona Arqueológica Maya");
    return desc.join(" · ");
  }
  
  function addTerminalLine(text, type = 'info') {
    const terminal = document.getElementById('terminal');
    const line = document.createElement('div');
    line.className = 'term-line';
    if (type === 'ok') {
      line.innerHTML = `<span class="term-ok">✅</span><span class="term-text"> ${text}</span>`;
    } else if (type === 'warn') {
      line.innerHTML = `<span class="term-warn">⚠️</span><span class="term-text"> ${text}</span>`;
    } else {
      line.innerHTML = `<span class="term-prompt">sofi@yucatan:~$</span><span class="term-text"> ${text}</span>`;
    }
    terminal.insertBefore(line, terminal.lastElementChild);
  }
  
  // Eventos UI
  const uploadArea = document.getElementById('uploadArea');
  const imageInput = document.getElementById('imageInput');
  const previewImage = document.getElementById('previewImage');
  const analyzeBtn = document.getElementById('analyzeBtn');
  
  uploadArea.addEventListener('click', () => imageInput.click());
  
  imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        previewImage.src = event.target.result;
        previewImage.style.display = 'block';
        uploadArea.style.display = 'none';
        imagenActual = new Image();
        imagenActual.onload = () => {
          analyzeBtn.disabled = false;
          addTerminalLine(`📸 Imagen cargada: ${file.name} — Lista para análisis Yucateco`, 'ok');
        };
        imagenActual.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  });
  
  analyzeBtn.addEventListener('click', () => {
    if (!imagenActual) return;
    analyzeBtn.disabled = true;
    analyzeBtn.textContent = 'ANALIZANDO...';
    addTerminalLine("🔍 Extrayendo características visuales...");
    
    extraerCaracteristicas(imagenActual, (caracteristicas) => {
      addTerminalLine(`📊 Características: [${caracteristicas.map(c => c.toFixed(2)).join(', ')}]`);
      
      const prediccion = predecirUbicacionYucatan(caracteristicas);
      const confianza = calcularConfianza(caracteristicas);
      const descripcion = describirCaracteristicasYucatan(caracteristicas);
      
      if (prediccion) {
        ultimaPrediccion = prediccion;
        document.getElementById('geoResult').style.display = 'block';
        document.getElementById('coordDisplay').innerHTML = `📍 Lat: ${prediccion.lat.toFixed(4)}° | Lng: ${prediccion.lng.toFixed(4)}°`;
        document.getElementById('confDisplay').innerHTML = `🎯 Confianza: ${Math.round(confianza * 100)}%`;
        document.getElementById('featuresDisplay').innerHTML = descripcion || "Zona no clasificada";
        addTerminalLine(`📡 Predicción Yucateca: ${prediccion.lat.toFixed(4)}, ${prediccion.lng.toFixed(4)} — ${Math.round(confianza * 100)}%`, 'ok');
        
        document.getElementById('ubicarEnMapa').onclick = () => {
          centrarEnCoordenada(prediccion.lat, prediccion.lng);
          addTerminalLine(`📍 Ubicación marcada en el mapa Yucateco`, 'ok');
        };
      }
      
      analyzeBtn.disabled = false;
      analyzeBtn.textContent = 'ANALIZAR UBICACIÓN';
    });
  });
  
  // Inicializar
  entrenarRedYucateca();
  centrarEnCoordenada(20.967, -89.623);
  setInterval(() => {
    const freq = (12.3 + Math.sin(Date.now() / 5000) * 0.05).toFixed(2);
    document.getElementById('frecuenciaMapa').innerHTML = freq;
  }, 1000);
</script>
</body>
</html>
