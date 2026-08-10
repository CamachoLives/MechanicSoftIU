import { useEffect, useState } from "react";
import { TbUsersPlus, TbEdit, TbTrash } from "react-icons/tb";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { obtenerGrupos, eliminarGrupo } from "../../services/grupoService";
import { obtenerUsuarios } from "../../services/usuarioService";
import { obtenerRoles } from "../../services/rolService";
import { mensajeError } from "../../utils/apiError";
import Button from "../../components/Button/Button";
import Badge from "../../components/Badge/Badge";
import ConfirmModal from "../../components/Modal/ConfirmModal";
import GrupoFormModal from "./GrupoFormModal";

export default function GruposTab() {
    const { tienePermiso } = useAuth();
    const toast = useToast();

    const [grupos, setGrupos] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [roles, setRoles] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [grupoEnEdicion, setGrupoEnEdicion] = useState(undefined);
    const [grupoParaEliminar, setGrupoParaEliminar] = useState(null);
    const [procesando, setProcesando] = useState(false);

    const puedeCrear = tienePermiso("grupos.crear");
    const puedeEditar = tienePermiso("grupos.editar");
    const puedeEliminar = tienePermiso("grupos.eliminar");

    const cargar = async () => {
        setCargando(true);
        try {
            const [g, u, r] = await Promise.all([obtenerGrupos(), obtenerUsuarios(), obtenerRoles()]);
            setGrupos(g);
            setUsuarios(u);
            setRoles(r);
        } catch (error) {
            toast.error(mensajeError(error, "No se pudo cargar los grupos."));
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

    const nombresMiembros = (grupo) =>
        usuarios.filter((u) => grupo.miembroIds.includes(u.id)).map((u) => u.nombre);

    const nombreRolBonus = (grupo) => roles.find((r) => r.id === grupo.rolBonusId)?.nombre;

    const confirmarEliminar = async () => {
        setProcesando(true);
        try {
            await eliminarGrupo(grupoParaEliminar.id);
            toast.exito(`Se eliminó el grupo "${grupoParaEliminar.nombre}".`);
            setGrupoParaEliminar(null);
            await cargar();
        } catch (error) {
            toast.error(error.message ?? "No se pudo eliminar el grupo.");
        } finally {
            setProcesando(false);
        }
    };

    if (cargando) return <p className="tabla-datos-cargando">Cargando grupos...</p>;

    return (
        <div>
            <div className="tabla-encabezado">
                <h2>Grupos ({grupos.length})</h2>
                {puedeCrear && (
                    <Button icono={<TbUsersPlus />} onClick={() => setGrupoEnEdicion(null)}>
                        Nuevo grupo
                    </Button>
                )}
            </div>

            <div className="tabla-datos-contenedor">
                <table className="tabla-datos">
                    <thead>
                        <tr>
                            <th>Grupo</th>
                            <th>Miembros</th>
                            <th>Rol bono</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {grupos.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="tabla-datos-vacio">
                                    No hay grupos creados.
                                </td>
                            </tr>
                        ) : (
                            grupos.map((grupo) => {
                                const miembros = nombresMiembros(grupo);
                                const rolBono = nombreRolBonus(grupo);
                                return (
                                    <tr key={grupo.id}>
                                        <td>
                                            <div className="celda-principal">
                                                <strong>{grupo.nombre}</strong>
                                                <span>{grupo.descripcion}</span>
                                            </div>
                                        </td>
                                        <td>
                                            {miembros.length > 0
                                                ? miembros.join(", ")
                                                : "Sin miembros"}
                                        </td>
                                        <td>{rolBono ? <Badge tono="warning">{rolBono}</Badge> : "—"}</td>
                                        <td>
                                            <div className="tabla-acciones">
                                                {puedeEditar && (
                                                    <Button
                                                        variante="secundario"
                                                        icono={<TbEdit />}
                                                        onClick={() => setGrupoEnEdicion(grupo)}
                                                    >
                                                        Editar
                                                    </Button>
                                                )}
                                                {puedeEliminar && (
                                                    <Button
                                                        variante="peligro"
                                                        icono={<TbTrash />}
                                                        onClick={() => setGrupoParaEliminar(grupo)}
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

            <GrupoFormModal
                grupo={grupoEnEdicion}
                usuarios={usuarios}
                roles={roles}
                cerrar={() => setGrupoEnEdicion(undefined)}
                alGuardar={async () => {
                    setGrupoEnEdicion(undefined);
                    await cargar();
                }}
            />

            <ConfirmModal
                abierto={Boolean(grupoParaEliminar)}
                titulo="Eliminar grupo"
                mensaje={`¿Seguro que deseas eliminar el grupo "${grupoParaEliminar?.nombre}"?`}
                textoConfirmar="Eliminar"
                variantePeligro
                cargando={procesando}
                confirmar={confirmarEliminar}
                cancelar={() => setGrupoParaEliminar(null)}
            />
        </div>
    );
}
