const express = require('express');
const axios = require('axios'); // ✅ AXIOS FUNCIONANDO
const app = express();
const PORT = 3000;

// ✅✅✅ ASÍ COMO ME DIJISTE ✅✅✅
const sistema = require('./sistema_monetario_conta_do_codigo');

// 🟢 AQUÍ ESTÁ LA VARIABLE DE ENTORNO
// ESTA APUNTANDO AL BANCO QUE ESTÁ EN PYTHON
const URL_BANCO_PRINCIPAL = "http://localhost:5000"; 

app.use(express.json());

// =============================================
// FUNCIÓN PARA MANDAR AL BANCO (PYTHON)
// =============================================
async function enviarAlBanco(ruta, datos) {
    try {
        const respuesta = await axios.post(`${URL_BANCO_PRINCIPAL}/${ruta}`, datos);
        console.log(`✅ Enviado al Banco:`, respuesta.data);
    } catch (error) {
        console.error(`❌ Error al conectar con Python:`, error.message);
    }
}

// =============================================
// MINERÍA
// =============================================
function generarMonedas() {
    setInterval(() => {
        const ganancia = (Math.random() * 0.1).toFixed(4);
        
        console.log(`⛏️ Minado: +${ganancia} monedas`);

        // 🟢 ENVIAR DIRECTO AL PYTHON
        enviarAlBanco('recibir-mineria', {
            usuario: "minero",
            cantidad: parseFloat(ganancia)
        });

    }, 3000);
}

// =============================================
// INICIAR
// =============================================
app.listen(PORT, () => {
    console.log(`🚀 Servidor Node (Minero) corriendo puerto ${PORT}`);
    console.log(`🏦 Conectado al Banco Python: ${URL_BANCO_PRINCIPAL}`);
    generarMonedas();
});
