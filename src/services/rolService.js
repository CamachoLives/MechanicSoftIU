import api from "./api";
import { mensajeError } from "../utils/apiError";

const API = "/api/roles";

export async function obtenerRoles() {
    const respuesta = await api.get(API);
    return respuesta.data;
}

export async function crearRol(datos) {
    try {
        const respuesta = await api.post(API, datos);
        return respuesta.data;
    } catch (error) {
        throw new Error(mensajeError(error, "No se pudo crear el rol."), { cause: error });
    }
}

export async function actualizarRol(id, datos) {
    try {
        const respuesta = await api.put(`${API}/${id}`, datos);
        return respuesta.data;
    } catch (error) {
        throw new Error(mensajeError(error, "No se pudo actualizar el rol."), { cause: error });
    }
}

export async function eliminarRol(id) {
    try {
        await api.delete(`${API}/${id}`);
    } catch (error) {
        throw new Error(mensajeError(error, "No se pudo eliminar el rol."), { cause: error });
    }
}
