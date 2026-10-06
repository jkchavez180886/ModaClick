/* ==========================================================================
   pages/confirmacion.js — Confirmación del pedido (confirmacion-pedido.html).
   Muestra el contenido del carrito, valida los datos de envío y, al
   confirmar, registra el pedido y vacía el carrito.
   ========================================================================== */

/** Datos de envío que el pedido necesita para guardarse. */
const CLAVE_DATOS_ENVIO = clavePorUsuario("modaclick_datos_envio");

/** Días que se toman como entrega estimada al confirmar. */
const DIAS_ENTREGA_ESTIMADA = 3;

/** Campos del formulario de envío, en el orden en que se guardan. */
const CAMPOS_ENVIO = [
  "nombre-receptor",
  "telefono-receptor",
  "direccion-envio",
  "metodo-envio",
  "metodo-pago",
  "referencia",
];

/* --------------------------------------------------------------------------
   Tabla de productos
   -------------------------------------------------------------------------- */

/** Pinta los productos del carrito y el pie con los totales. */
function dibujarProductos() {
  const items = leerCarrito();

  $("cuerpo-productos").innerHTML = items
    .map((item) => {
      const subtotal = item.precio * item.cantidad;
      return `
      <tr>
        <td>
          <div class="confirmacion-producto">
            <img src="${escapar(item.imagen)}" alt="${escapar(item.nombre)}"
                 width="46" height="56">
            <div>
              <strong>${escapar(item.nombre)}</strong>
              <span>${moneda(item.precio)} c/u</span>
            </div>
          </div>
        </td>
        <td class="centrado">${escapar(item.talla)}</td>
        <td class="centrado">${item.cantidad}</td>
        <td class="col-acciones">${moneda(item.precio)}</td>
        <td class="col-acciones">${moneda(subtotal)}</td>
      </tr>`;
    })
    .join("");

  const totales = resumenCarrito();
  $("pie-productos").innerHTML = `
    <tr class="total-fila">
      <td colspan="4">Total</td>
      <td class="col-acciones">${moneda(totales.total)}</td>
    </tr>`;

  $("resumen-subtotal").textContent = moneda(totales.subtotal);
  $("resumen-envio").textContent = moneda(totales.envio);
  $("resumen-total").textContent = moneda(totales.total);
}

/* --------------------------------------------------------------------------
   Datos de envío
   -------------------------------------------------------------------------- */

/** Rellena los campos con lo que se guardó la última vez. */
function cargarDatosEnvio() {
  const datos = usarLeerDato(CLAVE_DATOS_ENVIO);
  const usuario = obtenerUsuarioSesion();
  if (usuario) {
    $("nombre-receptor").value = usuario.nombre;
    $("telefono-receptor").value = usuario.telefono;
    $("direccion-envio").value = usuario.direccion;
  }
  CAMPOS_ENVIO.forEach((id) => {
    if (datos[id] !== undefined) $(id).value = datos[id];
  });
}

/**
 * Valida los datos de envío.
 * @returns {string} el mensaje de error, o "" si todo está bien
 */
function validarEnvio() {
  if (!valorDe("nombre-receptor")) return "Ingresa el nombre de quien recibe el pedido.";
  if (!valorDe("direccion-envio")) return "Ingresa la dirección de envío.";

  const telefono = valorDe("telefono-receptor");
  if (!telefono) return "Ingresa el teléfono de contacto.";
  if (!esTelefono(telefono)) return "El teléfono debe tener exactamente 9 dígitos.";

  if (!valorDe("metodo-envio")) return "Selecciona el método de envío.";
  if (!valorDe("metodo-pago")) return "Selecciona el método de pago.";

  return "";
}

/* --------------------------------------------------------------------------
   Pantalla de pedido confirmado
   -------------------------------------------------------------------------- */

/**
 * Devuelve la fecha de hoy sumada cierta cantidad de días, en formato
 * YYYY-MM-DD (para los <input type="date">).
 * @param {number} dias
 * @returns {string}
 */
function sumarDiasIso(dias) {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + dias);
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

/**
 * Registra el pedido con los datos de envío y vacía el carrito.
 * @returns {{codigo: string, total: number}}
 */
function registrarPedido() {
  const total = resumenCarrito().total;

  const pedido = registrarPedidoCompra({
    codigo: null,
    cliente: valorDe("nombre-receptor"),
    fechaPedido: hoyIso(),
    fechaEntrega: sumarDiasIso(DIAS_ENTREGA_ESTIMADA),
    metodoPago: valorDe("metodo-pago"),
    tipoEntrega: valorDe("metodo-envio"),
    direccion: valorDe("direccion-envio"),
    total,
    estado: "Pendiente",
    observaciones: valorDe("referencia"),
  });



  vaciarCarrito();

  return { codigo: pedido.codigo, total };
}

/**
 * Muestra el cartel de pedido confirmado.
 * @param {string} codigo
 * @param {number} total
 */
function mostrarExito(codigo, total) {
  // Se cuelga del body, no de #capa: esa capa está oculta por defecto.
  document.body.insertAdjacentHTML(
    "beforeend",
    `
    <div class="confirmacion-exito" id="exito" role="dialog" aria-modal="true">
      <div class="confirmacion-exito-caja">
        <div class="confirmacion-exito-icono">
          <i class="fa-solid fa-check"></i>
        </div>
        <h3>¡Pedido confirmado!</h3>
        <p>Tu pedido se ha registrado correctamente.</p>
        <p class="confirmacion-exito-codigo">${escapar(codigo)}</p>
        <p>Total del pedido: <strong>${moneda(total)}</strong></p>

        <div class="confirmacion-exito-acciones">
          <a href="mis-pedidos.html" class="btn btn-primario btn-bloque">Ver mis pedidos</a>
          <a href="catalogo.html" class="btn btn-secundario btn-bloque">Seguir comprando</a>
        </div>
      </div>
    </div>`
  );

  $("exito").classList.add("abierta");
  $("exito").addEventListener("click", (evento) => {
    if (evento.target === evento.currentTarget) $("exito").remove();
  });
}

/* --------------------------------------------------------------------------
   Eventos
   -------------------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  if (!obtenerUsuarioSesion()) return;
  /* Llenamos los <select> con las opciones de js/datos/pedidos.js */
  $("metodo-envio").innerHTML =
    `<option value="">Seleccione</option>` +
    TIPOS_ENTREGA.map((o) => `<option>${escapar(o)}</option>`).join("");
  $("metodo-pago").innerHTML =
    `<option value="">Seleccione</option>` +
    METODOS_PAGO.map((o) => `<option>${escapar(o)}</option>`).join("");

  /* Si el carrito está vacío, lo avisamos y ocultamos el formulario */
  if (leerCarrito().length === 0) {
    $("contenido-confirmacion").classList.add("oculto");
    $("carrito-vacio").style.display = "block";
    return;
  }

  cargarDatosEnvio();
  dibujarProductos();

  /* El teléfono solo admite dígitos */
  $("telefono-receptor").addEventListener("input", (evento) => {
    evento.target.value = evento.target.value.replace(/\D/g, "").slice(0, 9);
  });

  /* Confirmar el pedido */
  $("confirmar-pedido").addEventListener("click", () => {
    const error = validarEnvio();
    $("error-pedido").textContent = error;

    if (error) {
      mostrarAviso("Revisa los datos de envío", "error");
      return;
    }

    // Recordamos los datos de envío para la próxima compra
    const datosEnvio = {};
    CAMPOS_ENVIO.forEach((id) => {
      datosEnvio[id] = valorDe(id);
    });
    usarGuardarDato(CLAVE_DATOS_ENVIO, datosEnvio);

    try {
      const pedido = registrarPedido();
      $("confirmar-pedido").disabled = true;
      mostrarExito(pedido.codigo, pedido.total);
    } catch (error) { $("error-pedido").textContent = error.message; }
  });
});
