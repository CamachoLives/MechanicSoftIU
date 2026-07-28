# 🏍️ MechanicSoft — Panel Web

Panel de control para talleres de motos: control de acceso por roles, un tablero en vivo de las 4 bahías del taller, y el registro de los vehículos que ingresan. Construido con **React 19 + Vite**, con una interfaz oscura de paneles de vidrio azul pastel y acentos en cian ("Cristal Azul").

Este frontend consume la API de vehículos del proyecto hermano **[MechanicSoftRest](../MechanicSoftRest)**. El login, los usuarios/roles/grupos y el tablero del taller son independientes de esa API: viven en el `localStorage` del navegador, así que funcionan aunque el backend no esté corriendo (solo el módulo de Vehículos lo necesita).

---

## 🚀 Cómo empezar

### Opción A — con Docker

Requisitos: Docker y Docker Compose.

```bash
docker compose up --build
```

La aplicación queda disponible en **http://localhost:8080**.

### Opción B — local, sin Docker

Requisitos: Node.js 20 o superior.

```bash
npm install
npm run dev
```

La aplicación queda disponible en **http://localhost:5173**.

> En ambos casos, si quieres que el módulo de **Vehículos** cargue datos reales, levanta también [MechanicSoftRest](../MechanicSoftRest) (por defecto se espera en `http://localhost:9769`). Sin él, el resto de la app funciona igual y solo se muestra un aviso de conexión en esa sección.

---

## 👥 Usuarios de prueba

Es un entorno de demostración: en la pantalla de login hay un panel de "Usuarios de prueba" con estas cuentas ya creadas (un clic inicia sesión con cualquiera de ellas):

| Usuario           | Contraseña     | Rol                              |
|-------------------|----------------|-----------------------------------|
| `admin`           | `admin123`     | Administrador                    |
| `jorge.mecanico`  | `mecanico123`  | Mecánico                         |
| `carlos.mecanico` | `mecanico123`  | Mecánico (+ bono de Supervisor)  |
| `recepcion`       | `recepcion123` | Recepción                        |

Las contraseñas viven sin cifrar solo en el navegador (localStorage) — es un esquema pensado para demostración, no para producción.

---

## Estructura

- `pages/Login` — autenticación.
- `pages/Taller` — tablero de las 4 bahías (asignar, actualizar, finalizar, cancelar).
- `pages/Usuarios` — CRUD de usuarios, roles (con su matriz de permisos), grupos y catálogo de permisos.
- `pages/RegistroVehiculo` / `pages/ListaVehiculos` — alta y listado de vehículos (contra la API real).
- `context/AuthContext` — sesión y resolución de permisos por rol/grupo.
- `services/*` — capa de acceso a datos: `vehiculoService` habla con el backend real; el resto (`usuarioService`, `rolService`, `grupoService`, `tallerService`, `authService`) son mocks sobre `localStorage` con la misma forma, para poder reemplazarlos por una API real más adelante sin tocar quien los usa.

## Scripts disponibles

```bash
npm run dev      # servidor de desarrollo
npm run build    # build de producción a dist/
npm run lint     # ESLint
npm run preview  # sirve el build de producción localmente
```
