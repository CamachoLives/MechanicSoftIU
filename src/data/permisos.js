export const CATALOGO_PERMISOS = [
    { clave: "vehiculos.ver", etiqueta: "Ver vehículos", modulo: "Vehículos" },
    { clave: "vehiculos.crear", etiqueta: "Registrar vehículos", modulo: "Vehículos" },
    { clave: "vehiculos.editar", etiqueta: "Editar vehículos", modulo: "Vehículos" },
    { clave: "vehiculos.eliminar", etiqueta: "Eliminar vehículos", modulo: "Vehículos" },

    { clave: "taller.ver", etiqueta: "Ver el taller", modulo: "Taller" },
    { clave: "taller.asignar", etiqueta: "Asignar vehículos a bahías", modulo: "Taller" },
    { clave: "taller.gestionar", etiqueta: "Gestionar bahías (progreso, finalizar, cancelar)", modulo: "Taller" },

    { clave: "usuarios.ver", etiqueta: "Ver usuarios", modulo: "Usuarios" },
    { clave: "usuarios.crear", etiqueta: "Crear usuarios", modulo: "Usuarios" },
    { clave: "usuarios.editar", etiqueta: "Editar usuarios", modulo: "Usuarios" },
    { clave: "usuarios.eliminar", etiqueta: "Eliminar usuarios", modulo: "Usuarios" },

    { clave: "roles.ver", etiqueta: "Ver roles", modulo: "Roles" },
    { clave: "roles.crear", etiqueta: "Crear roles", modulo: "Roles" },
    { clave: "roles.editar", etiqueta: "Editar roles", modulo: "Roles" },
    { clave: "roles.eliminar", etiqueta: "Eliminar roles", modulo: "Roles" },

    { clave: "grupos.ver", etiqueta: "Ver grupos", modulo: "Grupos" },
    { clave: "grupos.crear", etiqueta: "Crear grupos", modulo: "Grupos" },
    { clave: "grupos.editar", etiqueta: "Editar grupos", modulo: "Grupos" },
    { clave: "grupos.eliminar", etiqueta: "Eliminar grupos", modulo: "Grupos" },
];

export const MODULOS_PERMISOS = [...new Set(CATALOGO_PERMISOS.map((p) => p.modulo))];

export function permisosPorModulo() {
    return MODULOS_PERMISOS.map((modulo) => ({
        modulo,
        permisos: CATALOGO_PERMISOS.filter((p) => p.modulo === modulo),
    }));
}
