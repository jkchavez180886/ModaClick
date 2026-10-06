/* Cuentas de la demo local. Los permisos reales requieren un servidor. */
const CLAVE_USUARIOS = "modaclick_usuarios";
const USUARIOS_EJEMPLO = [
  { id: "USR-ADMIN", nombre: "Administrador", correo: "44385416@certus.edu.pe", telefono: "", direccion: "", rol: "admin", activo: true, salt: "a19d073c14bfd8af7e5e329b1dc84542", hash: "ef965659247f22d8c4a3a286c20074d6861f257782e5ba8248c0ba62e9644c0e" },
  { id: "USR-CLIENTE", nombre: "Cliente de ejemplo", correo: "cliente@modaclick.com", telefono: "", direccion: "", rol: "estandar", activo: true, salt: "f732a84ca2f45cd174c03fb211701d4a", hash: "f4fd1b9f67f76b889cf3f4126e62ad50e0920120b8876e16151991a87160862b" },
];
function leerUsuarios() { return usarLeer(CLAVE_USUARIOS, USUARIOS_EJEMPLO); }
function obtenerUsuarioSesion() {
  try {
    const sesion = sessionStorage.getItem("modaclick_sesion");
    if (!sesion) return null;
    let id;
    try { id = JSON.parse(sesion).usuarioId; } catch { id = leerUsuarios().find(u => u.correo === sesion)?.id; }
    return leerUsuarios().find(u => u.id === id && u.activo) || null;
  } catch { return null; }
}
function esAdmin() { return obtenerUsuarioSesion()?.rol === "admin"; }
function exigirAdmin() { if (!esAdmin()) throw new Error("Solo un administrador puede realizar esta acción."); }
function clavePorUsuario(base) { const u = obtenerUsuarioSesion(); return u ? `${base}_${u.id}` : base; }
async function hashClaveUsuario(clave, salt) {
  if (!globalThis.crypto?.subtle) throw new Error("Abre la tienda desde localhost o HTTPS para gestionar contraseñas.");
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(clave), "PBKDF2", false, ["deriveBits"]);
  const bytes = Uint8Array.from(salt.match(/../g), h => parseInt(h, 16));
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: bytes, iterations: 100000 }, material, 256);
  return Array.from(new Uint8Array(bits), b => b.toString(16).padStart(2, "0")).join("");
}
async function credencialUsuario(clave) {
  if (clave.length < 6 || clave.length > 128) throw new Error("La contraseña debe tener entre 6 y 128 caracteres.");
  const salt = Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, "0")).join("");
  return { salt, hash: await hashClaveUsuario(clave, salt) };
}
function validarUsuario(datos, id) {
  const nombre = String(datos.nombre || "").trim();
  const correo = String(datos.correo || "").trim().toLowerCase();
  const telefono = String(datos.telefono || "").trim();
  const direccion = String(datos.direccion || "").trim();
  if (!nombre || nombre.length > 100) throw new Error("Ingresa un nombre de hasta 100 caracteres.");
  if (!esCorreo(correo) || correo.length > 150) throw new Error("Ingresa un correo válido.");
  if (telefono && !esTelefono(telefono)) throw new Error("El teléfono debe tener 9 dígitos.");
  if (direccion.length > 250) throw new Error("La dirección admite hasta 250 caracteres.");
  if (leerUsuarios().some(u => u.id !== id && u.correo.toLowerCase() === correo)) throw new Error("Ya existe un usuario con ese correo.");
  return { nombre, correo, telefono, direccion };
}
async function guardarUsuario(datos) {
  exigirAdmin();
  const anterior = datos.id ? leerUsuarios().find(u => u.id === datos.id) : null;
  if (datos.id && !anterior) throw new Error("El usuario ya no existe.");
  const campos = validarUsuario(datos, datos.id);
  if (!["admin", "estandar"].includes(datos.rol)) throw new Error("Selecciona un rol válido.");
  if (datos.id === obtenerUsuarioSesion().id && (datos.rol !== "admin" || !datos.activo)) throw new Error("No puedes desactivar tu cuenta ni quitarte el rol Admin.");
  const credencial = datos.clave ? await credencialUsuario(datos.clave) : anterior;
  if (!credencial) throw new Error("Ingresa una contraseña para el nuevo usuario.");
  exigirAdmin();
  validarUsuario(datos, datos.id);
  const usuario = { ...campos, id: anterior?.id || crypto.randomUUID(), rol: datos.rol, activo: !!datos.activo, salt: credencial.salt, hash: credencial.hash };
  const lista = leerUsuarios();
  localStorage.setItem(CLAVE_USUARIOS, JSON.stringify(anterior ? lista.map(u => u.id === usuario.id ? usuario : u) : [...lista, usuario]));
  return usuario;
}
async function guardarPerfil(datos) {
  const actual = obtenerUsuarioSesion();
  if (!actual) throw new Error("Inicia sesión para editar tu perfil.");
  const campos = validarUsuario(datos, actual.id);
  if (datos.clave || campos.correo !== actual.correo) {
    if (await hashClaveUsuario(datos.claveActual || "", actual.salt) !== actual.hash) throw new Error("La contraseña actual es incorrecta.");
  }
  const credencial = datos.clave ? await credencialUsuario(datos.clave) : actual;
  const vigente = obtenerUsuarioSesion();
  if (!vigente || vigente.id !== actual.id || vigente.hash !== actual.hash) throw new Error("La sesión cambió. Vuelve a iniciar sesión.");
  validarUsuario(datos, actual.id);
  const usuario = { ...vigente, ...campos, salt: credencial.salt, hash: credencial.hash };
  localStorage.setItem(CLAVE_USUARIOS, JSON.stringify(leerUsuarios().map(u => u.id === usuario.id ? usuario : u)));
  return usuario;
}
async function iniciarSesion(correo, clave) {
  const usuario = leerUsuarios().find(u => u.correo.toLowerCase() === correo.trim().toLowerCase() && u.activo);
  if (!usuario || await hashClaveUsuario(clave, usuario.salt) !== usuario.hash) throw new Error("Usuario o contraseña incorrectos.");
  const vigente = leerUsuarios().find(u => u.id === usuario.id && u.activo && u.hash === usuario.hash);
  if (!vigente) throw new Error("La cuenta cambió. Inténtalo nuevamente.");
  sessionStorage.setItem("modaclick_sesion", JSON.stringify({ usuarioId: usuario.id }));
  const invitado = localStorage.getItem("modaclick_carrito");
  if (invitado !== null && localStorage.getItem(clavePorUsuario("modaclick_carrito")) === null) {
    localStorage.setItem(clavePorUsuario("modaclick_carrito"), invitado);
    localStorage.removeItem("modaclick_carrito");
  }
  return vigente;
}
