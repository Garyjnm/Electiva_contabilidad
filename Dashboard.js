// REEMPLAZA ESTA URL CON LA QUE TE DIO GOOGLE APPS SCRIPT
const URL_APPS_SCRIPT = "https://script.google.com/macros/s/AKfycbxcvVI9t-vJ1lWSYdpH1MZipbICY3S2WC0Qxat7mm9v65lzqv6F2x5GPvu-rw5TmtK91g/exec";

// Paleta de colores exacta de tu diseño CSS
const COLORES_BARRAS = {
    'Gastos': '#FF6584',
    'Servicio': '#E8834A',
    'Compra': '#5B8FD4',
    'Venta': '#2EB88A',
    'Sin definir': '#888898'
};

const COLORES_DONA = {
    'Proveedores': '#6C63FF',
    'Bancos': '#2EB88A',
    'Sin definir': '#888898'
};

let barChartInstance = null;
let donutChartInstance = null;

// Estilos globales de Chart.js para acoplarse al Dark Mode
Chart.defaults.font.family = "'Inter', system-ui, sans-serif";
Chart.defaults.color = '#9191A8';

async function cargarDatos() {
    try {
        const response = await fetch(URL_APPS_SCRIPT);
        const data = await response.json();
        
        procesarKPIs(data);
        renderizarGraficos(data);

    } catch (error) {
        console.error("Error al cargar los datos:", error);
    }
}

function procesarKPIs(data) {
    let ingresos = 0;
    let gastos = 0;
    let sumaTotalMontos = 0;

    data.forEach(fila => {
        const monto = parseFloat(fila["Monto Total"]) || 0; 
        const tipoTransaccion = fila["Transacción"] || "";

        sumaTotalMontos += monto;

        if (tipoTransaccion === "Venta" || tipoTransaccion === "Servicio") {
            ingresos += monto;
        } else if (tipoTransaccion === "Gastos" || tipoTransaccion === "Compra") {
            gastos += monto;
        }
    });

    const balance = ingresos - gastos;
    const formatMoneda = (val) => val.toLocaleString('es-NI', {minimumFractionDigits: 2, maximumFractionDigits: 2});

    // Actualizar Tarjetas KPI Principales
    document.getElementById('kpi-ingresos').textContent = `C$ ${formatMoneda(ingresos)}`;
    document.getElementById('kpi-gastos').textContent = `C$ ${formatMoneda(gastos)}`;
    document.getElementById('kpi-balance').textContent = `C$ ${formatMoneda(balance)}`;
    document.getElementById('kpi-transacciones').textContent = data.length;
    
    // Textos de apoyo en gráficos
    document.getElementById('lbl-total-ops-barras').textContent = `${data.length} operaciones en total`;
    document.getElementById('donut-center-val').textContent = data.length;

    // Calcular promedios para la tarjeta resumen inferior
    const promedioOp = data.length > 0 ? (sumaTotalMontos / data.length) : 0;
    document.getElementById('sum-promedio').textContent = `C$ ${promedioOp.toLocaleString('es-NI', {maximumFractionDigits: 0})}`;
}

function renderizarGraficos(data) {
    const conteoTransacciones = { 'Gastos': 0, 'Servicio': 0, 'Compra': 0, 'Venta': 0, 'Sin definir': 0 };
    const conteoMetodoPago = { 'Proveedores': 0, 'Bancos': 0, 'Sin definir': 0 };

    data.forEach(fila => {
        const transaccion = fila["Transacción"] || "Sin definir";
        const metodoPago = fila["Con que se Pagó?"] || "Sin definir";

        if(conteoTransacciones[transaccion] !== undefined) conteoTransacciones[transaccion]++;
        else conteoTransacciones['Sin definir']++;

        if(conteoMetodoPago[metodoPago] !== undefined) conteoMetodoPago[metodoPago]++;
        else conteoMetodoPago['Sin definir']++;
    });

    // Construir Leyenda lateral derecha de la Dona dinámicamente
    construirLeyendaDona(conteoMetodoPago, data.length);

    // Destruir instancias previas
    if (barChartInstance) barChartInstance.destroy();
    if (donutChartInstance) donutChartInstance.destroy();

    // --- GRÁFICO 1: BARRAS ---
    const ctxBar = document.getElementById('barChart').getContext('2d');
    const bgColorsBar = Object.keys(conteoTransacciones).map(k => COLORES_BARRAS[k]);

    barChartInstance = new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: Object.keys(conteoTransacciones),
            datasets: [{
                data: Object.values(conteoTransacciones),
                backgroundColor: bgColorsBar,
                borderRadius: 6,
                borderSkipped: false,
                barPercentage: 0.55,
                categoryPercentage: 0.7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1E1E2E',
                    titleColor: '#E0E0F0',
                    bodyColor: '#9191A8',
                    borderColor: 'rgba(255,255,255,0.08)',
                    borderWidth: 1,
                    padding: 10,
                    cornerRadius: 8,
                    callbacks: { label: c => `  ${c.parsed.y} operaciones` }
                }
            },
            scales: {
                x: { grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false }, ticks: { color: '#4A4A62' }, border: { display: false } },
                y: { grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false }, ticks: { color: '#4A4A62', stepSize: 1 }, border: { display: false }, beginAtZero: true }
            }
        }
    });

    // --- GRÁFICO 2: DONA ---
    const ctxDonut = document.getElementById('donutChart').getContext('2d');
    const labelsDonut = Object.keys(conteoMetodoPago).filter(k => conteoMetodoPago[k] > 0);
    const dataDonut = labelsDonut.map(k => conteoMetodoPago[k]);
    const bgColorsDonut = labelsDonut.map(k => COLORES_DONA[k]);

    document.getElementById('lbl-metodos-activos').textContent = `${labelsDonut.length} métodos activos`;

    donutChartInstance = new Chart(ctxDonut, {
        type: 'doughnut',
        data: {
            labels: labelsDonut,
            datasets: [{
                data: dataDonut,
                backgroundColor: bgColorsDonut,
                borderWidth: 3,
                borderColor: '#1C1C26',
                hoverOffset: 8,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '72%',
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1E1E2E',
                    titleColor: '#E0E0F0',
                    bodyColor: '#9191A8',
                    borderColor: 'rgba(255,255,255,0.08)',
                    borderWidth: 1,
                    padding: 10,
                    cornerRadius: 8,
                    callbacks: {
                        label: c => {
                            const pct = Math.round((c.raw / data.length) * 100);
                            return `  ${pct}%  ·  ${c.raw} operaciones`;
                        }
                    }
                }
            }
        }
    });
}

function construirLeyendaDona(conteo, totalOps) {
    const contenedor = document.getElementById('donut-legend-container');
    let html = '';
    
    let mayorMetodo = '-';
    let maxOps = -1;

    Object.entries(conteo).forEach(([metodo, cantidad]) => {
        if(cantidad > maxOps && metodo !== 'Sin definir') {
            maxOps = cantidad;
            mayorMetodo = metodo;
        }

        const porcentaje = totalOps > 0 ? Math.round((cantidad / totalOps) * 100) : 0;
        const color = COLORES_DONA[metodo] || '#888898';

        html += `
        <div class="stat-row">
            <div class="stat-left">
                <span class="stat-dot" style="background:${color}"></span>
                <span class="stat-name">${metodo}</span>
            </div>
            <div class="mini-bar-track"><div class="mini-bar-fill" style="width:${porcentaje}%;background:${color}"></div></div>
            <div class="stat-right">
              <div class="stat-pct" style="color:${color}">${porcentaje}%</div>
              <div class="stat-ops">${cantidad} ops</div>
            </div>
        </div>`;
    });

    contenedor.innerHTML = html;

    // Actualizar resúmenes inferiores
    document.getElementById('sum-mayor').textContent = mayorMetodo;
    document.getElementById('sum-sin-clasificar').textContent = `${conteo['Sin definir'] || 0} ops`;
}

// Ejecutar cuando cargue la página
document.addEventListener('DOMContentLoaded', cargarDatos);