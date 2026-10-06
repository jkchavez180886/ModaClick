document.addEventListener("DOMContentLoaded", () => {
  if (!obtenerUsuarioSesion()) return;
  const lista = leerMisPedidos().slice().reverse();
  $("lista-mis-pedidos").innerHTML = lista.map(p => `<tr><td>${escapar(p.codigo)}</td><td>${escapar(fechaCorta(p.fechaPedido))}</td><td><span class="etiqueta ${colorEstadoPedido(p.estado)}">${escapar(p.estado)}</span></td><td>${moneda(p.total)}</td><td>${escapar(p.tipoEntrega)}</td><td>${(p.items || []).map(i => `${escapar(i.nombre)} (${escapar(i.talla)}) × ${Number(i.cantidad)}`).join("<br>")}</td></tr>`).join("");
  $("sin-pedidos").classList.toggle("oculto", lista.length > 0);
  $("conteo-mis-pedidos").textContent = `${lista.length} pedidos`;
});
