/* ==========================================================================
   pages/carrito.js — Lógica del carrito de compras (carrito.html).
   Lee el carrito de localStorage y permite cambiar cantidades, quitar
   artículos y pasar al pago.
   ========================================================================== */

/* --------------------------------------------------------------------------
   Dibujo
   -------------------------------------------------------------------------- */

/**
 * Arma el HTML de un artículo del carrito.
 * @param {object} item
 * @returns {string}
 */
function htmlArticulo(item) {
  const subtotal = item.precio * item.cantidad;

  return `
    <article class="carrito-articulo">
      <a class="carrito-articulo-enlace" href="${enlaceProducto(item.id)}" aria-label="Ver ${escapar(item.nombre)}">
        <img class="carrito-articulo-imagen" src="${escapar(item.imagen)}"
             alt="${escapar(item.nombre)}" width="92" height="112">
      </a>

      <div class="carrito-articulo-datos">
        <h3 class="carrito-articulo-nombre"><a href="${enlaceProducto(item.id)}">${escapar(item.nombre)}</a></h3>
        <p class="carrito-articulo-variante">Talla: ${escapar(item.talla)}</p>
        <p class="carrito-articulo-precio">
          ${moneda(item.precio)}
          <small>Precio por unidad</small>
        </p>
      </div>

      <div class="carrito-articulo-acciones">
        <div class="carrito-cantidad" role="group" aria-label="Cantidad de ${escapar(item.nombre)}">
          <button type="button" data-accion="restar"
                  aria-label="Quitar una unidad">−</button>
          <span>${escapar(item.cantidad)}</span>
          <button type="button" data-accion="sumar"
                  aria-label="Agregar una unidad">+</button>
        </div>
        <strong class="carrito-articulo-total">${moneda(subtotal)}<small>Subtotal</small></strong>
        <button type="button" class="btn btn-secundario carrito-quitar" data-accion="quitar" aria-label="Eliminar ${escapar(item.nombre)} del carrito">
          <i class="fa-regular fa-trash-can" aria-hidden="true"></i> Eliminar
        </button>
      </div>

      <input type="hidden" value="${escapar(item.clave)}">
    </article>`;
}

/** Vuelve a pintar la lista de artículos y el resumen. */
function dibujarCarrito() {
  const items = leerCarrito();
  const contenedor = $("carrito-articulos");
  const resumen = $("carrito-resumen");
  const cantidad = items.reduce((suma, item) => suma + Number(item.cantidad), 0);
  $("carrito-conteo").textContent = `${cantidad} ${cantidad === 1 ? "artículo" : "artículos"}`;

  /* Carrito vacío */
  if (items.length === 0) {
    contenedor.innerHTML = `
      <div class="carrito-vacio">
        <i class="fa-solid fa-cart-shopping"></i>
        <h3>Tu carrito está vacío</h3>
        <p>Todavía no has agregado ningún producto.</p>
        <a href="catalogo.html" class="btn btn-primario">
          <i class="fa-solid fa-bag-shopping"></i> Ir al catálogo
        </a>
      </div>`;
    resumen.classList.add("oculto");
    return;
  }

  resumen.classList.remove("oculto");
  contenedor.innerHTML = items.map(htmlArticulo).join("");

  const totales = resumenCarrito();
  $("resumen-subtotal").textContent = moneda(totales.subtotal);
  $("resumen-envio").textContent = moneda(totales.envio);
  $("resumen-total").textContent = moneda(totales.total);
}

/* --------------------------------------------------------------------------
   Eventos
   -------------------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  dibujarCarrito();

  /* Cambiar cantidades y quitar artículos (delegación de eventos) */
  $("carrito-articulos").addEventListener("click", async (evento) => {
    const boton = evento.target.closest("[data-accion]");
    if (!boton) return;

    const articulo = boton.closest(".carrito-articulo");
    const clave = articulo.querySelector('input[type="hidden"]').value;
    const accion = boton.dataset.accion;

    /* Sumar o restar una unidad */
    if (accion === "sumar" || accion === "restar") {
      const item = leerCarrito().find((x) => x.clave === clave);
      if (!item) return;
      const nueva = item.cantidad + (accion === "sumar" ? 1 : -1);
      cambiarCantidad(clave, nueva);
      dibujarCarrito();
      return;
    }

    /* Quitar el artículo, pidiendo confirmación */
    if (accion === "quitar") {
      const item = leerCarrito().find((x) => x.clave === clave);
      const aceptado = await confirmar(
        "Quitar del carrito",
        `¿Seguro que quieres quitar "${item ? item.nombre : "este producto"}"?`
      );
      if (aceptado) {
        quitarDelCarrito(clave);
        dibujarCarrito();
        mostrarAviso("Producto quitado del carrito");
      }
    }
  });

  /* Vaciar todo el carrito */
  $("btn-vaciar").addEventListener("click", async () => {
    const aceptado = await confirmar(
      "Vaciar carrito",
      "Se quitarán todos los productos de tu carrito. ¿Deseas continuar?"
    );
    if (aceptado) {
      vaciarCarrito();
      dibujarCarrito();
      mostrarAviso("Carrito vaciado");
    }
  });

  /* Ir al pago */
  $("btn-checkout").addEventListener("click", async (evento) => {
    if (leerCarrito().length === 0) {
      mostrarAviso("Agrega productos antes de pagar", "error");
      return;
    }
    const boton = evento.currentTarget;
    boton.disabled = true;
    try {
      await continuarConPedido();
    } finally {
      boton.disabled = false;
    }
  });
});
