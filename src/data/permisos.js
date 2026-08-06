export const CATALOGO_PERMISOS = [
    { clave: "vehiculos.ver", etiqueta: "Ver vehículos", modulo: "Vehículos" },
    { clave: "vehiculos.crear", etiqueta: "Registrar vehículos", modulo: "Vehículos" },
    { clave: "vehiculos.editar", etiqueta: "Editar vehículos", modulo: "Vehículos" },
    { clave: "vehiculos.eliminar", etiqueta: "Eliminar vehículos", modulo: "Vehículos" },

    { clave: "clientes.ver", etiqueta: "Ver clientes", modulo: "Clientes" },
    { clave: "clientes.crear", etiqueta: "Registrar clientes", modulo: "Clientes" },
    { clave: "clientes.editar", etiqueta: "Editar clientes", modulo: "Clientes" },
    { clave: "clientes.eliminar", etiqueta: "Eliminar clientes", modulo: "Clientes" },

    { clave: "ordenes.ver", etiqueta: "Ver órdenes de servicio", modulo: "Órdenes de servicio" },
    { clave: "ordenes.crear", etiqueta: "Crear órdenes de servicio", modulo: "Órdenes de servicio" },
    { clave: "ordenes.editar", etiqueta: "Editar diagnóstico y trabajo realizado", modulo: "Órdenes de servicio" },
    { clave: "ordenes.cambiarEstado", etiqueta: "Cambiar el estado de una orden", modulo: "Órdenes de servicio" },
    { clave: "ordenes.gestionarServicios", etiqueta: "Agregar/quitar servicios de una orden", modulo: "Órdenes de servicio" },
    { clave: "ordenes.gestionarRepuestos", etiqueta: "Agregar/quitar repuestos de una orden", modulo: "Órdenes de servicio" },

    { clave: "repuestos.ver", etiqueta: "Ver repuestos", modulo: "Repuestos" },
    { clave: "repuestos.crear", etiqueta: "Crear repuestos", modulo: "Repuestos" },
    { clave: "repuestos.editar", etiqueta: "Editar repuestos", modulo: "Repuestos" },
    { clave: "repuestos.eliminar", etiqueta: "Eliminar repuestos", modulo: "Repuestos" },
    { clave: "repuestos.movimientos", etiqueta: "Registrar entradas/salidas de stock", modulo: "Repuestos" },

    { clave: "pagos.ver", etiqueta: "Ver pagos", modulo: "Pagos" },
    { clave: "pagos.registrar", etiqueta: "Registrar pagos", modulo: "Pagos" },
    { clave: "pagos.anular", etiqueta: "Anular pagos", modulo: "Pagos" },

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
