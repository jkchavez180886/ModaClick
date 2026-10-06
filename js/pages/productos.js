/* Alta de prendas, calzado y accesorios. */
let urlVistaProducto = null;
let guardandoProducto = false;

function sugerirCategoriasProducto() {
  $("opciones-categoria").innerHTML = [...new Set([...CATEGORIAS, ...CATEGORIAS_SUGERIDAS])]
    .map(c => '<option value="' + escapar(c) + '"></option>').join("");
}
function dibujarGestionProductos() {
  const texto = valorDe("buscar-productos").toLocaleLowerCase("es");
  const visibles = PRODUCTOS.filter(p => [p.nombre, p.categoria, p.equipo, p.id].join(" ").toLocaleLowerCase("es").includes(texto));
  $("lista-productos").innerHTML = paginarFilas("lista-productos", visibles, p =>
    '<tr><td><div class="productos-fila"><img src="' + escapar(p.imagen) + '" alt="" loading="lazy" width="48" height="56">' +
    '<div><strong>' + escapar(p.nombre) + '</strong><small>' + escapar(p.id) + '</small>' +
    (p.destacado ? '<span class="etiqueta etiqueta-destacado">★ Destacado</span>' : '') + '</div></div></td>' +
    '<td>' + escapar(p.categoria) + '</td><td>' + moneda(p.precio) + '</td><td>' + p.stock + '</td>' +
    '<td>' + p.tallas.map(escapar).join(", ") + '</td><td>' + (p.stock <= 0
      ? '<span class="etiqueta neutra">Agotado</span>'
      : '<a href="' + enlaceProducto(p.id) + '" aria-label="Ver ' + escapar(p.nombre) + '">Ver producto</a>') + '</td></tr>'
  , texto) || '<tr><td colspan="6" class="vacio">No hay productos que coincidan con la búsqueda.</td></tr>';
  $("conteo-gestion").textContent = visibles.length + " de " + PRODUCTOS.length + " productos coinciden con la búsqueda";
}
function actualizarVistaProducto() {
  const destacado = $("nuevo-destacado").checked;
  $("vista-destacado").classList.toggle("oculto", !destacado);
  $("vista-destacado").closest(".productos-vista").classList.toggle("vista-destacada", destacado);
  $("vista-nombre").textContent = valorDe("nuevo-nombre") || "Tu nuevo producto";
  $("vista-categoria").textContent = valorDe("nuevo-categoria") || "Categoría";
  $("vista-descripcion").textContent = valorDe("nuevo-descripcion") || "Así se verá en tu catálogo.";
  const precio = Number(valorDe("nuevo-precio"));
  $("vista-precio").textContent = moneda(Number.isFinite(precio) && precio > 0 ? precio : 0);
  $("vista-stock").textContent = "Stock: " + (valorDe("nuevo-stock") || 0) + " unidades";
}
function errorAltaProducto(mensaje) {
  $("error-producto").textContent = mensaje;
  if (mensaje) $("error-producto").focus();
}
function validarArchivoProducto(archivo) {
  if (!["image/png", "image/jpeg", "image/webp"].includes(archivo.type))
    throw new Error("Selecciona una imagen PNG, JPG o WebP.");
  if (archivo.size > 1024 * 1024) throw new Error("La imagen no debe superar 1 MB.");
}
function leerImagenProducto(archivo) {
  validarArchivoProducto(archivo);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("No se pudo leer la imagen. Selecciónala nuevamente."));
    reader.readAsDataURL(archivo);
  });
}
function actualizarImagenVistaProducto() {
  if (urlVistaProducto) { URL.revokeObjectURL(urlVistaProducto); urlVistaProducto = null; }
  const archivo = $("nuevo-imagen").files[0];
  let imagen = IMAGEN_PRODUCTO_DEFAULT;
  try {
    if (archivo) {
      validarArchivoProducto(archivo);
      urlVistaProducto = URL.createObjectURL(archivo);
      imagen = urlVistaProducto;
    } else {
      const url = valorDe("nuevo-url");
      if (url && esImagenProducto(url)) imagen = url;
    }
    $("error-producto").textContent = "";
  } catch (error) { errorAltaProducto(error.message); }
  $("vista-imagen").src = imagen;
}
document.addEventListener("DOMContentLoaded", () => {
  if (!esAdmin()) return;
  sugerirCategoriasProducto();
  dibujarGestionProductos();
  const formulario = $("form-producto");
  formulario.addEventListener("input", actualizarVistaProducto);
  $("nuevo-imagen").addEventListener("change", actualizarImagenVistaProducto);
  $("nuevo-url").addEventListener("change", actualizarImagenVistaProducto);
  $("vista-imagen").addEventListener("error", () => {
    if ($("vista-imagen").getAttribute("src") !== IMAGEN_PRODUCTO_DEFAULT)
      $("vista-imagen").src = IMAGEN_PRODUCTO_DEFAULT;
  });
  $("buscar-productos").addEventListener("input", dibujarGestionProductos);
  formulario.addEventListener("reset", () => {
    setTimeout(() => {
      actualizarVistaProducto(); actualizarImagenVistaProducto();
      $("resultado-producto").classList.add("oculto");
    }, 0);
  });
  formulario.addEventListener("submit", async evento => {
    evento.preventDefault();
    if (guardandoProducto) return;
    $("resultado-producto").classList.add("oculto");
    const archivo = $("nuevo-imagen").files[0];
    const datos = {
      nombre: valorDe("nuevo-nombre"), categoria: valorDe("nuevo-categoria"),
      equipo: valorDe("nuevo-marca"), precio: Number(valorDe("nuevo-precio")),
      stock: Number(valorDe("nuevo-stock")),
      destacado: $("nuevo-destacado").checked,
      tallas: valorDe("nuevo-tallas").split(",").map(t => t.trim()).filter(Boolean),
      descripcion: valorDe("nuevo-descripcion"),
      imagen: archivo ? IMAGEN_PRODUCTO_DEFAULT : (valorDe("nuevo-url") || IMAGEN_PRODUCTO_DEFAULT),
    };
    if (!valorDe("nuevo-stock")) { errorAltaProducto("Ingresa el stock del producto."); return; }
    const error = validarProducto(datos);
    if (error) { errorAltaProducto(error); return; }
    guardandoProducto = true;
    $("guardar-producto").disabled = true;
    $("guardar-producto").textContent = "Guardando...";
    try {
      if (archivo) datos.imagen = await leerImagenProducto(archivo);
      const producto = guardarProducto(datos);
      $("error-producto").textContent = "";
      sugerirCategoriasProducto();
      $("buscar-productos").value = "";
      dibujarGestionProductos();
      formulario.reset();
      setTimeout(() => {
        $("resultado-producto").innerHTML = '<strong>' + escapar(producto.nombre) + '</strong> se agregó a ' +
          escapar(producto.categoria) + '. <a href="catalogo.html?categoria=' +
          encodeURIComponent(producto.categoria) + '">Ver en el catálogo</a>';
        $("resultado-producto").classList.remove("oculto");
      }, 0);
      mostrarAviso("Producto agregado al catálogo", "exito");
    } catch (error) { errorAltaProducto(error.message); }
    finally {
      guardandoProducto = false;
      $("guardar-producto").disabled = false;
      $("guardar-producto").textContent = "Guardar producto";
    }
  });
  window.addEventListener("storage", evento => {
    if (evento.key === CLAVE_PRODUCTOS || evento.key === null) {
      actualizarProductos(); sugerirCategoriasProducto(); dibujarGestionProductos();
    }
  });
  window.addEventListener("pagehide", () => {
    if (urlVistaProducto) { URL.revokeObjectURL(urlVistaProducto); urlVistaProducto = null; }
  });
});
