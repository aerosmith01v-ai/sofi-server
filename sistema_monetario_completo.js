# ============================================================
# CÓDIGO 2 — BANCO PRINCIPAL PYTHON (FLASK)
# Banco único. Recibe minería del Node.js y gestiona todo.
# ============================================================

import threading
import json
import urllib.request
import time
from flask import Flask, request, jsonify
from market_engine import MarketEngine
from bot_frecuencia import BotFrecuencias
from config import NOMBRE_BANCO, NOMBRE_MONEDA

app = Flask(__name__)

# ============================================================
# BANCO INTERNO — dict en memoria (reemplaza con DB si quieres)
# ============================================================
cuentas_banco = {}
lock_banco = threading.Lock()

def depositar(usuario: str, cantidad: float) -> float:
    """Deposita y devuelve el nuevo saldo."""
    with lock_banco:
        cuentas_banco[usuario] = cuentas_banco.get(usuario, 0.0) + cantidad
        return cuentas_banco[usuario]

def obtener_saldo(usuario: str) -> float:
    with lock_banco:
        return cuentas_banco.get(usuario, 0.0)

def obtener_todos_saldos() -> dict:
    with lock_banco:
        return dict(cuentas_banco)

# ============================================================
# ENDPOINTS GENERALES
# ============================================================
@app.route('/')
def home():
    return jsonify({
        "banco"      : NOMBRE_BANCO,
        "moneda"     : NOMBRE_MONEDA,
        "estado"     : "activo",
        "frecuencias": "12.3 Hz",
        "cuentas"    : len(obtener_todos_saldos())
    })

@app.route('/ping', methods=['GET'])
def ping():
    return jsonify({"status": "ok", "ts": time.time()})

# ============================================================
# ENDPOINTS DE MERCADO
# ============================================================
@app.route('/orden', methods=['POST'])
def crear_orden():
    data = request.json
    res  = MarketEngine.crear_orden(
        data['usuario'], data['tipo'], data['precio'], data['cantidad']
    )
    return jsonify(res)

@app.route('/orden/<int:id>', methods=['DELETE'])
def cancelar_orden(id):
    return jsonify(MarketEngine.cancelar_orden(id))

@app.route('/libro', methods=['GET'])
def libro():
    return jsonify(MarketEngine.obtener_libro_ordenes())

@app.route('/matching', methods=['POST'])
def ejecutar_matching():
    MarketEngine.ejecutar_matching()
    return jsonify({"exito": True})

# ============================================================
# ENDPOINT 1 — RECIBIR MINERÍA DEL NODE.JS
# ============================================================
@app.route('/recibir-mineria', methods=['POST'])
def recibir_mineria():
    """
    Recibe cada lote minado por el Código 1 (Node.js)
    y lo deposita directamente en el banco.
    """
    try:
        data     = request.json or {}
        cantidad = float(data.get('cantidad', 0))
        usuario  = str(data.get('usuario', 'minero'))
        ts       = data.get('timestamp', time.time())

        if cantidad <= 0:
            return jsonify({"exito": False, "error": "Cantidad inválida"}), 400

        nuevo_saldo = depositar(usuario, cantidad)

        print(f"⛏️  Minería recibida | +{cantidad:.6f} para '{usuario}' | Saldo: {nuevo_saldo:.6f}")

        return jsonify({
            "exito"      : True,
            "accion"     : "mineria_depositada",
            "usuario"    : usuario,
            "cantidad"   : cantidad,
            "saldo_total": nuevo_saldo,
            "timestamp"  : ts
        })

    except Exception as e:
        print(f"❌ Error en recibir_mineria: {e}")
        return jsonify({"exito": False, "error": str(e)}), 500

# ============================================================
# ENDPOINT 2 — TRANSFERENCIA TOTAL (saldo histórico del Node)
# ============================================================
@app.route('/transferencia-total', methods=['POST'])
def transferencia_total():
    """
    Recibe el saldo completo acumulado en el banco viejo (Node.js)
    al momento del arranque. Solo debería llamarse una vez.
    """
    try:
        data           = request.json or {}
        saldo_anterior = float(data.get('saldo_total', 0))
        usuario        = str(data.get('usuario', 'sistema'))

        if saldo_anterior < 0:
            return jsonify({"exito": False, "error": "Saldo negativo no permitido"}), 400

        nuevo_saldo = depositar(usuario, saldo_anterior)

        print(f"🏦 Transferencia total recibida | +{saldo_anterior} para '{usuario}' | Saldo: {nuevo_saldo}")

        return jsonify({
            "exito"         : True,
            "accion"        : "transferencia_total_completada",
            "usuario"       : usuario,
            "saldo_recibido": saldo_anterior,
            "saldo_total"   : nuevo_saldo,
            "mensaje"       : "Banco viejo vaciado — fondos en banco principal"
        })

    except Exception as e:
        print(f"❌ Error en transferencia_total: {e}")
        return jsonify({"exito": False, "error": str(e)}), 500

# ============================================================
# ENDPOINT 3 — CONSULTAR SALDO
# ============================================================
@app.route('/saldo/<usuario>', methods=['GET'])
def consultar_saldo(usuario):
    return jsonify({
        "usuario": usuario,
        "saldo"  : obtener_saldo(usuario),
        "moneda" : NOMBRE_MONEDA
    })

@app.route('/saldos', methods=['GET'])
def consultar_todos():
    return jsonify({
        "banco" : NOMBRE_BANCO,
        "saldos": obtener_todos_saldos()
    })

# ============================================================
# PRECIO KRAKEN
# ============================================================
def obtener_precio_kraken():
    url = "https://api.kraken.com/0/public/Ticker?pair=XXBTZUSD"
    try:
        with urllib.request.urlopen(url, timeout=5) as response:
            data = json.loads(response.read().decode())
            return float(data['result']['XXBTZUSD']['c'][0])
    except Exception as e:
        print(f"❌ Error al obtener precio Kraken: {e}")
        return None

# ============================================================
# HILOS DE FONDO
# ============================================================
def iniciar_bot():
    bot = BotFrecuencias(obtener_precio_kraken)
    bot.iniciar()

def matching_loop():
    while True:
        MarketEngine.ejecutar_matching()
        time.sleep(5)

# ============================================================
# ARRANQUE
# ============================================================
if __name__ == '__main__':
    print(f"🏦 Iniciando banco: {NOMBRE_BANCO} | Moneda: {NOMBRE_MONEDA}")

    threading.Thread(target=iniciar_bot,    daemon=True).start()
    threading.Thread(target=matching_loop,  daemon=True).start()

    app.run(host='0.0.0.0', port=5000, debug=False)
