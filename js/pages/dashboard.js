/* ==========================================================================
   pages/dashboard.js — Panel administrativo (dashboard-admin.html).
   Muestra cuatro métricas, dos gráficos de ApexCharts y la tabla de pedidos
   recientes. Todos los datos salen de js/datos/pedidos.js.
   ========================================================================== */

/** Número de meses que muestra el gráfico de ventas. */
const MESES_GRAFICO = 7;

/** Etiquetas de los meses (en español) para el gráfico de ventas. */
const NOMBRES_MES = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

/* --------------------------------------------------------------------------
   Métricas
   -------------------------------------------------------------------------- */

/**
 * Calcula los números del panel a partir de los pedidos.
 * @param {Array} pedidos
 * @returns {object}
 */
function calcularMetricas(pedidos) {
  const facturados = pedidos
    .filter((pedido) => pedido.estado !== "Cancelado")
    .reduce((suma, pedido) => suma + Number(pedido.total || 0), 0);

  const activos = pedidos.filter((pedido) =>
    ["Pendiente", "Confirmado", "En preparación", "Enviado"].includes(pedido.estado)
  ).length;

  const entregados = pedidos.filter((pedido) => pedido.estado === "Entregado").length;

  return {
    pedidos: pedidos.length,
    facturados,
    activos,
    entregados,
  };
}

/** Pinta las cuatro tarjetas de métricas. */
function dibujarMetricas(pedidos) {
  const m = calcularMetricas(pedidos);

  const tarjetas = [
    {
      icono: "fa-solid fa-box",
      clase: "marca",
      titulo: "Pedidos totales",
      valor: String(m.pedidos),
    },
    {
      icono: "fa-solid fa-sack-dollar",
      clase: "exito",
      titulo: "Total facturado",
      valor: moneda(m.facturados),
    },
    {
      icono: "fa-solid fa-truck-fast",
      clase: "advertencia",
      titulo: "Pedidos en curso",
      valor: String(m.activos),
    },
    {
      icono: "fa-solid fa-circle-check",
      clase: "info",
      titulo: "Pedidos entregados",
      valor: String(m.entregados),
    },
  ];

  $("metricas").innerHTML = tarjetas
    .map(
      (t) => `
    <div class="tarjeta">
      <div class="tarjeta-cuerpo">
        <div class="metrica">
          <div class="metrica-icono ${t.clase}"><i class="${t.icono}"></i></div>
          <div>
            <span>${t.titulo}</span>
            <strong>${escapar(t.valor)}</strong>
          </div>
        </div>
      </div>
    </div>`
    )
    .join("");
}

/* --------------------------------------------------------------------------
   Gráfico 1: ventas por mes (barras apiladas por método de pago)
   -------------------------------------------------------------------------- */

/**
 * Devuelve las últimas n etiquetas de mes hasta hoy.
 * @param {number} cantidad
 * @returns {string[]}
 */
function ultimosMeses(cantidad) {
  const etiquetas = [];
  const hoy = new Date();

  for (let i = cantidad - 1; i >= 0; i--) {
    const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    etiquetas.push(`${NOMBRES_MES[fecha.getMonth()]} ${String(fecha.getFullYear()).slice(2)}`);
  }

  return etiquetas;
}

/**
 * Agrupa el total de cada pedido en su mes de pedido.
 * @param {Array} pedidos
 * @param {number} cantidad - cuántos meses mostrar
 * @returns {{etiquetas: string[], valores: number[]}}
 */
function ventasPorMes(pedidos, cantidad) {
  const etiquetas = ultimosMeses(cantidad);
  const valores = new Array(cantidad).fill(0);
  const inicio = new Date();
  inicio.setMonth(inicio.getMonth() - (cantidad - 1));
  inicio.setDate(1);

  pedidos.forEach((pedido) => {
    if (pedido.estado === "Cancelado") return;

    const fecha = new Date(pedido.fechaPedido);
    if (isNaN(fecha) || fecha < inicio) return;

    const indice =
      (fecha.getFullYear() - inicio.getFullYear()) * 12 +
      (fecha.getMonth() - inicio.getMonth());

    if (indice >= 0 && indice < cantidad) {
      valores[indice] += Number(pedido.total || 0);
    }
  });

  return { etiquetas, valores };
}

/**
 * Dibuja el gráfico de barras con las ventas de los últimos meses.
 * @param {Array} pedidos
 */
function dibujarGraficoVentas(pedidos) {
  const { etiquetas, valores } = ventasPorMes(pedidos, MESES_GRAFICO);

  new ApexCharts($("grafico-ventas"), {
    chart: {
      type: "bar",
      height: 320,
      toolbar: { show: false },
      fontFamily: "Outfit, Segoe UI, system-ui, sans-serif",
      animations: { enabled: true, speed: 500 },
    },
    series: [{ name: "Ventas", data: valores }],
    colors: ["#465fff"],
    plotOptions: {
      bar: {
        columnWidth: "45%",
        borderRadius: 6,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: { enabled: false },
    stroke: { width: 0 },
    xaxis: {
      categories: etiquetas,
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        formatter: (numero) => "S/ " + numero.toFixed(0),
      },
    },
    grid: {
      borderColor: "rgba(148, 163, 184, 0.25)",
      strokeDashArray: 4,
    },
    tooltip: {
      y: { formatter: (numero) => moneda(numero) },
    },
    noData: { text: "Aún no hay ventas registradas" },
  }).render();
}

/* --------------------------------------------------------------------------
   Gráfico 2: pedidos por estado (gráfico de anillo)
   -------------------------------------------------------------------------- */

/** Colores de las etiquetas de estado, en el mismo orden que ESTADOS_PEDIDO. */
const COLORES_ESTADO = {
  Pendiente: "#94a3b8",
  Confirmado: "#d97706",
  "En preparación": "#f59e0b",
  Enviado: "#465fff",
  Entregado: "#16a34a",
  Cancelado: "#dc2626",
};

/**
 * Cuenta cuántos pedidos hay en cada estado.
 * @param {Array} pedidos
 * @returns {Array<{estado: string, cantidad: number}>}
 */
function pedidosPorEstado(pedidos) {
  return ESTADOS_PEDIDO.map((estado) => ({
    estado,
    cantidad: pedidos.filter((pedido) => pedido.estado === estado).length,
  })).filter((item) => item.cantidad > 0);
}

/**
 * Dibuja el gráfico de anillo con la distribución por estado.
 * @param {Array} pedidos
 */
function dibujarGraficoEstados(pedidos) {
  const datos = pedidosPorEstado(pedidos);

  new ApexCharts($("grafico-estados"), {
    chart: {
      type: "donut",
      height: 320,
      fontFamily: "Outfit, Segoe UI, system-ui, sans-serif",
    },
    series: datos.map((item) => item.cantidad),
    labels: datos.map((item) => item.estado),
    colors: datos.map((item) => COLORES_ESTADO[item.estado] || "#94a3b8"),
    stroke: { width: 3 },
    plotOptions: {
      pie: {
        donut: {
          size: "62%",
          labels: {
            show: true,
            name: { fontSize: "0.85rem", offsetY: 18 },
            value: {
              fontSize: "1.5rem",
              fontWeight: 700,
              offsetY: -12,
              formatter: (numero) => `${numero} pedidos`,
            },
            total: {
              show: true,
              label: "Pedidos",
              fontSize: "0.85rem",
              formatter: () => String(datos.reduce((s, d) => s + d.cantidad, 0)),
            },
          },
        },
      },
    },
    dataLabels: {
      formatter: (porcentaje) => `${porcentaje.toFixed(0)}%`,
    },
    legend: {
      position: "bottom",
      fontSize: "0.85rem",
      markers: { width: 10, height: 10 },
    },
    tooltip: {
      y: { formatter: (numero) => `${numero} pedido(s)` },
    },
    noData: { text: "Aún no hay pedidos registrados" },
  }).render();
}

/* --------------------------------------------------------------------------
   Tabla de pedidos recientes
   -------------------------------------------------------------------------- */

/** Pinta los 5 pedidos más recientes. */
function dibujarPedidosRecientes(pedidos) {
  const recientes = [...pedidos]
    .sort((a, b) => String(b.fechaPedido).localeCompare(String(a.fechaPedido)))
    .slice(0, 5);

  if (recientes.length === 0) {
    $("cuerpo-pedidos").innerHTML =
      '<tr><td colspan="6" class="vacio">Aún no hay pedidos registrados.</td></tr>';
    return;
  }

  $("cuerpo-pedidos").innerHTML = recientes
    .map(
      (pedido) => `
    <tr>
      <td class="codigo-fila">${escapar(pedido.codigo)}</td>
      <td class="nombre-fila">${escapar(pedido.cliente)}</td>
      <td>${fechaCorta(pedido.fechaPedido)}</td>
      <td>${fechaCorta(pedido.fechaEntrega)}</td>
      <td>${pedido.total ? moneda(pedido.total) : "—"}</td>
      <td><span class="etiqueta ${colorEstadoPedido(pedido.estado)}">${escapar(pedido.estado)}</span></td>
    </tr>`
    )
    .join("");
}

/* --------------------------------------------------------------------------
   Eventos
   -------------------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  if (!esAdmin()) return;
  const pedidos = leerPedidos();

  dibujarMetricas(pedidos);
  dibujarPedidosRecientes(pedidos);

  /* Si ApexCharts no cargó (sin internet), la página sigue siendo usable */
  if (typeof ApexCharts !== "function") {
    $("grafico-ventas").innerHTML =
      '<p class="vacio">No se pudo cargar el gráfico de ventas.</p>';
    $("grafico-estados").innerHTML =
      '<p class="vacio">No se pudo cargar el gráfico de estados.</p>';
    return;
  }

  dibujarGraficoVentas(pedidos);
  dibujarGraficoEstados(pedidos);
});
