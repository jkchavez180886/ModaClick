/* ==========================================================================
   datos/productos.js — Catálogo de prendas de ModaClick.
   Productos iniciales y altas desde la pantalla Gestionar productos.
   Los nuevos productos se guardan en localStorage.
   ========================================================================== */

const PRODUCTOS_EJEMPLO = [
  {
    id: "P-001",
    nombre: "Alianza Lima 24/25",
    equipo: "Alianza Lima",
    descripcion: "Camiseta oficial de local. ¡Vamos blanquiazules!",
    precio: 199.0,
    imagen: "../assets/img/productos/alianza-lima.png",
    categoria: "Local",
    tallas: ["S", "M", "L", "XL", "XXL"],
    stock: 25,
  },
  {
    id: "P-002",
    nombre: "Arsenal 24/25",
    equipo: "Arsenal",
    descripcion: "Camiseta oficial de local. Rojo y blanco de Londres.",
    precio: 259.0,
    imagen: "../assets/img/productos/arsenal.png",
    categoria: "Local",
    tallas: ["S", "M", "L", "XL", "XXL"],
    stock: 18,
  },
  {
    id: "P-003",
    nombre: "Inter Miami 24/25",
    equipo: "Inter Miami",
    descripcion: "Camiseta oficial de local. Rosa y negro de Messi.",
    precio: 319.0,
    imagen: "../assets/img/productos/inter-miami.png",
    categoria: "Local",
    tallas: ["S", "M", "L", "XL", "XXL"],
    stock: 12,
  },
  {
    id: "P-004",
    nombre: "Juventus 24/25",
    equipo: "Juventus",
    descripcion: "Camiseta oficial de local. Rayas blancas y negras.",
    precio: 265.0,
    imagen: "../assets/img/productos/juventus.png",
    categoria: "Local",
    tallas: ["S", "M", "L", "XL", "XXL"],
    stock: 20,
  },
  {
    id: "P-005",
    nombre: "Bayern Munich 24/25",
    equipo: "Bayern Munich",
    descripcion: "Camiseta oficial de local. Rojo y blanco clásico.",
    precio: 285.0,
    imagen: "../assets/img/productos/bayern.png",
    categoria: "Local",
    tallas: ["S", "M", "L", "XL", "XXL"],
    stock: 15,
  },
  {
    id: "P-006",
    nombre: "Liverpool 24/25",
    equipo: "Liverpool",
    descripcion: "Camiseta oficial de local. El clásico rojo de Anfield.",
    precio: 275.0,
    imagen: "../assets/img/productos/liverpool.png",
    categoria: "Local",
    tallas: ["S", "M", "L", "XL", "XXL"],
    stock: 22,
  },
  {
    id: "P-007",
    nombre: "PSG 24/25",
    equipo: "Paris Saint-Germain",
    descripcion: "Camiseta oficial de local. Diseño elegante azul y rojo.",
    precio: 299.0,
    imagen: "../assets/img/productos/psg.png",
    categoria: "Local",
    tallas: ["S", "M", "L", "XL", "XXL"],
    stock: 10,
  },
  {
    id: "P-008",
    nombre: "Manchester City 24/25",
    equipo: "Manchester City",
    descripcion: "Camiseta oficial de visitante. Diseño black lightning.",
    precio: 269.0,
    imagen: "../assets/img/productos/manchester-city.png",
    categoria: "Visitante",
    tallas: ["S", "M", "L", "XL", "XXL"],
    stock: 17,
  },
  {
    id: "P-009",
    nombre: "FC Barcelona 24/25",
    equipo: "FC Barcelona",
    descripcion: "Camiseta oficial de local. Diseño clásico blaugrana.",
    precio: 279.0,
    imagen: "../assets/img/productos/barcelona.png",
    categoria: "Local",
    tallas: ["S", "M", "L", "XL", "XXL"],
    stock: 26,
  },
  {
    id: "P-010",
    nombre: "Real Madrid 24/25",
    equipo: "Real Madrid",
    descripcion: "Camiseta oficial third kit. Diseño elegante gris.",
    precio: 289.0,
    imagen: "../assets/img/productos/real-madrid.png",
    categoria: "Third Kit",
    tallas: ["S", "M", "L", "XL", "XXL"],
    stock: 14,
  },
  {
    id: "DEMO-AGOTADO",
    nombre: "Camiseta PSG de entrenamiento",
    equipo: "Paris Saint-Germain",
    descripcion: "Prenda deportiva de ejemplo para probar el estado agotado.",
    precio: 189.0,
    imagen: "../assets/img/productos/psg.png",
    categoria: "Deportiva",
    tallas: ["S", "M", "L", "XL"],
    stock: 0,
    destacado: false,
  },
  {
    id: "DEMO-DESTACADO",
    nombre: "Camiseta Real Madrid edición especial",
    equipo: "Real Madrid",
    descripcion: "Una edición especial para destacar tu estilo dentro y fuera de la cancha.",
    precio: 299.0,
    imagen: "../assets/img/productos/real-madrid.png",
    categoria: "Deportiva",
    tallas: ["S", "M", "L", "XL"],
    stock: 12,
    destacado: true,
  },
];

// Catálogo ampliable con productos guardados en este navegador.
const CLAVE_PRODUCTOS = "modaclick_productos";
const IMAGEN_PRODUCTO_DEFAULT = "../assets/img/productos/sin-imagen.svg";
const CATEGORIAS_SUGERIDAS = ["Polos", "Pantalones", "Vestidos", "Casacas", "Calzado", "Accesorios"];

function esImagenProducto(imagen) {
  if (typeof imagen !== "string") return false;
  if (/^\.\.\/assets\/[a-zA-Z0-9_./-]+$/.test(imagen)) return true;
  if (/^data:image\/(png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/.test(imagen)) return imagen.length <= 1400000;
  try {
    const url = new URL(imagen);
    return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password;
  } catch { return false; }
}

function validarProducto(datos) {
  if (!datos || typeof datos !== "object") return "Los datos del producto no son válidos.";
  if (typeof datos.nombre !== "string" || !datos.nombre.trim() || datos.nombre.length > 100)
    return "Ingresa un nombre de hasta 100 caracteres.";
  if (typeof datos.categoria !== "string" || !datos.categoria.trim() || datos.categoria.length > 50)
    return "Ingresa una categoría de hasta 50 caracteres.";
  if (datos.categoria.trim().toLocaleLowerCase("es") === "todas")
    return "Usa otro nombre de categoría; Todas está reservado para el filtro.";
  if (typeof datos.precio !== "number" || !Number.isFinite(datos.precio) || datos.precio < 0.01 || !Number.isSafeInteger(Math.round(datos.precio * 100)))
    return "El precio debe ser un número igual o mayor que S/ 0.01.";
  if (!Number.isSafeInteger(datos.stock) || datos.stock < 0)
    return "El stock debe ser un número entero igual o mayor que cero.";
  if (datos.destacado !== undefined && typeof datos.destacado !== "boolean")
    return "La opción de producto destacado debe estar marcada o desmarcada.";
  if (!Array.isArray(datos.tallas) || !datos.tallas.length || datos.tallas.length > 20 ||
      datos.tallas.some(t => typeof t !== "string" || !t.trim() || t.length > 20))
    return "Ingresa hasta 20 tallas o usa Única para accesorios.";
  if (typeof datos.descripcion !== "string" || datos.descripcion.length > 1000)
    return "La descripción puede tener hasta 1000 caracteres.";
  if (!esImagenProducto(datos.imagen)) return "La imagen debe ser PNG, JPG, WebP o una URL HTTP/HTTPS.";
  return "";
}

function leerProductos() {
  const ids = new Set(PRODUCTOS_EJEMPLO.map(p => p.id));
  const nuevos = usarLeer(CLAVE_PRODUCTOS, []).filter(p => {
    if (validarProducto(p) || typeof p.id !== "string" || !/^P-\d+$/.test(p.id) || ids.has(p.id)) return false;
    ids.add(p.id);
    return true;
  });
  return [...PRODUCTOS_EJEMPLO, ...nuevos].map(p => ({
    ...p, tallas: [...p.tallas], destacado: p.destacado === true,
  }));
}

let PRODUCTOS = leerProductos();
let CATEGORIAS = [...new Set(PRODUCTOS.map(p => p.categoria))];

function actualizarProductos() {
  PRODUCTOS = leerProductos();
  CATEGORIAS = [...new Set(PRODUCTOS.map(p => p.categoria))];
}

function guardarProducto(datos) {
  exigirAdmin();
  const error = validarProducto(datos);
  if (error) throw new Error(error);
  const productos = leerProductos();
  const categoria = datos.categoria.trim().replace(/\s+/g, " ");
  const existente = productos.find(p => p.categoria.toLocaleLowerCase("es") === categoria.toLocaleLowerCase("es"));
  // Los ejemplos DEMO no ocupan códigos P-xxx de productos registrados.
  const numero = productos.reduce((max, p) => Math.max(max, Number(p.id.match(/^P-(\d+)$/)?.[1] || 0)), 0) + 1;
  if (!Number.isSafeInteger(numero)) throw new Error("No se pudo generar el código del producto.");
  const producto = {
    id: "P-" + String(numero).padStart(3, "0"),
    nombre: datos.nombre.trim(),
    equipo: typeof datos.equipo === "string" ? datos.equipo.trim().slice(0, 100) : "",
    descripcion: datos.descripcion.trim(),
    precio: Math.round(datos.precio * 100) / 100,
    imagen: datos.imagen,
    categoria: existente ? existente.categoria : categoria,
    tallas: [...new Set(datos.tallas.map(t => t.trim()))],
    stock: datos.stock,
    destacado: datos.destacado === true,
  };
  const nuevos = productos.filter(p => !PRODUCTOS_EJEMPLO.some(e => e.id === p.id));
  // Informar el fallo conserva el formulario cuando el almacenamiento está lleno o bloqueado.
  try {
    localStorage.setItem(CLAVE_PRODUCTOS, JSON.stringify([...nuevos, producto]));
  } catch {
    throw new Error("No se pudo guardar. El almacenamiento puede estar lleno o bloqueado. Prueba con una imagen más pequeña o una URL.");
  }
  actualizarProductos();
  return producto;
}

function buscarProducto(id) {
  return PRODUCTOS.find(producto => producto.id === id);
}

const enlaceProducto = id => "producto.html?id=" + encodeURIComponent(id);
