/* ==========================================================================
   pages/catalogo.js — Lógica del catálogo (catalogo.html).
   Dibuja las tarjetas de producto y aplica los filtros de búsqueda,
   categoría y orden.
   ========================================================================== */

/** Estado actual de la página: qué se está mostrando y con qué filtros. */
const estadoCatalogo = {
  texto: "",
  categoria: "Todas",
  orden: "destacados",
  pagina: 1,
  porPagina: 12,
};

/* --------------------------------------------------------------------------
   Dibujo de productos
   -------------------------------------------------------------------------- */

/**
 * Arma el HTML de una tarjeta de producto.
 * @param {object} producto
 * @returns {string}
 */
function htmlProducto(producto) {
  const agotado = producto.stock <= 0;
  const destacado = producto.destacado === true && !agotado;
  const tallas = producto.tallas
    .map((talla) => `<button type="button" data-talla="${escapar(talla)}" ${agotado ? "disabled" : ""}>${escapar(talla)}</button>`)
    .join("");

  return `
    <article class="producto${agotado ? " producto-agotado" : destacado ? " producto-destacado" : ""}" data-id="${escapar(producto.id)}">
      ${agotado ? '<div class="producto-imagen">' : `<a class="producto-imagen" href="${enlaceProducto(producto.id)}">`}
        <img src="${escapar(producto.imagen)}" alt="${escapar(producto.nombre)}"
             loading="lazy" width="260" height="260">
        ${agotado ? '<span class="producto-estado">Agotado</span>' : ""}
        ${destacado ? '<span class="producto-estado producto-estado-destacado"><span aria-hidden="true">★</span> Destacado</span>' : ""}
      ${agotado ? "</div>" : "</a>"}

      <div class="producto-cuerpo">
        <span class="producto-categoria">${escapar(producto.categoria)}</span>
        <h3 class="producto-nombre">${escapar(producto.nombre)}</h3>
        <p class="producto-descripcion">${escapar(producto.descripcion)}</p>

        <p class="producto-precio">
          ${moneda(producto.precio)}
          <small>${agotado ? "Sin stock disponible" : `Stock: ${producto.stock} unidades`}</small>
        </p>

        <div class="producto-tallas" data-tallas>${tallas}</div>

        <div class="producto-acciones">
          <button type="button" class="btn btn-primario btn-pequeno" data-accion="agregar" ${agotado ? "disabled" : ""}>
            <i class="fa-solid fa-cart-plus" aria-hidden="true"></i> ${agotado ? "Agotado" : "Agregar"}
          </button>
          ${agotado ? '<button type="button" class="btn btn-secundario btn-pequeno" disabled>' : `<a class="btn btn-secundario btn-pequeno" href="${enlaceProducto(producto.id)}">`}
            Ver detalle
          ${agotado ? "</button>" : "</a>"}
        </div>
      </div>
    </article>`;
}

/* --------------------------------------------------------------------------
   Filtros
   -------------------------------------------------------------------------- */

/**
 * Devuelve los productos que pasan los filtros de texto y categoría.
 * @returns {Array}
 */
function productosFiltrados() {
  const busqueda = estadoCatalogo.texto.toLowerCase();

  let lista = PRODUCTOS.filter((producto) => {
    // Filtro por categoría
    if (estadoCatalogo.categoria !== "Todas" &&
        producto.categoria !== estadoCatalogo.categoria) {
      return false;
    }

    // Filtro por texto
    if (!busqueda) return true;
    return [producto.nombre, producto.equipo, producto.categoria, producto.descripcion]
      .join(" ")
      .toLowerCase()
      .includes(busqueda);
  });

  // Orden
  switch (estadoCatalogo.orden) {
    case "destacados":
      lista.sort((a, b) => Number(b.destacado && b.stock > 0) - Number(a.destacado && a.stock > 0));
      break;
    case "precio-asc":
      lista.sort((a, b) => a.precio - b.precio);
      break;
    case "precio-desc":
      lista.sort((a, b) => b.precio - a.precio);
      break;
    case "nombre":
      lista.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
      break;
  }

  return lista;
}

/* --------------------------------------------------------------------------
   Renderizado
   -------------------------------------------------------------------------- */

/** Vuelve a dibujar la rejilla con los productos filtrados. */
function dibujarCatalogo() {
  const lista = productosFiltrados();
  const rejilla = $("rejilla-productos");
  const vacio = $("sin-resultados");

  const paginas = Math.max(1, Math.ceil(lista.length / estadoCatalogo.porPagina));
  estadoCatalogo.pagina = Math.min(paginas, Math.max(1, estadoCatalogo.pagina));
  const inicio = (estadoCatalogo.pagina - 1) * estadoCatalogo.porPagina;
  rejilla.innerHTML = lista.slice(inicio, inicio + estadoCatalogo.porPagina).map(htmlProducto).join("");
  vacio.classList.toggle("oculto", lista.length > 0);

  $("conteo-productos").textContent = lista.length
    ? `Mostrando ${inicio + 1}–${Math.min(inicio + estadoCatalogo.porPagina, lista.length)} de ${lista.length} productos · Página ${estadoCatalogo.pagina} de ${paginas}`
    : "0 productos";
  const boton = (pagina, texto, deshabilitado = false) => `<button type="button" class="btn ${pagina === estadoCatalogo.pagina && /^\d+$/.test(texto) ? "btn-primario" : "btn-secundario"}" data-pagina="${pagina}" ${deshabilitado ? "disabled" : ""} ${pagina === estadoCatalogo.pagina && /^\d+$/.test(texto) ? 'aria-current="page"' : ""} aria-label="${/^\d+$/.test(texto) ? `Página ${texto}` : texto}">${texto}</button>`;
  const numeros = [...new Set([1, paginas, estadoCatalogo.pagina - 1, estadoCatalogo.pagina, estadoCatalogo.pagina + 1])]
    .filter(p => p >= 1 && p <= paginas).sort((a, b) => a - b);
  let anterior = 0;
  const enlaces = numeros.map(p => {
    const salto = anterior && p > anterior + 1 ? '<span aria-hidden="true">…</span>' : "";
    anterior = p;
    return salto + boton(p, String(p));
  }).join("");
  $("paginacion-catalogo").innerHTML = paginas > 1
    ? boton(estadoCatalogo.pagina - 1, "Anterior", estadoCatalogo.pagina === 1) + enlaces + boton(estadoCatalogo.pagina + 1, "Siguiente", estadoCatalogo.pagina === paginas)
    : "";
}

/** Dibuja los botones de categoría. */
function dibujarCategorias() {
  $("filtro-categorias").innerHTML = ["Todas", ...CATEGORIAS]
    .map((categoria) => {
      const activa = categoria === estadoCatalogo.categoria ? " activo" : "";
      return `<button type="button" class="chip${activa}" data-categoria="${escapar(categoria)}">
                ${escapar(categoria)}
              </button>`;
    })
    .join("");
}

/* --------------------------------------------------------------------------
   Eventos
   -------------------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  /* Si llegamos desde el buscador del header, aplicamos el texto de entrada */
  const params = new URLSearchParams(window.location.search);
  if (params.get("buscar")) {
    estadoCatalogo.texto = params.get("buscar");
  }

  const categoriaUrl = params.get("categoria");
  if (CATEGORIAS.includes(categoriaUrl)) estadoCatalogo.categoria = categoriaUrl;

  dibujarCategorias();
  dibujarCatalogo();
  $("paginacion-catalogo").addEventListener("click", evento => {
    const boton = evento.target.closest("[data-pagina]");
    if (!boton || boton.disabled) return;
    estadoCatalogo.pagina = Number(boton.dataset.pagina);
    dibujarCatalogo();
    $("rejilla-productos").scrollIntoView({ block: "start" });
    $("paginacion-catalogo").querySelector('[aria-current="page"]')?.focus({ preventScroll: true });
  });
  $("productos-por-pagina").addEventListener("change", evento => {
    const cantidad = Number(evento.target.value);
    estadoCatalogo.porPagina = [12, 24, 48].includes(cantidad) ? cantidad : 12;
    estadoCatalogo.pagina = 1;
    dibujarCatalogo();
  });

  /* El texto del buscador del header y el del catálogo son el mismo filtro */
  const buscadorHeader = $("buscador-header");
  const filtroTexto = $("filtro-texto");

  filtroTexto.value = estadoCatalogo.texto;
  if (buscadorHeader) buscadorHeader.value = estadoCatalogo.texto;

  filtroTexto.addEventListener("input", () => {
    estadoCatalogo.texto = filtroTexto.value;
    estadoCatalogo.pagina = 1;
    if (buscadorHeader) buscadorHeader.value = filtroTexto.value;
    dibujarCatalogo();
  });

  filtroTexto.addEventListener("keydown", (evento) => {
    if (evento.key === "Enter") {
      window.location.href = "catalogo.html?buscar=" +
        encodeURIComponent(filtroTexto.value.trim());
    }
  });

  /* Orden */
  $("filtro-orden").addEventListener("change", (evento) => {
    estadoCatalogo.orden = evento.target.value;
    estadoCatalogo.pagina = 1;
    dibujarCatalogo();
  });

  /* Chips de categoría (delegación: los botones se recrean en cada dibujo) */
  $("filtro-categorias").addEventListener("click", (evento) => {
    const chip = evento.target.closest(".chip");
    if (!chip) return;
    estadoCatalogo.categoria = chip.dataset.categoria;
    estadoCatalogo.pagina = 1;
    dibujarCategorias();
    dibujarCatalogo();
  });

  /* Acciones dentro de cada tarjeta */
  $("rejilla-productos").addEventListener("click", (evento) => {
    const tarjeta = evento.target.closest(".producto");
    if (!tarjeta) return;

    const producto = buscarProducto(tarjeta.dataset.id);
    if (!producto || producto.stock <= 0) return;

    /* Elegir talla */
    const botonTalla = evento.target.closest("[data-talla]");
    if (botonTalla) {
      $$("[data-talla]", tarjeta).forEach((b) => b.classList.remove("elegida"));
      botonTalla.classList.add("elegida");
      return;
    }

    /* Agregar al carrito */
    if (evento.target.closest('[data-accion="agregar"]')) {
      if (producto.stock === 0) { mostrarAviso("Este producto está agotado", "error"); return; }
      const elegida = $$("[data-talla].elegida", tarjeta)[0];
      const talla = elegida ? elegida.dataset.talla : producto.tallas[0];

      agregarAlCarrito(producto, talla, 1);
      mostrarAviso(`${producto.nombre} (${talla}) agregado al carrito`, "exito");
    }
  });
});
window.addEventListener("storage", evento => {
  if (evento.key !== CLAVE_PRODUCTOS && evento.key !== null) return;
  actualizarProductos();
  if (!CATEGORIAS.includes(estadoCatalogo.categoria)) estadoCatalogo.categoria = "Todas";
  dibujarCategorias();
  dibujarCatalogo();
});
