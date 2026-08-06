import axios from "axios";
import { mensajeError } from "../utils/apiError";

const API = "http://localhost:9769/api/roles";

export async function obtenerRoles() {
    const respuesta = await axios.get(API);
    return respuesta.data;
}

export async function crearRol(datos) {
    try {
        const respuesta = await axios.post(API, datos);
        return respuesta.data;
    } catch (error) {
        throw new Error(mensajeError(error, "No se pudo crear el rol."), { cause: error });
    }
}

export async function actualizarRol(id, datos) {
    try {
        const respuesta = await axios.put(`${API}/${id}`, datos);
        return respuesta.data;
    } catch (error) {
        throw new Error(mensajeError(error, "No se pudo actualizar el rol."), { cause: error });
    }
}

export async function eliminarRol(id) {
    try {
        await axios.delete(`${API}/${id}`);
    } catch (error) {
        throw new Error(mensajeError(error, "No se pudo eliminar el rol."), { cause: error });
    }
}
