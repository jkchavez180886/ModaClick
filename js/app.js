/* ==========================================================================
   app.js — Comportamientos comunes a todas las páginas:
   modo oscuro, menú lateral en móvil, menú de usuario y pantalla de carga.
   Se carga después de layout.js y utils.js.
   ========================================================================== */

/* --------------------------------------------------------------------------
   1. Modo oscuro
   Se guarda en localStorage para que la preferencia persista al recargar.
   -------------------------------------------------------------------------- */
const CLAVE_TEMA = "modaclick_tema";

/**
 * Aplica el tema claro u oscuro y actualiza el icono del botón.
 * @param {"claro"|"oscuro"} tema
 */
function aplicarTema(tema) {
  document.documentElement.classList.toggle("tema-oscuro", tema === "oscuro");

  const boton = $("btn-tema");
  if (boton) {
    const icono = boton.querySelector("i");
    icono.className = tema === "oscuro" ? "fa-solid fa-sun" : "fa-solid fa-moon";
    boton.title = tema === "oscuro" ? "Cambiar a tema claro" : "Cambiar a tema oscuro";
  }

  try {
    localStorage.setItem(CLAVE_TEMA, tema);
  } catch (error) {
    // Si no se puede guardar, el tema igual funciona en esta sesión
  }
}

/** Alterna entre tema claro y oscuro. */
function alternarTema() {
  const actualOscuro = document.documentElement.classList.contains("tema-oscuro");
  aplicarTema(actualOscuro ? "claro" : "oscuro");
}

/** Restaura el tema guardado (o el claro si no hay ninguno). */
function restaurarTema() {
  let guardado = "claro";
  try {
    guardado = localStorage.getItem(CLAVE_TEMA) || "claro";
  } catch (error) {
    guardado = "claro";
  }
  aplicarTema(guardado);
}

// Se aplica lo antes posible para evitar el parpadeo blanco al recargar
restaurarTema();

/* --------------------------------------------------------------------------
   2. Menú lateral en móvil
   -------------------------------------------------------------------------- */

/** Muestra u oculta el menú lateral y la capa oscura de fondo. */
function alternarMenuLateral() {
  const lateral = $("app-sidebar");
  if (!lateral) return;

  const abierto = lateral.classList.toggle("abierta");
  lateral.inert = !abierto;
  $("btn-menu")?.setAttribute("aria-expanded", String(abierto));
  document.body.classList.toggle("menu-abierto", abierto);
  ocultarCapa(!abierto);
}

function ocultarCapa(forzarOculta = true) {
  const capa = $("capa");
  if (!capa) return;
  capa.classList.toggle("visible", !forzarOculta);
}

function cerrarMenuLateral() {
  const lateral = $("app-sidebar");
  if (lateral) lateral.classList.remove("abierta");
  if (lateral) lateral.inert = window.innerWidth <= 1024;
  $("btn-menu")?.setAttribute("aria-expanded", "false");
  document.body.classList.remove("menu-abierto");
  ocultarCapa(true);
}

/* --------------------------------------------------------------------------
   3. Menú desplegable del usuario
   -------------------------------------------------------------------------- */

/** Abre o cierra el desplegable #menu-usuario. */
function alternarMenuUsuario() {
  const menu = $("menu-usuario");
  if (menu) {
    const abierto = menu.classList.toggle("abierta");
    $("btn-usuario")?.setAttribute("aria-expanded", String(abierto));
  }
}

function cerrarMenuUsuario() {
  const menu = $("menu-usuario");
  if (menu) menu.classList.remove("abierta");
  $("btn-usuario")?.setAttribute("aria-expanded", "false");
}

/* --------------------------------------------------------------------------
   4. Pantalla de carga
   La quita un instante después de que la página esté lista.
   -------------------------------------------------------------------------- */
function quitarPreloader() {
  const preloader = $("preloader");
  if (!preloader) return;
  setTimeout(() => preloader.classList.add("oculto"), 120);
}

/* --------------------------------------------------------------------------
   5. Buscador del header
   Redirige al catálogo filtrando por lo que se escriba.
   -------------------------------------------------------------------------- */
function conectarBuscador() {
  const campo = $("buscador-header");
  if (!campo) return;

  campo.addEventListener("keydown", (evento) => {
    if (evento.key !== "Enter") return;
    const texto = campo.value.trim();
    if (!texto) return;
    window.location.href = "catalogo.html?buscar=" + encodeURIComponent(texto);
  });
}

/* --------------------------------------------------------------------------
   6. Cerrar sesión
   Borra la sesión guardada y vuelve al login.
   -------------------------------------------------------------------------- */
function cerrarSesion() {
  try {
    sessionStorage.removeItem("modaclick_sesion");
    localStorage.removeItem("modaclick_tema");
  } catch (error) {
    // sin almacenamiento, la redirección sigue funcionando
  }
  window.location.href = "../index.html";
}

/* --------------------------------------------------------------------------
   7. Eventos
   Se conectan una sola vez, cuando el DOM ya está listo.
   -------------------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  cerrarMenuLateral();
  /* Botón de hamburguesa */
  $("btn-menu")?.addEventListener("click", alternarMenuLateral);

  /* Capa oscura: al pulsarla se cierra el menú */
  $("capa")?.addEventListener("click", cerrarMenuLateral);

  /* Botón de tema */
  $("btn-tema")?.addEventListener("click", alternarTema);

  /* Menú de usuario */
  $("btn-usuario")?.addEventListener("click", alternarMenuUsuario);
  $("btn-cerrar-sesion")?.addEventListener("click", cerrarSesion);

  /* Al hacer clic fuera del desplegable, se cierra */
  document.addEventListener("click", (evento) => {
    if (!evento.target.closest(".usuario")) cerrarMenuUsuario();
  });

  /* Al presionar Escape se cierra todo lo abierto */
  document.addEventListener("keydown", (evento) => {
    if (evento.key !== "Escape") return;
    cerrarMenuUsuario();
    cerrarMenuLateral();
  });

  /* Si la ventana crece hasta ser de escritorio, el menú móvil se cierra */
  window.addEventListener("resize", () => {
    if (window.innerWidth > 1024) cerrarMenuLateral();
    else if (!$("app-sidebar")?.classList.contains("abierta")) cerrarMenuLateral();
  });

  conectarBuscador();
  quitarPreloader();
});
