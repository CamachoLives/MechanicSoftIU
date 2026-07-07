import { useState } from "react";
import "./App.css";

import Header from "./components/Header/Header";
import Sidebar from "./components/Sidebar/Sidebar";

import RegistroVehiculo from "./pages/RegistroVehiculo/RegistroVehiculo";
import ListaVehiculos from "./pages/ListaVehiculos/ListaVehiculos";

function App() {

  const [paginaActual, setPaginaActual] = useState("registro");

  return (

    <div className="app">

      <Header />

      <div className="contenedor">

        <Sidebar
          paginaActual={paginaActual}
          cambiarPagina={setPaginaActual}
        />

        <main className="contenido">

          {paginaActual === "registro" && <RegistroVehiculo />}

          {paginaActual === "lista" && <ListaVehiculos />}

        </main>

      </div>

    </div>

  );

}

export default App;