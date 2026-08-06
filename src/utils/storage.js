const PREFIJO = "msoft_";

export function obtener(clave, porDefecto) {
    try {
        const crudo = localStorage.getItem(PREFIJO + clave);
        if (crudo === null) return porDefecto;
        return JSON.parse(crudo);
    } catch {
        return porDefecto;
    }
}

export function guardar(clave, valor) {
    localStorage.setItem(PREFIJO + clave, JSON.stringify(valor));
}

export function eliminarClave(clave) {
    localStorage.removeItem(PREFIJO + clave);
}
