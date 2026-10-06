/* ==========================================================================
   pages/clientes.js — Mantenimiento de clientes (clientes.html).
   Permite listar, buscar, crear, editar y eliminar clientes.
   Los datos se guardan en el navegador (js/datos/clientes.js).
   ========================================================================== */

/** Código del cliente que se está editando, o null si estamos creando uno. */
let clienteEnEdicion = null;

/* --------------------------------------------------------------------------
   Listado
   -------------------------------------------------------------------------- */

/**
 * Arma el HTML de una fila de la tabla.
 * @param {object} cliente
 * @returns {string}
 */
function htmlFilaCliente(cliente) {
  return `
    <tr>
      <td class="codigo-fila">${escapar(cliente.codigo)}</td>
      <td class="nombre-fila">${escapar(cliente.nombre)}</td>
      <td>${escapar(cliente.telefono)}</td>
      <td>${escapar(cliente.correo) || "—"}</td>
      <td>${escapar(cliente.talla) || "—"}</td>
      <td>${cliente.contacto ? `<span class="etiqueta">${escapar(cliente.contacto)}</span>` : "—"}</td>
      <td class="col-acciones">
        <button type="button" class="btn-accion editar" data-accion="editar"
                data-codigo="${escapar(cliente.codigo)}" title="Editar"
                aria-label="Editar ${escapar(cliente.nombre)}">
          <i class="fa-solid fa-pen"></i>
        </button>
        <button type="button" class="btn-accion borrar" data-accion="eliminar"
                data-codigo="${escapar(cliente.codigo)}" title="Eliminar"
                aria-label="Eliminar ${escapar(cliente.nombre)}">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </td>
    </tr>`;
}

/** Pinta la tabla con los clientes filtrados por la búsqueda. */
function dibujarClientes() {
  const todos = leerClientes();
  const visibles = filtrarClientes(todos, valorDe("buscar-cliente"));
  const cuerpo = $("cuerpo-clientes");
  const filas = paginarFilas("cuerpo-clientes", visibles, htmlFilaCliente, valorDe("buscar-cliente"));

  if (visibles.length === 0) {
    const mensaje = todos.length
      ? "Ningún cliente coincide con la búsqueda."
      : "Aún no hay clientes. Usa «Nuevo cliente» para registrar el primero.";
    cuerpo.innerHTML = `<tr><td colspan="7" class="vacio">${mensaje}</td></tr>`;
  } else {
    cuerpo.innerHTML = filas;
  }

  $("conteo-clientes").textContent =
    `${visibles.length} de ${todos.length} clientes coinciden con la búsqueda`;
}

/* --------------------------------------------------------------------------
   Formulario
   -------------------------------------------------------------------------- */

/**
 * Muestra un error dentro del formulario.
 * @param {string} mensaje - vacío para ocultarlo
 */
function errorCliente(mensaje) {
  $("error-cliente").textContent = mensaje || "";
}

/**
 * Abre el formulario en modo alta o edición.
 * @param {object|null} cliente - null para crear uno nuevo
 */
function abrirFormulario(cliente) {
  clienteEnEdicion = cliente ? cliente.codigo : null;

  $("titulo-formulario").textContent = cliente ? "Editar cliente" : "Nuevo cliente";
  $("cli-codigo").value = cliente ? cliente.codigo : "";
  $("cli-nombre").value = cliente ? cliente.nombre : "";
  $("cli-telefono").value = cliente ? cliente.telefono : "";
  $("cli-correo").value = cliente ? cliente.correo : "";
  $("cli-talla").value = cliente ? cliente.talla : "";
  $("cli-contacto").value = cliente ? cliente.contacto : "";
  $("cli-direccion").value = cliente ? cliente.direccion : "";
  errorCliente("");

  $("formulario-cliente").classList.remove("oculto");
  $("formulario-cliente").scrollIntoView({ behavior: "smooth", block: "start" });
  $("cli-nombre").focus();
}

function cerrarFormulario() {
  clienteEnEdicion = null;
  $("formulario-cliente").classList.add("oculto");
  errorCliente("");
}

/* --------------------------------------------------------------------------
   Validación y guardado
   -------------------------------------------------------------------------- */

/** Valida el formulario y guarda el cliente. Muestra el error si algo falla. */
function guardarClienteDesdeFormulario() {
  const nombre = valorDe("cli-nombre");
  const telefono = valorDe("cli-telefono");
  const correo = valorDe("cli-correo");

  if (!nombre) {
    errorCliente("Ingresa los nombres y apellidos del cliente.");
    return;
  }
  if (!esTelefono(telefono)) {
    errorCliente("El teléfono debe tener exactamente 9 dígitos.");
    return;
  }
  if (correo && !esCorreo(correo)) {
    errorCliente("Ingresa un correo válido, por ejemplo: nombre@ejemplo.com");
    return;
  }

  guardarCliente({
    codigo: clienteEnEdicion,
    nombre,
    telefono,
    correo,
    talla: valorDe("cli-talla"),
    contacto: valorDe("cli-contacto"),
    direccion: valorDe("cli-direccion"),
  });

  const eraEdicion = Boolean(clienteEnEdicion);
  cerrarFormulario();
  dibujarClientes();
  mostrarAviso(eraEdicion ? "Cliente actualizado" : "Cliente guardado", "exito");
}

/* --------------------------------------------------------------------------
   Eventos
   -------------------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  if (!esAdmin()) return;
  dibujarClientes();

  /* Búsqueda en vivo */
  $("buscar-cliente").addEventListener("input", dibujarClientes);

  /* Botón "Nuevo cliente" */
  $("nuevo-cliente").addEventListener("click", () => abrirFormulario(null));

  /* Guardar y cancelar */
  $("guardar-cliente").addEventListener("click", guardarClienteDesdeFormulario);
  $("cancelar-cliente").addEventListener("click", cerrarFormulario);

  /* El teléfono solo admite dígitos */
  $("cli-telefono").addEventListener("input", (evento) => {
    evento.target.value = evento.target.value.replace(/\D/g, "").slice(0, 9);
  });

  /* Editar y eliminar desde la tabla */
  $("cuerpo-clientes").addEventListener("click", async (evento) => {
    const boton = evento.target.closest("[data-accion]");
    if (!boton) return;

    const codigo = boton.dataset.codigo;

    if (boton.dataset.accion === "editar") {
      const cliente = leerClientes().find((x) => x.codigo === codigo);
      if (cliente) abrirFormulario(cliente);
      return;
    }

    const cliente = leerClientes().find((x) => x.codigo === codigo);
    const aceptado = await confirmar(
      "Eliminar cliente",
      `Se eliminará a ${cliente ? cliente.nombre : codigo} (${codigo}). Esta acción no se puede deshacer.`
    );

    if (aceptado) {
      eliminarCliente(codigo);
      if (clienteEnEdicion === codigo) cerrarFormulario();
      dibujarClientes();
      mostrarAviso("Cliente eliminado");
    }
  });
});
