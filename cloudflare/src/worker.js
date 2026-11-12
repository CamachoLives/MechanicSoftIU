/**
 * MechanicSoft API - Cloudflare Worker + D1
 *
 * Reescritura del backend Spring Boot (MechanicSoftRest) con los mismos endpoints,
 * el mismo JSON y las mismas reglas de negocio, para correr gratis en Cloudflare.
 *
 * Diferencia a propósito: el API exige iniciar sesión. En Spring Boot el login solo
 * ocultaba pantallas y cualquiera con la URL podía leer o modificar los datos.
 * Aquí el login devuelve un token y el resto de /api lo pide en "Authorization: Bearer".
 * Públicos: POST /api/auth/login y POST /api/publico/moto.
 */

// ---------- constantes de negocio (iguales al backend Java) ----------

const PERMISOS = [
  'vehiculos.ver', 'vehiculos.crear', 'vehiculos.editar', 'vehiculos.eliminar',
  'clientes.ver', 'clientes.crear', 'clientes.editar', 'clientes.eliminar',
  'ordenes.ver', 'ordenes.crear', 'ordenes.editar', 'ordenes.cambiarEstado',
  'ordenes.gestionarServicios', 'ordenes.gestionarRepuestos',
  'repuestos.ver', 'repuestos.crear', 'repuestos.editar', 'repuestos.eliminar', 'repuestos.movimientos',
  'pagos.ver', 'pagos.registrar', 'pagos.anular',
  'usuarios.ver', 'usuarios.crear', 'usuarios.editar', 'usuarios.eliminar',
  'roles.ver', 'roles.crear', 'roles.editar', 'roles.eliminar',
  'grupos.ver', 'grupos.crear', 'grupos.editar', 'grupos.eliminar',
];
const ESTADOS = ['RECIBIDO', 'EN_DIAGNOSTICO', 'ESPERA_APROBACION', 'APROBADO', 'EN_REPARACION', 'FINALIZADO', 'ENTREGADO', 'CANCELADO'];
const TRANSICIONES = {
  RECIBIDO: ['EN_DIAGNOSTICO', 'CANCELADO'],
  EN_DIAGNOSTICO: ['ESPERA_APROBACION', 'CANCELADO'],
  ESPERA_APROBACION: ['APROBADO', 'EN_DIAGNOSTICO', 'CANCELADO'],
  APROBADO: ['EN_REPARACION', 'CANCELADO'],
  EN_REPARACION: ['FINALIZADO', 'ESPERA_APROBACION', 'CANCELADO'],
  FINALIZADO: ['ENTREGADO', 'EN_REPARACION'],
  ENTREGADO: [],
  CANCELADO: [],
};
const INMUTABLES = ['FINALIZADO', 'ENTREGADO', 'CANCELADO'];
const TERMINALES = ['ENTREGADO', 'CANCELADO'];
const ETIQUETAS = {
  RECIBIDO: 'Recibida', EN_DIAGNOSTICO: 'En diagnóstico', ESPERA_APROBACION: 'Esperando aprobación',
  APROBADO: 'Aprobada', EN_REPARACION: 'En reparación', FINALIZADO: 'Finalizada', ENTREGADO: 'Entregada', CANCELADO: 'Cancelada',
};
const TIPOS_DOCUMENTO = ['CC', 'CE', 'TI', 'PP', 'NIT', 'PEP'];
const METODOS_PAGO = ['EFECTIVO', 'TRANSFERENCIA', 'TARJETA', 'OTRO'];
const PERMISO_ADMIN_USUARIOS = 'usuarios.editar';
const LIMITE_CONSULTAS = 10;
const VENTANA_CONSULTAS_MS = 60 * 60 * 1000;
const DURACION_TOKEN_MS = 12 * 60 * 60 * 1000;
const PBKDF2_ITERACIONES = 100000;

// ---------- errores con el mismo formato que GlobalExceptionHandler ----------

const RAZONES = { 400: 'Bad Request', 401: 'Unauthorized', 404: 'Not Found', 409: 'Conflict', 422: 'Unprocessable Entity', 429: 'Too Many Requests', 500: 'Internal Server Error' };

class HttpError extends Error {
  constructor(status, message, extra) { super(message); this.status = status; this.extra = extra; }
}
const noEncontrado = (m) => new HttpError(404, m);
const conflicto = (m) => new HttpError(409, m);
const invalido = (m) => new HttpError(400, m);

function ahora() {
  // LocalDateTime de Colombia (UTC-5), como lo serializa Jackson: sin zona horaria.
  return new Date(Date.now() - 5 * 3600_000).toISOString().replace('Z', '');
}

function cuerpoError(status, message, extra) {
  return { timestamp: ahora(), status, error: RAZONES[status] || 'Error', message, ...(extra || {}) };
}

/** Validación de campos al estilo Bean Validation: acumula y responde 400 con "errores". */
class Validador {
  constructor() { this.errores = {}; }
  agregar(campo, msg) { if (!(campo in this.errores)) this.errores[campo] = msg; }
  obligatorio(campo, v, msg) { if (v === undefined || v === null || String(v).trim() === '') this.agregar(campo, msg); return this; }
  noNulo(campo, v, msg = 'no debe ser nulo') { if (v === undefined || v === null || v === '') this.agregar(campo, msg); return this; }
  max(campo, v, n, msg) { if (v != null && String(v).length > n) this.agregar(campo, msg); return this; }
  patron(campo, v, re, msg) { if (v != null && v !== '' && !re.test(String(v))) this.agregar(campo, msg); return this; }
  minimo(campo, v, n, msg) { if (v != null && v !== '' && Number(v) < n) this.agregar(campo, msg); return this; }
  maximo(campo, v, n, msg) { if (v != null && v !== '' && Number(v) > n) this.agregar(campo, msg); return this; }
  correo(campo, v, msg = 'El correo no es válido') { if (v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) this.agregar(campo, msg); return this; }
  verificar() {
    if (Object.keys(this.errores).length) throw new HttpError(400, 'Uno o más campos no son válidos.', { errores: this.errores });
  }
}

const vacioANull = (v) => (v === undefined || v === '' ? null : v);
const numeroONull = (v) => (v === undefined || v === null || v === '' ? null : Number(v));
const bool = (v) => v === 1 || v === true;
const redondear = (n) => Math.round(Number(n) * 100) / 100;

function enteroValido(v, campo, { requerido = true } = {}) {
  if (v === undefined || v === null || v === '') {
    if (requerido) throw invalido(`El valor de '${campo}' no es válido.`);
    return null;
  }
  const n = Number(v);
  if (!Number.isInteger(n)) throw invalido(`El valor de '${campo}' no es válido.`);
  return n;
}

async function ejecutar(fn) {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof HttpError) throw e;
    const m = String(e?.message || e);
    if (m.includes('UNIQUE constraint failed')) throw conflicto('El registro entra en conflicto con datos existentes (¿un valor único duplicado?).');
    if (m.includes('CHECK constraint failed')) throw conflicto('Otra operación modificó este registro al mismo tiempo. Vuelve a intentarlo.');
    throw e;
  }
}

// ---------- contraseñas (PBKDF2) y token de sesión (HMAC) ----------

const te = new TextEncoder();
const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const deB64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const b64url = (s) => btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const deB64url = (s) => atob(s.replace(/-/g, '+').replace(/_/g, '/'));

async function derivar(contrasena, sal, iteraciones) {
  const clave = await crypto.subtle.importKey('raw', te.encode(contrasena), 'PBKDF2', false, ['deriveBits']);
  return crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: sal, iterations: iteraciones }, clave, 256);
}

async function hashContrasena(contrasena) {
  const sal = crypto.getRandomValues(new Uint8Array(16));
  const h = await derivar(contrasena, sal, PBKDF2_ITERACIONES);
  return `pbkdf2$${PBKDF2_ITERACIONES}$${b64(sal)}$${b64(h)}`;
}

async function verificarContrasena(contrasena, guardado) {
  const [tipo, it, sal, hash] = String(guardado || '').split('$');
  if (tipo !== 'pbkdf2') return false;
  const h = b64(await derivar(String(contrasena ?? ''), deB64(sal), parseInt(it, 10)));
  if (h.length !== hash.length) return false;
  let dif = 0;
  for (let i = 0; i < h.length; i++) dif |= h.charCodeAt(i) ^ hash.charCodeAt(i);
  return dif === 0;
}

async function claveHmac(env) {
  if (!env.TOKEN_SECRET) throw new HttpError(500, 'Falta configurar TOKEN_SECRET.');
  return crypto.subtle.importKey('raw', te.encode(env.TOKEN_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

async function crearToken(env, usuarioId) {
  const datos = b64url(JSON.stringify({ u: usuarioId, e: Date.now() + DURACION_TOKEN_MS }));
  const firma = await crypto.subtle.sign('HMAC', await claveHmac(env), te.encode(datos));
  return `${datos}.${b64url(String.fromCharCode(...new Uint8Array(firma)))}`;
}

async function usuarioDelToken(request, env) {
  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const [datos, firma] = token.split('.');
  const sinSesion = new HttpError(401, 'Tu sesión expiró. Inicia sesión de nuevo.');
  if (!datos || !firma) throw sinSesion;
  let ok = false;
  try {
    const bytes = Uint8Array.from(deB64url(firma), (c) => c.charCodeAt(0));
    ok = await crypto.subtle.verify('HMAC', await claveHmac(env), bytes, te.encode(datos));
  } catch { ok = false; }
  if (!ok) throw sinSesion;
  const p = JSON.parse(deB64url(datos));
  if (!p.e || p.e < Date.now()) throw sinSesion;
  const u = await env.DB.prepare('SELECT id, activo FROM usuarios WHERE id = ?').bind(p.u).first();
  if (!u || !bool(u.activo)) throw sinSesion;
  return u.id;
}

// ---------- lectura y serialización (mismo JSON que Jackson) ----------

const enLista = (ids) => [...new Set(ids.filter((x) => x != null).map((x) => parseInt(x, 10)))];

function rolJson(r) {
  if (!r) return null;
  let permisos = [];
  try { permisos = JSON.parse(r.permisos || '[]'); } catch { permisos = []; }
  return { id: r.id, nombre: r.nombre, descripcion: r.descripcion, permisos, colorBadge: r.color_badge, esSistema: bool(r.es_sistema), createdAt: r.created_at };
}

async function mapaRoles(env) {
  const { results } = await env.DB.prepare('SELECT * FROM roles').all();
  return new Map(results.map((r) => [r.id, rolJson(r)]));
}

function usuarioJson(u, roles) {
  return {
    id: u.id, usuario: u.usuario, nombre: u.nombre, correo: u.correo, telefono: u.telefono, cargo: u.cargo,
    rol: roles.get(u.rol_id) ?? null, activo: bool(u.activo), createdAt: u.created_at,
  };
}

async function usuariosPorIds(env, ids, roles) {
  const lista = enLista(ids);
  if (!lista.length) return new Map();
  const { results } = await env.DB.prepare(`SELECT * FROM usuarios WHERE id IN (${lista.join(',')})`).all();
  roles = roles || (await mapaRoles(env));
  return new Map(results.map((u) => [u.id, usuarioJson(u, roles)]));
}

function clienteJson(c) {
  if (!c) return null;
  return {
    id: c.id, nombre: c.nombre, apellido: c.apellido, telefono: c.telefono, correo: c.correo,
    tipoDocumento: c.tipo_documento, numeroDocumento: c.numero_documento, createdAt: c.created_at, activo: bool(c.activo),
  };
}

async function clientesPorIds(env, ids) {
  const lista = enLista(ids);
  if (!lista.length) return new Map();
  const { results } = await env.DB.prepare(`SELECT * FROM clientes WHERE id IN (${lista.join(',')})`).all();
  return new Map(results.map((c) => [c.id, clienteJson(c)]));
}

function vehiculoJson(v, cliente) {
  return {
    id: v.id, placa: v.placa, marca: v.marca, modelo: v.modelo, anio: v.anio, color: v.color, kilometraje: v.kilometraje,
    cilindrajeCc: v.cilindraje_cc, fotoVehiculo: v.foto_vehiculo, observaciones: v.observaciones,
    cliente: cliente ?? null, activo: bool(v.activo), createdAt: v.created_at, updatedAt: v.updated_at,
  };
}

async function vehiculosJson(env, filas) {
  const clientes = await clientesPorIds(env, filas.map((v) => v.cliente_id));
  return filas.map((v) => vehiculoJson(v, clientes.get(v.cliente_id)));
}

function repuestoJson(r) {
  return {
    id: r.id, nombre: r.nombre, codigo: r.codigo, descripcion: r.descripcion, precio: r.precio,
    cantidadDisponible: r.cantidad_disponible, activo: bool(r.activo), createdAt: r.created_at, version: r.version,
  };
}

async function ordenesJson(env, filas) {
  if (!filas.length) return [];
  const vehs = enLista(filas.map((o) => o.vehiculo_id));
  const { results: vfilas } = await env.DB.prepare(`SELECT * FROM vehiculos WHERE id IN (${vehs.join(',')})`).all();
  const vehiculos = new Map((await vehiculosJson(env, vfilas)).map((v) => [v.id, v]));
  const ids = filas.map((o) => o.id).join(',');
  const { results: mec } = await env.DB.prepare(`SELECT orden_id, usuario_id FROM orden_mecanicos WHERE orden_id IN (${ids})`).all();
  const usuarios = await usuariosPorIds(env, mec.map((m) => m.usuario_id));
  return filas.map((o) => ({
    id: o.id,
    vehiculo: vehiculos.get(o.vehiculo_id) ?? null,
    kilometrajeIngreso: o.kilometraje_ingreso,
    fechaIngreso: o.fecha_ingreso,
    motivoIngreso: o.motivo_ingreso,
    diagnostico: o.diagnostico,
    trabajoRealizado: o.trabajo_realizado,
    observaciones: o.observaciones,
    estado: o.estado,
    valorTotal: o.valor_total,
    fechaEntrega: o.fecha_entrega,
    createdAt: o.created_at,
    updatedAt: o.updated_at,
    mecanicos: mec.filter((m) => m.orden_id === o.id).map((m) => usuarios.get(m.usuario_id)).filter(Boolean),
  }));
}

async function ordenJson(env, id) {
  const o = await env.DB.prepare('SELECT * FROM ordenes_servicio WHERE id = ?').bind(id).first();
  if (!o) throw noEncontrado('Orden de servicio no encontrada');
  return (await ordenesJson(env, [o]))[0];
}

async function gruposJson(env, filas) {
  if (!filas.length) return [];
  const roles = await mapaRoles(env);
  const { results: mi } = await env.DB.prepare(`SELECT grupo_id, usuario_id FROM grupo_miembros WHERE grupo_id IN (${filas.map((g) => g.id).join(',')})`).all();
  const usuarios = await usuariosPorIds(env, mi.map((m) => m.usuario_id), roles);
  return filas.map((g) => ({
    id: g.id, nombre: g.nombre, descripcion: g.descripcion,
    miembros: mi.filter((m) => m.grupo_id === g.id).map((m) => usuarios.get(m.usuario_id)).filter(Boolean),
    rolBonus: g.rol_bonus_id ? roles.get(g.rol_bonus_id) ?? null : null,
    createdAt: g.created_at,
  }));
}

// ---------- auth ----------

async function login(env, body) {
  const u = await env.DB.prepare('SELECT * FROM usuarios WHERE usuario = ?').bind(String(body.usuario ?? '')).first();
  if (!u) throw new HttpError(401, 'Usuario o contraseña incorrectos.');
  if (!bool(u.activo)) throw new HttpError(401, 'Este usuario está inactivo. Contacta a un administrador.');
  if (!(await verificarContrasena(body.contrasena, u.contrasena))) throw new HttpError(401, 'Usuario o contraseña incorrectos.');
  const rol = (await mapaRoles(env)).get(u.rol_id);
  return {
    id: u.id, usuario: u.usuario, nombre: u.nombre, correo: u.correo,
    rolId: rol?.id ?? null, rolNombre: rol?.nombre ?? null, permisos: rol?.permisos ?? null,
    token: await crearToken(env, u.id),
  };
}

// ---------- clientes ----------

function validarCliente(b) {
  new Validador()
    .obligatorio('nombre', b.nombre, 'El nombre es obligatorio').max('nombre', b.nombre, 100, 'El nombre no puede tener más de 100 caracteres')
    .max('apellido', b.apellido, 100, 'El apellido no puede tener más de 100 caracteres')
    .obligatorio('telefono', b.telefono, 'El teléfono es obligatorio').patron('telefono', b.telefono, /^[0-9+()\s-]{7,20}$/, 'El teléfono no es válido')
    .correo('correo', b.correo).max('correo', b.correo, 150, 'El correo no puede tener más de 150 caracteres')
    .max('numeroDocumento', b.numeroDocumento, 30, 'El número de documento no puede tener más de 30 caracteres')
    .verificar();
  if (b.tipoDocumento != null && b.tipoDocumento !== '' && !TIPOS_DOCUMENTO.includes(b.tipoDocumento)) throw invalido('El cuerpo de la petición no es válido.');
}

async function clientePorId(env, id) {
  const c = await env.DB.prepare('SELECT * FROM clientes WHERE id = ?').bind(id).first();
  if (!c) throw noEncontrado('Cliente no encontrado');
  return c;
}

// ---------- vehículos ----------

function validarVehiculo(b) {
  new Validador()
    .obligatorio('placa', b.placa, 'La placa es obligatoria')
    .patron('placa', b.placa, /^[A-Za-z0-9-]{4,10}$/, 'La placa solo puede tener letras, números y guiones (4 a 10 caracteres)')
    .obligatorio('marca', b.marca, 'La marca es obligatoria').max('marca', b.marca, 100, 'La marca no puede tener más de 100 caracteres')
    .obligatorio('modelo', b.modelo, 'El modelo es obligatorio').max('modelo', b.modelo, 100, 'El modelo no puede tener más de 100 caracteres')
    .noNulo('anio', b.anio, 'El año es obligatorio').minimo('anio', b.anio, 1900, 'El año no es válido').maximo('anio', b.anio, 2100, 'El año no es válido')
    .obligatorio('color', b.color, 'El color es obligatorio').max('color', b.color, 50, 'El color no puede tener más de 50 caracteres')
    .noNulo('kilometraje', b.kilometraje).minimo('kilometraje', b.kilometraje, 0, 'debe ser mayor que o igual a 0')
    .noNulo('cilindrajeCc', b.cilindrajeCc).minimo('cilindrajeCc', b.cilindrajeCc, 50, 'debe ser mayor que o igual a 50')
    .max('observaciones', b.observaciones, 500, 'Las observaciones no pueden tener más de 500 caracteres')
    .noNulo('cliente', b.cliente, 'El cliente es obligatorio')
    .verificar();
}

async function resolverCliente(env, b) {
  if (!b.cliente || b.cliente.id == null) throw noEncontrado('El vehículo debe tener un cliente asociado');
  return clientePorId(env, enteroValido(b.cliente.id, 'cliente.id'));
}

async function vehiculoPorId(env, id) {
  const v = await env.DB.prepare('SELECT * FROM vehiculos WHERE id = ?').bind(id).first();
  if (!v) throw noEncontrado('Vehículo no encontrado');
  return v;
}

const unVehiculo = async (env, id) => (await vehiculosJson(env, [await vehiculoPorId(env, id)]))[0];

// ---------- repuestos ----------

function validarRepuesto(b) {
  new Validador()
    .obligatorio('nombre', b.nombre, 'El nombre es obligatorio').max('nombre', b.nombre, 150, 'El nombre no puede tener más de 150 caracteres')
    .obligatorio('codigo', b.codigo, 'El código es obligatorio').max('codigo', b.codigo, 50, 'El código no puede tener más de 50 caracteres')
    .max('descripcion', b.descripcion, 300, 'La descripción no puede tener más de 300 caracteres')
    .noNulo('precio', b.precio, 'El precio es obligatorio').minimo('precio', b.precio, 0, 'El precio no puede ser negativo')
    .noNulo('cantidadDisponible', b.cantidadDisponible, 'La cantidad disponible es obligatoria')
    .minimo('cantidadDisponible', b.cantidadDisponible, 0, 'La cantidad disponible no puede ser negativa')
    .verificar();
}

async function repuestoPorId(env, id) {
  const r = await env.DB.prepare('SELECT * FROM repuestos WHERE id = ?').bind(id).first();
  if (!r) throw noEncontrado('Repuesto no encontrado');
  return r;
}

async function moverStock(env, id, body, signo) {
  if (body.cantidad === undefined || body.cantidad === null) throw invalido('La cantidad es obligatoria.');
  const cantidad = enteroValido(body.cantidad, 'cantidad');
  if (cantidad <= 0) throw conflicto(`La cantidad de ${signo > 0 ? 'entrada' : 'salida'} debe ser mayor a cero.`);
  const r = await repuestoPorId(env, id);
  if (signo < 0) {
    const res = await env.DB.prepare('UPDATE repuestos SET cantidad_disponible = cantidad_disponible - ?, version = version + 1 WHERE id = ? AND cantidad_disponible >= ?').bind(cantidad, id, cantidad).run();
    if (!res.meta.changes) throw new HttpError(422, `No hay suficiente stock de ${r.nombre}.`);
  } else {
    await env.DB.prepare('UPDATE repuestos SET cantidad_disponible = cantidad_disponible + ?, version = version + 1 WHERE id = ?').bind(cantidad, id).run();
  }
  return repuestoJson(await repuestoPorId(env, id));
}

// ---------- órdenes ----------

async function ordenFila(env, id) {
  const o = await env.DB.prepare('SELECT * FROM ordenes_servicio WHERE id = ?').bind(id).first();
  if (!o) throw noEncontrado('Orden de servicio no encontrada');
  return o;
}

function verificarMutable(o) {
  if (INMUTABLES.includes(o.estado)) throw conflicto(`Esta orden ya no admite cambios (estado: ${o.estado}).`);
}

async function idsMecanicos(env, lista) {
  if (!Array.isArray(lista) || !lista.length) return [];
  const ids = enLista(lista.map((m) => (m && typeof m === 'object' ? m.id : m)).filter((x) => x != null && Number.isInteger(Number(x))));
  if (!ids.length) return [];
  const { results } = await env.DB.prepare(`SELECT id FROM usuarios WHERE id IN (${ids.join(',')})`).all();
  return results.map((r) => r.id);
}

function recalcularTotal(env, ordenId) {
  return env.DB.prepare(`
    UPDATE ordenes_servicio SET valor_total =
      COALESCE((SELECT SUM(subtotal) FROM servicios_orden WHERE orden_id = ?1), 0) +
      COALESCE((SELECT SUM(subtotal) FROM repuestos_orden WHERE orden_id = ?1), 0),
      updated_at = ?2
    WHERE id = ?1`).bind(ordenId, ahora());
}

function servicioJson(s) {
  return { id: s.id, nombreServicio: s.nombre_servicio, descripcion: s.descripcion, cantidad: s.cantidad, precioUnitario: s.precio_unitario, subtotal: s.subtotal };
}

async function lineasRepuestoJson(env, filas) {
  const ids = enLista(filas.map((l) => l.repuesto_id));
  const rep = ids.length ? (await env.DB.prepare(`SELECT * FROM repuestos WHERE id IN (${ids.join(',')})`).all()).results : [];
  const mapa = new Map(rep.map((r) => [r.id, repuestoJson(r)]));
  return filas.map((l) => ({ id: l.id, repuesto: mapa.get(l.repuesto_id) ?? null, cantidadUtilizada: l.cantidad_utilizada, precioUnitario: l.precio_unitario, subtotal: l.subtotal }));
}

const pagoJson = (p) => ({ id: p.id, monto: p.monto, metodoPago: p.metodo_pago, fechaPago: p.fecha_pago, estado: p.estado });

// ---------- usuarios, roles y grupos ----------

async function usuarioFila(env, id) {
  const u = await env.DB.prepare('SELECT * FROM usuarios WHERE id = ?').bind(id).first();
  if (!u) throw noEncontrado('Usuario no encontrado');
  return u;
}

async function unUsuario(env, id) {
  return usuarioJson(await usuarioFila(env, id), await mapaRoles(env));
}

async function resolverRol(env, b) {
  if (!b.rol || b.rol.id == null || b.rol.id === '') throw noEncontrado('El usuario debe tener un rol asignado');
  const r = await env.DB.prepare('SELECT id FROM roles WHERE id = ?').bind(enteroValido(b.rol.id, 'rol.id')).first();
  if (!r) throw noEncontrado('Rol no encontrado');
  return r.id;
}

/** Evita quedarse sin nadie que pueda administrar usuarios. */
async function verificarNoUltimoAdministrador(env, idAfectado) {
  const roles = await mapaRoles(env);
  const { results } = await env.DB.prepare('SELECT id, rol_id FROM usuarios WHERE activo = 1 AND id != ?').bind(idAfectado).all();
  if (!results.some((u) => roles.get(u.rol_id)?.permisos.includes(PERMISO_ADMIN_USUARIOS))) {
    throw conflicto('No es posible continuar: no quedaría ningún usuario activo con permiso para administrar usuarios.');
  }
}

function validarUsuario(b) {
  new Validador()
    .obligatorio('usuario', b.usuario, 'El usuario es obligatorio').max('usuario', b.usuario, 100, 'El usuario no puede tener más de 100 caracteres')
    .obligatorio('nombre', b.nombre, 'El nombre es obligatorio').max('nombre', b.nombre, 150, 'El nombre no puede tener más de 150 caracteres')
    .correo('correo', b.correo).max('correo', b.correo, 150, 'El correo no puede tener más de 150 caracteres')
    .max('telefono', b.telefono, 20, 'El teléfono no puede tener más de 20 caracteres')
    .max('cargo', b.cargo, 100, 'El cargo no puede tener más de 100 caracteres')
    .noNulo('rol', b.rol, 'El rol es obligatorio')
    .verificar();
}

const permisosValidos = (p) => (Array.isArray(p) ? p.filter((x) => typeof x === 'string') : []);

async function rolPorId(env, id) {
  const r = await env.DB.prepare('SELECT * FROM roles WHERE id = ?').bind(id).first();
  if (!r) throw noEncontrado('Rol no encontrado');
  return r;
}

async function guardarGrupo(env, id, b) {
  new Validador().obligatorio('nombre', b.nombre, 'El nombre es obligatorio').verificar();
  let rolBonus = null;
  if (b.rolBonus && b.rolBonus.id != null && b.rolBonus.id !== '') {
    const r = await env.DB.prepare('SELECT id FROM roles WHERE id = ?').bind(enteroValido(b.rolBonus.id, 'rolBonus.id')).first();
    if (!r) throw noEncontrado('Rol bono no encontrado');
    rolBonus = r.id;
  }
  const miembros = await idsMecanicos(env, b.miembros);
  if (id == null) {
    const g = await env.DB.prepare('INSERT INTO grupos (nombre, descripcion, rol_bonus_id, created_at) VALUES (?, ?, ?, ?) RETURNING id')
      .bind(b.nombre, vacioANull(b.descripcion), rolBonus, ahora()).first();
    id = g.id;
  } else {
    await env.DB.prepare('UPDATE grupos SET nombre = ?, descripcion = ?, rol_bonus_id = ? WHERE id = ?').bind(b.nombre, vacioANull(b.descripcion), rolBonus, id).run();
  }
  await env.DB.batch([
    env.DB.prepare('DELETE FROM grupo_miembros WHERE grupo_id = ?').bind(id),
    ...miembros.map((u) => env.DB.prepare('INSERT INTO grupo_miembros (grupo_id, usuario_id) VALUES (?, ?)').bind(id, u)),
  ]);
  const g = await env.DB.prepare('SELECT * FROM grupos WHERE id = ?').bind(id).first();
  return (await gruposJson(env, [g]))[0];
}

// ---------- consulta pública ----------

async function consultaPublica(env, request, b) {
  const ip = request.headers.get('cf-connecting-ip') || (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'desconocida';
  const ahoraMs = Date.now();
  const reg = await env.DB.prepare(`
    INSERT INTO limites_consulta (ip, intentos, inicio) VALUES (?1, 1, ?2)
    ON CONFLICT(ip) DO UPDATE SET
      intentos = CASE WHEN ?2 - inicio > ?3 THEN 1 ELSE intentos + 1 END,
      inicio = CASE WHEN ?2 - inicio > ?3 THEN ?2 ELSE inicio END
    RETURNING intentos, inicio`).bind(ip, ahoraMs, VENTANA_CONSULTAS_MS).first();
  if (reg.intentos > LIMITE_CONSULTAS) {
    const espera = Math.max(0, Math.floor((VENTANA_CONSULTAS_MS - (ahoraMs - reg.inicio)) / 1000));
    return json({ mensaje: `Has superado el límite de consultas. Intenta de nuevo en ${espera} segundos.`, esperarSegundos: espera }, 429);
  }

  if (b.tipoDocumento != null && !TIPOS_DOCUMENTO.includes(b.tipoDocumento)) throw invalido('El cuerpo de la petición no es válido.');
  new Validador()
    .obligatorio('placa', b.placa, 'La placa es obligatoria').patron('placa', b.placa, /^[A-Za-z0-9-]{4,10}$/, 'Placa inválida')
    .noNulo('tipoDocumento', b.tipoDocumento, 'El tipo de documento es obligatorio')
    .obligatorio('numeroDocumento', b.numeroDocumento, 'El número de documento es obligatorio')
    .verificar();

  const ERROR = 'No se encontró ninguna moto asociada a los datos ingresados. Verifica la placa y tu documento.';
  const v = await env.DB.prepare('SELECT * FROM vehiculos WHERE placa = ?').bind(String(b.placa).toUpperCase()).first();
  if (!v) throw noEncontrado(ERROR);
  const c = await env.DB.prepare('SELECT * FROM clientes WHERE id = ?').bind(v.cliente_id).first();
  if (!c || c.tipo_documento !== b.tipoDocumento || String(b.numeroDocumento).trim() !== c.numero_documento) throw noEncontrado(ERROR);
  const { results } = await env.DB.prepare('SELECT * FROM ordenes_servicio WHERE vehiculo_id = ? ORDER BY fecha_ingreso DESC').bind(v.id).all();
  return json({
    vehiculo: { placa: v.placa, marca: v.marca, modelo: v.modelo, anio: v.anio, color: v.color, kilometraje: v.kilometraje, cilindrajeCc: v.cilindraje_cc },
    ordenes: results.map((o) => ({
      id: o.id, estado: o.estado, estadoEtiqueta: ETIQUETAS[o.estado] || o.estado, motivoIngreso: o.motivo_ingreso,
      fechaIngreso: o.fecha_ingreso, diagnostico: o.diagnostico, trabajoRealizado: o.trabajo_realizado,
      observaciones: o.observaciones, valorTotal: o.valor_total, fechaEntrega: o.fecha_entrega,
    })),
  });
}

// ---------- router ----------

function json(data, status = 200) {
  return new Response(data === undefined ? null : JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}
const vacio = () => new Response(null, { status: 200 });

const rutas = [];
const ruta = (metodo, patron, fn) => rutas.push({ metodo, re: new RegExp('^' + patron.replace(/:(\w+)/g, '(?<$1>[^/]+)') + '/?$'), fn });

ruta('POST', '/api/auth/login', async ({ env, body }) => json(await login(env, body)));
ruta('POST', '/api/publico/moto', async ({ env, request, body }) => consultaPublica(env, request, body));

// Clientes
ruta('GET', '/api/clientes', async ({ env, url }) => {
  const q = (url.searchParams.get('buscar') || '').trim();
  const { results } = q
    ? await env.DB.prepare("SELECT * FROM clientes WHERE LOWER(nombre) LIKE '%' || LOWER(?1) || '%' OR telefono LIKE '%' || ?1 || '%' ORDER BY id").bind(q).all()
    : await env.DB.prepare('SELECT * FROM clientes ORDER BY id').all();
  return json(results.map(clienteJson));
});
ruta('POST', '/api/clientes', async ({ env, body: b }) => {
  validarCliente(b);
  const f = ahora();
  const c = await ejecutar(() => env.DB.prepare(`INSERT INTO clientes (nombre, apellido, telefono, correo, tipo_documento, numero_documento, created_at, activo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`).bind(b.nombre, vacioANull(b.apellido), b.telefono, vacioANull(b.correo), vacioANull(b.tipoDocumento),
    vacioANull(b.numeroDocumento), f, b.activo === false ? 0 : 1).first());
  return json(clienteJson(c));
});
ruta('GET', '/api/clientes/por-documento/:tipo/:numero', async ({ env, p }) => {
  if (!TIPOS_DOCUMENTO.includes(p.tipo)) throw invalido("El valor de 'tipo' no es válido.");
  const c = await env.DB.prepare('SELECT * FROM clientes WHERE tipo_documento = ? AND numero_documento = ?').bind(p.tipo, decodeURIComponent(p.numero)).first();
  return c ? json(clienteJson(c)) : new Response(null, { status: 404 });
});
ruta('GET', '/api/clientes/:id', async ({ env, p }) => json(clienteJson(await clientePorId(env, enteroValido(p.id, 'id')))));
ruta('PUT', '/api/clientes/:id', async ({ env, p, body: b }) => {
  validarCliente(b);
  const id = enteroValido(p.id, 'id');
  await clientePorId(env, id);
  await ejecutar(() => env.DB.prepare('UPDATE clientes SET nombre = ?, apellido = ?, telefono = ?, correo = ?, tipo_documento = ?, numero_documento = ? WHERE id = ?')
    .bind(b.nombre, vacioANull(b.apellido), b.telefono, vacioANull(b.correo), vacioANull(b.tipoDocumento), vacioANull(b.numeroDocumento), id).run());
  return json(clienteJson(await clientePorId(env, id)));
});
ruta('PATCH', '/api/clientes/:id/estado', async ({ env, p, body }) => {
  const id = enteroValido(p.id, 'id');
  await clientePorId(env, id);
  await env.DB.prepare('UPDATE clientes SET activo = ? WHERE id = ?').bind(body.activo === true ? 1 : 0, id).run();
  return json(clienteJson(await clientePorId(env, id)));
});
ruta('GET', '/api/clientes/:id/vehiculos', async ({ env, p }) => {
  const { results } = await env.DB.prepare('SELECT * FROM vehiculos WHERE cliente_id = ? ORDER BY id').bind(enteroValido(p.id, 'id')).all();
  return json(await vehiculosJson(env, results));
});

// Vehículos
ruta('GET', '/api/vehiculos', async ({ env }) => json(await vehiculosJson(env, (await env.DB.prepare('SELECT * FROM vehiculos ORDER BY id').all()).results)));
ruta('POST', '/api/vehiculos', async ({ env, body: b }) => {
  validarVehiculo(b);
  const c = await resolverCliente(env, b);
  const f = ahora();
  const v = await ejecutar(() => env.DB.prepare(`INSERT INTO vehiculos (placa, marca, modelo, anio, color, kilometraje, cilindraje_cc, foto_vehiculo, observaciones, cliente_id, activo, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`).bind(b.placa, b.marca, b.modelo, Number(b.anio), b.color, Number(b.kilometraje), Number(b.cilindrajeCc),
    vacioANull(b.fotoVehiculo), vacioANull(b.observaciones), c.id, b.activo === false ? 0 : 1, f, f).first());
  return json(await unVehiculo(env, v.id));
});
ruta('GET', '/api/vehiculos/placa/:placa', async ({ env, p }) => {
  const v = await env.DB.prepare('SELECT * FROM vehiculos WHERE placa = ?').bind(decodeURIComponent(p.placa)).first();
  if (!v) throw noEncontrado('Vehículo no encontrado');
  return json((await vehiculosJson(env, [v]))[0]);
});
ruta('GET', '/api/vehiculos/:id', async ({ env, p }) => json(await unVehiculo(env, enteroValido(p.id, 'id'))));
ruta('PUT', '/api/vehiculos/:id', async ({ env, p, body: b }) => {
  validarVehiculo(b);
  const id = enteroValido(p.id, 'id');
  await vehiculoPorId(env, id);
  const c = await resolverCliente(env, b);
  await ejecutar(() => env.DB.prepare(`UPDATE vehiculos SET placa = ?, marca = ?, modelo = ?, anio = ?, color = ?, kilometraje = ?, cilindraje_cc = ?,
    foto_vehiculo = ?, observaciones = ?, cliente_id = ?, updated_at = ? WHERE id = ?`).bind(b.placa, b.marca, b.modelo, Number(b.anio), b.color,
    Number(b.kilometraje), Number(b.cilindrajeCc), vacioANull(b.fotoVehiculo), vacioANull(b.observaciones), c.id, ahora(), id).run());
  return json(await unVehiculo(env, id));
});
ruta('PATCH', '/api/vehiculos/:id/estado', async ({ env, p, body }) => {
  const id = enteroValido(p.id, 'id');
  await vehiculoPorId(env, id);
  await env.DB.prepare('UPDATE vehiculos SET activo = ?, updated_at = ? WHERE id = ?').bind(body.activo === true ? 1 : 0, ahora(), id).run();
  return json(await unVehiculo(env, id));
});

// Repuestos
ruta('GET', '/api/repuestos', async ({ env, url }) => {
  const q = (url.searchParams.get('buscar') || '').trim();
  const { results } = q
    ? await env.DB.prepare("SELECT * FROM repuestos WHERE LOWER(nombre) LIKE '%' || LOWER(?1) || '%' OR LOWER(codigo) LIKE '%' || LOWER(?1) || '%' ORDER BY id").bind(q).all()
    : await env.DB.prepare('SELECT * FROM repuestos ORDER BY id').all();
  return json(results.map(repuestoJson));
});
ruta('POST', '/api/repuestos', async ({ env, body: b }) => {
  validarRepuesto(b);
  if (await env.DB.prepare('SELECT 1 FROM repuestos WHERE codigo = ?').bind(b.codigo).first()) throw conflicto('Ya existe un repuesto con ese código.');
  const r = await ejecutar(() => env.DB.prepare(`INSERT INTO repuestos (nombre, codigo, descripcion, precio, cantidad_disponible, activo, created_at, version)
    VALUES (?, ?, ?, ?, ?, ?, ?, 0) RETURNING *`).bind(b.nombre, b.codigo, vacioANull(b.descripcion), redondear(b.precio), Number(b.cantidadDisponible),
    b.activo === false ? 0 : 1, ahora()).first());
  return json(repuestoJson(r));
});
ruta('GET', '/api/repuestos/:id', async ({ env, p }) => json(repuestoJson(await repuestoPorId(env, enteroValido(p.id, 'id')))));
ruta('PUT', '/api/repuestos/:id', async ({ env, p, body: b }) => {
  validarRepuesto(b);
  const id = enteroValido(p.id, 'id');
  const ex = await repuestoPorId(env, id);
  if (ex.codigo !== b.codigo && (await env.DB.prepare('SELECT 1 FROM repuestos WHERE codigo = ?').bind(b.codigo).first())) throw conflicto('Ya existe un repuesto con ese código.');
  await ejecutar(() => env.DB.prepare('UPDATE repuestos SET nombre = ?, codigo = ?, descripcion = ?, precio = ?, cantidad_disponible = ?, version = version + 1 WHERE id = ?')
    .bind(b.nombre, b.codigo, vacioANull(b.descripcion), redondear(b.precio), Number(b.cantidadDisponible), id).run());
  return json(repuestoJson(await repuestoPorId(env, id)));
});
ruta('PATCH', '/api/repuestos/:id/estado', async ({ env, p, body }) => {
  const id = enteroValido(p.id, 'id');
  await repuestoPorId(env, id);
  await env.DB.prepare('UPDATE repuestos SET activo = ?, version = version + 1 WHERE id = ?').bind(body.activo === true ? 1 : 0, id).run();
  return json(repuestoJson(await repuestoPorId(env, id)));
});
ruta('POST', '/api/repuestos/:id/entradas', async ({ env, p, body }) => json(await moverStock(env, enteroValido(p.id, 'id'), body, 1)));
ruta('POST', '/api/repuestos/:id/salidas', async ({ env, p, body }) => json(await moverStock(env, enteroValido(p.id, 'id'), body, -1)));

// Órdenes de servicio
ruta('GET', '/api/ordenes', async ({ env, url }) => {
  const vehiculoId = enteroValido(url.searchParams.get('vehiculoId'), 'vehiculoId', { requerido: false });
  const clienteId = enteroValido(url.searchParams.get('clienteId'), 'clienteId', { requerido: false });
  const estado = url.searchParams.get('estado') || null;
  if (estado && !ESTADOS.includes(estado)) throw invalido("El valor de 'estado' no es válido.");
  let st;
  if (vehiculoId != null) st = env.DB.prepare('SELECT * FROM ordenes_servicio WHERE vehiculo_id = ? ORDER BY id').bind(vehiculoId);
  else if (clienteId != null) st = env.DB.prepare('SELECT o.* FROM ordenes_servicio o JOIN vehiculos v ON v.id = o.vehiculo_id WHERE v.cliente_id = ? ORDER BY o.id').bind(clienteId);
  else if (estado) st = env.DB.prepare('SELECT * FROM ordenes_servicio WHERE estado = ? ORDER BY id').bind(estado);
  else st = env.DB.prepare('SELECT * FROM ordenes_servicio ORDER BY id');
  return json(await ordenesJson(env, (await st.all()).results));
});
ruta('GET', '/api/ordenes/resumen', async ({ env }) => {
  const { results } = await env.DB.prepare('SELECT estado, COUNT(*) AS n FROM ordenes_servicio GROUP BY estado').all();
  const porEstado = ESTADOS.map((e) => ({ estado: e, cantidad: results.find((r) => r.estado === e)?.n ?? 0 }));
  return json({
    totalOrdenes: porEstado.reduce((s, x) => s + x.cantidad, 0),
    ordenesAbiertas: porEstado.filter((x) => !TERMINALES.includes(x.estado)).reduce((s, x) => s + x.cantidad, 0),
    porEstado,
  });
});
ruta('POST', '/api/ordenes', async ({ env, body: b }) => {
  new Validador()
    .noNulo('vehiculo', b.vehiculo, 'El vehículo es obligatorio')
    .noNulo('kilometrajeIngreso', b.kilometrajeIngreso, 'El kilometraje de ingreso es obligatorio')
    .minimo('kilometrajeIngreso', b.kilometrajeIngreso, 0, 'debe ser mayor que o igual a 0')
    .obligatorio('motivoIngreso', b.motivoIngreso, 'El motivo de ingreso es obligatorio')
    .max('motivoIngreso', b.motivoIngreso, 500, 'El motivo de ingreso no puede tener más de 500 caracteres')
    .verificar();
  if (!b.vehiculo || b.vehiculo.id == null) throw noEncontrado('La orden debe tener un vehículo asociado');
  const v = await vehiculoPorId(env, enteroValido(b.vehiculo.id, 'vehiculo.id'));
  const mecanicos = await idsMecanicos(env, b.mecanicos);
  const f = ahora();
  const o = await env.DB.prepare(`INSERT INTO ordenes_servicio (vehiculo_id, kilometraje_ingreso, fecha_ingreso, motivo_ingreso, observaciones, estado, valor_total, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'RECIBIDO', 0, ?, ?) RETURNING id`).bind(v.id, Number(b.kilometrajeIngreso), f, b.motivoIngreso, vacioANull(b.observaciones), f, f).first();
  if (mecanicos.length) await env.DB.batch(mecanicos.map((u) => env.DB.prepare('INSERT INTO orden_mecanicos (orden_id, usuario_id) VALUES (?, ?)').bind(o.id, u)));
  return json(await ordenJson(env, o.id));
});
ruta('GET', '/api/ordenes/:id', async ({ env, p }) => json(await ordenJson(env, enteroValido(p.id, 'id'))));
ruta('PUT', '/api/ordenes/:id', async ({ env, p, body: b }) => {
  const id = enteroValido(p.id, 'id');
  verificarMutable(await ordenFila(env, id));
  const mecanicos = await idsMecanicos(env, b.mecanicos);
  await env.DB.batch([
    env.DB.prepare('UPDATE ordenes_servicio SET diagnostico = ?, trabajo_realizado = ?, observaciones = ?, updated_at = ? WHERE id = ?')
      .bind(vacioANull(b.diagnostico), vacioANull(b.trabajoRealizado), vacioANull(b.observaciones), ahora(), id),
    env.DB.prepare('DELETE FROM orden_mecanicos WHERE orden_id = ?').bind(id),
    ...mecanicos.map((u) => env.DB.prepare('INSERT INTO orden_mecanicos (orden_id, usuario_id) VALUES (?, ?)').bind(id, u)),
  ]);
  return json(await ordenJson(env, id));
});
ruta('PATCH', '/api/ordenes/:id/estado', async ({ env, p, body }) => {
  const id = enteroValido(p.id, 'id');
  if (body.estado == null) throw invalido('El estado es obligatorio.');
  if (!ESTADOS.includes(body.estado)) throw invalido(`El estado '${body.estado}' no es válido.`);
  const o = await ordenFila(env, id);
  if (!(TRANSICIONES[o.estado] || []).includes(body.estado)) throw conflicto(`No se puede pasar de ${o.estado} a ${body.estado}.`);
  const f = ahora();
  await env.DB.prepare('UPDATE ordenes_servicio SET estado = ?, fecha_entrega = ?, updated_at = ? WHERE id = ?')
    .bind(body.estado, body.estado === 'ENTREGADO' ? f : o.fecha_entrega, f, id).run();
  return json(await ordenJson(env, id));
});

// Servicios de la orden
ruta('GET', '/api/ordenes/:ordenId/servicios', async ({ env, p }) => {
  const { results } = await env.DB.prepare('SELECT * FROM servicios_orden WHERE orden_id = ? ORDER BY id').bind(enteroValido(p.ordenId, 'ordenId')).all();
  return json(results.map(servicioJson));
});
ruta('POST', '/api/ordenes/:ordenId/servicios', async ({ env, p, body: b }) => {
  const ordenId = enteroValido(p.ordenId, 'ordenId');
  new Validador()
    .obligatorio('nombreServicio', b.nombreServicio, 'El nombre del servicio es obligatorio')
    .max('nombreServicio', b.nombreServicio, 150, 'El nombre del servicio no puede tener más de 150 caracteres')
    .max('descripcion', b.descripcion, 300, 'La descripción no puede tener más de 300 caracteres')
    .noNulo('cantidad', b.cantidad).minimo('cantidad', b.cantidad, 1, 'debe ser mayor que o igual a 1')
    .noNulo('precioUnitario', b.precioUnitario).minimo('precioUnitario', b.precioUnitario, 0, 'El precio no puede ser negativo')
    .verificar();
  verificarMutable(await ordenFila(env, ordenId));
  const cantidad = enteroValido(b.cantidad, 'cantidad');
  const precio = redondear(b.precioUnitario);
  const [ins] = await env.DB.batch([
    env.DB.prepare('INSERT INTO servicios_orden (orden_id, nombre_servicio, descripcion, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?, ?) RETURNING *')
      .bind(ordenId, b.nombreServicio, vacioANull(b.descripcion), cantidad, precio, redondear(precio * cantidad)),
    recalcularTotal(env, ordenId),
  ]);
  return json(servicioJson(ins.results[0]));
});
ruta('DELETE', '/api/ordenes/:ordenId/servicios/:id', async ({ env, p }) => {
  const ordenId = enteroValido(p.ordenId, 'ordenId');
  const id = enteroValido(p.id, 'id');
  verificarMutable(await ordenFila(env, ordenId));
  const l = await env.DB.prepare('SELECT * FROM servicios_orden WHERE id = ?').bind(id).first();
  if (!l || l.orden_id !== ordenId) throw noEncontrado('Línea de servicio no encontrada');
  await env.DB.batch([env.DB.prepare('DELETE FROM servicios_orden WHERE id = ?').bind(id), recalcularTotal(env, ordenId)]);
  return vacio();
});

// Repuestos de la orden (descuentan y devuelven stock)
ruta('GET', '/api/ordenes/:ordenId/repuestos', async ({ env, p }) => {
  const { results } = await env.DB.prepare('SELECT * FROM repuestos_orden WHERE orden_id = ? ORDER BY id').bind(enteroValido(p.ordenId, 'ordenId')).all();
  return json(await lineasRepuestoJson(env, results));
});
ruta('POST', '/api/ordenes/:ordenId/repuestos', async ({ env, p, body: b }) => {
  const ordenId = enteroValido(p.ordenId, 'ordenId');
  new Validador()
    .noNulo('repuesto', b.repuesto, 'El repuesto es obligatorio')
    .noNulo('cantidadUtilizada', b.cantidadUtilizada).minimo('cantidadUtilizada', b.cantidadUtilizada, 1, 'debe ser mayor que o igual a 1')
    .verificar();
  verificarMutable(await ordenFila(env, ordenId));
  if (!b.repuesto || b.repuesto.id == null) throw noEncontrado('El repuesto es obligatorio');
  const r = await repuestoPorId(env, enteroValido(b.repuesto.id, 'repuesto.id'));
  const cantidad = enteroValido(b.cantidadUtilizada, 'cantidadUtilizada');
  if (r.cantidad_disponible < cantidad) throw new HttpError(422, `No hay suficiente stock de ${r.nombre}.`);
  const res = await ejecutar(() => env.DB.batch([
    env.DB.prepare('UPDATE repuestos SET cantidad_disponible = cantidad_disponible - ?, version = version + 1 WHERE id = ?').bind(cantidad, r.id),
    env.DB.prepare('INSERT INTO repuestos_orden (orden_id, repuesto_id, cantidad_utilizada, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?) RETURNING *')
      .bind(ordenId, r.id, cantidad, r.precio, redondear(r.precio * cantidad)),
    recalcularTotal(env, ordenId),
  ]));
  return json((await lineasRepuestoJson(env, [res[1].results[0]]))[0]);
});
ruta('DELETE', '/api/ordenes/:ordenId/repuestos/:id', async ({ env, p }) => {
  const ordenId = enteroValido(p.ordenId, 'ordenId');
  const id = enteroValido(p.id, 'id');
  verificarMutable(await ordenFila(env, ordenId));
  const l = await env.DB.prepare('SELECT * FROM repuestos_orden WHERE id = ?').bind(id).first();
  if (!l || l.orden_id !== ordenId) throw noEncontrado('Línea de repuesto no encontrada');
  await env.DB.batch([
    env.DB.prepare('UPDATE repuestos SET cantidad_disponible = cantidad_disponible + ?, version = version + 1 WHERE id = ?').bind(l.cantidad_utilizada, l.repuesto_id),
    env.DB.prepare('DELETE FROM repuestos_orden WHERE id = ?').bind(id),
    recalcularTotal(env, ordenId),
  ]);
  return vacio();
});

// Pagos
ruta('GET', '/api/ordenes/:ordenId/pagos', async ({ env, p }) => {
  const { results } = await env.DB.prepare('SELECT * FROM pagos WHERE orden_id = ? ORDER BY id').bind(enteroValido(p.ordenId, 'ordenId')).all();
  return json(results.map(pagoJson));
});
ruta('GET', '/api/ordenes/:ordenId/pagos/resumen', async ({ env, p }) => {
  const ordenId = enteroValido(p.ordenId, 'ordenId');
  const o = await ordenFila(env, ordenId);
  const s = await env.DB.prepare("SELECT COALESCE(SUM(monto), 0) AS t FROM pagos WHERE orden_id = ? AND estado = 'PAGADO'").bind(ordenId).first();
  const pagado = redondear(s.t);
  const estado = pagado === 0 ? 'PENDIENTE' : pagado >= o.valor_total ? 'PAGADO' : 'PAGO_PARCIAL';
  return json({ valorTotal: o.valor_total, totalPagado: pagado, saldoPendiente: Math.max(0, redondear(o.valor_total - pagado)), estado });
});
ruta('POST', '/api/ordenes/:ordenId/pagos', async ({ env, p, body: b }) => {
  const ordenId = enteroValido(p.ordenId, 'ordenId');
  if (b.metodoPago != null && !METODOS_PAGO.includes(b.metodoPago)) throw invalido('El cuerpo de la petición no es válido.');
  new Validador()
    .noNulo('monto', b.monto, 'El monto es obligatorio').minimo('monto', b.monto, 0.01, 'El monto debe ser mayor a cero')
    .noNulo('metodoPago', b.metodoPago, 'El método de pago es obligatorio')
    .verificar();
  verificarMutable(await ordenFila(env, ordenId));
  const pago = await env.DB.prepare("INSERT INTO pagos (orden_id, monto, metodo_pago, fecha_pago, estado) VALUES (?, ?, ?, ?, 'PAGADO') RETURNING *")
    .bind(ordenId, redondear(b.monto), b.metodoPago, ahora()).first();
  return json(pagoJson(pago));
});
ruta('PATCH', '/api/ordenes/:ordenId/pagos/:id/anular', async ({ env, p }) => {
  const ordenId = enteroValido(p.ordenId, 'ordenId');
  const id = enteroValido(p.id, 'id');
  const pago = await env.DB.prepare('SELECT * FROM pagos WHERE id = ?').bind(id).first();
  if (!pago || pago.orden_id !== ordenId) throw noEncontrado('Pago no encontrado');
  await env.DB.prepare("UPDATE pagos SET estado = 'ANULADO' WHERE id = ?").bind(id).run();
  return json(pagoJson({ ...pago, estado: 'ANULADO' }));
});

// Usuarios
ruta('GET', '/api/usuarios', async ({ env }) => {
  const roles = await mapaRoles(env);
  return json((await env.DB.prepare('SELECT * FROM usuarios ORDER BY id').all()).results.map((u) => usuarioJson(u, roles)));
});
ruta('POST', '/api/usuarios', async ({ env, body: b }) => {
  validarUsuario(b);
  if (!b.contrasena || !String(b.contrasena).trim()) throw conflicto('La contraseña es obligatoria.');
  if (await env.DB.prepare('SELECT 1 FROM usuarios WHERE usuario = ?').bind(b.usuario).first()) throw conflicto('Ya existe un usuario con ese nombre de usuario.');
  const rolId = await resolverRol(env, b);
  const u = await ejecutar(async () => env.DB.prepare(`INSERT INTO usuarios (usuario, contrasena, nombre, correo, telefono, cargo, rol_id, activo, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`).bind(b.usuario, await hashContrasena(String(b.contrasena)), b.nombre, vacioANull(b.correo),
    vacioANull(b.telefono), vacioANull(b.cargo), rolId, b.activo === false ? 0 : 1, ahora()).first());
  return json(await unUsuario(env, u.id));
});
ruta('GET', '/api/usuarios/:id', async ({ env, p }) => json(await unUsuario(env, enteroValido(p.id, 'id'))));
ruta('PUT', '/api/usuarios/:id', async ({ env, p, body: b }) => {
  const id = enteroValido(p.id, 'id');
  const ex = await usuarioFila(env, id);
  if (b.usuario != null && b.usuario !== ex.usuario && (await env.DB.prepare('SELECT 1 FROM usuarios WHERE usuario = ?').bind(b.usuario).first())) {
    throw conflicto('Ya existe un usuario con ese nombre de usuario.');
  }
  const cambiaRol = b.rol && b.rol.id != null && b.rol.id !== '' && Number(b.rol.id) !== ex.rol_id;
  if (b.activo === false || cambiaRol) await verificarNoUltimoAdministrador(env, id);
  const rolId = await resolverRol(env, b);
  if (!b.usuario || !b.nombre) throw conflicto('El registro entra en conflicto con datos existentes (¿un valor único duplicado?).');
  const activo = b.activo === undefined || b.activo === null ? ex.activo : b.activo ? 1 : 0;
  const clave = b.contrasena && String(b.contrasena).trim() ? await hashContrasena(String(b.contrasena)) : ex.contrasena;
  await ejecutar(() => env.DB.prepare('UPDATE usuarios SET usuario = ?, nombre = ?, correo = ?, telefono = ?, cargo = ?, rol_id = ?, activo = ?, contrasena = ? WHERE id = ?')
    .bind(b.usuario, b.nombre, vacioANull(b.correo), vacioANull(b.telefono), vacioANull(b.cargo), rolId, activo, clave, id).run());
  return json(await unUsuario(env, id));
});
ruta('PATCH', '/api/usuarios/:id/estado', async ({ env, p, body }) => {
  const id = enteroValido(p.id, 'id');
  const activo = body.activo === true;
  if (!activo) await verificarNoUltimoAdministrador(env, id);
  await usuarioFila(env, id);
  await env.DB.prepare('UPDATE usuarios SET activo = ? WHERE id = ?').bind(activo ? 1 : 0, id).run();
  return json(await unUsuario(env, id));
});

// Roles
ruta('GET', '/api/roles/permisos', async () => json(PERMISOS));
ruta('GET', '/api/roles', async ({ env }) => json((await env.DB.prepare('SELECT * FROM roles ORDER BY id').all()).results.map(rolJson)));
ruta('POST', '/api/roles', async ({ env, body: b }) => {
  new Validador().obligatorio('nombre', b.nombre, 'El nombre es obligatorio').verificar();
  if (await env.DB.prepare('SELECT 1 FROM roles WHERE nombre = ?').bind(b.nombre).first()) throw conflicto('Ya existe un rol con ese nombre.');
  const r = await ejecutar(() => env.DB.prepare('INSERT INTO roles (nombre, descripcion, permisos, color_badge, es_sistema, created_at) VALUES (?, ?, ?, ?, 0, ?) RETURNING *')
    .bind(b.nombre, vacioANull(b.descripcion), JSON.stringify(permisosValidos(b.permisos)), vacioANull(b.colorBadge), ahora()).first());
  return json(rolJson(r));
});
ruta('GET', '/api/roles/:id', async ({ env, p }) => json(rolJson(await rolPorId(env, enteroValido(p.id, 'id')))));
ruta('PUT', '/api/roles/:id', async ({ env, p, body: b }) => {
  new Validador().obligatorio('nombre', b.nombre, 'El nombre es obligatorio').verificar();
  const id = enteroValido(p.id, 'id');
  await rolPorId(env, id);
  await ejecutar(() => env.DB.prepare('UPDATE roles SET nombre = ?, descripcion = ?, permisos = ?, color_badge = ? WHERE id = ?')
    .bind(b.nombre, vacioANull(b.descripcion), JSON.stringify(permisosValidos(b.permisos)), vacioANull(b.colorBadge), id).run());
  return json(rolJson(await rolPorId(env, id)));
});
ruta('DELETE', '/api/roles/:id', async ({ env, p }) => {
  const id = enteroValido(p.id, 'id');
  const r = await rolPorId(env, id);
  if (bool(r.es_sistema)) throw conflicto('Este rol es del sistema y no puede eliminarse.');
  if (await env.DB.prepare('SELECT 1 FROM usuarios WHERE rol_id = ?').bind(id).first()) throw conflicto('No se puede eliminar: hay usuarios con este rol asignado.');
  if (await env.DB.prepare('SELECT 1 FROM grupos WHERE rol_bonus_id = ?').bind(id).first()) throw conflicto('No se puede eliminar: hay grupos que otorgan este rol como bono.');
  await env.DB.prepare('DELETE FROM roles WHERE id = ?').bind(id).run();
  return vacio();
});

// Grupos
ruta('GET', '/api/grupos', async ({ env }) => json(await gruposJson(env, (await env.DB.prepare('SELECT * FROM grupos ORDER BY id').all()).results)));
ruta('POST', '/api/grupos', async ({ env, body }) => json(await guardarGrupo(env, null, body)));
ruta('GET', '/api/grupos/:id', async ({ env, p }) => {
  const g = await env.DB.prepare('SELECT * FROM grupos WHERE id = ?').bind(enteroValido(p.id, 'id')).first();
  if (!g) throw noEncontrado('Grupo no encontrado');
  return json((await gruposJson(env, [g]))[0]);
});
ruta('PUT', '/api/grupos/:id', async ({ env, p, body }) => {
  const id = enteroValido(p.id, 'id');
  if (!(await env.DB.prepare('SELECT 1 FROM grupos WHERE id = ?').bind(id).first())) throw noEncontrado('Grupo no encontrado');
  return json(await guardarGrupo(env, id, body));
});
ruta('DELETE', '/api/grupos/:id', async ({ env, p }) => {
  const id = enteroValido(p.id, 'id');
  if (!(await env.DB.prepare('SELECT 1 FROM grupos WHERE id = ?').bind(id).first())) throw noEncontrado('Grupo no encontrado');
  await env.DB.batch([env.DB.prepare('DELETE FROM grupo_miembros WHERE grupo_id = ?').bind(id), env.DB.prepare('DELETE FROM grupos WHERE id = ?').bind(id)]);
  return vacio();
});

const PUBLICAS = ['/api/auth/login', '/api/publico/moto'];

async function api(request, env, url) {
  const path = url.pathname;
  let encontrada = null;
  let metodoNoPermitido = false;
  for (const r of rutas) {
    const m = path.match(r.re);
    if (!m) continue;
    if (r.metodo !== request.method) { metodoNoPermitido = true; continue; }
    encontrada = { r, p: m.groups || {} };
    break;
  }
  if (!encontrada) {
    if (metodoNoPermitido) return json(cuerpoError(400, 'Método no permitido para esta ruta.'), 405);
    return json(cuerpoError(404, 'Ruta no encontrada.'), 404);
  }
  if (!PUBLICAS.includes(path.replace(/\/$/, ''))) await usuarioDelToken(request, env);
  let body = {};
  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    const texto = await request.text();
    if (texto.trim()) {
      try { body = JSON.parse(texto); } catch { throw invalido('El cuerpo de la petición no es válido.'); }
      if (body === null || typeof body !== 'object' || Array.isArray(body)) throw invalido('El cuerpo de la petición no es válido.');
    }
  }
  return encontrada.r.fn({ env, request, url, p: encontrada.p, body });
}

// ---------- archivos del sitio (React) ----------

const TIPOS = {
  js: 'text/javascript; charset=utf-8', css: 'text/css; charset=utf-8', html: 'text/html; charset=utf-8',
  json: 'application/json', svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg', ico: 'image/x-icon',
  webp: 'image/webp', woff2: 'font/woff2', woff: 'font/woff', txt: 'text/plain; charset=utf-8',
};

/** Sirve el frontend desde una URL pública fija (carpeta del repositorio en GitHub fijada a un commit). */
async function assetRemoto(env, url) {
  let path = url.pathname;
  if (path === '/' || !/\.[a-z0-9]+$/i.test(path)) path = '/index.html';
  if (path.includes('..')) return new Response('No encontrado', { status: 404 });
  const cache = caches.default;
  const clave = new Request(new URL(path, url.origin).toString());
  const enCache = await cache.match(clave);
  if (enCache) return enCache;
  const origen = await fetch(env.ASSETS_BASE_URL.replace(/\/$/, '') + path, { cf: { cacheTtl: 86400, cacheEverything: true } });
  if (!origen.ok) return new Response('No encontrado', { status: 404 });
  const ext = path.split('.').pop().toLowerCase();
  const resp = new Response(origen.body, {
    headers: {
      'content-type': TIPOS[ext] || 'application/octet-stream',
      'cache-control': path === '/index.html' ? 'public, max-age=60' : 'public, max-age=31536000, immutable',
      'x-content-type-options': 'nosniff',
    },
  });
  await cache.put(clave, resp.clone());
  return resp;
}

function conCors(request, resp) {
  const origen = request.headers.get('origin') || '';
  if (!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origen)) return resp;
  const r = new Response(resp.body, resp);
  r.headers.set('access-control-allow-origin', origen);
  r.headers.set('access-control-allow-headers', 'content-type, authorization');
  r.headers.set('access-control-allow-methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  return r;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      if (request.method === 'OPTIONS') return conCors(request, new Response(null, { status: 204 }));
      let resp;
      try {
        resp = await api(request, env, url);
      } catch (e) {
        if (e instanceof HttpError) resp = json(cuerpoError(e.status, e.message, e.extra), e.status);
        else {
          console.error(e);
          resp = json(cuerpoError(500, 'Ocurrió un error inesperado. Intenta de nuevo.'), 500);
        }
      }
      return conCors(request, resp);
    }
    if (env.ASSETS) return env.ASSETS.fetch(request);
    if (env.ASSETS_BASE_URL) return assetRemoto(env, url);
    return new Response('Frontend no configurado', { status: 404 });
  },
};
