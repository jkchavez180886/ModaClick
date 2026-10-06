/* Paginación compartida: se generan solamente diez filas por página. */
const estadosTablas = new Map();
function paginarFilas(id, lista, htmlFila, filtro = "") {
  const cuerpo = $(id);
  let estado = estadosTablas.get(id);
  if (!estado) {
    const pie = document.createElement("div");
    pie.className = "tabla-paginacion";
    const conteo = document.createElement("p");
    conteo.className = "conteo";
    conteo.setAttribute("role", "status");
    const nav = document.createElement("nav");
    nav.setAttribute("aria-label", "Páginas de la tabla");
    pie.append(conteo, nav);
    (cuerpo.closest(".tabla-envoltura") || cuerpo.closest("table")).after(pie);
    estado = { pagina: 1, filtro, conteo, nav };
    estadosTablas.set(id, estado);
    nav.addEventListener("click", e => {
      const boton = e.target.closest("[data-pagina-tabla]");
      if (!boton || boton.disabled) return;
      estado.pagina = Number(boton.dataset.paginaTabla);
      cuerpo.innerHTML = paginarFilas(id, estado.lista, estado.htmlFila, estado.filtro);
      nav.querySelector('[aria-current="page"]')?.focus({ preventScroll: true });
    });
  }
  if (estado.filtro !== filtro) estado.pagina = 1;
  Object.assign(estado, { lista, htmlFila, filtro });
  const paginas = Math.max(1, Math.ceil(lista.length / 10));
  estado.pagina = Math.min(estado.pagina, paginas);
  const inicio = (estado.pagina - 1) * 10;
  estado.conteo.textContent = lista.length ? `Mostrando ${inicio + 1}–${Math.min(inicio + 10, lista.length)} de ${lista.length} registros · Página ${estado.pagina} de ${paginas}` : "0 registros";
  const boton = (pagina, texto, disabled = false) => `<button type="button" class="btn ${pagina === estado.pagina && /^\d+$/.test(texto) ? "btn-primario" : "btn-secundario"}" data-pagina-tabla="${pagina}" ${disabled ? "disabled" : ""} ${pagina === estado.pagina && /^\d+$/.test(texto) ? 'aria-current="page"' : ""} aria-label="${/^\d+$/.test(texto) ? `Página ${texto}` : texto}">${texto}</button>`;
  const numeros = [...new Set([1, paginas, estado.pagina - 1, estado.pagina, estado.pagina + 1])].filter(p => p >= 1 && p <= paginas).sort((a, b) => a - b);
  let anterior = 0;
  const enlaces = numeros.map(p => {
    const salto = anterior && p > anterior + 1 ? '<span aria-hidden="true">…</span>' : "";
    anterior = p;
    return salto + boton(p, String(p));
  }).join("");
  estado.nav.innerHTML = paginas > 1 ? boton(estado.pagina - 1, "Anterior", estado.pagina === 1) + enlaces + boton(estado.pagina + 1, "Siguiente", estado.pagina === paginas) : "";
  return lista.slice(inicio, inicio + 10).map(htmlFila).join("");
}
