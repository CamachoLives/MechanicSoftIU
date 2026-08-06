import axios from "axios";
import { obtener, guardar, eliminarClave } from "../utils/storage";
import { mensajeError } from "../utils/apiError";

const API = "http://localhost:9769/api/auth";

export async function iniciarSesion(usuario, contrasena) {
    try {
        const respuesta = await axios.post(`${API}/login`, { usuario, contrasena });
        guardar("sesion", { usuarioId: respuesta.data.id });
        return { ok: true, usuarioId: respuesta.data.id };
    } catch (error) {
        return { ok: false, error: mensajeError(error, "No se pudo iniciar sesión.") };
    }
}

export function cerrarSesion() {
    eliminarClave("sesion");
}

export function obtenerSesionActual() {
    return obtener("sesion", null);
}
