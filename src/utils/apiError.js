/** Extrae el mensaje legible que manda el backend (ver GlobalExceptionHandler) de un error de axios. */
export function mensajeError(error, mensajePorDefecto = "Ocurrió un error inesperado.") {
    return error?.response?.data?.message ?? mensajePorDefecto;
}
