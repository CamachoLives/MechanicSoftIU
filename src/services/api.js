import axios from "axios";

// En desarrollo apunta al backend local por defecto. En un build de
// producción (Docker, por ejemplo) el host real se fija con VITE_API_URL
// en tiempo de compilación — antes cada servicio tenía "http://localhost:9769"
// escrito a mano, así que el build de producción siempre apuntaba a
// localhost sin importar dónde corriera el backend.
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:9769";

// Sin timeout, una petición a un backend caído o que colgó se queda
// pendiente indefinidamente: la pantalla se queda en "Cargando..." para
// siempre sin ningún mensaje. 15s es generoso para cualquier operación de
// este API, pero acota la espera a algo que el usuario pueda notar.
const api = axios.create({ baseURL: BASE_URL, timeout: 15000 });

export default api;
