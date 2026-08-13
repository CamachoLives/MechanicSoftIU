import api from "./api";
import { mensajeError } from "../utils/apiError";

const API = "/api/vehiculos";

// Antes este servicio devolvía la respuesta cruda de axios (obligando a cada
// llamador a leer `.data`) y no manejaba errores, a diferencia de los demás
// servicios. Se unifica con el mismo patrón.

export async function obtenerVehiculos() {
    const respuesta = await api.get(API);
    return respuesta.data;
}

export async function guardarVehiculo(vehiculo) {
    try {
        const respuesta = await api.post(API, vehiculo);
        return respuesta.data;
    } catch (error) {
        throw new Error(mensajeError(error, "No se pudo registrar el vehículo."), { cause: error });
    }
}

export async function actualizarVehiculo(id, vehiculo) {
    try {
        const respuesta = await api.put(`${API}/${id}`, vehiculo);
        return respuesta.data;
    } catch (error) {
        throw new Error(mensajeError(error, "No se pudo actualizar el vehículo."), { cause: error });
    }
}

// El backend ya no borra vehículos físicamente (tienen órdenes reales
// colgando de ellos): se desactivan en su lugar.
export async function cambiarEstadoVehiculo(id, activo) {
    try {
        const respuesta = await api.patch(`${API}/${id}/estado`, { activo });
        return respuesta.data;
    } catch (error) {
        throw new Error(mensajeError(error, "No se pudo cambiar el estado del vehículo."), { cause: error });
    }
}
