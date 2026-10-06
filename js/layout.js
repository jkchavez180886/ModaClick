/* ==========================================================================
   layout.js — Componente reutilizable que dibuja el sidebar, el header y el
   footer en TODAS las páginas.

   Cómo usarlo, en cualquier página del sitio:
     <body>
       <div class="app">
         <div id="app-sidebar"></div>   <-- se rellena solo
         <div class="app-contenido">
           <header id="app-header"></header>  <-- se rellena solo
           <main class="app-main">
             ... contenido propio de la página ...
           </main>
           <footer id="app-footer"></footer>  <-- se rellena solo
         </div>
       </div>
       <div class="capa" id="capa"></div>
     </body>

   Para cambiar el menú, la marca o el usuario, edita SOLO este archivo.
   ========================================================================== */

/* --------------------------------------------------------------------------
   1. Configuración
   -------------------------------------------------------------------------- */

const MARCA = {
  nombre: "ModaClick",
  lema: "Tu estilo, en un clic",
  logo: "../assets/img/logo.png",
};

const sesionLayout = obtenerUsuarioSesion();
const USUARIO = {
  nombre: escapar(sesionLayout?.nombre || "Invitado"),
  nombreCompleto: escapar(sesionLayout?.nombre || "Invitado"),
  correo: escapar(sesionLayout?.correo || "Explora nuestro catálogo"),
  foto: "../assets/img/admin/owner.png",
};

/**
 * Opciones que puede cambiar cada página.
 * @typedef {Object} OpcionesLayout
 * @property {string}  [titulo]    - título que aparece en el header
 * @property {boolean} [buscador]  - mostrar el buscador del header (por defecto true)
 * @property {boolean} [notificar] - mostrar el botón de notificaciones
 */

/* --------------------------------------------------------------------------
   2. Menú lateral
   El enlace activo se marca comparando esta URL con la del navegador.
   -------------------------------------------------------------------------- */
const ENLACES_MENU = [
  ...(sesionLayout ? [{ texto: "Inicio", icono: "fa-house", href: esAdmin() ? "dashboard-admin.html" : "dashboard-usuario.html" }] : []),
  { texto: "Catálogo", icono: "fa-book-open", href: "catalogo.html" },
  { texto: "Carrito de compras", icono: "fa-cart-shopping", href: "carrito.html" },
  ...(sesionLayout ? [
    { texto: "Mi perfil", icono: "fa-user", href: "perfil.html" },
    { texto: "Mis datos", icono: "fa-id-card", href: "cliente.html" },
    { texto: "Mis pedidos", icono: "fa-cart-flatbed", href: "mis-pedidos.html" },
  ] : [{ texto: "Iniciar sesión", icono: "fa-user", href: "../index.html" }]),
  ...(esAdmin() ? [
    { texto: "Gestión de usuarios", icono: "fa-users-gear", href: "usuarios.html" },
    { texto: "Gestionar productos", icono: "fa-tags", href: "productos.html" },
    { texto: "Lista de clientes", icono: "fa-users", href: "clientes.html" },
    { texto: "Registro de pedidos", icono: "fa-cart-flatbed", href: "pedidos.html" },
    { texto: "Configuración", icono: "fa-wrench", href: "panel-admin.html" },
  ] : []),
];

/* --------------------------------------------------------------------------
   3. Generadores de cada pieza
   -------------------------------------------------------------------------- */

function htmlSidebar() {
  const actual = archivoActual();
  let yaMarcado = false;

  const enlaces = ENLACES_MENU.map((enlace) => {
    // "Inicio" y "Panel Administrativo" apuntan al mismo archivo: para que no
    // queden los dos resaltados, solo se marca el primero que coincide.
    const esActual = enlace.href === actual && !yaMarcado;
    if (esActual) yaMarcado = true;

    return `
      <li>
        <a href="${enlace.href}" class="${esActual ? "activo" : ""}" ${esActual ? 'aria-current="page"' : ""}>
          <i class="fa-solid ${enlace.icono}"></i>
          <span>${enlace.texto}</span>
        </a>
      </li>`;
  }).join("");

  return `
    <div class="sidebar-logo">
      <a href="catalogo.html" class="fila">
        <img src="${MARCA.logo}" alt="${MARCA.nombre}">
        <div>
          <strong>${MARCA.nombre}</strong>
          <span>${MARCA.lema}</span>
        </div>
      </a>
    </div>

    <nav class="sidebar-nav">
      <p class="sidebar-titulo">Menú</p>
      <ul>${enlaces}</ul>
    </nav>`;
}

function htmlHeader(opciones) {
  const titulo = opciones.titulo || MARCA.nombre;

  const buscador = opciones.buscador === false ? "" : `
      <div class="buscador">
        <i class="fa-solid fa-magnifying-glass"></i>
        <input type="search" id="buscador-header" placeholder="Buscar en la página...">
      </div>`;

  const notificaciones = opciones.notificar === false ? "" : `
      <button class="btn-icono" id="btn-notificaciones" title="Notificaciones">
        <span class="punto"></span>
        <i class="fa-regular fa-bell"></i>
      </button>`;

  return `
      <button class="btn-menu" id="btn-menu" title="Abrir menú" aria-label="Abrir menú" aria-controls="app-sidebar" aria-expanded="false">
        <i class="fa-solid fa-bars"></i>
      </button>

      <h1 class="titulo-header">${titulo}</h1>
      ${buscador}

      <div class="header-acciones">
        ${notificaciones}

        <button class="btn-icono" id="btn-tema" title="Cambiar entre claro y oscuro">
          <i class="fa-solid fa-moon"></i>
        </button>

        <div class="usuario">
          <button class="usuario-btn" id="btn-usuario" aria-haspopup="true" aria-controls="menu-usuario" aria-expanded="false">
            <span class="avatar-usuario" aria-hidden="true">${escapar((sesionLayout?.nombre || "I").slice(0, 1).toUpperCase())}</span>
            <span id="usuario-nombre">${USUARIO.nombre}</span>
            <i class="fa-solid fa-chevron-down texto-pequeno"></i>
          </button>

          <div class="dropdown" id="menu-usuario">
            <div class="dropdown-cabecera">
              <strong id="usuario-nombre-completo">${USUARIO.nombreCompleto}</strong>
              <span id="usuario-correo">${USUARIO.correo}</span>
            </div>
            <a href="${sesionLayout ? "perfil.html" : "../index.html"}"><i class="fa-regular fa-user"></i> ${sesionLayout ? "Editar perfil" : "Iniciar sesión"}</a>
            <button type="button" id="btn-cerrar-sesion" class="peligro">
              <i class="fa-solid fa-arrow-right-from-bracket"></i> Cerrar sesión
            </button>
          </div>
        </div>
      </div>`;
}

function htmlFooter() {
  const anio = new Date().getFullYear();
  return `
    <p>&copy; ${anio} ${MARCA.nombre}. Todos los derechos reservados.</p>`;
}

/* --------------------------------------------------------------------------
   4. Piezas globales: aviso flotante y modal de confirmación
   Las crea layout.js para que no haya que repetirlas en cada HTML.
   -------------------------------------------------------------------------- */
function htmlGlobales() {
  return `
  <div class="aviso" id="aviso" role="status"></div>

  <div class="modal" id="modal-confirmar" role="dialog" aria-modal="true">
    <div class="modal-caja">
      <h3 id="confirmar-titulo">Confirmar</h3>
      <p id="confirmar-mensaje"></p>
      <div class="modal-acciones">
        <button class="btn btn-secundario" id="confirmar-cancelar">Cancelar</button>
        <button class="btn btn-peligro" id="confirmar-ok">Eliminar</button>
      </div>
    </div>
  </div>`;
}

/* --------------------------------------------------------------------------
   5. Punto de entrada
   -------------------------------------------------------------------------- */

/**
 * Devuelve el nombre del archivo HTML actual, para marcar el menú activo.
 * @returns {string}
 */
function archivoActual() {
  const partes = window.location.pathname.split("/");
  return partes[partes.length - 1] || "index.html";
}

/**
 * Dibuja el sidebar, el header y el footer dentro de los contenedores
 * <div id="app-sidebar">, <header id="app-header"> y <footer id="app-footer">.
 * @param {OpcionesLayout} [opciones]
 */
function montarLayout(opciones = {}) {
  const lateral = $("app-sidebar");
  const cabecera = $("app-header");
  const pie = $("app-footer");

  if (lateral) lateral.innerHTML = htmlSidebar();
  if (cabecera) cabecera.innerHTML = htmlHeader(opciones);
  if (pie) pie.innerHTML = htmlFooter();

  // Las piezas globales se insertan una sola vez al final del <body>
  if (!$("aviso")) {
    document.body.insertAdjacentHTML("beforeend", htmlGlobales());
  }
}

montarLayout({
  titulo: document.body.dataset.titulo || "",
  buscador: document.body.dataset.buscador !== "no",
});

/* Exportado por si alguna página necesita redibujar el layout */
window.montarLayout = montarLayout;

function actualizarUsuarioHeader() {
  const u = obtenerUsuarioSesion();
  if ($("usuario-nombre")) $("usuario-nombre").textContent = u?.nombre || "Invitado";
  if ($("usuario-nombre-completo")) $("usuario-nombre-completo").textContent = u?.nombre || "Invitado";
  if ($("usuario-correo")) $("usuario-correo").textContent = u?.correo || "";
  const avatar = document.querySelector(".avatar-usuario");
  if (avatar) avatar.textContent = (u?.nombre || "I").slice(0, 1).toUpperCase();
}
document.querySelectorAll('.migas a[href="dashboard-admin.html"]').forEach(a => a.href = esAdmin() ? "dashboard-admin.html" : sesionLayout ? "dashboard-usuario.html" : "catalogo.html");
