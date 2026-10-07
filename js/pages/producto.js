/* ==========================================================================
   pages/producto.js — Lógica de la ficha de producto (producto.html).
   Lee el producto de la URL (?id=P-001), lo muestra y permite elegir talla,
   cantidad y agregar al carrito.
   ========================================================================== */

/** Datos del producto abierto y la talla/cantidad elegidas. */
let productoActual = null;
let tallaElegida = null;
let cantidadElegida = 1;

/* --------------------------------------------------------------------------
   Obtener el producto de la URL
   -------------------------------------------------------------------------- */

/** @returns {string|null} el valor del parámetro "id" */
function idDesdeUrl() {
  return new URLSearchParams(window.location.search).get("id");
}

/* --------------------------------------------------------------------------
   Dibujo de la ficha
   -------------------------------------------------------------------------- */

/** Pinta los datos del producto en el HTML. */
function dibujarProducto() {
  document.title = `${productoActual.nombre} | ModaClick`;

  $("miga-nombre").textContent = productoActual.nombre;
  $("producto-imagen").src = productoActual.imagen;
  $("producto-imagen").alt = productoActual.nombre;
  $("producto-referencia").textContent = `Código ${productoActual.id}`;
  $("producto-categoria").textContent = productoActual.categoria;
  $("producto-destacado").classList.toggle("oculto", !productoActual.destacado);
  $("producto-nombre").textContent = productoActual.nombre;
  $("producto-precio").textContent = moneda(productoActual.precio);
  $("producto-descripcion").textContent = productoActual.descripcion;

  $("producto-tallas").innerHTML = productoActual.tallas
    .map(
      (talla) =>
        `<button type="button" data-talla="${escapar(talla)}">${escapar(talla)}</button>`
    )
    .join("");

  actualizarStock();

  // Por defecto se marca la primera talla disponible
  const primeraTalla = $$("[data-talla]", $("producto-tallas"))[0];
  if (primeraTalla) {
    primeraTalla.classList.add("elegida");
    tallaElegida = primeraTalla.dataset.talla;
  }
}

/** Muestra cuántas unidades quedan según la cantidad elegida. */
function actualizarStock() {
  const restantes = productoActual.stock - cantidadElegida;
  const texto = $("producto-stock");

  if (productoActual.stock === 0) {
    texto.textContent = `No hay stock suficiente (disponible: ${productoActual.stock}).`;
    texto.style.color = "var(--peligro)";
  } else {
    texto.textContent = `Quedan ${restantes} de ${productoActual.stock} unidades disponibles.`;
    texto.style.color = "";
  }
}

/* --------------------------------------------------------------------------
   Productos relacionados
   Muestra hasta 4 productos del mismo estilo, empezando por el actual.
   -------------------------------------------------------------------------- */

/** Pinta las tarjetas de productos relacionados. */
function dibujarRelacionados() {
  const otros = PRODUCTOS.filter((p) => p.id !== productoActual.id)
    .sort((a, b) => Number(b.categoria === productoActual.categoria) - Number(a.categoria === productoActual.categoria))
    .slice(0, 4);

  $("productos-relacionados").innerHTML = otros
    .map(
      (producto) => `
      <article class="producto${producto.stock <= 0 ? " producto-agotado" : producto.destacado ? " producto-destacado" : ""}">
        ${producto.stock <= 0 ? '<div class="producto-imagen">' : `<a class="producto-imagen" href="${enlaceProducto(producto.id)}">`}
          <img src="${escapar(producto.imagen)}" alt="${escapar(producto.nombre)}"
               loading="lazy" width="260" height="260">
          ${producto.stock <= 0 ? '<span class="producto-estado">Agotado</span>' : ""}
          ${producto.destacado && producto.stock > 0 ? '<span class="producto-estado producto-estado-destacado"><span aria-hidden="true">★</span> Destacado</span>' : ""}
        ${producto.stock <= 0 ? "</div>" : "</a>"}
        <div class="producto-cuerpo">
          <span class="producto-categoria">${escapar(producto.categoria)}</span>
          <h3 class="producto-nombre">${escapar(producto.nombre)}</h3>
          <p class="producto-precio">${moneda(producto.precio)}</p>
          <div class="producto-acciones">
            ${producto.stock <= 0 ? '<button type="button" class="btn btn-secundario btn-pequeno btn-bloque" disabled>' : `<a class="btn btn-secundario btn-pequeno btn-bloque" href="${enlaceProducto(producto.id)}">`}
              Ver detalle
            ${producto.stock <= 0 ? "</button>" : "</a>"}
          </div>
        </div>
      </article>`
    )
    .join("");
}

/* --------------------------------------------------------------------------
   Cantidad
   -------------------------------------------------------------------------- */

/**
 * Cambia la cantidad y la muestra en el campo.
 * @param {number} nueva
 */
function fijarCantidad(nueva) {
  cantidadElegida = Math.min(Math.max(1, nueva), productoActual.stock);
  $("cantidad").value = cantidadElegida;
  $("cantidad").max = productoActual.stock;
  $("cantidad").disabled = productoActual.stock === 0;
  $("agregar-carrito").disabled = productoActual.stock === 0;
  $("comprar-ahora").disabled = productoActual.stock === 0;

  $("menos-cantidad").disabled = cantidadElegida <= 1;
  $("mas-cantidad").disabled = cantidadElegida >= productoActual.stock;

  actualizarStock();
}

/* --------------------------------------------------------------------------
   Inicio
   -------------------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  productoActual = buscarProducto(idDesdeUrl());

  /* Si el id no existe, avisamos y ocultamos la ficha */
  if (!productoActual || productoActual.stock <= 0) {
    $("producto-contenido").classList.add("oculto");
    $("productos-relacionados").closest("section").classList.add("oculto");
    $("producto-inexistente").classList.remove("oculto");
    if (productoActual) {
      $("producto-inexistente").querySelector("h3").textContent = "Producto agotado";
      $("producto-inexistente").querySelector("p").textContent = "Este producto no tiene stock disponible. Puedes seguir explorando el catálogo.";
      document.title = "Producto agotado | ModaClick";
    }
    return;
  }

  dibujarProducto();
  dibujarRelacionados();
  fijarCantidad(1);

  /* Elegir talla */
  $("producto-tallas").addEventListener("click", (evento) => {
    const boton = evento.target.closest("[data-talla]");
    if (!boton) return;
    $$("[data-talla]", $("producto-tallas")).forEach((b) => b.classList.remove("elegida"));
    boton.classList.add("elegida");
    tallaElegida = boton.dataset.talla;
  });

  /* Cantidad */
  $("menos-cantidad").addEventListener("click", () => fijarCantidad(cantidadElegida - 1));
  $("mas-cantidad").addEventListener("click", () => fijarCantidad(cantidadElegida + 1));

  $("cantidad").addEventListener("change", (evento) => {
    fijarCantidad(parseInt(evento.target.value, 10) || 1);
  });

  /* Agregar al carrito */
  $("agregar-carrito").addEventListener("click", () => {
    if (productoActual.stock === 0) return;
    if (!tallaElegida) {
      mostrarAviso("Elige una talla primero", "error");
      return;
    }
    agregarAlCarrito(productoActual, tallaElegida, cantidadElegida);
    mostrarAviso(
      `${cantidadElegida} × ${productoActual.nombre} agregado al carrito`,
      "exito"
    );
  });

  /* Comprar ahora: va directo a confirmar el pedido */
  $("comprar-ahora").addEventListener("click", async (evento) => {
    if (productoActual.stock === 0) return;
    if (!tallaElegida) {
      mostrarAviso("Elige una talla primero", "error");
      return;
    }
    agregarAlCarrito(productoActual, tallaElegida, cantidadElegida);
    const boton = evento.currentTarget;
    boton.disabled = true;
    try {
      await continuarConPedido();
    } finally {
      boton.disabled = false;
    }
  });
});
