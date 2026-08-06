import axios from "axios";
import { mensajeError } from "../utils/apiError";

const API = "http://localhost:9769/api/grupos";

// El backend anida los miembros y el rol bono como objetos completos; la UI
// existente espera miembroIds/rolBonusId planos — se adapta acá.
function aFormaFrontend(grupo) {
    if (!grupo) return grupo;
    return {
        ...grupo,
        miembroIds: (grupo.miembros ?? []).map((u) => u.id),
        rolBonusId: grupo.rolBonus?.id ?? "",
    };
}

function aFormaBackend(datos) {
    return {
        nombre: datos.nombre,
        descripcion: datos.descripcion,
        miembros: (datos.miembroIds ?? []).map((id) => ({ id })),
        rolBonus: datos.rolBonusId ? { id: datos.rolBonusId } : null,
    };
}

export async function obtenerGrupos() {
    const respuesta = await axios.get(API);
    return respuesta.data.map(aFormaFrontend);
}

export async function crearGrupo(datos) {
    try {
        const respuesta = await axios.post(API, aFormaBackend(datos));
        return aFormaFrontend(respuesta.data);
    } catch (error) {
        throw new Error(mensajeError(error, "No se pudo crear el grupo."), { cause: error });
    }
}

export async function actualizarGrupo(id, datos) {
    try {
        const respuesta = await axios.put(`${API}/${id}`, aFormaBackend(datos));
        return aFormaFrontend(respuesta.data);
    } catch (error) {
        throw new Error(mensajeError(error, "No se pudo actualizar el grupo."), { cause: error });
    }
}

export async function eliminarGrupo(id) {
    try {
        await axios.delete(`${API}/${id}`);
    } catch (error) {
        throw new Error(mensajeError(error, "No se pudo eliminar el grupo."), { cause: error });
    }
}
