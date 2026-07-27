import { useEffect, useState } from "react";
import { TbUserPlus, TbEdit, TbTrash, TbUserCheck, TbUserX } from "react-icons/tb";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import {
    obtenerUsuarios,
    eliminarUsuario,
    actualizarUsuario,
} from "../../services/usuarioService";
import { obtenerRoles } from "../../services/rolService";
import { obtenerGrupos } from "../../services/grupoService";
import Button from "../../components/Button/Button";
import Badge from "../../components/Badge/Badge";
import ConfirmModal from "../../components/Modal/ConfirmModal";
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
    const [usuarioParaEliminar, setUsuarioParaEliminar] = useState(null);
    const [procesando, setProcesando] = useState(false);

    const puedeCrear = tienePermiso("usuarios.crear");
    const puedeEditar = tienePermiso("usuarios.editar");
    const puedeEliminar = tienePermiso("usuarios.eliminar");

    const cargar = async () => {
        setCargando(true);
        const [u, r, g] = await Promise.all([obtenerUsuarios(), obtenerRoles(), obtenerGrupos()]);
        setUsuarios(u);
        setRoles(r);
        setGrupos(g);
        setCargando(false);
    };

    useEffect(() => {
        (async () => {
            await cargar();
        })();
    }, []);

    const nombreRol = (rolId) => roles.find((r) => r.id === rolId)?.nombre ?? "—";
    const gruposDe = (usuario) =>
        grupos.filter((g) => usuario.grupoIds?.includes(g.id)).map((g) => g.nombre);

    const alGuardar = async () => {
        setUsuarioEnEdicion(undefined);
        await cargar();
    };

    const alternarActivo = async (usuario) => {
        setProcesando(true);
        try {
            await actualizarUsuario(usuario.id, { activo: !usuario.activo });
            toast.exito(`${usuario.nombre} quedó ${usuario.activo ? "inactivo" : "activo"}.`);
            await cargar();
        } catch (error) {
            toast.error(error.message ?? "No se pudo cambiar el estado.");
        } finally {
            setProcesando(false);
        }
    };

    const confirmarEliminar = async () => {
        setProcesando(true);
        try {
            await eliminarUsuario(usuarioParaEliminar.id);
            toast.exito(`Se eliminó a ${usuarioParaEliminar.nombre}.`);
            setUsuarioParaEliminar(null);
            await cargar();
        } catch (error) {
            toast.error(error.message ?? "No se pudo eliminar el usuario.");
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
                                                        variante="secundario"
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
                                                {puedeEliminar && (
                                                    <Button
                                                        variante="peligro"
                                                        icono={<TbTrash />}
                                                        onClick={() => setUsuarioParaEliminar(usuario)}
                                                        disabled={esUsuarioActual}
                                                        title={
                                                            esUsuarioActual
                                                                ? "No puedes eliminar tu propia cuenta"
                                                                : ""
                                                        }
                                                    >
                                                        Eliminar
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
                grupos={grupos}
                cerrar={() => setUsuarioEnEdicion(undefined)}
                alGuardar={alGuardar}
            />

            <ConfirmModal
                abierto={Boolean(usuarioParaEliminar)}
                titulo="Eliminar usuario"
                mensaje={`¿Seguro que deseas eliminar a "${usuarioParaEliminar?.nombre}"? Esta acción no se puede deshacer.`}
                textoConfirmar="Eliminar"
                variantePeligro
                cargando={procesando}
                confirmar={confirmarEliminar}
                cancelar={() => setUsuarioParaEliminar(null)}
            />
        </div>
    );
}
