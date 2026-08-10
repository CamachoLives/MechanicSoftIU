import { useEffect, useState } from "react";
import { TbUserPlus, TbEdit, TbUserCheck, TbUserX } from "react-icons/tb";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { obtenerUsuarios, cambiarEstadoUsuario } from "../../services/usuarioService";
import { obtenerRoles } from "../../services/rolService";
import { obtenerGrupos } from "../../services/grupoService";
import { mensajeError } from "../../utils/apiError";
import Button from "../../components/Button/Button";
import Badge from "../../components/Badge/Badge";
import UsuarioFormModal from "./UsuarioFormModal";

export default function UsuariosTab() {
    const { usuarioActual, tienePermiso } = useAuth();
    const toast = useToast();

    const [usuarios, setUsuarios] = useState([]);
    const [roles, setRoles] = useState([]);
    const [grupos, setGrupos] = useState([]);
    const [cargando, setCargando] = useState(true);

    // undefined = modal cerrado, null = creando, objeto = editando
    const [usuarioEnEdicion, setUsuarioEnEdicion] = useState(undefined);
    const [procesando, setProcesando] = useState(false);

    const puedeCrear = tienePermiso("usuarios.crear");
    const puedeEditar = tienePermiso("usuarios.editar");

    const cargar = async () => {
        setCargando(true);
        try {
            const [u, r, g] = await Promise.all([obtenerUsuarios(), obtenerRoles(), obtenerGrupos()]);
            setUsuarios(u);
            setRoles(r);
            setGrupos(g);
        } catch (error) {
            toast.error(mensajeError(error, "No se pudo cargar los usuarios."));
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        (async () => {
            await cargar();
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const nombreRol = (rolId) => roles.find((r) => r.id === rolId)?.nombre ?? "—";
    // El backend guarda la membresía en el grupo (miembroIds), no en el usuario:
    // se invierte la búsqueda para saber a qué grupos pertenece cada usuario.
    const gruposDe = (usuario) =>
        grupos.filter((g) => g.miembroIds?.includes(usuario.id)).map((g) => g.nombre);

    const alGuardar = async () => {
        setUsuarioEnEdicion(undefined);
        await cargar();
    };

    const alternarActivo = async (usuario) => {
        setProcesando(true);
        try {
            await cambiarEstadoUsuario(usuario.id, !usuario.activo);
            toast.exito(`${usuario.nombre} quedó ${usuario.activo ? "inactivo" : "activo"}.`);
            await cargar();
        } catch (error) {
            toast.error(error.message ?? "No se pudo cambiar el estado.");
        } finally {
            setProcesando(false);
        }
    };

    if (cargando) return <p className="tabla-datos-cargando">Cargando usuarios...</p>;

    return (
        <div>
            <div className="tabla-encabezado">
                <h2>Usuarios ({usuarios.length})</h2>
                {puedeCrear && (
                    <Button icono={<TbUserPlus />} onClick={() => setUsuarioEnEdicion(null)}>
                        Nuevo usuario
                    </Button>
                )}
            </div>

            <div className="tabla-datos-contenedor">
                <table className="tabla-datos">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Usuario</th>
                            <th>Rol</th>
                            <th>Grupos</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {usuarios.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="tabla-datos-vacio">
                                    No hay usuarios registrados.
                                </td>
                            </tr>
                        ) : (
                            usuarios.map((usuario) => {
                                const esUsuarioActual = usuario.id === usuarioActual?.id;
                                const gruposUsuario = gruposDe(usuario);
                                return (
                                    <tr key={usuario.id}>
                                        <td>
                                            <div className="celda-principal">
                                                <strong>{usuario.nombre}</strong>
                                                <span>{usuario.correo || "sin correo"}</span>
                                            </div>
                                        </td>
                                        <td>{usuario.usuario}</td>
                                        <td>
                                            <Badge tono="info">{nombreRol(usuario.rolId)}</Badge>
                                        </td>
                                        <td>{gruposUsuario.length > 0 ? gruposUsuario.join(", ") : "—"}</td>
                                        <td>
                                            <Badge tono={usuario.activo ? "success" : "neutral"}>
                                                {usuario.activo ? "Activo" : "Inactivo"}
                                            </Badge>
                                        </td>
                                        <td>
                                            <div className="tabla-acciones">
                                                {puedeEditar && (
                                                    <Button
                                                        variante="secundario"
                                                        icono={<TbEdit />}
                                                        onClick={() => setUsuarioEnEdicion(usuario)}
                                                    >
                                                        Editar
                                                    </Button>
                                                )}
                                                {puedeEditar && (
                                                    <Button
                                                        variante={usuario.activo ? "peligro" : "secundario"}
                                                        icono={usuario.activo ? <TbUserX /> : <TbUserCheck />}
                                                        onClick={() => alternarActivo(usuario)}
                                                        disabled={esUsuarioActual || procesando}
                                                        title={
                                                            esUsuarioActual
                                                                ? "No puedes desactivar tu propia cuenta"
                                                                : ""
                                                        }
                                                    >
                                                        {usuario.activo ? "Desactivar" : "Activar"}
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <UsuarioFormModal
                usuario={usuarioEnEdicion}
                roles={roles}
                cerrar={() => setUsuarioEnEdicion(undefined)}
                alGuardar={alGuardar}
            />
        </div>
    );
}
