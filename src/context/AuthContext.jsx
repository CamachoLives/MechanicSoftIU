import { createContext, useContext, useEffect, useState } from "react";
import { iniciarSesion, cerrarSesion, obtenerSesionActual } from "../services/authService";
import { buscarUsuarioPorId } from "../services/usuarioService";
import { obtenerRoles } from "../services/rolService";
import { obtenerGrupos } from "../services/grupoService";
import { tienePermiso, permisosEfectivos } from "../utils/rbac";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [usuarioActual, setUsuarioActual] = useState(null);
    const [rolActual, setRolActual] = useState(null);
    const [roles, setRoles] = useState([]);
    const [grupos, setGrupos] = useState([]);
    const [cargando, setCargando] = useState(true);

    const limpiarSesion = () => {
        setUsuarioActual(null);
        setRolActual(null);
        setRoles([]);
        setGrupos([]);
    };

    const cargarSesion = async (usuarioId) => {
        if (!usuarioId) {
            limpiarSesion();
            return;
        }

        try {
            const [usuario, listaRoles, listaGrupos] = await Promise.all([
                buscarUsuarioPorId(usuarioId),
                obtenerRoles(),
                obtenerGrupos(),
            ]);
            setUsuarioActual(usuario);
            setRoles(listaRoles);
            setGrupos(listaGrupos);
            setRolActual(listaRoles.find((r) => r.id === usuario.rolId) ?? null);
        } catch {
            // La sesión guardada ya no es válida (usuario borrado, backend caído, etc.)
            cerrarSesion();
            limpiarSesion();
        }
    };

    // Solo debe ejecutarse una vez al montar (lectura de la sesión persistida).
    // cargarSesion se recrea en cada render; incluirla como dependencia
    // provocaría un bucle de recargas en cada cambio de estado.
    useEffect(() => {
        (async () => {
            const sesion = obtenerSesionActual();
            await cargarSesion(sesion?.usuarioId ?? null);
            setCargando(false);
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function login(usuario, contrasena) {
        const resultado = await iniciarSesion(usuario, contrasena);
        if (resultado.ok) {
            await cargarSesion(resultado.usuarioId);
        }
        return resultado;
    }

    function logout() {
        cerrarSesion();
        limpiarSesion();
    }

    const valor = {
        usuarioActual,
        rolActual,
        cargando,
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
