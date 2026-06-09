// REEMPLAZA ESTA URL CON LA QUE TE DIO GOOGLE APPS SCRIPT
const URL_APPS_SCRIPT = "https://script.google.com/macros/s/AKfycbxcvVI9t-vJ1lWSYdpH1MZipbICY3S2WC0Qxat7mm9v65lzqv6F2x5GPvu-rw5TmtK91g/exec";

// Variables globales para guardar la instancia de los gráficos y no se dupliquen
let chartTransaccionesInstance = null;
let chartMetodoPagoInstance = null;

// Función principal que se ejecuta al cargar la página
async function cargarDatos() {
    try {
        // Obtenemos los datos (GET)
        const response = await fetch(URL_APPS_SCRIPT);
        const data = await response.json();
        
        procesarKPIs(data);
        renderizarGraficos(data);

    } catch (error) {
        console.error("Error al cargar los datos:", error);
        alert("Hubo un problema al cargar el dashboard. Revisa la consola.");
    }
}

// Procesar los datos para las tarjetas superiores (Insights)
function procesarKPIs(data) {
    let totalIngresos = 0;
    let totalGastos = 0;

    data.forEach(fila => {
        // Convertimos el monto a número por si viene como texto
        const monto = parseFloat(fila["Monto Total"]) || 0; 
        const tipoTransaccion = fila["Transacción"];

        // Lógica simple: Ventas y Servicios suman ingresos; Gastos y Compras suman egresos
        if (tipoTransaccion === "Venta" || tipoTransaccion === "Servicio") {
            totalIngresos += monto;
        } else if (tipoTransaccion === "Gastos" || tipoTransaccion === "Compra") {
            totalGastos += monto;
        }
    });

    const balance = totalIngresos - totalGastos;

    // Actualizamos el HTML
    document.getElementById('kpi-ingresos').textContent = `C$ ${totalIngresos.toLocaleString('es-NI', {minimumFractionDigits: 2})}`;
    document.getElementById('kpi-gastos').textContent = `C$ ${totalGastos.toLocaleString('es-NI', {minimumFractionDigits: 2})}`;
    document.getElementById('kpi-balance').textContent = `C$ ${balance.toLocaleString('es-NI', {minimumFractionDigits: 2})}`;
    document.getElementById('kpi-transacciones').textContent = data.length;
}

// Dibujar los gráficos con Chart.js
function renderizarGraficos(data) {
    // 1. Preparar datos para Gráfico de Transacciones
    const conteoTransacciones = {};
    const conteoMetodoPago = {};

    data.forEach(fila => {
        const transaccion = fila["Transacción"] || "Sin definir";
        const metodoPago = fila["Con que se Pagó?"] || "Sin definir";

        // Agrupar por Transacción
        if(conteoTransacciones[transaccion]) {
            conteoTransacciones[transaccion]++;
        } else {
            conteoTransacciones[transaccion] = 1;
        }

        // Agrupar por Método de Pago
        if(conteoMetodoPago[metodoPago]) {
            conteoMetodoPago[metodoPago]++;
        } else {
            conteoMetodoPago[metodoPago] = 1;
        }
    });

    // Destruir gráficos anteriores si existen (por si se recarga la función)
    if (chartTransaccionesInstance) chartTransaccionesInstance.destroy();
    if (chartMetodoPagoInstance) chartMetodoPagoInstance.destroy();

    // -- DIBUJAR GRÁFICO 1 (Barras) --
    const ctxTransacciones = document.getElementById('chartTransacciones').getContext('2d');
    chartTransaccionesInstance = new Chart(ctxTransacciones, {
        type: 'bar',
        data: {
            labels: Object.keys(conteoTransacciones),
            datasets: [{
                label: 'Cantidad de Operaciones',
                data: Object.values(conteoTransacciones),
                backgroundColor: 'rgba(52, 152, 219, 0.6)',
                borderColor: 'rgba(41, 128, 185, 1)',
                borderWidth: 1
            }]
        },
        options: { responsive: true }
    });

    // -- DIBUJAR GRÁFICO 2 (Dona) --
    const ctxMetodo = document.getElementById('chartMetodoPago').getContext('2d');
    chartMetodoPagoInstance = new Chart(ctxMetodo, {
        type: 'doughnut',
        data: {
            labels: Object.keys(conteoMetodoPago),
            datasets: [{
                data: Object.values(conteoMetodoPago),
                backgroundColor: [
                    'rgba(46, 204, 113, 0.6)', // Verde
                    'rgba(155, 89, 182, 0.6)', // Morado
                    'rgba(241, 196, 15, 0.6)'  // Amarillo
                ],
                borderWidth: 1
            }]
        },
        options: { responsive: true }
    });
}

// Ejecutar todo cuando el documento esté listo
document.addEventListener('DOMContentLoaded', cargarDatos);