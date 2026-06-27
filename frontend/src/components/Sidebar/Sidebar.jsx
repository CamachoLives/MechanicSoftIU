import "./Sidebar.css";

export default function Sidebar({

    paginaActual,

    cambiarPagina

}){

    return(

        <aside className="sidebar">

            <button

                className={paginaActual==="registro"?"activo":""}

                onClick={()=>cambiarPagina("registro")}

            >

                🚗 Registrar

            </button>

            <button

                className={paginaActual==="lista"?"activo":""}

                onClick={()=>cambiarPagina("lista")}

            >

                📋 Vehículos

            </button>

        </aside>

    )

}