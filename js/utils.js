/* ==========================================================================
   utils.js — Funciones de ayuda compartidas por todas las páginas.
   No hace nada por sí solo: aquí solo se exportan/utilizan funciones.
   ========================================================================== */

/* --------------------------------------------------------------------------
   1. Acceso al DOM
   -------------------------------------------------------------------------- */

/**
 * Busca un elemento por su id.
 * @param {string} id
 * @returns {HTMLElement|null}
 */
const $ = (id) => document.getElementById(id);

/**
 * Busca todos los elementos que cumplen un selector.
 * @param {string} selector
 * @param {ParentNode} [contexto] - dónde buscar (por defecto, todo el documento)
 * @returns {Element[]}
 */
const $$ = (selector, contexto = document) =>
  Array.from(contexto.querySelectorAll(selector));

/**
 * Crea un elemento con clase, texto y atributos en una sola llamada.
 * @param {string} etiqueta - por ejemplo "div" o "span"
 * @param {string} clase
 * @param {string} [texto]
 * @returns {HTMLElement}
 */
function crearElemento(etiqueta, clase, texto = "") {
  const el = document.createElement(etiqueta);
  if (clase) el.className = clase;
  if (texto) el.textContent = texto;
  return el;
}

/* --------------------------------------------------------------------------
   2. Texto y formatos
   -------------------------------------------------------------------------- */

/**
 * Escapa los caracteres especiales del HTML.
 * Úsalo SIEMPRE que vas a insertar texto del usuario dentro de un
 * innerHTML, así un cliente no puede inyectar código.
 * @param {*} texto
 * @returns {string}
 */
function escapar(texto) {
  if (texto === null || texto === undefined) return "";
  return String(texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Convierte un número a moneda peruana: 199 -> "S/ 199.00"
 * @param {number} monto
 * @returns {string}
 */
function moneda(monto) {
  return "S/ " + Number(monto || 0).toFixed(2);
}

/**
 * Convierte "2026-03-15" en "15/03/2026" (formato peruano).
 * @param {string} fechaIso - fecha en formato YYYY-MM-DD
 * @returns {string}
 */
function fechaCorta(fechaIso) {
  if (!fechaIso) return "";
  const [anio, mes, dia] = String(fechaIso).split("-");
  if (!dia) return fechaIso;
  return `${dia}/${mes}/${anio}`;
}

/**
 * Devuelve la fecha de hoy en formato YYYY-MM-DD, para los <input type="date">.
 * @returns {string}
 */
function hoyIso() {
  const ahora = new Date();
  const mes = String(ahora.getMonth() + 1).padStart(2, "0");
  const dia = String(ahora.getDate()).padStart(2, "0");
  return `${ahora.getFullYear()}-${mes}-${dia}`;
}

/* --------------------------------------------------------------------------
   3. Almacenamiento local
   Los datos de la demo se guardan en el navegador para funcionar sin
   servidor. Al conectar una base de datos, reemplaza usarGuardar() y
   usarLeer() por llamadas a tu API.
   -------------------------------------------------------------------------- */

/**
 * Lee un arreglo del localStorage. Si no hay nada o está corrupto,
 * devuelve los datos de ejemplo.
 * @param {string} clave
 * @param {Array} ejemplo
 * @returns {Array}
 */
function usarLeer(clave, ejemplo) {
  try {
    const guardado = JSON.parse(localStorage.getItem(clave));
    if (Array.isArray(guardado)) return guardado;
  } catch (error) {
    // localStorage puede estar bloqueado: seguimos con los datos de ejemplo
  }
  return ejemplo.map((item) => ({ ...item }));
}

/**
 * Guarda un arreglo en el localStorage. Si falla, no interrumpe la página.
 * @param {string} clave
 * @param {Array} datos
 */
function usarGuardar(clave, datos) {
  try {
    localStorage.setItem(clave, JSON.stringify(datos));
  } catch (error) {
    console.warn("No se pudo guardar en localStorage:", clave);
  }
}

/**
 * Lee un objeto del localStorage (datos que NO son un arreglo, por ejemplo
 * los campos de un formulario). Si no hay nada, devuelve el ejemplo.
 * @param {string} clave
 * @param {object} [ejemplo]
 * @returns {object}
 */
function usarLeerDato(clave, ejemplo = {}) {
  try {
    const guardado = JSON.parse(localStorage.getItem(clave));
    if (guardado && typeof guardado === "object" && !Array.isArray(guardado)) {
      return guardado;
    }
  } catch (error) {
    // localStorage bloqueado: seguimos con el ejemplo
  }
  return { ...ejemplo };
}

/**
 * Guarda un objeto en el localStorage. Si falla, no interrumpe la página.
 * @param {string} clave
 * @param {object} datos
 */
function usarGuardarDato(clave, datos) {
  usarGuardar(clave, datos);
}

/* --------------------------------------------------------------------------
   4. Aviso flotante (toast)
   -------------------------------------------------------------------------- */

/**
 * Muestra un aviso breve en la esquina inferior derecha.
 * El elemento #aviso debe existir en el HTML (lo agrega layout.js).
 * @param {string} mensaje
 * @param {"info"|"exito"|"error"} [tipo]
 */
function mostrarAviso(mensaje, tipo = "info") {
  const aviso = $("aviso");
  if (!aviso) {
    console.log("[aviso]", mensaje);
    return;
  }

  aviso.textContent = mensaje;
  aviso.className = "aviso visible";

  if (tipo === "exito") aviso.classList.add("exito");
  if (tipo === "error") aviso.classList.add("error");

  // Reinicia el temporizador si se llaman dos avisos seguidos
  clearTimeout(aviso._temporizador);
  aviso._temporizador = setTimeout(() => {
    aviso.classList.remove("visible");
  }, 2600);
}

/* --------------------------------------------------------------------------
   5. Confirmación
   -------------------------------------------------------------------------- */

/**
 * Devuelve una promesa que se resuelve a true/false según lo que elija
 * el usuario en el modal #modal-confirmar (lo crea layout.js).
 * @param {string} titulo
 * @param {string} mensaje
 * @returns {Promise<boolean>}
 */
function confirmar(titulo, mensaje) {
  return new Promise((resolver) => {
    const modal = $("modal-confirmar");
    if (!modal) {
      // Si no hay modal disponible, usamos el confirm del navegador
      resolver(window.confirm(mensaje));
      return;
    }

    $("confirmar-titulo").textContent = titulo;
    $("confirmar-mensaje").textContent = mensaje;
    modal.classList.add("abierta");

    const cerrar = (respuesta) => {
      modal.classList.remove("abierta");
      $("confirmar-ok").onclick = null;
      $("confirmar-cancelar").onclick = null;
      modal.onclick = null;
      document.removeEventListener("keydown", alPulsarTecla);
      resolver(respuesta);
    };

    const alPulsarTecla = (evento) => {
      if (evento.key === "Escape") cerrar(false);
    };

    $("confirmar-ok").onclick = () => cerrar(true);
    $("confirmar-cancelar").onclick = () => cerrar(false);
    // Cerrar haciendo clic fuera de la caja
    modal.onclick = (evento) => {
      if (evento.target === modal) cerrar(false);
    };
    document.addEventListener("keydown", alPulsarTecla);
  });
}

/* --------------------------------------------------------------------------
   6. Validaciones de formulario
   -------------------------------------------------------------------------- */

/**
 * Valida un teléfono peruano de 9 dígitos.
 * @param {string} valor
 * @returns {boolean}
 */
const esTelefono = (valor) => /^\d{9}$/.test(valor);

/**
 * Valida un correo electrónico.
 * @param {string} valor
 * @returns {boolean}
 */
const esCorreo = (valor) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);

/**
 * Devuelve el valor de un campo quitando los espacios sobrantes.
 * @param {string} id
 * @returns {string}
 */
const valorDe = (id) => ($(id)?.value || "").trim();

/* --------------------------------------------------------------------------
   7. Exportación
   Se asignan a window para poder llamarlos desde cualquier página sin
   tener que importar nada.
   -------------------------------------------------------------------------- */
window.$ = $;
window.$$ = $$;
window.crearElemento = crearElemento;
window.escapar = escapar;
window.moneda = moneda;
window.fechaCorta = fechaCorta;
window.hoyIso = hoyIso;
window.usarLeer = usarLeer;
window.usarGuardar = usarGuardar;
window.usarLeerDato = usarLeerDato;
window.usarGuardarDato = usarGuardarDato;
window.mostrarAviso = mostrarAviso;
window.confirmar = confirmar;
window.esTelefono = esTelefono;
window.esCorreo = esCorreo;
window.valorDe = valorDe;