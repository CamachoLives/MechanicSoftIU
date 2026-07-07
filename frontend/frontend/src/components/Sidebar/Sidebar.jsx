import { useState } from "react";
import "./Sidebar.css";

export default function Sidebar({

    paginaActual,

    cambiarPagina

}) {

    const [menuAbierto, setMenuAbierto] = useState(false);

    const cambiarVista = (pagina) => {

        cambiarPagina(pagina);

        setMenuAbierto(false);

    };

    return (

        <>
            {/* Botón hamburguesa (solo aparecerá en celular mediante CSS) */}
            <button
                className="menu-toggle"
                onClick={() => setMenuAbierto(!menuAbierto)}
            >
                ☰
            </button>

            <aside className={`sidebar ${menuAbierto ? "abierto" : ""}`}>

                <div className="sidebar-header">

                    <h2>🚗 MechanicSoft</h2>

                </div>

                <nav>

                    <button

                        className={paginaActual === "registro" ? "activo" : ""}

                        onClick={() => cambiarVista("registro")}

                    >

                        🚗 Registrar

                    </button>

                    <button

                        className={paginaActual === "lista" ? "activo" : ""}

                        onClick={() => cambiarVista("lista")}

                    >

                        📋 Vehículos

                    </button>

                </nav>

            </aside>

        </>

    );

}