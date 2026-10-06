/* ==========================================================================
   datos/pedidos.js — Alta, edición y baja de pedidos.
   Los datos viven en localStorage para que la demo funcione sin servidor.
   Al conectar una base de datos, reemplaza leer() y guardar() por tu API.
   ========================================================================== */

const CLAVE_PEDIDOS = "modaclick_pedidos";

/** Estados posibles de un pedido. */
const ESTADOS_PEDIDO = [
  "Pendiente",
  "Confirmado",
  "En preparación",
  "Enviado",
  "Entregado",
  "Cancelado",
];

const METODOS_PAGO = ["Efectivo", "Yape/Plin", "Transferencia", "Tarjeta"];
const TIPOS_ENTREGA = ["Recojo en Tienda", "Delivery"];

/** Pedidos de ejemplo con los que arranca la demo. */
const PEDIDOS_EJEMPLO = [
  { codigo: "PED-001", cliente: "María Fernanda Quispe Rojas", fechaPedido: "2026-09-28", fechaEntrega: "2026-10-02", metodoPago: "Yape/Plin", tipoEntrega: "Delivery", direccion: "Av. Los Olivos 1250, Los Olivos", total: 458, estado: "Enviado", observaciones: "Entregar antes de las 6 pm." },
  { codigo: "PED-002", cliente: "Luis Alberto Ramírez Soto", fechaPedido: "2026-09-27", fechaEntrega: "2026-10-01", metodoPago: "Efectivo", tipoEntrega: "Recojo en Tienda", direccion: "Jr. Huancavelica 340, Cercado de Lima", total: 279, estado: "Confirmado", observaciones: "" },
  { codigo: "PED-003", cliente: "Carla Sofía Mendoza Paredes", fechaPedido: "2026-09-25", fechaEntrega: "2026-09-30", metodoPago: "Tarjeta", tipoEntrega: "Delivery", direccion: "Calle Las Magnolias 215, San Miguel", total: 612.5, estado: "Entregado", observaciones: "Envolver para regalo." },
  { codigo: "PED-004", cliente: "Diego Andrés Torres Vela", fechaPedido: "2026-09-24", fechaEntrega: "2026-09-29", metodoPago: "Transferencia", tipoEntrega: "Delivery", direccion: "Av. Túpac Amaru 780, Comas", total: 184.9, estado: "Pendiente", observaciones: "" },
  { codigo: "PED-005", cliente: "Valeria Nicole Huamán Cruz", fechaPedido: "2026-09-20", fechaEntrega: "2026-09-25", metodoPago: "Yape/Plin", tipoEntrega: "Recojo en Tienda", direccion: "Mz. C Lote 12, Villa El Salvador", total: 398, estado: "Cancelado", observaciones: "El cliente pidió cancelar." },
  { codigo: "PED-006", cliente: "Jorge Enrique Salazar Díaz", fechaPedido: "2026-09-18", fechaEntrega: "2026-09-23", metodoPago: "Efectivo", tipoEntrega: "Delivery", direccion: "Av. Universitaria 1890, San Martín de Porres", total: 745, estado: "Entregado", observaciones: "" },
];

/** @returns {Array} Todos los pedidos guardados. */
function leerPedidos() {
  return usarLeer(CLAVE_PEDIDOS, PEDIDOS_EJEMPLO);
}

/**
 * Guarda la lista completa de pedidos.
 * @param {Array} pedidos
 */
function guardarPedidos(pedidos) {
  localStorage.setItem(CLAVE_PEDIDOS, JSON.stringify(pedidos));
}

/**
 * Calcula el siguiente código disponible: PED-001, PED-002, ...
 * @param {Array} pedidos
 * @returns {string}
 */
function siguienteCodigoPedido(pedidos) {
  const mayor = pedidos.reduce((max, pedido) => {
    const numero = parseInt(String(pedido.codigo).replace(/\D/g, ""), 10) || 0;
    return numero > max ? numero : max;
  }, 0);
  return "PED-" + String(mayor + 1).padStart(3, "0");
}

/**
 * Inserta un pedido nuevo o actualiza el que tenga el mismo código.
 * @param {object} datos
 * @returns {Array} La lista de pedidos ya guardada.
 */
function guardarPedido(datos) {
  exigirAdmin();
  const pedidos = leerPedidos();
  const existe = pedidos.some((pedido) => pedido.codigo === datos.codigo);

  if (existe) {
    guardarPedidos(
      pedidos.map((pedido) =>
        pedido.codigo === datos.codigo ? { ...pedido, ...datos } : pedido
      )
    );
  } else {
    guardarPedidos([...pedidos, { ...datos, codigo: siguienteCodigoPedido(pedidos) }]);
  }

  return leerPedidos();
}

/**
 * Elimina un pedido por su código.
 * @param {string} codigo
 */
function eliminarPedido(codigo) {
  exigirAdmin();
  guardarPedidos(leerPedidos().filter((pedido) => pedido.codigo !== codigo));
}

/**
 * Filtra pedidos por un texto libre o por estado.
 * @param {Array} pedidos
 * @param {string} texto
 * @param {string} [estado] - "Todos" para no filtrar por estado
 * @returns {Array}
 */
function filtrarPedidos(pedidos, texto, estado = "Todos") {
  const busqueda = texto.trim().toLowerCase();

  return pedidos.filter((pedido) => {
    if (estado !== "Todos" && pedido.estado !== estado) return false;
    if (!busqueda) return true;

    return [
      pedido.codigo,
      pedido.cliente,
      pedido.direccion,
      pedido.metodoPago,
      pedido.estado,
    ]
      .join(" ")
      .toLowerCase()
      .includes(busqueda);
  });
}

/**
 * Devuelve el color de la etiqueta según el estado del pedido.
 * @param {string} estado
 * @returns {string} una de: exito, advertencia, peligro, info, neutra
 */
function colorEstadoPedido(estado) {
  switch (estado) {
    case "Entregado":
      return "exito";
    case "Enviado":
      return "info";
    case "Confirmado":
    case "En preparación":
      return "advertencia";
    case "Cancelado":
      return "peligro";
    default:
      return "neutra";
  }
}
function leerMisPedidos() {
  const usuario = obtenerUsuarioSesion();
  return usuario ? leerPedidos().filter(p => p.usuarioId === usuario.id) : [];
}
function registrarPedidoCompra(datos) {
  const usuario = obtenerUsuarioSesion();
  if (!usuario) throw new Error("Inicia sesión para realizar un pedido.");
  const items = leerCarrito();
  if (!items.length) throw new Error("El carrito está vacío.");
  const pedidos = leerPedidos();
  const pedido = { ...datos, codigo: siguienteCodigoPedido(pedidos), usuarioId: usuario.id, items, total: resumenCarrito().total, estado: "Pendiente" };
  guardarPedidos([...pedidos, pedido]);
  return pedido;
}
