/**
 * Extrae el mensaje legible que manda el backend (ver GlobalExceptionHandler)
 * de un error de axios. Si la petición nunca llegó a tener respuesta (backend
 * caído, sin red, o venció el timeout de services/api.js), el mensaje por
 * defecto del llamador ("No se pudo crear el cliente.") sería engañoso —
 * el problema no fue la operación, fue no poder hablar con el servidor.
 */
export function mensajeError(error, mensajePorDefecto = "Ocurrió un error inesperado.") {
    if (error?.response?.data?.message) {
        return error.response.data.message;
    }
    if (error?.code === "ECONNABORTED" || (error?.request && !error?.response)) {
        return "No se pudo conectar con el servidor. Verifica tu conexión e inténtalo de nuevo.";
    }
    return mensajePorDefecto;
}
