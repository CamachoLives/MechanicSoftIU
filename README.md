# 🏍️ MechanicSoft — Panel Web

Panel de control para talleres de motos: control de acceso por roles, clientes y sus vehículos, órdenes de servicio (desde que la moto ingresa hasta que se entrega), repuestos e inventario, y pagos. Construido con **React 19 + Vite**, con una interfaz oscura de paneles de vidrio azul pastel y acentos en cian ("Cristal Azul").

Este frontend consume la API real del proyecto hermano **[MechanicSoftRest](../MechanicSoftRest)** — login, usuarios/roles/grupos, clientes, vehículos, órdenes, repuestos y pagos viven todos en esa base de datos, no en `localStorage`. Sin el backend corriendo, la aplicación no puede iniciar sesión ni cargar datos.

---

## 🚀 Cómo empezar

### Opción A — con Docker

Requisitos: Docker y Docker Compose.

```bash
docker compose up --build
```

La aplicación queda disponible en **http://localhost:8080**.

Por defecto el build apunta al backend en `http://localhost:9769`. Si el backend corre en otro host (otro contenedor, otra máquina), fija `VITE_API_URL` antes de construir — Vite la incrusta en el bundle en tiempo de compilación, así que un cambio requiere reconstruir la imagen:

```bash
VITE_API_URL=http://mi-backend:9769 docker compose up --build
```

### Opción B — local, sin Docker

Requisitos: Node.js 20 o superior.

```bash
npm install
npm run dev
```

La aplicación queda disponible en **http://localhost:5173**.

> En ambos casos hace falta levantar también [MechanicSoftRest](../MechanicSoftRest) (por defecto se espera en `http://localhost:9769`) — sin él no se puede ni iniciar sesión. La URL se puede cambiar con la variable de entorno `VITE_API_URL` (ver `.env.example`).

---

## 👥 Usuarios de prueba

Es un entorno de demostración: en la pantalla de login hay un panel de "Usuarios de prueba" con estas cuentas ya creadas (un clic inicia sesión con cualquiera de ellas). Las siembra el backend al arrancar por primera vez (`DatosInicialesRunner`), con la contraseña cifrada (BCrypt) en la base de datos:

| Usuario     | Contraseña     | Rol            |
|-------------|----------------|----------------|
| `admin`     | `admin123`     | Administrador  |
| `recepcion` | `recepcion123` | Recepcionista  |
| `mecanico`  | `mecanico123`  | Mecánico       |

---

## Estructura

- `pages/Login` — autenticación contra el backend real.
- `pages/Clientes` — alta, búsqueda y vehículos asociados a cada cliente.
- `pages/RegistroVehiculo` / `pages/ListaVehiculos` — alta y listado de vehículos (cliente obligatorio).
- `pages/OrdenesServicio` — tablero por estado y detalle de cada orden (diagnóstico, servicios, repuestos, pagos).
- `pages/Repuestos` — inventario y movimientos de stock (entradas/salidas).
- `pages/Usuarios` — CRUD de usuarios, roles (con su matriz de permisos) y grupos.
- `context/AuthContext` — sesión y resolución de permisos por rol/grupo.
- `services/*` — capa de acceso a datos: todas las llamadas usan la instancia axios compartida en `services/api.js` (URL configurable con `VITE_API_URL`) contra la API real de [MechanicSoftRest](../MechanicSoftRest).

## Scripts disponibles

```bash
npm run dev      # servidor de desarrollo
npm run build    # build de producción a dist/
npm run lint     # ESLint
npm run preview  # sirve el build de producción localmente
```
