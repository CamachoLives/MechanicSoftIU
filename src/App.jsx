import { useState } from "react";
import "./App.css";

import { useAuth } from "./context/AuthContext";
import { NAV_ITEMS } from "./config/navegacion";

import Header from "./components/Header/Header";
import Sidebar from "./components/Sidebar/Sidebar";
import AccesoDenegado from "./components/AccesoDenegado/AccesoDenegado";
import Login from "./pages/Login/Login";

import RegistroVehiculo from "./pages/RegistroVehiculo/RegistroVehiculo";
import ListaVehiculos from "./pages/ListaVehiculos/ListaVehiculos";
import OrdenesServicio from "./pages/OrdenesServicio/OrdenesServicio";
import Clientes from "./pages/Clientes/Clientes";
import Repuestos from "./pages/Repuestos/Repuestos";
import Usuarios from "./pages/Usuarios/Usuarios";

function App() {
    const { usuarioActual, cargando, tienePermiso } = useAuth();

    const [vista, setVista] = useState(null);

    if (cargando) {
        return (
            <div className="app-cargando">
                <span className="app-cargando-spinner" />
            </div>
        );
    }

    if (!usuarioActual) {
        return <Login />;
    }

    const primerItemPermitido = NAV_ITEMS.find((item) => tienePermiso(item.permiso));
    const vistaValida =
        vista && NAV_ITEMS.some((item) => item.clave === vista && tienePermiso(item.permiso));
    const vistaActual = vistaValida ? vista : primerItemPermitido?.clave ?? null;

    return (
        <div className="app">
            <Header />

            <div className="contenedor">
                <Sidebar vistaActual={vistaActual} cambiarVista={setVista} />

                <main className="contenido">
                    {!vistaActual && (
                        <AccesoDenegado mensaje="Tu usuario no tiene ningún permiso asignado todavía. Contacta a un administrador." />
                    )}

                    {vistaActual === "ordenes" && <OrdenesServicio />}
                    {vistaActual === "clientes" && <Clientes />}
                    {vistaActual === "vehiculos-registro" && <RegistroVehiculo />}
                    {vistaActual === "vehiculos-lista" && <ListaVehiculos />}
                    {vistaActual === "repuestos" && <Repuestos />}
                    {vistaActual === "usuarios" && <Usuarios />}
                </main>
            </div>
        </div>
    );
}

export default App;
