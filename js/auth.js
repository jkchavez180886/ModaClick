const PAGINAS_ADMIN = ["usuarios.html", "productos.html", "clientes.html", "pedidos.html", "dashboard-admin.html", "panel-admin.html"];
const PAGINAS_SESION = ["perfil.html", "cliente.html", "mis-pedidos.html", "dashboard-usuario.html", "confirmacion-pedido.html"];
function comprobarAcceso() {
  const pagina = location.pathname.split("/").pop();
  const usuario = obtenerUsuarioSesion();
  if ((PAGINAS_ADMIN.includes(pagina) || PAGINAS_SESION.includes(pagina)) && !usuario) {
    document.body.classList.add("acceso-denegado");
    location.replace("../index.html?volver=" + encodeURIComponent(pagina));
    return false;
  }
  if (PAGINAS_ADMIN.includes(pagina) && !esAdmin()) {
    document.body.classList.add("acceso-denegado");
    location.replace("dashboard-usuario.html");
    return false;
  }
  return true;
}
comprobarAcceso();
window.addEventListener("storage", e => { if (e.key === CLAVE_USUARIOS || e.key === null) { if (comprobarAcceso()) location.reload(); } });
window.addEventListener("pageshow", e => { if (e.persisted && comprobarAcceso()) location.reload(); });
