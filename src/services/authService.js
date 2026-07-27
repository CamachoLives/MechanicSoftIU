import { obtener, guardar, eliminarClave } from "../utils/storage";

export async function iniciarSesion(usuario, contrasena) {
    const usuarios = obtener("usuarios", []);
    const encontrado = usuarios.find(
        (u) => u.usuario.toLowerCase() === usuario.trim().toLowerCase()
    );

    if (!encontrado || encontrado.contrasena !== contrasena) {
        return { ok: false, error: "credenciales_invalidas" };
    }
    if (!encontrado.activo) {
        return { ok: false, error: "usuario_inactivo" };
    }

    guardar("sesion", { usuarioId: encontrado.id });
    return { ok: true, usuarioId: encontrado.id };
}

export function cerrarSesion() {
    eliminarClave("sesion");
}

export function obtenerSesionActual() {
    return obtener("sesion", null);
}
