import api from "./api";
import { mensajeError } from "../utils/apiError";

const API = "/api/usuarios";

// El backend anida el rol completo ({rol: {id, nombre, permisos...}}); la UI
// existente espera un rolId plano — se adapta acá para no tocar esos componentes.
function aFormaFrontend(usuario) {
    if (!usuario) return usuario;
    return { ...usuario, rolId: usuario.rol?.id ?? "" };
}

function aFormaBackend(datos) {
    const payload = { ...datos };
    if (datos.rolId) {
        payload.rol = { id: datos.rolId };
    }
    delete payload.rolId;
    delete payload.grupoIds; // la membresía de grupo se administra desde Grupos, no desde Usuario
    return payload;
}

export async function obtenerUsuarios() {
    const respuesta = await api.get(API);
    return respuesta.data.map(aFormaFrontend);
}

export async function buscarUsuarioPorId(id) {
    const respuesta = await api.get(`${API}/${id}`);
    return aFormaFrontend(respuesta.data);
}

export async function crearUsuario(datos) {
    try {
        const respuesta = await api.post(API, aFormaBackend(datos));
        return aFormaFrontend(respuesta.data);
    } catch (error) {
        throw new Error(mensajeError(error, "No se pudo crear el usuario."), { cause: error });
    }
}

export async function actualizarUsuario(id, cambios) {
    try {
        const respuesta = await api.put(`${API}/${id}`, aFormaBackend(cambios));
        return aFormaFrontend(respuesta.data);
    } catch (error) {
        throw new Error(mensajeError(error, "No se pudo actualizar el usuario."), { cause: error });
    }
}

export async function cambiarEstadoUsuario(id, activo) {
    try {
        const respuesta = await api.patch(`${API}/${id}/estado`, { activo });
        return aFormaFrontend(respuesta.data);
    } catch (error) {
        throw new Error(mensajeError(error, "No se pudo cambiar el estado del usuario."), { cause: error });
    }
}
