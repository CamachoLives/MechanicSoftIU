# MechanicSoft en Cloudflare (gratis)

Un solo Worker sirve el frontend React y el API `/api/...` con una base de datos D1 (SQLite).
Es una reescritura del backend Spring Boot (`MechanicSoftRest`) con **los mismos endpoints,
el mismo JSON y las mismas reglas**: estados de la orden y sus transiciones, órdenes bloqueadas
al finalizar, stock de repuestos, total recalculado, resumen de pagos, último administrador,
roles del sistema, grupos y la consulta pública con límite de 10 intentos por hora.

## Diferencias con el backend Java

- **El API exige sesión.** El login devuelve un `token` y el frontend lo envía en
  `Authorization: Bearer ...`. En Spring Boot el login solo ocultaba pantallas: cualquiera con la
  URL podía leer o modificar clientes y órdenes. Públicos: `POST /api/auth/login` y `POST /api/publico/moto`.
- Contraseñas con PBKDF2-SHA256 (WebCrypto) en vez de BCrypt.
- El límite de la consulta pública se guarda en D1 (tabla `limites_consulta`), no en memoria.

## Correr en tu PC

```bash
npm install && npm run build            # frontend (raíz del repo)
cd cloudflare && npm install
echo "TOKEN_SECRET=cualquier-texto-largo" > .dev.vars
npx wrangler d1 execute mechanicsoft-db --local --file=schema.sql
node scripts/usuarios-iniciales.mjs admin123 recepcion123 mecanico123 > usuarios.sql
npx wrangler d1 execute mechanicsoft-db --local --file=usuarios.sql
npx wrangler d1 execute mechanicsoft-db --local --file=demo.sql   # opcional: datos de ejemplo
npx wrangler dev                          # http://localhost:8787
```

## Publicar

```bash
cd cloudflare
npx wrangler login
npx wrangler d1 create mechanicsoft-db     # copia el database_id en wrangler.jsonc
npx wrangler d1 execute mechanicsoft-db --remote --file=schema.sql
node scripts/usuarios-iniciales.mjs <clave_admin> <clave_recepcion> <clave_mecanico> > usuarios.sql
npx wrangler d1 execute mechanicsoft-db --remote --file=usuarios.sql
npx wrangler secret put TOKEN_SECRET
cd .. && npm run build && cd cloudflare && npx wrangler deploy
```

Todo dentro del plan gratis de Cloudflare: si se superan los límites diarios, responde con error
hasta el día siguiente; no cobra.
