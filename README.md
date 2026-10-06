# ModaClick

Tienda virtual de polos de fútbol. Proyecto **100 % estático**: HTML, CSS y JavaScript
sin frameworks, sin `npm` y sin proceso de compilación.

## Cómo abrir el proyecto

Como los datos se guardan en `localStorage`, conviene abrirlo con un servidor local
(simple) en lugar de hacer doble clic en el archivo:

```bash
python -m http.server 8000
```

Luego entra a <http://localhost:8000>.

## Páginas

| Archivo | Qué hace |
| --- | --- |
| `index.html` | Inicio de sesión. Demo: `44385416@certus.edu.pe` / `123` |
| `pages/productos.html` | Alta de productos con imagen, tallas y categorías personalizadas |
| `pages/catalogo.html` | Catálogo con filtros, orden y paginación |
| `pages/usuarios.html` | Gestión de usuarios: creación, edición, roles y estado |
| `pages/perfil.html` | Edición del perfil y contraseña de la cuenta actual |
| `pages/mis-pedidos.html` | Historial de pedidos de la cuenta actual |
| `pages/producto.html` | Ficha de producto. Se abre con `?id=P-001` |
| `pages/carrito.html` | Carrito: cantidades, quitar artículos y totales |
| `pages/confirmacion-pedido.html` | Datos de envío y confirmación del pedido |
| `pages/cliente.html` | Formulario de datos del cliente |
| `pages/clientes.html` | CRUD de clientes (listar, crear, editar, eliminar) |
| `pages/pedidos.html` | CRUD de pedidos, con filtro por estado |
| `pages/dashboard-admin.html` | Métricas, 2 gráficos ApexCharts y pedidos recientes |
| `pages/dashboard-usuario.html` | Accesos personales al catálogo, perfil y pedidos |
| `pages/panel-admin.html` | Accesos a configuración y registros administrativos |

Los demas archivos HTML se encuentran en `pages/`. Sus recursos compartidos se cargan desde `../css/`, `../js/` y `../assets/`.

## Estructura

```
.
|-- index.html                      Inicio de sesion
|-- pages/                          Paginas HTML
├── assets/img/                     Imágenes (logo, productos, administración)
│   └── _sin-usar/                  Imágenes que la plantilla ya no necesita
├── css/
│   ├── base.css                    Variables, reset, tipografía y modo oscuro
│   ├── layout.css                  Sidebar, header, footer y responsive
│   ├── components.css              Botones, tablas, formularios, tarjetas, modales
│   └── pages/                      Un CSS por página
└── js/
    ├── utils.js                    Helpers compartidos ($$, escapar, moneda, avisos)
    ├── layout.js                   Sidebar + header + footer reutilizables
    ├── app.js                      Modo oscuro, menú móvil, dropdown, logout
    ├── datos/                      Productos, carrito, clientes y pedidos
    └── pages/                      Un JS por página
```

### Cómo se comparte el sidebar, el header y el footer

Cada página deja tres contenedores vacíos y `layout.js` los rellena:

```html
<aside class="app-sidebar" id="app-sidebar"></aside>
<header class="app-header" id="app-header"></header>
<footer class="app-footer" id="app-footer"></footer>
```

Para cambiar el menú, la marca o el usuario se edita **solo** `js/layout.js`.

## Dónde se guardan los datos

Todo vive en el `localStorage` del navegador, bajo estas claves:

| Clave | Contenido |
| --- | --- |
| `modaclick_usuarios` | Cuentas, perfiles, roles, estado y contraseñas derivadas con PBKDF2 |
| `modaclick_productos` | Productos nuevos; se combinan con el catálogo inicial |
| `modaclick_carrito` | Artículos del carrito |
| `modaclick_clientes` | Clientes registrados |
| `modaclick_pedidos` | Pedidos |
| `modaclick_datos_cliente` | Formulario de datos del cliente |
| `modaclick_datos_envio` | Datos de envío del último pedido |
| `modaclick_tema` | Preferencia de tema claro/oscuro |

La primera vez se cargan datos de ejemplo (`PEDIDOS_EJEMPLO`, `CARRITO_EJEMPLO`, etc.),
de modo que la demo se ve completa sin escribir nada.

## De aquí a una versión con base de datos

El proyecto no tiene servidor, así que las credenciales del login y los datos están
en el navegador: **es solo una demo**. Para producción:

1. Reemplazar el cuerpo de `usarLeer()` / `usarGuardar()` (en `js/utils.js`) y de
   `leerPedidos()` / `guardarPedidos()` (en `js/datos/`) por llamadas `fetch()` a tu API.
2. Mover la validación del login al servidor; nunca comparar contraseñas en el cliente.
3. Añadir paginación y filtros en el servidor (hoy se filtra todo en memoria).

## Dependencias externas

Solo dos, por CDN:

- **Font Awesome 6.5.2** — iconos.
- **ApexCharts 3.54.1** — gráficos de `pages/dashboard-admin.html`. Si no carga (sin internet),
  la página muestra un aviso en lugar de romperse.

## Agregar productos

En el menú, abre **Gestionar productos**. Completa nombre, categoría, precio, stock y tallas; puedes cargar una imagen PNG, JPG o WebP de hasta 1 MB o indicar una URL. Para accesorios, usa la talla Única. Puedes elegir una categoría existente o escribir una nueva. Al guardar, el producto aparece en el catálogo, su filtro de categoría y su ficha de detalle.

Los productos y las imágenes cargadas se guardan en este navegador. No se comparten entre dispositivos. Si se llena el almacenamiento, el formulario muestra un error y conserva los datos para volver a intentar.

Marca **Producto destacado** para resaltar la tarjeta con borde y etiqueta dorados y darle prioridad al ordenar por **Destacados**. La elección se conserva al recargar. Si el producto está agotado, prevalecen el estilo gris y el bloqueo de sus acciones.

La categoría **Deportiva** incluye dos productos de prueba: **Camiseta PSG de entrenamiento** (agotado) y **Camiseta Real Madrid edición especial** (destacado). Sus códigos `DEMO-AGOTADO` y `DEMO-DESTACADO` no interfieren con los productos registrados anteriormente.

## Usuarios y acceso

- **Admin:** `44385416@certus.edu.pe` / `123`. Accede a Gestión de usuarios, productos, clientes, registro de pedidos y configuración.
- **Estándar:** `cliente@modaclick.com` / `123456`. Consulta productos, realiza pedidos y ve únicamente sus propios pedidos.
- **Mi perfil** permite editar los datos personales. Cambiar correo o contraseña requiere la contraseña actual.
- Desde **Gestión de usuarios**, un administrador crea cuentas y edita sus datos, rol, contraseña y estado activo. No puede desactivar su propia cuenta ni quitarse su rol Admin.

La sesión usa `sessionStorage`. Carrito y datos de envío utilizan claves con el ID del usuario para separar las cuentas. Los visitantes pueden consultar el catálogo; confirmar un pedido requiere iniciar sesión. Abre la aplicación desde localhost o HTTPS para utilizar Web Crypto. Las cuentas se guardan únicamente en este navegador: la protección de rutas y roles es funcional para la demo; un entorno real necesita autenticación y autorización en el servidor.

## Paginación del catálogo

El catálogo conserva las tarjetas y muestra 12 productos por página, con opciones de 24 o 48. Los controles Anterior, Siguiente y números de página se adaptan a pantallas pequeñas. La búsqueda, categoría y orden se aplican a todo el catálogo antes de paginar; cambiar esos filtros vuelve a la primera página. Los datos todavía se cargan completos en memoria; para catálogos grandes, la API deberá realizar filtros y paginación.

Todas las tablas muestran **10 registros por página**, mediante el componente compartido `js/tablas.js`: usuarios, productos, clientes, pedidos, historial personal, pedidos recientes y artículos de confirmación. Cambiar filtros vuelve a la primera página; al eliminar registros se ajusta la página actual. Los totales de compra incluyen todos los artículos, independientemente de la página visible. Las credenciales de demostración se documentan aquí y ya no se muestran en el login.
