/* ==========================================================================
   datos/clientes.js — Alta, edición y baja de clientes.
   Los datos viven en localStorage para que la demo funcione sin servidor.
   Al conectar una base de datos, reemplaza leer() y guardar() por tu API.
   ========================================================================== */

const CLAVE_CLIENTES = "modaclick_clientes";

/** Clientes de ejemplo con los que arranca la demo. */
const CLIENTES_EJEMPLO = [
  { codigo: "CLI-001", nombre: "María Fernanda Quispe Rojas", telefono: "987654321", correo: "maria.quispe@example.com", talla: "S", contacto: "WhatsApp", direccion: "Av. Los Olivos 1250, Los Olivos" },
  { codigo: "CLI-002", nombre: "Luis Alberto Ramírez Soto", telefono: "956123478", correo: "luis.ramirez@example.com", talla: "L", contacto: "Llamada", direccion: "Jr. Huancavelica 340, Cercado de Lima" },
  { codigo: "CLI-003", nombre: "Carla Sofía Mendoza Paredes", telefono: "944582013", correo: "carla.mendoza@example.com", talla: "M", contacto: "WhatsApp", direccion: "Calle Las Magnolias 215, San Miguel" },
  { codigo: "CLI-004", nombre: "Diego Andrés Torres Vela", telefono: "921347865", correo: "diego.torres@example.com", talla: "XL", contacto: "Correo", direccion: "Av. Túpac Amaru 780, Comas" },
  { codigo: "CLI-005", nombre: "Valeria Nicole Huamán Cruz", telefono: "963258741", correo: "valeria.huaman@example.com", talla: "XS", contacto: "WhatsApp", direccion: "Mz. C Lote 12, Villa El Salvador" },
  { codigo: "CLI-006", nombre: "Jorge Enrique Salazar Díaz", telefono: "978412563", correo: "jorge.salazar@example.com", talla: "M", contacto: "Llamada", direccion: "Av. Universitaria 1890, San Martín de Porres" },
];

/** @returns {Array} Todos los clientes guardados. */
function leerClientes() {
  return usarLeer(CLAVE_CLIENTES, CLIENTES_EJEMPLO);
}

/**
 * Guarda la lista completa de clientes.
 * @param {Array} clientes
 */
function guardarClientes(clientes) {
  usarGuardar(CLAVE_CLIENTES, clientes);
}

/**
 * Calcula el siguiente código disponible: CLI-001, CLI-002, ...
 * @param {Array} clientes
 * @returns {string}
 */
function siguienteCodigoCliente(clientes) {
  const mayor = clientes.reduce((max, cliente) => {
    const numero = parseInt(String(cliente.codigo).replace(/\D/g, ""), 10) || 0;
    return numero > max ? numero : max;
  }, 0);
  return "CLI-" + String(mayor + 1).padStart(3, "0");
}

/**
 * Inserta un cliente nuevo o actualiza el que tenga el mismo código.
 * @param {object} datos - { codigo, nombre, telefono, correo, talla, contacto, direccion }
 * @returns {Array} La lista de clientes ya guardada.
 */
function guardarCliente(datos) {
  exigirAdmin();
  const clientes = leerClientes();
  const existe = clientes.some((cliente) => cliente.codigo === datos.codigo);

  if (existe) {
    guardarClientes(
      clientes.map((cliente) =>
        cliente.codigo === datos.codigo ? { ...cliente, ...datos } : cliente
      )
    );
  } else {
    guardarClientes([...clientes, { ...datos, codigo: siguienteCodigoCliente(clientes) }]);
  }

  return leerClientes();
}

/**
 * Elimina un cliente por su código.
 * @param {string} codigo
 */
function eliminarCliente(codigo) {
  exigirAdmin();
  guardarClientes(leerClientes().filter((cliente) => cliente.codigo !== codigo));
}

/**
 * Filtra clientes por un texto (nombre, teléfono, correo o código).
 * @param {Array} clientes
 * @param {string} texto
 * @returns {Array}
 */
function filtrarClientes(clientes, texto) {
  const busqueda = texto.trim().toLowerCase();
  if (!busqueda) return clientes;

  return clientes.filter((cliente) =>
    [cliente.nombre, cliente.telefono, cliente.correo, cliente.codigo]
      .join(" ")
      .toLowerCase()
      .includes(busqueda)
  );
}