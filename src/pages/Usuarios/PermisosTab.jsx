import { useEffect, useState } from "react";
import { TbKey } from "react-icons/tb";
import { permisosPorModulo } from "../../data/permisos";
import { obtenerRoles } from "../../services/rolService";
import Badge from "../../components/Badge/Badge";

const GRUPOS_PERMISOS = permisosPorModulo();

export default function PermisosTab() {
    const [roles, setRoles] = useState([]);

    useEffect(() => {
        obtenerRoles().then(setRoles);
    }, []);

    const rolesConPermiso = (clave) => roles.filter((r) => r.permisos.includes(clave));

    return (
        <div>
            <div className="tabla-encabezado">
                <h2>
                    <TbKey /> Catálogo de permisos
                </h2>
            </div>
            <p className="formulario-nota">
                Este catálogo es fijo: los permisos no se crean ni se editan directamente, se
                combinan dentro de cada rol (pestaña "Roles").
            </p>

            <div className="matriz-permisos">
                {GRUPOS_PERMISOS.map(({ modulo, permisos }) => (
                    <div className="matriz-permisos-grupo" key={modulo}>
                        <h4>{modulo}</h4>
                        <div className="permisos-tabla">
                            {permisos.map((permiso) => (
                                <div className="permisos-fila" key={permiso.clave}>
                                    <span className="permisos-etiqueta">{permiso.etiqueta}</span>
                                    <div className="permisos-roles">
                                        {rolesConPermiso(permiso.clave).map((r) => (
                                            <Badge tono="neutral" key={r.id}>
                                                {r.nombre}
                                            </Badge>
                                        ))}
                                        {rolesConPermiso(permiso.clave).length === 0 && (
                                            <span className="selector-chips-vacio">
                                                Ningún rol lo otorga
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
