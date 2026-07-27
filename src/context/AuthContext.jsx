import { createContext, useContext, useState } from "react";
import { obtener } from "../utils/storage";
import { iniciarSesion, cerrarSesion, obtenerSesionActual } from "../services/authService";
import { tienePermiso, permisosEfectivos } from "../utils/rbac";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    // La sesión vive en localStorage (lectura síncrona), así que el id se
    // resuelve de una vez en el estado inicial: no hace falta un efecto ni
    // una bandera de "cargando" para esto.
    const [usuarioId, setUsuarioId] = useState(() => obtenerSesionActual()?.usuarioId ?? null);

    // Roles/usuarios/grupos se leen "en vivo" (no se cachean en estado) para que
    // un cambio de rol/permiso se refleje apenas se vuelva a iniciar sesión o se recargue la app.
    const roles = obtener("roles", []);
    const grupos = obtener("grupos", []);
    const usuarios = obtener("usuarios", []);
    const usuarioActual = usuarios.find((u) => u.id === usuarioId) ?? null;
    const rolActual = roles.find((r) => r.id === usuarioActual?.rolId) ?? null;

    async function login(usuario, contrasena) {
        const resultado = await iniciarSesion(usuario, contrasena);
        if (resultado.ok) {
            setUsuarioId(resultado.usuarioId);
        }
        return resultado;
    }

    function logout() {
        cerrarSesion();
        setUsuarioId(null);
    }

    const valor = {
        usuarioActual,
        rolActual,
        login,
        logout,
        tienePermiso: (clave) => tienePermiso(usuarioActual, clave, { roles, grupos }),
        permisos: permisosEfectivos(usuarioActual, { roles, grupos }),
    };

    return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

// Hook colocado deliberadamente junto a su Provider (patrón común de Context);
// solo le cuesta el fast-refresh a este archivo, nada funcional.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    const contexto = useContext(AuthContext);
    if (!contexto) {
        throw new Error("useAuth debe usarse dentro de <AuthProvider>.");
    }
    return contexto;
}
