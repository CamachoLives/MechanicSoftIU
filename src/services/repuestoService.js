import api from "./api";
import { mensajeError } from "../utils/apiError";

const API = "/api/repuestos";

export async function obtenerRepuestos(buscar) {
    const respuesta = await api.get(API, { params: buscar ? { buscar } : {} });
    return respuesta.data;
}

export async function buscarRepuestoPorId(id) {
    const respuesta = await api.get(`${API}/${id}`);
    return respuesta.data;
}

export async function crearRepuesto(datos) {
    try {
        const respuesta = await api.post(API, datos);
        return respuesta.data;
    } catch (error) {
        throw new Error(mensajeError(error, "No se pudo crear el repuesto."), { cause: error });
    }
}

export async function actualizarRepuesto(id, datos) {
    try {
        const respuesta = await api.put(`${API}/${id}`, datos);
        return respuesta.data;
    } catch (error) {
        throw new Error(mensajeError(error, "No se pudo actualizar el repuesto."), { cause: error });
    }
}

export async function cambiarEstadoRepuesto(id, activo) {
    try {
        const respuesta = await api.patch(`${API}/${id}/estado`, { activo });
        return respuesta.data;
    } catch (error) {
        throw new Error(mensajeError(error, "No se pudo cambiar el estado del repuesto."), { cause: error });
    }
}

export async function registrarEntradaRepuesto(id, cantidad) {
    try {
        const respuesta = await api.post(`${API}/${id}/entradas`, { cantidad });
        return respuesta.data;
    } catch (error) {
        throw new Error(mensajeError(error, "No se pudo registrar la entrada."), { cause: error });
    }
}

export async function registrarSalidaRepuesto(id, cantidad) {
    try {
        const respuesta = await api.post(`${API}/${id}/salidas`, { cantidad });
        return respuesta.data;
    } catch (error) {
        throw new Error(mensajeError(error, "No se pudo registrar la salida."), { cause: error });
    }
}
