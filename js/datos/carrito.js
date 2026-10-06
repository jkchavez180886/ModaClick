/* ==========================================================================
   datos/carrito.js — Productos que viven en el carrito de compras.
   Se guardan en localStorage para que el carrito sobreviva al recargar.

   La demo guarda en el navegador porque no hay servidor. Cuando exista una
   API, reemplaza el cuerpo de leer() y guardar() por llamadas a tu backend.
   ========================================================================== */

const CLAVE_CARRITO = clavePorUsuario("modaclick_carrito");

/**
 * Separador entre el id del producto y la talla elegida.
 * Evita tener que guardar dos objetos sueltos por cada talla.
 */
const SEPARADOR = "::";

/** Carrito de ejemplo con el que arranca la demo. */
const CARRITO_EJEMPLO = [
  {
    clave: "P-009::M",
    id: "P-009",
    talla: "M",
    cantidad: 1,
    nombre: "FC Barcelona 24/25",
    imagen: "../assets/img/productos/barcelona.png",
    precio: 279.0,
  },
  {
    clave: "P-003::L",
    id: "P-003",
    talla: "L",
    cantidad: 1,
    nombre: "Inter Miami 24/25",
    imagen: "../assets/img/productos/inter-miami.png",
    precio: 319.0,
  },
  {
    clave: "P-006::L",
    id: "P-006",
    talla: "L",
    cantidad: 1,
    nombre: "Liverpool 24/25",
    imagen: "../assets/img/productos/liverpool.png",
    precio: 275.0,
  },
];

/** Costo de envío fijo. */
const COSTO_ENVIO = 5.0;

/**
 * Devuelve el carrito guardado en el navegador, o el de ejemplo la primera vez.
 * @returns {Array}
 */
function leerCarrito() {
  // Compatibilidad con las rutas de imagen de carritos guardados antes del traslado.
  return usarLeer(CLAVE_CARRITO, CARRITO_EJEMPLO).map((item) => ({
    ...item,
    imagen: typeof item.imagen === "string" && item.imagen.startsWith("assets/")
      ? "../" + item.imagen
      : item.imagen,
  }));
}

/**
 * Guarda el carrito en el navegador.
 * @param {Array} items
 */
function guardarCarrito(items) {
  usarGuardar(CLAVE_CARRITO, items);
}

/**
 * Agrega un producto al carrito. Si ya estaba con esa talla, suma la cantidad.
 * @param {object} producto - debe traer id, nombre, imagen y precio
 * @param {string} talla
 * @param {number} [cantidad]
 */
function agregarAlCarrito(producto, talla, cantidad = 1) {
  if (producto.stock <= 0) return false;
  const items = leerCarrito();
  const clave = producto.id + SEPARADOR + talla;
  const existente = items.find((item) => item.clave === clave);

  if (existente) {
    existente.cantidad += cantidad;
  } else {
    items.push({
      clave,
      id: producto.id,
      talla,
      cantidad,
      nombre: producto.nombre,
      estampado: producto.estampado || null,
      imagen: producto.imagen,
      precio: producto.precio,
    });
  }

  guardarCarrito(items);
}

/**
 * Cambia la cantidad de un artículo del carrito.
 * Si la cantidad llega a 0, el artículo se elimina.
 * @param {string} clave
 * @param {number} cantidad
 */
function cambiarCantidad(clave, cantidad) {
  const items = leerCarrito()
    .map((item) =>
      item.clave === clave ? { ...item, cantidad: Math.max(0, cantidad) } : item
    )
    .filter((item) => item.cantidad > 0);

  guardarCarrito(items);
}

/**
 * Quita un artículo del carrito.
 * @param {string} clave
 */
function quitarDelCarrito(clave) {
  guardarCarrito(leerCarrito().filter((item) => item.clave !== clave));
}

/** Vacía el carrito por completo. */
function vaciarCarrito() {
  guardarCarrito([]);
}

/**
 * Calcula los totales del carrito.
 * @returns {{subtotal:number, envio:number, total:number, articulos:number}}
 */
function resumenCarrito() {
  const items = leerCarrito();
  const subtotal = items.reduce(
    (suma, item) => suma + item.precio * item.cantidad,
    0
  );
  const articulos = items.reduce((suma, item) => suma + item.cantidad, 0);

  return {
    subtotal,
    envio: articulos > 0 ? COSTO_ENVIO : 0,
    total: subtotal + (articulos > 0 ? COSTO_ENVIO : 0),
    articulos,
  };
}
