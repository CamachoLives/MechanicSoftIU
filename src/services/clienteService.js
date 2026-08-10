import api from "./api";
import { mensajeError } from "../utils/apiError";

const API = "/api/clientes";

export async function obtenerClientes(buscar) {
    const respuesta = await api.get(API, { params: buscar ? { buscar } : {} });
    return respuesta.data;
}

export async function buscarClientePorId(id) {
    const respuesta = await api.get(`${API}/${id}`);
    return respuesta.data;
}

export async function obtenerVehiculosDeCliente(id) {
    const respuesta = await api.get(`${API}/${id}/vehiculos`);
    return respuesta.data;
}

export async function crearCliente(datos) {
    try {
        const respuesta = await api.post(API, datos);
        return respuesta.data;
    } catch (error) {
        throw new Error(mensajeError(error, "No se pudo crear el cliente."), { cause: error });
    }
}

export async function actualizarCliente(id, datos) {
    try {
        const respuesta = await api.put(`${API}/${id}`, datos);
        return respuesta.data;
    } catch (error) {
        throw new Error(mensajeError(error, "No se pudo actualizar el cliente."), { cause: error });
    }
}

export async function cambiarEstadoCliente(id, activo) {
    try {
        const respuesta = await api.patch(`${API}/${id}/estado`, { activo });
        return respuesta.data;
    } catch (error) {
        throw new Error(mensajeError(error, "No se pudo cambiar el estado del cliente."), { cause: error });
    }
}
