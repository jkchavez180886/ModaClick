/* ==========================================================================
   pages/cliente.js — Formulario de datos del cliente (cliente.html).
   Guarda los datos del cliente en el navegador y los recupera al abrir la
   página, para no perderlos al recargar.
   ========================================================================== */

const CLAVE_DATOS_CLIENTE = clavePorUsuario("modaclick_datos_cliente");

/** Campos del formulario, en el orden en que se guardan. */
const CAMPOS_CLIENTE = [
  "nombres",
  "apellidos",
  "sexo",
  "fecha-nacimiento",
  "talla-preferida",
  "preferencia-contacto",
  "correo",
  "telefono",
  "direccion",
  "distrito",
  "ciudad",
  "como-conocio",
];

/* --------------------------------------------------------------------------
   Guardar y recuperar
   -------------------------------------------------------------------------- */

/** Lee los valores de todos los campos del formulario. */
function leerCampos() {
  const datos = {};
  CAMPOS_CLIENTE.forEach((id) => {
    datos[id] = $(id).value;
  });
  return datos;
}

/** Vuelca los datos guardados dentro del formulario. */
function cargarCampos() {
  const datos = usarLeerDato(CLAVE_DATOS_CLIENTE);
  CAMPOS_CLIENTE.forEach((id) => {
    if (datos[id] !== undefined) $(id).value = datos[id];
  });
}

/** Vacía todos los campos del formulario. */
function limpiarCampos() {
  CAMPOS_CLIENTE.forEach((id) => {
    $(id).value = "";
  });
  $("error-cliente").textContent = "";
}

/* --------------------------------------------------------------------------
   Validación
   -------------------------------------------------------------------------- */

/**
 * Revisa los campos obligatorios.
 * @returns {string} el mensaje de error, o "" si todo está bien
 */
function validarCampos() {
  if (!valorDe("nombres")) return "Ingresa tus nombres.";
  if (!valorDe("apellidos")) return "Ingresa tus apellidos.";

  const correo = valorDe("correo");
  if (!correo) return "Ingresa tu correo electrónico.";
  if (!esCorreo(correo)) return "El correo no tiene un formato válido.";

  const telefono = valorDe("telefono");
  if (!telefono) return "Ingresa tu teléfono.";
  if (!esTelefono(telefono)) return "El teléfono debe tener exactamente 9 dígitos.";

  return "";
}

/* --------------------------------------------------------------------------
   Eventos
   -------------------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  if (!obtenerUsuarioSesion()) return;
  cargarCampos();

  /* El teléfono solo admite dígitos */
  $("telefono").addEventListener("input", (evento) => {
    evento.target.value = evento.target.value.replace(/\D/g, "").slice(0, 9);
  });

  /* Guardar */
  $("formulario-cliente").addEventListener("submit", (evento) => {
    evento.preventDefault();

    const error = validarCampos();
    $("error-cliente").textContent = error;

    if (error) {
      mostrarAviso("Revisa los datos del formulario", "error");
      return;
    }

    usarGuardarDato(CLAVE_DATOS_CLIENTE, leerCampos());
    mostrarAviso("Datos guardados correctamente", "exito");
  });

  /* Limpiar */
  $("limpiar-cliente").addEventListener("click", () => {
    limpiarCampos();
    mostrarAviso("Formulario limpiado");
  });
});
