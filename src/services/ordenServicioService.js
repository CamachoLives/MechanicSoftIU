import axios from "axios";
import { mensajeError } from "../utils/apiError";

const API = "http://localhost:9769/api/ordenes";

export async function obtenerOrdenes({ estado, vehiculoId, clienteId } = {}) {
    const respuesta = await axios.get(API, { params: { estado, vehiculoId, clienteId } });
    return respuesta.data;
}

export async function buscarOrdenPorId(id) {
    const respuesta = await axios.get(`${API}/${id}`);
    return respuesta.data;
}

export async function crearOrden(datos) {
    try {
        const respuesta = await axios.post(API, datos);
        return respuesta.data;
    } catch (error) {
        throw new Error(mensajeError(error, "No se pudo crear la orden."), { cause: error });
    }
}

export async function actualizarOrden(id, datos) {
    try {
        const respuesta = await axios.put(`${API}/${id}`, datos);
        return respuesta.data;
    } catch (error) {
        throw new Error(mensajeError(error, "No se pudo actualizar la orden."), { cause: error });
    }
}

export async function cambiarEstadoOrden(id, estado) {
    try {
        const respuesta = await axios.patch(`${API}/${id}/estado`, { estado });
        return respuesta.data;
    } catch (error) {
        throw new Error(mensajeError(error, "No se pudo cambiar el estado de la orden."), { cause: error });
    }
}

// ---- Servicios de la orden ----

export async function obtenerServiciosDeOrden(ordenId) {
    const respuesta = await axios.get(`${API}/${ordenId}/servicios`);
    return respuesta.data;
}

export async function agregarServicioAOrden(ordenId, datos) {
    try {
        const respuesta = await axios.post(`${API}/${ordenId}/servicios`, datos);
        return respuesta.data;
    } catch (error) {
        throw new Error(mensajeError(error, "No se pudo agregar el servicio."), { cause: error });
    }
}

export async function eliminarServicioDeOrden(ordenId, lineaId) {
    try {
        await axios.delete(`${API}/${ordenId}/servicios/${lineaId}`);
    } catch (error) {
        throw new Error(mensajeError(error, "No se pudo quitar el servicio."), { cause: error });
    }
}

// ---- Repuestos de la orden ----

export async function obtenerRepuestosDeOrden(ordenId) {
    const respuesta = await axios.get(`${API}/${ordenId}/repuestos`);
    return respuesta.data;
}

export async function agregarRepuestoAOrden(ordenId, datos) {
    try {
        const respuesta = await axios.post(`${API}/${ordenId}/repuestos`, datos);
        return respuesta.data;
    } catch (error) {
        throw new Error(mensajeError(error, "No se pudo agregar el repuesto."), { cause: error });
    }
}

export async function eliminarRepuestoDeOrden(ordenId, lineaId) {
    try {
        await axios.delete(`${API}/${ordenId}/repuestos/${lineaId}`);
    } catch (error) {
        throw new Error(mensajeError(error, "No se pudo quitar el repuesto."), { cause: error });
    }
}

// ---- Pagos de la orden ----

export async function obtenerPagosDeOrden(ordenId) {
    const respuesta = await axios.get(`${API}/${ordenId}/pagos`);
    return respuesta.data;
}

export async function obtenerResumenPagoDeOrden(ordenId) {
    const respuesta = await axios.get(`${API}/${ordenId}/pagos/resumen`);
    return respuesta.data;
}

export async function registrarPagoDeOrden(ordenId, datos) {
    try {
        const respuesta = await axios.post(`${API}/${ordenId}/pagos`, datos);
        return respuesta.data;
    } catch (error) {
        throw new Error(mensajeError(error, "No se pudo registrar el pago."), { cause: error });
    }
}

export async function anularPagoDeOrden(ordenId, pagoId) {
    try {
        const respuesta = await axios.patch(`${API}/${ordenId}/pagos/${pagoId}/anular`);
        return respuesta.data;
    } catch (error) {
        throw new Error(mensajeError(error, "No se pudo anular el pago."), { cause: error });
    }
}
