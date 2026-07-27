import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { NAV_ITEMS } from "../../config/navegacion";
import "./Sidebar.css";

export default function Sidebar({ vistaActual, cambiarVista }) {
    const { tienePermiso } = useAuth();
    const [menuAbierto, setMenuAbierto] = useState(false);

    const itemsVisibles = NAV_ITEMS.filter((item) => tienePermiso(item.permiso));

    const cambiarVistaYCerrar = (clave) => {
        cambiarVista(clave);
        setMenuAbierto(false);
    };

    return (
        <>
            <button
                type="button"
                className={`menu-toggle ${menuAbierto ? "menu-toggle-oculto" : ""}`}
                onClick={() => setMenuAbierto((v) => !v)}
                aria-label="Abrir menú"
            >
                ☰
            </button>

            <aside className={`sidebar ${menuAbierto ? "abierto" : ""}`}>
                <div className="sidebar-header">
                    <h2>MechanicSoft</h2>
                </div>

                <nav>
                    {itemsVisibles.map((item) => {
                        const Icono = item.icono;
                        return (
                            <button
                                key={item.clave}
                                className={vistaActual === item.clave ? "activo" : ""}
                                onClick={() => cambiarVistaYCerrar(item.clave)}
                            >
                                <Icono className="sidebar-icono" />
                                {item.etiqueta}
                            </button>
                        );
                    })}
                </nav>
            </aside>

            {menuAbierto && (
                <div className="sidebar-fondo" onClick={() => setMenuAbierto(false)} />
            )}
        </>
    );
}
