import axios from "axios";
import { mensajeError } from "../utils/apiError";

const API = "http://localhost:9769/api/clientes";

export async function obtenerClientes(buscar) {
    const respuesta = await axios.get(API, { params: buscar ? { buscar } : {} });
    return respuesta.data;
}

export async function buscarClientePorId(id) {
    const respuesta = await axios.get(`${API}/${id}`);
    return respuesta.data;
}

export async function obtenerVehiculosDeCliente(id) {
    const respuesta = await axios.get(`${API}/${id}/vehiculos`);
    return respuesta.data;
}

export async function crearCliente(datos) {
    try {
        const respuesta = await axios.post(API, datos);
        return respuesta.data;
    } catch (error) {
        throw new Error(mensajeError(error, "No se pudo crear el cliente."), { cause: error });
    }
}

export async function actualizarCliente(id, datos) {
    try {
        const respuesta = await axios.put(`${API}/${id}`, datos);
        return respuesta.data;
    } catch (error) {
        throw new Error(mensajeError(error, "No se pudo actualizar el cliente."), { cause: error });
    }
}

export async function cambiarEstadoCliente(id, activo) {
    try {
        const respuesta = await axios.patch(`${API}/${id}/estado`, { activo });
        return respuesta.data;
    } catch (error) {
        throw new Error(mensajeError(error, "No se pudo cambiar el estado del cliente."), { cause: error });
    }
}
