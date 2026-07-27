import { obtener, guardar, generarId } from "../utils/storage";

export async function obtenerGrupos() {
    return obtener("grupos", []);
}

export async function crearGrupo(datos) {
    const grupos = obtener("grupos", []);

    const nuevo = {
        id: generarId(),
        nombre: datos.nombre.trim(),
        descripcion: datos.descripcion?.trim() ?? "",
        miembroIds: datos.miembroIds ?? [],
        rolBonusId: datos.rolBonusId || null,
        creadoEn: new Date().toISOString(),
    };

    guardar("grupos", [...grupos, nuevo]);
    return nuevo;
}

export async function actualizarGrupo(id, cambios) {
    const grupos = obtener("grupos", []);

    let actualizado = null;
    const siguientes = grupos.map((g) => {
        if (g.id !== id) return g;
        actualizado = { ...g, ...cambios };
        return actualizado;
    });

    guardar("grupos", siguientes);
    return actualizado;
}

export async function eliminarGrupo(id) {
    const grupos = obtener("grupos", []);
    guardar("grupos", grupos.filter((g) => g.id !== id));

    const usuarios = obtener("usuarios", []);
    guardar(
        "usuarios",
        usuarios.map((u) => ({ ...u, grupoIds: u.grupoIds.filter((gid) => gid !== id) }))
    );
}
