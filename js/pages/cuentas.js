document.addEventListener("DOMContentLoaded", () => {
  const gestion = !!$("lista-usuarios");
  if (gestion ? !esAdmin() : !obtenerUsuarioSesion()) return;
  let editando = null;
  const form = $("form-cuenta");
  function rellenar(u) {
    editando = u?.id || null;
    form.reset();
    ["nombre", "correo", "telefono", "direccion"].forEach(c => $("cuenta-" + c).value = u?.[c] || "");
    if (gestion) {
      $("cuenta-rol").value = u?.rol || "estandar";
      $("cuenta-activo").checked = u ? u.activo : true;
      $("cuenta-clave").required = !u;
      $("titulo-form-cuenta").textContent = u ? "Editar usuario" : "Crear usuario";
    } else $("rol-perfil").textContent = u.rol === "admin" ? "Admin" : "Estándar";
    $("error-cuenta").textContent = "";
  }
  function dibujar() {
    const texto = valorDe("buscar-usuarios").toLowerCase();
    const rol = valorDe("filtrar-rol");
    const usuarios = leerUsuarios().filter(u => (!rol || u.rol === rol) && [u.nombre, u.correo].join(" ").toLowerCase().includes(texto));
    $("lista-usuarios").innerHTML = paginarFilas("lista-usuarios", usuarios, u => `<tr><td>${escapar(u.nombre)}</td><td>${escapar(u.correo)}</td><td><span class="etiqueta">${u.rol === "admin" ? "Admin" : "Estándar"}</span></td><td>${u.activo ? "Activo" : "Inactivo"}</td><td><button class="btn btn-secundario btn-pequeno" data-editar="${escapar(u.id)}">Editar</button></td></tr>`, JSON.stringify([texto, rol]));
    $("conteo-usuarios").textContent = `${usuarios.length} usuarios`;
  }
  rellenar(gestion ? null : obtenerUsuarioSesion());
  if (gestion) {
    dibujar();
    $("buscar-usuarios").addEventListener("input", dibujar);
    $("filtrar-rol").addEventListener("change", dibujar);
    $("nuevo-usuario").addEventListener("click", () => rellenar(null));
    $("lista-usuarios").addEventListener("click", e => {
      const boton = e.target.closest("[data-editar]");
      if (!boton) return;
      rellenar(leerUsuarios().find(u => u.id === boton.dataset.editar));
      form.scrollIntoView({ behavior: "smooth", block: "start" });
      $("cuenta-nombre").focus({ preventScroll: true });
    });
  }
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const boton = $("guardar-cuenta");
    if (boton.disabled) return;
    boton.disabled = true;
    $("error-cuenta").textContent = "";
    try {
      const datos = Object.fromEntries(["nombre", "correo", "telefono", "direccion"].map(c => [c, valorDe("cuenta-" + c)]));
      datos.clave = $("cuenta-clave").value;
      if (gestion) { datos.id = editando; datos.rol = valorDe("cuenta-rol"); datos.activo = $("cuenta-activo").checked; }
      else datos.claveActual = $("cuenta-clave-actual").value;
      const usuario = await (gestion ? guardarUsuario(datos) : guardarPerfil(datos));
      if (gestion) { dibujar(); rellenar(usuario); } else rellenar(usuario);
      actualizarUsuarioHeader();
      mostrarAviso("Datos guardados correctamente", "exito");
    } catch (error) { $("error-cuenta").textContent = error.message; }
    finally { boton.disabled = false; }
  });
});
