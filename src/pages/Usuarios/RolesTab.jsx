import { useEffect, useState } from "react";
import { TbShieldPlus, TbEdit, TbTrash, TbLock } from "react-icons/tb";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { obtenerRoles, eliminarRol } from "../../services/rolService";
import { mensajeError } from "../../utils/apiError";
import Button from "../../components/Button/Button";
import Badge from "../../components/Badge/Badge";
import ConfirmModal from "../../components/Modal/ConfirmModal";
import RolFormModal from "./RolFormModal";

export default function RolesTab() {
    const { tienePermiso } = useAuth();
    const toast = useToast();

    const [roles, setRoles] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [rolEnEdicion, setRolEnEdicion] = useState(undefined);
    const [rolParaEliminar, setRolParaEliminar] = useState(null);
    const [procesando, setProcesando] = useState(false);

    const puedeCrear = tienePermiso("roles.crear");
    const puedeEditar = tienePermiso("roles.editar");
    const puedeEliminar = tienePermiso("roles.eliminar");

    const cargar = async () => {
        setCargando(true);
        try {
            setRoles(await obtenerRoles());
        } catch (error) {
            toast.error(mensajeError(error, "No se pudo cargar los roles."));
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

    const confirmarEliminar = async () => {
        setProcesando(true);
        try {
            await eliminarRol(rolParaEliminar.id);
            toast.exito(`Se eliminó el rol "${rolParaEliminar.nombre}".`);
            setRolParaEliminar(null);
            await cargar();
        } catch (error) {
            toast.error(error.message ?? "No se pudo eliminar el rol.");
        } finally {
            setProcesando(false);
        }
    };

    if (cargando) return <p className="tabla-datos-cargando">Cargando roles...</p>;

    return (
        <div>
            <div className="tabla-encabezado">
                <h2>Roles ({roles.length})</h2>
                {puedeCrear && (
                    <Button icono={<TbShieldPlus />} onClick={() => setRolEnEdicion(null)}>
                        Nuevo rol
                    </Button>
                )}
            </div>

            <div className="tabla-datos-contenedor">
                <table className="tabla-datos">
                    <thead>
                        <tr>
                            <th scope="col">Rol</th>
                            <th scope="col">Permisos</th>
                            <th scope="col">Tipo</th>
                            <th scope="col">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {roles.map((rol) => (
                            <tr key={rol.id}>
                                <td>
                                    <div className="celda-principal">
                                        <strong>{rol.nombre}</strong>
                                        <span>{rol.descripcion}</span>
                                    </div>
                                </td>
                                <td>{rol.permisos.length} permisos</td>
                                <td>
                                    <Badge tono={rol.esSistema ? "neutral" : "info"}>
                                        {rol.esSistema ? "Sistema" : "Personalizado"}
                                    </Badge>
                                </td>
                                <td>
                                    <div className="tabla-acciones">
                                        {puedeEditar && (
                                            <Button
                                                variante="secundario"
                                                icono={<TbEdit />}
                                                onClick={() => setRolEnEdicion(rol)}
                                            >
                                                Editar
                                            </Button>
                                        )}
                                        {puedeEliminar && (
                                            <Button
                                                variante="peligro"
                                                icono={rol.esSistema ? <TbLock /> : <TbTrash />}
                                                onClick={() => setRolParaEliminar(rol)}
                                                disabled={rol.esSistema}
                                                title={
                                                    rol.esSistema
                                                        ? "Los roles del sistema no se pueden eliminar"
                                                        : ""
                                                }
                                            >
                                                Eliminar
                                            </Button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <RolFormModal
                rol={rolEnEdicion}
                cerrar={() => setRolEnEdicion(undefined)}
                alGuardar={async () => {
                    setRolEnEdicion(undefined);
                    await cargar();
                }}
            />

            <ConfirmModal
                abierto={Boolean(rolParaEliminar)}
                titulo="Eliminar rol"
                mensaje={`¿Seguro que deseas eliminar el rol "${rolParaEliminar?.nombre}"?`}
                textoConfirmar="Eliminar"
                variantePeligro
                cargando={procesando}
                confirmar={confirmarEliminar}
                cancelar={() => setRolParaEliminar(null)}
            />
        </div>
    );
}
