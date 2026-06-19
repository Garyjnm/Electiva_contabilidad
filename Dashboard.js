// REEMPLAZA ESTA URL CON LA QUE TE DIO GOOGLE APPS SCRIPT
const URL_APPS_SCRIPT = "https://script.google.com/macros/s/AKfycbxcvVI9t-vJ1lWSYdpH1MZipbICY3S2WC0Qxat7mm9v65lzqv6F2x5GPvu-rw5TmtK91g/exec";

// ── PALETA GLOBAL ────────────────────────────────────────────
// Mantenida aquí para sincronizarla fácilmente con el CSS
const PALETTE = {
  terracota:      "#C9622F",
  terracotaDark:  "#A04E24",
  terracotaLite:  "#F4DDD0",
  positive:       "#2A7D5F",
  positiveLite:   "#C8EAE0",
  negative:       "#B84040",
  negativeLite:   "#F2CECE",
  neutral:        "#4A6FA5",
  textPrimary:    "#1C1A18",
  textSecondary:  "#6B6560",
  textMuted:      "#A09890",
  border:         "#EDE8E2",
  surface:        "#FFFFFF",
};

// ── DEFAULTS GLOBALES DE CHART.JS ───────────────────────────
Chart.defaults.font.family = "'Plus Jakarta Sans', system-ui, sans-serif";
Chart.defaults.font.size   = 12;
Chart.defaults.color       = PALETTE.textSecondary;

// Variables globales para guardar la instancia de los gráficos
let chartTransaccionesInstance = null;
let chartMetodoPagoInstance    = null;

// ── FUNCIÓN PRINCIPAL ────────────────────────────────────────
async function cargarDatos() {
  try {
    const response = await fetch(URL_APPS_SCRIPT);
    const data     = await response.json();

    procesarKPIs(data);
    renderizarGraficos(data);

  } catch (error) {
    console.error("Error al cargar los datos:", error);
    alert("Hubo un problema al cargar el dashboard. Revisa la consola.");
  }
}

// ── KPIs ─────────────────────────────────────────────────────
function procesarKPIs(data) {
  let totalIngresos = 0;
  let totalGastos   = 0;

  data.forEach(fila => {
    const monto            = parseFloat(fila["Monto Total"]) || 0;
    const tipoTransaccion  = fila["Transacción"];

    if (tipoTransaccion === "Venta" || tipoTransaccion === "Servicio") {
      totalIngresos += monto;
    } else if (tipoTransaccion === "Gastos" || tipoTransaccion === "Compra") {
      totalGastos += monto;
    }
  });

  const balance = totalIngresos - totalGastos;
  const fmt     = v => `C$ ${v.toLocaleString("es-NI", { minimumFractionDigits: 2 })}`;

  document.getElementById("kpi-ingresos").textContent      = fmt(totalIngresos);
  document.getElementById("kpi-gastos").textContent        = fmt(totalGastos);
  document.getElementById("kpi-balance").textContent       = fmt(balance);
  document.getElementById("kpi-transacciones").textContent = data.length;
}

// ── GRÁFICOS ─────────────────────────────────────────────────
function renderizarGraficos(data) {

  // Agrupación de datos
  const conteoTransacciones = {};
  const conteoMetodoPago    = {};

  data.forEach(fila => {
    const t = fila["Transacción"]        || "Sin definir";
    const m = fila["Con que se Pagó?"]   || "Sin definir";
    conteoTransacciones[t] = (conteoTransacciones[t] || 0) + 1;
    conteoMetodoPago[m]    = (conteoMetodoPago[m]    || 0) + 1;
  });

  // Destruir instancias previas
  if (chartTransaccionesInstance) chartTransaccionesInstance.destroy();
  if (chartMetodoPagoInstance)    chartMetodoPagoInstance.destroy();

  // ─── GRÁFICO 1: Barras — Distribución de Transacciones ────
  // Colores por tipo de operación
  const transLabels = Object.keys(conteoTransacciones);
  const colorMap    = {
    "Venta":   PALETTE.positive,
    "Servicio":PALETTE.terracota,
    "Compra":  PALETTE.neutral,
    "Gastos":  PALETTE.negative,
  };
  const barColors = transLabels.map(l => colorMap[l] || PALETTE.textMuted);
  const barAlpha  = barColors.map(c => c + "CC"); // 80% opacidad

  const ctxBar = document.getElementById("chartTransacciones").getContext("2d");
  chartTransaccionesInstance = new Chart(ctxBar, {
    type: "bar",
    data: {
      labels: transLabels,
      datasets: [{
        label: "Operaciones",
        data:  Object.values(conteoTransacciones),
        backgroundColor: barAlpha,
        borderColor:     barColors,
        borderWidth:     0,
        borderRadius:    6,       // Bordes redondeados en las barras
        borderSkipped:   false,
      }]
    },
    options: {
      responsive:          true,
      maintainAspectRatio: true,
      layout: {
        padding: { top: 8, bottom: 4 }
      },
      scales: {
        x: {
          grid:  { display: false },       // Sin rejilla vertical
          border:{ display: false },
          ticks: {
            color: PALETTE.textSecondary,
            font:  { weight: "600", size: 11 },
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color:       PALETTE.border,  // Líneas tenues
            lineWidth:   1,
            drawTicks:   false,
          },
          border: { display: false, dash: [4, 4] },
          ticks:  {
            color:      PALETTE.textMuted,
            font:       { size: 11 },
            stepSize:   1,
            padding:    8,
          }
        }
      },
      plugins: {
        legend: { display: false },        // Sin leyenda (redundante con eje X)
        tooltip: {
          backgroundColor:  "#1C1A18",
          titleColor:       "#FFFFFF",
          bodyColor:        PALETTE.textMuted,
          titleFont:        { weight: "700", size: 12 },
          bodyFont:         { size: 12 },
          padding:          12,
          cornerRadius:     8,
          displayColors:    true,
          boxWidth:         8,
          boxHeight:        8,
          boxPadding:       4,
          callbacks: {
            label: ctx => `  ${ctx.parsed.y} operación${ctx.parsed.y !== 1 ? "es" : ""}`
          }
        }
      }
    }
  });

  // ─── GRÁFICO 2: Dona — Métodos de Pago ────────────────────
  const metodoLabels = Object.keys(conteoMetodoPago);
  const donutPalette = [
    PALETTE.terracota,
    PALETTE.positive,
    PALETTE.neutral,
    PALETTE.negative,
    "#8E6BBF",   // Violeta por si hay 5+ métodos
  ];

  const ctxDona = document.getElementById("chartMetodoPago").getContext("2d");
  chartMetodoPagoInstance = new Chart(ctxDona, {
    type: "doughnut",
    data: {
      labels: metodoLabels,
      datasets: [{
        data:            Object.values(conteoMetodoPago),
        backgroundColor: donutPalette.slice(0, metodoLabels.length).map(c => c + "D9"), // 85%
        borderColor:     PALETTE.surface,
        borderWidth:     3,
        hoverOffset:     8,
      }]
    },
    options: {
      responsive:          true,
      maintainAspectRatio: true,
      cutout:              "65%",         // Dona más fina y elegante
      layout: {
        padding: 8
      },
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            padding:     20,
            boxWidth:    10,
            boxHeight:   10,
            borderRadius: 3,
            useBorderRadius: true,
            color:  PALETTE.textSecondary,
            font:   { size: 11, weight: "600" },
          }
        },
        tooltip: {
          backgroundColor: "#1C1A18",
          titleColor:      "#FFFFFF",
          bodyColor:       PALETTE.textMuted,
          titleFont:       { weight: "700", size: 12 },
          bodyFont:        { size: 12 },
          padding:         12,
          cornerRadius:    8,
          displayColors:   true,
          boxWidth:        8,
          boxHeight:       8,
          boxPadding:      4,
          callbacks: {
            label: ctx => {
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              const pct   = ((ctx.parsed / total) * 100).toFixed(1);
              return `  ${ctx.label}: ${ctx.parsed} (${pct}%)`;
            }
          }
        }
      }
    }
  });
}

// ── ARRANQUE ─────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", cargarDatos);