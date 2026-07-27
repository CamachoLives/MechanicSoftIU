import { obtener, guardar, generarId } from "../utils/storage";
import { tienePermiso } from "../utils/rbac";

export async function obtenerUsuarios() {
    return obtener("usuarios", []);
}

export async function crearUsuario(datos) {
    const usuarios = obtener("usuarios", []);

    const yaExiste = usuarios.some(
        (u) => u.usuario.toLowerCase() === datos.usuario.trim().toLowerCase()
    );
    if (yaExiste) {
        throw new Error("Ya existe un usuario con ese nombre de usuario.");
    }

    const nuevo = {
        id: generarId(),
        usuario: datos.usuario.trim(),
        contrasena: datos.contrasena,
        nombre: datos.nombre.trim(),
        correo: datos.correo?.trim() ?? "",
        rolId: datos.rolId,
        grupoIds: datos.grupoIds ?? [],
        activo: datos.activo ?? true,
        creadoEn: new Date().toISOString(),
    };

    guardar("usuarios", [...usuarios, nuevo]);
    return nuevo;
}

export async function actualizarUsuario(id, cambios) {
    const usuarios = obtener("usuarios", []);

    if (cambios.usuario) {
        const duplicado = usuarios.some(
            (u) => u.id !== id && u.usuario.toLowerCase() === cambios.usuario.trim().toLowerCase()
        );
        if (duplicado) {
            throw new Error("Ya existe un usuario con ese nombre de usuario.");
        }
    }

    if (cambios.activo === false || cambios.rolId) {
        verificarNoUltimoAdministrador(usuarios, id);
    }

    let actualizado = null;
    const siguientes = usuarios.map((u) => {
        if (u.id !== id) return u;
        actualizado = { ...u, ...cambios };
        return actualizado;
    });

    guardar("usuarios", siguientes);
    return actualizado;
}

export async function eliminarUsuario(id) {
    const usuarios = obtener("usuarios", []);
    verificarNoUltimoAdministrador(usuarios, id);

    guardar("usuarios", usuarios.filter((u) => u.id !== id));

    const grupos = obtener("grupos", []);
    guardar(
        "grupos",
        grupos.map((g) => ({ ...g, miembroIds: g.miembroIds.filter((mid) => mid !== id) }))
    );
}

/** Evita quedarse sin nadie que pueda administrar usuarios (bloquea el último con "usuarios.editar"). */
function verificarNoUltimoAdministrador(usuarios, idAfectado) {
    const roles = obtener("roles", []);
    const grupos = obtener("grupos", []);

    const quedanOtrosAdmins = usuarios.some((u) => {
        if (u.id === idAfectado || u.activo === false) return false;
        return tienePermiso(u, "usuarios.editar", { roles, grupos });
    });

    if (!quedanOtrosAdmins) {
        throw new Error(
            "No es posible continuar: no quedaría ningún usuario activo con permiso para administrar usuarios."
        );
    }
}
