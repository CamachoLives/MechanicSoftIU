import { obtener, guardar } from "../utils/storage";
import { CATALOGO_PERMISOS } from "./permisos";

const TODOS_LOS_PERMISOS = CATALOGO_PERMISOS.map((p) => p.clave);
const FECHA_SEMILLA = "2026-01-01T00:00:00.000Z";

export const ROLES_SEMILLA = [
    {
        id: "rol-administrador",
        nombre: "Administrador",
        descripcion: "Acceso total: vehículos, taller, usuarios, roles y grupos.",
        permisos: TODOS_LOS_PERMISOS,
        colorBadge: "#7dd3fc",
        esSistema: true,
        creadoEn: FECHA_SEMILLA,
    },
    {
        id: "rol-mecanico",
        nombre: "Mecánico",
        descripcion: "Trabaja sobre los vehículos ya registrados dentro del taller.",
        permisos: ["vehiculos.ver", "taller.ver", "taller.asignar", "taller.gestionar"],
        colorBadge: "#60a5fa",
        esSistema: true,
        creadoEn: FECHA_SEMILLA,
    },
    {
        id: "rol-recepcion",
        nombre: "Recepción",
        descripcion: "Registra el ingreso de vehículos y los envía al taller.",
        permisos: [
            "vehiculos.ver",
            "vehiculos.crear",
            "vehiculos.editar",
            "vehiculos.eliminar",
            "taller.ver",
            "taller.asignar",
        ],
        colorBadge: "#34d399",
        esSistema: true,
        creadoEn: FECHA_SEMILLA,
    },
    {
        id: "rol-supervisor",
        nombre: "Supervisor",
        descripcion:
            "Rol adicional que se otorga a un grupo (no a un usuario directamente): permite consultar el listado de usuarios.",
        permisos: ["usuarios.ver"],
        colorBadge: "#fbbf24",
        esSistema: true,
        creadoEn: FECHA_SEMILLA,
    },
];

export const USUARIOS_SEMILLA = [
    {
        id: "usr-admin",
        usuario: "admin",
        contrasena: "admin123",
        nombre: "Laura Gómez",
        correo: "laura.gomez@mechanicsoft.test",
        rolId: "rol-administrador",
        grupoIds: [],
        activo: true,
        creadoEn: FECHA_SEMILLA,
    },
    {
        id: "usr-jorge",
        usuario: "jorge.mecanico",
        contrasena: "mecanico123",
        nombre: "Jorge Ramírez",
        correo: "jorge.ramirez@mechanicsoft.test",
        rolId: "rol-mecanico",
        grupoIds: ["grp-turno-manana"],
        activo: true,
        creadoEn: FECHA_SEMILLA,
    },
    {
        id: "usr-carlos",
        usuario: "carlos.mecanico",
        contrasena: "mecanico123",
        nombre: "Carlos Pérez",
        correo: "carlos.perez@mechanicsoft.test",
        rolId: "rol-mecanico",
        grupoIds: ["grp-supervisores"],
        activo: true,
        creadoEn: FECHA_SEMILLA,
    },
    {
        id: "usr-recepcion",
        usuario: "recepcion",
        contrasena: "recepcion123",
        nombre: "María Torres",
        correo: "maria.torres@mechanicsoft.test",
        rolId: "rol-recepcion",
        grupoIds: ["grp-turno-manana"],
        activo: true,
        creadoEn: FECHA_SEMILLA,
    },
];

export const GRUPOS_SEMILLA = [
    {
        id: "grp-turno-manana",
        nombre: "Turno Mañana",
        descripcion: "Personal que trabaja en el horario de 7:00 a. m. a 3:00 p. m.",
        miembroIds: ["usr-jorge", "usr-recepcion"],
        rolBonusId: null,
        creadoEn: FECHA_SEMILLA,
    },
    {
        id: "grp-supervisores",
        nombre: "Supervisores de Taller",
        descripcion: "Mecánicos con visibilidad adicional sobre el equipo del taller.",
        miembroIds: ["usr-carlos"],
        rolBonusId: "rol-supervisor",
        creadoEn: FECHA_SEMILLA,
    },
];

/**
 * Siembra cada colección solo si aún no existe en localStorage. Nunca
 * sobreescribe datos ya presentes (creados por semilla o por el usuario).
 */
export function sembrarDatosSiEsNecesario() {
    if (obtener("roles", null) === null) guardar("roles", ROLES_SEMILLA);
    if (obtener("usuarios", null) === null) guardar("usuarios", USUARIOS_SEMILLA);
    if (obtener("grupos", null) === null) guardar("grupos", GRUPOS_SEMILLA);
    if (obtener("asignaciones", null) === null) guardar("asignaciones", []);
}

export const USUARIOS_PRUEBA = USUARIOS_SEMILLA.map((u) => ({
    usuario: u.usuario,
    contrasena: u.contrasena,
    nombre: u.nombre,
    rol: ROLES_SEMILLA.find((r) => r.id === u.rolId)?.nombre ?? "",
}));
