import axios from "axios";
import { obtener, eliminarClave } from "../utils/storage";

// En desarrollo apunta al backend local por defecto. En un build de
// producción el host real se fija con VITE_API_URL en tiempo de compilación;
// si no se define, usa el mismo dominio de la página (así funciona en
// Cloudflare, donde el Worker sirve el frontend y el /api juntos).
const BASE_URL = import.meta.env.VITE_API_URL ?? (import.meta.env.PROD ? "" : "http://localhost:9769");

// Sin timeout, una petición a un backend caído o que colgó se queda
// pendiente indefinidamente: la pantalla se queda en "Cargando..." para
// siempre sin ningún mensaje. 15s es generoso para cualquier operación de
// este API, pero acota la espera a algo que el usuario pueda notar.
const api = axios.create({ baseURL: BASE_URL, timeout: 15000 });

// El backend en Cloudflare exige el token que devuelve el login en cada
// petición. Con el backend Spring Boot el encabezado simplemente se ignora.
api.interceptors.request.use((config) => {
    const token = obtener("sesion", null)?.token;
    if (token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Si la sesión venció (401 fuera del login), se cierra y se vuelve a la
// pantalla inicial en lugar de dejar la app mostrando errores.
api.interceptors.response.use(
    (respuesta) => respuesta,
    (error) => {
        const url = error?.config?.url ?? "";
        if (error?.response?.status === 401 && !url.includes("/api/auth/login") && obtener("sesion", null)) {
            eliminarClave("sesion");
            window.location.reload();
        }
        return Promise.reject(error);
    }
);

export default api;
