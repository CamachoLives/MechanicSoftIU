// Genera el SQL de los 3 roles del sistema y sus usuarios iniciales (como DatosInicialesRunner.java).
// Las contraseñas se pasan por argumento para NO dejarlas escritas en el repositorio.
//
// Uso: node scripts/usuarios-iniciales.mjs <clave_admin> <clave_recepcion> <clave_mecanico> > usuarios.sql
//      npx wrangler d1 execute mechanicsoft-db --remote --file=usuarios.sql
import { webcrypto as crypto } from 'node:crypto';

const [claveAdmin, claveRecepcion, claveMecanico] = process.argv.slice(2);
if (!claveAdmin || !claveRecepcion || !claveMecanico) {
  console.error('Uso: node scripts/usuarios-iniciales.mjs <clave_admin> <clave_recepcion> <clave_mecanico>');
  process.exit(1);
}

const ITER = 100000;
async function hash(clave) {
  const sal = crypto.getRandomValues(new Uint8Array(16));
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(clave), 'PBKDF2', false, ['deriveBits']);
  const h = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: sal, iterations: ITER }, k, 256);
  return `pbkdf2$${ITER}$${Buffer.from(sal).toString('base64')}$${Buffer.from(h).toString('base64')}`;
}

const TODOS = [
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
const roles = [
  [1, 'Administrador', 'Acceso total: clientes, vehículos, órdenes, repuestos, pagos, usuarios, roles y grupos.', TODOS, '#7dd3fc'],
  [2, 'Recepcionista', 'Atiende clientes y vehículos, crea órdenes y registra pagos.', [
    'clientes.ver', 'clientes.crear', 'clientes.editar', 'vehiculos.ver', 'vehiculos.crear', 'vehiculos.editar',
    'ordenes.ver', 'ordenes.crear', 'ordenes.cambiarEstado', 'repuestos.ver', 'pagos.ver', 'pagos.registrar'], '#34d399'],
  [3, 'Mecánico', 'Trabaja las órdenes: diagnóstico, reparación, servicios y repuestos.', [
    'clientes.ver', 'vehiculos.ver', 'ordenes.ver', 'ordenes.crear', 'ordenes.editar', 'ordenes.cambiarEstado',
    'ordenes.gestionarServicios', 'ordenes.gestionarRepuestos', 'repuestos.ver'], '#60a5fa'],
];
const usuarios = [
  ['admin', claveAdmin, 'Laura Gómez', 'laura.gomez@mechanicsoft.test', 1],
  ['recepcion', claveRecepcion, 'María Torres', 'maria.torres@mechanicsoft.test', 2],
  ['mecanico', claveMecanico, 'Jorge Ramírez', 'jorge.ramirez@mechanicsoft.test', 3],
];

const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const fecha = new Date(Date.now() - 5 * 3600_000).toISOString().replace('Z', '');
let sql = '';
for (const [id, nombre, desc, permisos, color] of roles) {
  sql += `INSERT OR IGNORE INTO roles (id, nombre, descripcion, permisos, color_badge, es_sistema, created_at) VALUES (${id}, ${q(nombre)}, ${q(desc)}, ${q(JSON.stringify(permisos))}, ${q(color)}, 1, ${q(fecha)});\n`;
}
for (const [usuario, clave, nombre, correo, rol] of usuarios) {
  sql += `INSERT OR IGNORE INTO usuarios (usuario, contrasena, nombre, correo, rol_id, activo, created_at) VALUES (${q(usuario)}, ${q(await hash(clave))}, ${q(nombre)}, ${q(correo)}, ${rol}, 1, ${q(fecha)});\n`;
}
process.stdout.write(sql);
