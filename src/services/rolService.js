import { obtener, guardar, generarId } from "../utils/storage";

export async function obtenerRoles() {
    return obtener("roles", []);
}

export async function crearRol(datos) {
    const roles = obtener("roles", []);

    const nuevo = {
        id: generarId(),
        nombre: datos.nombre.trim(),
        descripcion: datos.descripcion?.trim() ?? "",
        permisos: datos.permisos ?? [],
        colorBadge: datos.colorBadge ?? "#93c5fd",
        esSistema: false,
        creadoEn: new Date().toISOString(),
    };

    guardar("roles", [...roles, nuevo]);
    return nuevo;
}

export async function actualizarRol(id, cambios) {
    const roles = obtener("roles", []);

    let actualizado = null;
    const siguientes = roles.map((r) => {
        if (r.id !== id) return r;
        actualizado = { ...r, ...cambios, id: r.id, esSistema: r.esSistema };
        return actualizado;
    });

    guardar("roles", siguientes);
    return actualizado;
}

export async function eliminarRol(id) {
    const roles = obtener("roles", []);
    const rol = roles.find((r) => r.id === id);

    if (rol?.esSistema) {
        throw new Error("Este rol es del sistema y no puede eliminarse.");
    }

    const usuarios = obtener("usuarios", []);
    if (usuarios.some((u) => u.rolId === id)) {
        throw new Error("No se puede eliminar: hay usuarios con este rol asignado.");
    }

    const grupos = obtener("grupos", []);
    if (grupos.some((g) => g.rolBonusId === id)) {
        throw new Error("No se puede eliminar: hay grupos que otorgan este rol como bono.");
    }

    guardar("roles", roles.filter((r) => r.id !== id));
}
