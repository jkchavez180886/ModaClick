# Documentación del proyecto web ModaClick

**Proyecto:** tienda virtual de prendas de vestir y accesorios  
**Fecha:** 7 de octubre de 2026  
**Tecnologías:** HTML5, CSS3 y JavaScript moderno

## 1. Introducción al proyecto web desarrollado

ModaClick es una aplicación web que simula el funcionamiento de una tienda virtual. Su catálogo incluye camisetas de fútbol y permite explorar productos, seleccionar tallas, gestionar un carrito y registrar pedidos. También dispone de herramientas administrativas para gestionar productos, usuarios, clientes y pedidos.

El objetivo es integrar una interfaz adaptable con lógica de negocio desarrollada en JavaScript, aplicando manipulación del DOM, programación orientada a eventos y persistencia local. El usuario estándar consulta el catálogo y sus pedidos; el administrador dispone de pantallas de gestión. Un visitante puede explorar el catálogo, mientras que la confirmación de pedidos requiere una sesión.

La aplicación es estática: no utiliza un backend ni una base de datos remota. HTML define los elementos de la interfaz, CSS controla su presentación y JavaScript procesa acciones y actualiza los contenidos. Los datos se conservan en `localStorage`, y la sesión se identifica mediante `sessionStorage`. Es una demostración académica; la autorización definitiva y la persistencia compartida requerirían un servidor.

## 2. Desarrollo de nuevos requerimientos bajo la arquitectura de JavaScript moderno

### 2.1 Organización del proyecto

```text
ModaClick/
├── index.html              Inicio de sesión
├── pages/                  Pantallas del catálogo, compras y administración
├── css/                    Estilos base, componentes y estilos por página
├── assets/img/             Marca e imágenes de productos
└── js/
    ├── utils.js            DOM, formato, almacenamiento y validaciones
    ├── layout.js           Cabecera, menú lateral y pie compartidos
    ├── app.js              Tema, navegación y comportamientos comunes
    ├── auth.js             Comprobación de acceso a las páginas
    ├── tablas.js           Paginación reutilizable de tablas
    ├── datos/              Operaciones sobre usuarios, productos y pedidos
    └── pages/              Lógica específica de cada pantalla
```

La separación por responsabilidad permite agregar funcionalidades sin concentrar toda la lógica en un archivo. Se utilizan scripts clásicos cargados con `defer`, en un orden que respeta sus dependencias. Esta organización es modular por archivos y funciones, pero no corresponde al sistema de módulos ES con `import` y `export`; algunas utilidades se exponen mediante `window`.

### 2.2 Requerimientos presentes en la versión revisada

| Requerimiento | Desarrollo en JavaScript | Resultado para el usuario |
| --- | --- | --- |
| Buscar y filtrar productos | Estado del catálogo, `filter()` y comparación de texto | Tarjetas que coinciden con la búsqueda y categoría |
| Ordenar el catálogo | `switch` y `sort()` | Orden por destacados, precio o nombre |
| Paginar resultados | Cálculo de páginas y `slice()` | 12 productos por página, con opciones de 24 o 48 |
| Registrar productos | Validaciones, `FileReader` y almacenamiento local | Nuevos productos visibles en el catálogo |
| Resaltar destacados y bloquear agotados | Condiciones basadas en `destacado` y `stock` | Etiquetas, estilos y acciones acordes con la disponibilidad |
| Gestionar el carrito | `find()`, `map()`, `filter()` y `reduce()` | Cantidades, eliminación y totales actualizados |
| Gestionar cuentas y roles | Funciones asíncronas, Web Crypto y sesión local | Acceso diferenciado y edición del perfil |
| Cambiar el tema | `classList.toggle()` y persistencia | Interfaz clara u oscura |

Estos requerimientos se describen a partir del código actual; no se atribuyen fechas de incorporación ni cambios respecto de una versión anterior.

### 2.3 Recursos de JavaScript moderno

El código emplea `const` y `let`, funciones flecha, plantillas literales, desestructuración, operador de propagación, encadenamiento opcional y métodos de arreglos. Las promesas y `async`/`await` permiten esperar operaciones como la validación de credenciales o la confirmación de una eliminación.

Por ejemplo, `js/datos/carrito.js` calcula el subtotal mediante:

```js
const subtotal = items.reduce(
  (suma, item) => suma + item.precio * item.cantidad,
  0
);
```

Cada artículo aporta su precio multiplicado por la cantidad. El acumulador permite calcular el total de todos los artículos, independientemente de lo que esté visible en una tabla paginada.

## 3. Captura de elementos y manipulación dinámica del árbol del DOM

### 3.1 Selección de elementos

En `js/utils.js` se definen dos funciones de acceso al DOM:

```js
const $ = (id) => document.getElementById(id);

const $$ = (selector, contexto = document) =>
  Array.from(contexto.querySelectorAll(selector));
```

`$()` obtiene un elemento por su identificador. `$$()` obtiene un arreglo de elementos que coinciden con un selector CSS y permite limitar la búsqueda a una tarjeta o contenedor. Además, se utilizan `querySelector()` para localizar un elemento interno y `closest()` para identificar el botón o tarjeta asociados con un clic.

### 3.2 Actualización del contenido

En `js/pages/catalogo.js`, `dibujarCatalogo()` filtra los productos y sustituye los elementos de la rejilla:

```js
const inicio = (estadoCatalogo.pagina - 1) * estadoCatalogo.porPagina;
rejilla.innerHTML = lista
  .slice(inicio, inicio + estadoCatalogo.porPagina)
  .map(htmlProducto)
  .join("");
vacio.classList.toggle("oculto", lista.length > 0);
```

`slice()` selecciona los productos de la página actual; `map()` genera sus tarjetas y `join()` reúne el HTML. La clase `oculto` controla la visibilidad del mensaje de búsqueda sin resultados. Al escribir un filtro se recalcula la vista sin recargar toda la página.

El carrito actualiza los importes mediante `textContent`:

```js
const totales = resumenCarrito();
$("resumen-subtotal").textContent = moneda(totales.subtotal);
$("resumen-envio").textContent = moneda(totales.envio);
$("resumen-total").textContent = moneda(totales.total);
```

Para construir nodos también existe `crearElemento()`, que utiliza `document.createElement()`. El cambio de tema modifica la clase del elemento raíz con `classList.toggle()`. Cuando se insertan valores de texto dentro de HTML generado, la utilidad `escapar()` codifica caracteres especiales; esto no sustituye la validación específica de otros valores, como las URL.

## 4. Control de flujo: estructuras condicionales

### 4.1 `if` y `else`

En `js/datos/carrito.js`, agregar un producto requiere decidir si ya existe una entrada para el mismo producto y talla:

```js
if (existente) {
  existente.cantidad += cantidad;
} else {
  items.push({
    clave,
    id: producto.id,
    talla,
    cantidad,
    nombre: producto.nombre,
    estampado: producto.estampado || null,
    imagen: producto.imagen,
    precio: producto.precio,
  });
}
```

La primera rama incrementa la cantidad; la segunda crea un artículo. Antes de esta decisión, la función rechaza los productos cuyo stock es menor o igual a cero.

### 4.2 `else if`

En `js/app.js`, el evento de cambio de tamaño controla el menú lateral:

```js
window.addEventListener("resize", () => {
  if (window.innerWidth > 1024) cerrarMenuLateral();
  else if (!$("app-sidebar")?.classList.contains("abierta"))
    cerrarMenuLateral();
});
```

Si el ancho supera 1024 píxeles, el menú móvil se cierra. En una pantalla menor, si el menú ya no está abierto, la segunda condición sincroniza su estado mediante `cerrarMenuLateral()`, que también actualiza la capa y los atributos de accesibilidad.

### 4.3 `switch`

En `js/pages/catalogo.js` se determina el criterio de orden:

```js
switch (estadoCatalogo.orden) {
  case "destacados":
    lista.sort((a, b) =>
      Number(b.destacado && b.stock > 0) -
      Number(a.destacado && a.stock > 0));
    break;
  case "precio-asc":
    lista.sort((a, b) => a.precio - b.precio);
    break;
  case "precio-desc":
    lista.sort((a, b) => b.precio - a.precio);
    break;
  case "nombre":
    lista.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
    break;
}
```

Cada `case` aplica un criterio y `break` evita continuar hacia el siguiente. Este `switch` no tiene `default`: un valor no reconocido conserva el orden de la lista filtrada. En `js/datos/pedidos.js`, `colorEstadoPedido()` sí incluye `default` y devuelve la clase `neutra` para estados no reconocidos.

## 5. Programación orientada a eventos: uso de `addEventListener`

La interactividad se organiza mediante eventos del navegador. `DOMContentLoaded` inicia la lógica cuando el documento ya puede utilizarse; los eventos de los controles conectan las acciones del usuario con las funciones del proyecto.

| Evento | Ejemplo | Comportamiento |
| --- | --- | --- |
| `input` | Buscador del catálogo | Actualiza el texto del filtro y las tarjetas |
| `change` | Selector de orden | Cambia el criterio y vuelve a la primera página |
| `click` | Botón de tema o acciones del carrito | Cambia la presentación o los artículos |
| `submit` | Formulario de acceso | Valida las credenciales sin el envío tradicional |
| `keydown` | Escape y Enter | Cierra menús o aplica una búsqueda |
| `storage` | Cambios de productos desde otra pestaña | Actualiza los datos y el catálogo |
| `resize` | Cambio de tamaño de ventana | Sincroniza el menú lateral |

Ejemplo real del filtro en `js/pages/catalogo.js`:

```js
filtroTexto.addEventListener("input", () => {
  estadoCatalogo.texto = filtroTexto.value;
  estadoCatalogo.pagina = 1;
  if (buscadorHeader) buscadorHeader.value = filtroTexto.value;
  dibujarCatalogo();
});
```

También se aplica delegación de eventos: el contenedor conserva el listener aunque sus botones se regeneren. En el filtro por categorías:

```js
$("filtro-categorias").addEventListener("click", (evento) => {
  const chip = evento.target.closest(".chip");
  if (!chip) return;
  estadoCatalogo.categoria = chip.dataset.categoria;
  estadoCatalogo.pagina = 1;
  dibujarCategorias();
  dibujarCatalogo();
});
```

El evento asciende hasta el contenedor. `closest()` identifica el botón y `dataset` obtiene su categoría. En el acceso, `preventDefault()` evita el envío tradicional del formulario y permite ejecutar `iniciarSesion()` con `await`. La utilidad de confirmación combina `addEventListener` para el teclado con asignaciones a `onclick` para los botones del modal.

## 6. Código fuente limpio en JavaScript: modular y bien estructurado

El proyecto separa el acceso a datos, las utilidades, la composición de la interfaz y la lógica de cada página. Los nombres en español, como `dibujarCatalogo()`, `leerCarrito()` y `actualizarVistaProducto()`, indican su responsabilidad. Las constantes identifican claves de almacenamiento y configuraciones; los comentarios y anotaciones JSDoc explican parámetros y resultados en numerosos archivos.

El ciclo habitual es **evento → actualización del estado o datos → renderizado**. Por ejemplo, cambiar el orden modifica `estadoCatalogo`, reinicia la página y llama a `dibujarCatalogo()`. Esta división permite reutilizar funciones y localizar cambios con facilidad.

Las utilidades de formato, selección y paginación evitan duplicación. Los retornos tempranos descartan acciones inválidas, y `try`/`catch` maneja errores de almacenamiento, acceso y formularios. El registro de productos separa la validación de archivos, su lectura y la actualización de la vista previa.

Como mejoras futuras, se puede migrar a módulos ES para reducir las dependencias globales y conectar una API para centralizar datos y permisos. Algunos helpers de almacenamiento capturan el error y solo lo registran en consola; no todos los flujos garantizan que el usuario reciba una confirmación fiable de persistencia. El carrito bloquea productos agotados al agregarlos, pero sus cambios de cantidad no verifican un máximo de stock. Estas limitaciones deben resolverse para una tienda real.

## 7. Resultados obtenidos en el navegador

Las siguientes imágenes son capturas reales del proyecto servido en `http://127.0.0.1:8000`, en un navegador Chromium de escritorio con una vista de 1440 × 1000 píxeles. Se utilizó un perfil de captura separado, con datos de demostración. Las imágenes muestran el área visible de cada pantalla.

### Figura 1. Inicio de sesión

![Inicio de sesión de ModaClick](capturas/01-inicio-sesion.png)

La pantalla presenta la identidad de ModaClick, los campos de usuario y clave, y el acceso al catálogo como invitado.

### Figura 2. Catálogo de productos

![Catálogo de productos](capturas/02-catalogo.png)

Se visualizan tarjetas con imagen, precio, disponibilidad, tallas y acciones. Los controles permiten buscar, elegir categorías y ordenar los resultados.

### Figura 3. Búsqueda sin coincidencias

![Búsqueda sin resultados](capturas/03-busqueda-sin-resultados.png)

Al introducir un texto sin coincidencias, la rejilla se vacía y el contador indica `0 productos`. Este resultado evidencia la actualización dinámica del DOM por el evento `input`.

### Figura 4. Productos destacados y agotados

![Categoría Deportiva con productos destacados y agotados](capturas/04-destacado-agotado.png)

La categoría Deportiva muestra los productos de demostración. El destacado se resalta y el agotado presenta sus acciones deshabilitadas.

### Figura 5. Carrito de compras

![Carrito de compras](capturas/05-carrito.png)

El carrito presenta los artículos de ejemplo, sus cantidades y el resumen de compra. Los botones permiten sumar, restar o eliminar artículos.

### Figura 6. Gestión administrativa de productos

![Gestión de productos](capturas/06-gestion-productos.png)

Después de iniciar sesión con la cuenta administrativa de demostración, se accede al formulario de registro, la vista previa y el listado de productos.

### Figura 7. Tema oscuro

![Catálogo en tema oscuro](capturas/07-tema-oscuro.png)

La acción del botón de tema cambia la presentación de la interfaz mediante una clase CSS y conserva la preferencia en el almacenamiento local.

### Comprobaciones de la sesión de captura

Se comprobó la búsqueda sin coincidencias (`0 productos`), la actualización del total al sumar una unidad al primer artículo del carrito (de S/ 878.00 a S/ 1157.00), el acceso con la cuenta administrativa (redirección a `pages/dashboard-admin.html`) y el cambio al tema oscuro. Estas comprobaciones cubren esos flujos concretos; no constituyen una validación exhaustiva de todas las funciones, tamaños de pantalla o navegadores.

### Reproducción de los resultados

1. Abrir una terminal en la carpeta del proyecto y ejecutar `python -m http.server 8000`, si Python está instalado.
2. Visitar `http://localhost:8000` y explorar el catálogo como invitado.
3. Probar una búsqueda, una categoría, el selector de orden y los botones del carrito.
4. Para las pantallas administrativas, usar la cuenta de demostración documentada en `README.md`: `44385416@certus.edu.pe`, clave `123`.
5. Mantener el mismo origen y perfil del navegador para conservar los datos locales.

## Referencias internas

- `README.md`: ejecución, pantallas y alcance de la demostración.
- `js/utils.js`: selección del DOM, formato, persistencia y confirmaciones.
- `js/app.js`: tema, menús y eventos compartidos.
- `js/auth.js` y `js/datos/usuarios.js`: sesión y comprobación de roles.
- `js/pages/catalogo.js`: estado, filtros, orden, tarjetas y eventos.
- `js/datos/carrito.js` y `js/pages/carrito.js`: artículos, totales y acciones.
- `js/pages/productos.js`: registro, validaciones y vista previa.
- `js/datos/pedidos.js`: estados de los pedidos.
- `js/tablas.js`: paginación reutilizable.



## 8. Todas las pantallas del sistema por rol

Inventario completo de las 15 pantallas HTML del sistema: 22 capturas correspondientes al inicio de sesión, 13 vistas Admin y 8 vistas Standard. Las pantallas compartidas se presentan en ambas secciones con la cuenta correspondiente. El catálogo, el detalle y el carrito también admiten invitados. Las capturas muestran el área visible de 1440 × 1050 píxeles con datos de demostración.

### 8.1. Pantalla común: inicio de sesión


#### 1. Inicio de sesión

**Archivo:** `index.html`

Pantalla común de acceso para administradores y usuarios estándar; también permite explorar el catálogo como invitado.

![Inicio de sesión — comun](capturas/comun-index.png)

### 8.2. Pantallas del administrador (Admin)


#### 1. Inicio del administrador

**Archivo:** `dashboard-admin.html`

Presenta métricas, gráficos y pedidos recientes de la tienda.

![Inicio del administrador — admin](capturas/admin-dashboard-admin.png)

#### 2. Gestión de usuarios

**Archivo:** `usuarios.html`

Permite crear y editar cuentas, roles, contraseñas y estado activo.

![Gestión de usuarios — admin](capturas/admin-usuarios.png)

#### 3. Gestión de productos

**Archivo:** `productos.html`

Ofrece el formulario de registro, vista previa y listado paginado de productos.

![Gestión de productos — admin](capturas/admin-productos.png)

#### 4. Lista de clientes

**Archivo:** `clientes.html`

Permite listar, crear, editar y eliminar clientes.

![Lista de clientes — admin](capturas/admin-clientes.png)

#### 5. Registro de pedidos

**Archivo:** `pedidos.html`

Permite consultar y gestionar pedidos, con filtros por estado.

![Registro de pedidos — admin](capturas/admin-pedidos.png)

#### 6. Configuración / panel administrativo

**Archivo:** `panel-admin.html`

Reúne accesos a las herramientas y registros administrativos.

![Configuración / panel administrativo — admin](capturas/admin-panel-admin.png)

#### 7. Catálogo

**Archivo:** `catalogo.html`

Permite buscar, filtrar y ordenar productos, seleccionar tallas y agregarlos al carrito.

![Catálogo — admin](capturas/admin-catalogo.png)

#### 8. Detalle de producto

**Archivo:** `producto.html?id=P-001`

Presenta la imagen, el precio, la descripción, las tallas y las acciones de compra de un producto.

![Detalle de producto — admin](capturas/admin-producto.png)

#### 9. Carrito de compras

**Archivo:** `carrito.html`

Permite modificar cantidades, eliminar artículos y consultar el subtotal, envío y total.

![Carrito de compras — admin](capturas/admin-carrito.png)

#### 10. Confirmación del pedido

**Archivo:** `confirmacion-pedido.html`

Muestra el resumen de compra y el formulario de datos de envío y método de pago.

![Confirmación del pedido — admin](capturas/admin-confirmacion-pedido.png)

#### 11. Mi perfil

**Archivo:** `perfil.html`

Permite consultar y editar datos personales y cambiar las credenciales de la cuenta.

![Mi perfil — admin](capturas/admin-perfil.png)

#### 12. Mis datos

**Archivo:** `cliente.html`

Presenta el formulario con los datos del cliente utilizados en el proceso de compra.

![Mis datos — admin](capturas/admin-cliente.png)

#### 13. Mis pedidos

**Archivo:** `mis-pedidos.html`

Muestra el historial de pedidos correspondiente a la cuenta que ha iniciado sesión.

![Mis pedidos — admin](capturas/admin-mis-pedidos.png)

### 8.3. Pantallas del usuario estándar (Standard)


#### 1. Inicio del usuario estándar

**Archivo:** `dashboard-usuario.html`

Presenta accesos al catálogo, al perfil y a los pedidos personales.

![Inicio del usuario estándar — standard](capturas/standard-dashboard-usuario.png)

#### 2. Catálogo

**Archivo:** `catalogo.html`

Permite buscar, filtrar y ordenar productos, seleccionar tallas y agregarlos al carrito.

![Catálogo — standard](capturas/standard-catalogo.png)

#### 3. Detalle de producto

**Archivo:** `producto.html?id=P-001`

Presenta la imagen, el precio, la descripción, las tallas y las acciones de compra de un producto.

![Detalle de producto — standard](capturas/standard-producto.png)

#### 4. Carrito de compras

**Archivo:** `carrito.html`

Permite modificar cantidades, eliminar artículos y consultar el subtotal, envío y total.

![Carrito de compras — standard](capturas/standard-carrito.png)

#### 5. Confirmación del pedido

**Archivo:** `confirmacion-pedido.html`

Muestra el resumen de compra y el formulario de datos de envío y método de pago.

![Confirmación del pedido — standard](capturas/standard-confirmacion-pedido.png)

#### 6. Mi perfil

**Archivo:** `perfil.html`

Permite consultar y editar datos personales y cambiar las credenciales de la cuenta.

![Mi perfil — standard](capturas/standard-perfil.png)

#### 7. Mis datos

**Archivo:** `cliente.html`

Presenta el formulario con los datos del cliente utilizados en el proceso de compra.

![Mis datos — standard](capturas/standard-cliente.png)

#### 8. Mis pedidos

**Archivo:** `mis-pedidos.html`

Muestra el historial de pedidos correspondiente a la cuenta que ha iniciado sesión.

![Mis pedidos — standard](capturas/standard-mis-pedidos.png)
