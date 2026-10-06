document.addEventListener("DOMContentLoaded", () => {
  $("form-login").addEventListener("submit", async e => {
    e.preventDefault();
    const boton = e.currentTarget.querySelector('[type="submit"]');
    if (boton.disabled) return;
    boton.disabled = true;
    try {
      const usuario = await iniciarSesion(valorDe("usuario"), $("clave").value);
      const volver = new URLSearchParams(location.search).get("volver");
      const permitidas = ["catalogo.html", "carrito.html", "confirmacion-pedido.html", "perfil.html", "cliente.html", "mis-pedidos.html", "dashboard-usuario.html"];
      if (usuario.rol === "admin") permitidas.push("usuarios.html", "productos.html", "clientes.html", "pedidos.html", "dashboard-admin.html", "panel-admin.html");
      location.href = "pages/" + (permitidas.includes(volver) ? volver : usuario.rol === "admin" ? "dashboard-admin.html" : "catalogo.html");
    } catch(error) { $("login-error").textContent = error.message; boton.disabled = false; }
  });
});
