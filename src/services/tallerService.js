import { obtener, guardar, generarId } from "../utils/storage";
import { BAHIAS } from "../data/bahias";

const ESTADOS_ACTIVOS = ["en_espera", "en_progreso", "en_pausa"];

export async function obtenerBahias() {
    return BAHIAS;
}

export async function obtenerAsignacionesActivas() {
    const todas = obtener("asignaciones", []);
    return todas.filter((a) => ESTADOS_ACTIVOS.includes(a.estado));
}

/** Las 4 bahías fijas, cada una con su asignación activa (o null si está libre). */
export async function obtenerEstadoBahias() {
    const activas = await obtenerAsignacionesActivas();
    return BAHIAS.map((bahia) => ({
        ...bahia,
        asignacion: activas.find((a) => a.bahiaId === bahia.id) ?? null,
    }));
}

export async function obtenerActividadReciente(limite = 6) {
    const todas = obtener("asignaciones", []);
    return todas
        .filter((a) => a.estado === "finalizado" || a.estado === "cancelado")
        .sort((a, b) => new Date(b.fechaFin) - new Date(a.fechaFin))
        .slice(0, limite);
}

/** Excluye del listado de un vehículoService.obtenerVehiculos() los que ya están activos en alguna bahía. */
export async function obtenerVehiculosDisponibles(vehiculosRegistrados) {
    const activas = await obtenerAsignacionesActivas();
    const idsOcupados = new Set(activas.map((a) => a.vehiculoId));
    return vehiculosRegistrados.filter((v) => !idsOcupados.has(v.id));
}

export async function asignarVehiculo(bahiaId, datos) {
    const asignaciones = obtener("asignaciones", []);

    const bahiaOcupada = asignaciones.some(
        (a) => a.bahiaId === bahiaId && ESTADOS_ACTIVOS.includes(a.estado)
    );
    if (bahiaOcupada) {
        throw new Error("Esta bahía ya tiene un vehículo asignado.");
    }

    const nueva = {
        id: generarId(),
        bahiaId,
        vehiculoId: datos.vehiculoId,
        placaVehiculo: datos.placaVehiculo,
        marcaModelo: datos.marcaModelo,
        propietario: datos.propietario,
        servicio: datos.servicio,
        estado: datos.mecanicoId ? "en_progreso" : "en_espera",
        prioridad: datos.prioridad ?? "normal",
        mecanicoId: datos.mecanicoId ?? null,
        mecanicoNombre: datos.mecanicoNombre ?? null,
        progreso: 0,
        notas: datos.notas ?? "",
        fechaInicio: new Date().toISOString(),
        fechaEstimada: datos.fechaEstimada || null,
        fechaFin: null,
        creadoPor: datos.creadoPor ?? null,
    };

    guardar("asignaciones", [...asignaciones, nueva]);
    return nueva;
}

export async function actualizarAsignacion(id, cambios) {
    const asignaciones = obtener("asignaciones", []);

    let actualizada = null;
    const siguientes = asignaciones.map((a) => {
        if (a.id !== id) return a;
        actualizada = { ...a, ...cambios };
        return actualizada;
    });

    guardar("asignaciones", siguientes);
    return actualizada;
}

export async function finalizarAsignacion(id) {
    return actualizarAsignacion(id, {
        estado: "finalizado",
        progreso: 100,
        fechaFin: new Date().toISOString(),
    });
}

export async function cancelarAsignacion(id) {
    return actualizarAsignacion(id, {
        estado: "cancelado",
        fechaFin: new Date().toISOString(),
    });
}
