/* ==========================================================================
   pages/pedidos.js — Mantenimiento de pedidos (pedidos.html).
   Permite listar, filtrar por estado, crear, editar y eliminar pedidos.
   Los datos se guardan en el navegador (js/datos/pedidos.js).
   ========================================================================== */

/** Código del pedido que se está editando, o null si estamos creando uno. */
let pedidoEnEdicion = null;

/* --------------------------------------------------------------------------
   Listas de opciones
   -------------------------------------------------------------------------- */

/**
 * Llena un <select> con una lista de valores.
 * @param {string} id - id del select
 * @param {string[]} valores
 * @param {string} [primera] - texto de la opción vacía
 */
function llenarSelect(id, valores, primera) {
  const opciones = primera ? [`<option value="">${primera}</option>`] : [];
  $(id).innerHTML =
    opciones.concat(valores.map((v) => `<option>${escapar(v)}</option>`)).join("");
}

/* --------------------------------------------------------------------------
   Listado
   -------------------------------------------------------------------------- */

/**
 * Arma el HTML de una fila de la tabla.
 * @param {object} pedido
 * @returns {string}
 */
function htmlFilaPedido(pedido) {
  const color = colorEstadoPedido(pedido.estado);

  return `
    <tr>
      <td class="codigo-fila">${escapar(pedido.codigo)}</td>
      <td class="nombre-fila">${escapar(pedido.cliente)}</td>
      <td>${fechaCorta(pedido.fechaPedido)}</td>
      <td>${fechaCorta(pedido.fechaEntrega)}</td>
      <td>${escapar(pedido.metodoPago) || "—"}</td>
      <td>${escapar(pedido.tipoEntrega) || "—"}</td>
      <td>${escapar(pedido.direccion) || "—"}</td>
      <td>${pedido.total ? moneda(pedido.total) : "—"}</td>
      <td><span class="etiqueta ${color}">${escapar(pedido.estado)}</span></td>
      <td>${escapar(pedido.observaciones) || "—"}</td>
      <td class="col-acciones">
        <button type="button" class="btn-accion editar" data-accion="editar"
                data-codigo="${escapar(pedido.codigo)}" title="Editar"
                aria-label="Editar pedido ${escapar(pedido.codigo)}">
          <i class="fa-solid fa-pen"></i>
        </button>
        <button type="button" class="btn-accion borrar" data-accion="eliminar"
                data-codigo="${escapar(pedido.codigo)}" title="Eliminar"
                aria-label="Eliminar pedido ${escapar(pedido.codigo)}">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </td>
    </tr>`;
}

/** Pinta la tabla con los pedidos filtrados. */
function dibujarPedidos() {
  const todos = leerPedidos();
  const visibles = filtrarPedidos(
    todos,
    valorDe("buscar-pedido"),
    $("filtro-estado-pedido").value
  );
  const cuerpo = $("cuerpo-pedidos");
  const filas = paginarFilas("cuerpo-pedidos", visibles, htmlFilaPedido, JSON.stringify([valorDe("buscar-pedido"), $("filtro-estado-pedido").value]));

  if (visibles.length === 0) {
    const mensaje = todos.length
      ? "Ningún pedido coincide con los filtros aplicados."
      : "Aún no hay pedidos registrados.";
    cuerpo.innerHTML = `<tr><td colspan="11" class="vacio">${mensaje}</td></tr>`;
  } else {
    cuerpo.innerHTML = filas;
  }

  $("conteo-pedidos").textContent =
    `${visibles.length} de ${todos.length} pedidos coinciden con los filtros`;
}

/* --------------------------------------------------------------------------
   Formulario
   -------------------------------------------------------------------------- */

/**
 * Muestra un error dentro del formulario.
 * @param {string} mensaje - vacío para ocultarlo
 */
function errorPedido(mensaje) {
  $("error-pedido").textContent = mensaje || "";
}

/**
 * Abre el formulario en modo alta o edición.
 * @param {object|null} pedido - null para crear uno nuevo
 */
function abrirFormulario(pedido) {
  pedidoEnEdicion = pedido ? pedido.codigo : null;

  $("titulo-formulario").textContent = pedido ? `Editar pedido ${pedido.codigo}` : "Nuevo pedido";
  $("ped-codigo").value = pedido ? pedido.codigo : "";
  $("ped-cliente").value = pedido ? pedido.cliente : "";
  $("ped-fecha-pedido").value = pedido ? pedido.fechaPedido : hoyIso();
  $("ped-fecha-entrega").value = pedido ? pedido.fechaEntrega : "";
  $("ped-metodo-pago").value = pedido ? pedido.metodoPago : "";
  $("ped-tipo-entrega").value = pedido ? pedido.tipoEntrega : "";
  $("ped-estado").value = pedido ? pedido.estado : "Pendiente";
  $("ped-direccion").value = pedido ? pedido.direccion : "";
  $("ped-total").value = pedido && pedido.total ? pedido.total : "";
  $("ped-observaciones").value = pedido ? pedido.observaciones : "";
  errorPedido("");

  $("formulario-pedido").classList.remove("oculto");
  $("formulario-pedido").scrollIntoView({ behavior: "smooth", block: "start" });
  $("ped-cliente").focus();
}

function cerrarFormulario() {
  pedidoEnEdicion = null;
  $("formulario-pedido").classList.add("oculto");
  errorPedido("");
}

/* --------------------------------------------------------------------------
   Validación y guardado
   -------------------------------------------------------------------------- */

/** Valida el formulario y guarda el pedido. */
function guardarPedidoDesdeFormulario() {
  const cliente = valorDe("ped-cliente");
  const fechaPedido = valorDe("ped-fecha-pedido");
  const fechaEntrega = valorDe("ped-fecha-entrega");
  const tipoEntrega = valorDe("ped-tipo-entrega");

  if (!cliente) {
    errorPedido("Ingresa el nombre del cliente.");
    return;
  }
  if (!fechaPedido) {
    errorPedido("Selecciona la fecha del pedido.");
    return;
  }
  if (!fechaEntrega) {
    errorPedido("Selecciona la fecha de entrega estimada.");
    return;
  }
  if (fechaEntrega < fechaPedido) {
    errorPedido("La fecha de entrega no puede ser anterior a la del pedido.");
    return;
  }
  if (tipoEntrega === "Delivery" && !valorDe("ped-direccion")) {
    errorPedido("Si el envío es por delivery, ingresa la dirección.");
    return;
  }

  guardarPedido({
    codigo: pedidoEnEdicion,
    cliente,
    fechaPedido,
    fechaEntrega,
    metodoPago: valorDe("ped-metodo-pago"),
    tipoEntrega,
    direccion: valorDe("ped-direccion"),
    total: Number(valorDe("ped-total")) || 0,
    estado: valorDe("ped-estado") || "Pendiente",
    observaciones: valorDe("ped-observaciones"),
  });

  const eraEdicion = Boolean(pedidoEnEdicion);
  cerrarFormulario();
  dibujarPedidos();
  mostrarAviso(eraEdicion ? "Pedido actualizado" : "Pedido guardado", "exito");
}

/* --------------------------------------------------------------------------
   Eventos
   -------------------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  if (!esAdmin()) return;
  /* Llenamos las listas de estados, pagos y tipos de entrega */
  llenarSelect("ped-metodo-pago", METODOS_PAGO, "Seleccione");
  llenarSelect("ped-tipo-entrega", TIPOS_ENTREGA, "Seleccione");
  llenarSelect("ped-estado", ESTADOS_PEDIDO);

  /* El filtro de estado usa el texto completo, no el valor vacío */
  $("filtro-estado-pedido").innerHTML =
    `<option value="Todos">Todos los estados</option>` +
    ESTADOS_PEDIDO.map((e) => `<option>${escapar(e)}</option>`).join("");

  dibujarPedidos();

  /* Búsqueda y filtro */
  $("buscar-pedido").addEventListener("input", dibujarPedidos);
  $("filtro-estado-pedido").addEventListener("change", dibujarPedidos);

  /* Botón "Nuevo pedido" */
  $("nuevo-pedido").addEventListener("click", () => abrirFormulario(null));

  /* Guardar y cancelar */
  $("guardar-pedido").addEventListener("click", guardarPedidoDesdeFormulario);
  $("cancelar-pedido").addEventListener("click", cerrarFormulario);

  /* Editar y eliminar desde la tabla */
  $("cuerpo-pedidos").addEventListener("click", async (evento) => {
    const boton = evento.target.closest("[data-accion]");
    if (!boton) return;

    const codigo = boton.dataset.codigo;

    if (boton.dataset.accion === "editar") {
      const pedido = leerPedidos().find((x) => x.codigo === codigo);
      if (pedido) abrirFormulario(pedido);
      return;
    }

    const pedido = leerPedidos().find((x) => x.codigo === codigo);
    const aceptado = await confirmar(
      "Eliminar pedido",
      `Se eliminará el pedido ${codigo} de ${pedido ? pedido.cliente : ""}. Esta acción no se puede deshacer.`
    );

    if (aceptado) {
      eliminarPedido(codigo);
      if (pedidoEnEdicion === codigo) cerrarFormulario();
      dibujarPedidos();
      mostrarAviso("Pedido eliminado");
    }
  });
});
