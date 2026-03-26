<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SOFI v4.1 — HaaPpDigitalV</title>
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Share+Tech+Mono&display=swap" rel="stylesheet">
<style>
  :root {
    --cyan:   #00E5FF;
    --purple: #9B59B6;
    --green:  #2ECC71;
    --gold:   #F39C12;
    --red:    #E74C3C;
    --bg:     #050510;
    --bg2:    #0a0a1a;
    --text:   rgba(255,255,255,0.85);
  }

  * { margin:0; padding:0; box-sizing:border-box; }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: 'Share Tech Mono', monospace;
    min-height: 100vh;
    overflow-x: hidden;
  }

  /* FONDO ANIMADO */
  body::before {
    content: '';
    position: fixed;
    inset: 0;
    background:
      radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,229,255,0.05) 0%, transparent 60%),
      radial-gradient(ellipse 50% 40% at 80% 80%, rgba(155,89,182,0.06) 0%, transparent 50%);
    pointer-events: none;
    z-index: 0;
  }

  /* GRID LINES */
  body::after {
    content: '';
    position: fixed;
    inset: 0;
    background-image:
      linear-gradient(rgba(0,229,255,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,229,255,0.03) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
    z-index: 0;
  }

  /* ── HEADER ── */
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

  /* ── STATUS BAR ── */
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

  @keyframes blink {
    0%,100% { opacity: 1; }
    50%      { opacity: 0.3; }
  }

  /* ── HZ DISPLAY ── */
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
    box-shadow:
      0 0 30px rgba(0,229,255,0.1),
      inset 0 0 30px rgba(0,229,255,0.05);
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
    animation: rotarBorde 0s; /* cancel inherited */
    transform: rotate(0deg);
    position: relative;
    z-index: 1;
  }

  /* fix: el contenido dentro no debe rotar */
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

  /* ── MÓDULOS GRID ── */
  .modules-section {
    position: relative;
    z-index: 10;
    padding: 0 16px 40px;
    max-width: 900px;
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
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
  }

  .module-card {
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(0,229,255,0.08);
    padding: 18px 16px;
    border-radius: 4px;
    transition: border-color 0.3s, background 0.3s;
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

  /* ── TERMINAL LIVE ── */
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

  .term-line { display: flex; gap: 8px; }
  .term-prompt { color: var(--cyan); }
  .term-text   { color: rgba(255,255,255,0.7); }
  .term-ok     { color: var(--green); }
  .term-warn   { color: var(--gold); }
  .cursor-blink {
    display: inline-block;
    width: 8px; height: 14px;
    background: var(--cyan);
    animation: blink 1s infinite;
    vertical-align: middle;
  }

  /* ── FOOTER ── */
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
</style>
</head>
<body>

<!-- HEADER -->
<header>
  <div class="logo-wrap">
    <span class="brain-icon">🧠</span>
  </div>
  <h1>SOFI</h1>
  <div class="version-tag">v4.1 — Sistema Operativo de Funciones Inteligentes</div>
  <div class="brand">HaaPpDigitalV © Víctor Hugo González Torres · Mérida, Yucatán</div>
</header>

<!-- STATUS BAR -->
<div class="status-bar">
  <div class="status-item"><div class="dot green"></div> SERVIDOR ACTIVO</div>
  <div class="status-item"><div class="dot cyan"></div> INTEGRA PERCEPTIVA</div>
  <div class="status-item"><div class="dot cyan"></div> MOTOR COGNITIVO</div>
  <div class="status-item"><div class="dot purple"></div> BRAIN.JS ENTRENADO</div>
  <div class="status-item"><div class="dot purple"></div> WEBSOCKETS</div>
</div>

<!-- HZ CENTRAL -->
<div class="hz-section">
  <div class="hz-ring">
    <div class="hz-inner">
      <div class="hz-number">12.3</div>
      <div class="hz-label">Hz</div>
    </div>
  </div>
  <div class="hz-desc">FRECUENCIA CENTRAL — K'UHUL MAYA</div>
</div>

<!-- MÓDULOS -->
<div class="modules-section">
  <div class="section-title">── Módulos Activos ──</div>
  <div class="modules-grid">

    <div class="module-card" style="--card-color:#00E5FF">
      <span class="card-icon">🧠</span>
      <div class="card-name">Motor Cognitivo</div>
      <div class="card-desc">5 niveles: reflejo · rutina · análisis · razonamiento · profundo</div>
      <span class="card-badge">ACTIVO</span>
    </div>

    <div class="module-card" style="--card-color:#9B59B6">
      <span class="card-icon">🫀</span>
      <div class="card-name">Integra Perceptiva</div>
      <div class="card-desc">7 perfiles neurológicos · 12.3 Hz · adaptación sensorial</div>
      <span class="card-badge">ACTIVO</span>
    </div>

    <div class="module-card" style="--card-color:#2ECC71">
      <span class="card-icon">🌐</span>
      <div class="card-name">Grafo Cerebral 3D</div>
      <div class="card-desc">Mapa neuronal en tiempo real · WebSockets · Three.js</div>
      <span class="card-badge">ACTIVO</span>
    </div>

    <div class="module-card" style="--card-color:#F39C12">
      <span class="card-icon">⚡</span>
      <div class="card-name">Contraparte Frecuencial</div>
      <div class="card-desc">Escaneo biométrico · evolución · historial de sesiones</div>
      <span class="card-badge">ACTIVO</span>
    </div>

    <div class="module-card" style="--card-color:#E74C3C">
      <span class="card-icon">🤖</span>
      <div class="card-name">Brain.js</div>
      <div class="card-desc">Red neuronal entrenada · datos Hotmart · predicción</div>
      <span class="card-badge">ACTIVO</span>
    </div>

    <div class="module-card" style="--card-color:#00E5FF">
      <span class="card-icon">🌙</span>
      <div class="card-name">Sistema Sueños</div>
      <div class="card-desc">Detección Theta/Delta · registro · análisis de patrones</div>
      <span class="card-badge">ACTIVO</span>
    </div>

    <div class="module-card" style="--card-color:#9B59B6">
      <span class="card-icon">🎬</span>
      <div class="card-name">Editor Video</div>
      <div class="card-desc">Generación de guiones · preview · gestión de contenido</div>
      <span class="card-badge">ACTIVO</span>
    </div>

    <div class="module-card" style="--card-color:#2ECC71">
      <span class="card-icon">🔒</span>
      <div class="card-name">Seguridad</div>
      <div class="card-desc">API Key · middleware · acceso protegido · 30 rutas</div>
      <span class="card-badge">ACTIVO</span>
    </div>

  </div>
</div>

<!-- TERMINAL -->
<div class="terminal">
  <div class="term-header">
    <div class="term-dot td1"></div>
    <div class="term-dot td2"></div>
    <div class="term-dot td3"></div>
    <span class="term-title">sofi-mcpp.onrender.com — terminal</span>
  </div>
  <div class="term-body" id="terminal">
    <div class="term-line"><span class="term-prompt">sofi@haapp:~$</span><span class="term-text"> iniciando sistema...</span></div>
    <div class="term-line"><span class="term-ok">✅</span><span class="term-text"> SOFI v4.1 UNIFICADO — cargado</span></div>
    <div class="term-line"><span class="term-ok">✅</span><span class="term-text"> Integra Perceptiva — 12.3 Hz estable</span></div>
    <div class="term-line"><span class="term-ok">✅</span><span class="term-text"> Brain.js — red neuronal lista</span></div>
    <div class="term-line"><span class="term-ok">✅</span><span class="term-text"> WebSockets — escuchando conexiones</span></div>
    <div class="term-line"><span class="term-warn">⚡</span><span class="term-text"> HaaPpDigitalV © Mérida, Yucatán — DroidHuman Project</span></div>
    <div class="term-line"><span class="term-prompt">sofi@haapp:~$</span><span class="term-text"> </span><span class="cursor-blink"></span></div>
  </div>
</div>

<!-- FOOTER -->
<footer>
  <span>SOFI v4.1</span> · HaaPpDigitalV · Víctor Hugo González Torres<br>
  Mérida, Yucatán, México · Protegido INDAUTOR · OpenTimestamps
</footer>

<script>
  // Ping al /health y mostrar status real
  fetch('/health')
    .then(r => r.json())
    .then(data => {
      const term = document.getElementById('terminal');
      const line = document.createElement('div');
      line.className = 'term-line';
      line.innerHTML = `<span class="term-ok">🟢</span><span class="term-text"> HEALTH CHECK OK — ${data.timestamp || new Date().toISOString()}</span>`;
      term.insertBefore(line, term.lastElementChild);
    })
    .catch(() => {});
</script>
</body>
</html>
