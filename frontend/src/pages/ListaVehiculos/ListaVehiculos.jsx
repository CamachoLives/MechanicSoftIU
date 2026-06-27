import { useEffect, useState } from "react";
import "./ListaVehiculos.css";

import {
    obtenerVehiculos,
    eliminarVehiculo
} from "../../services/vehiculoService";

export default function ListaVehiculos() {

    const [vehiculos, setVehiculos] = useState([]);

    const [busqueda, setBusqueda] = useState("");

    useEffect(() => {
        cargarVehiculos();
    }, []);

    const cargarVehiculos = async () => {

        try {

            const respuesta = await obtenerVehiculos();

            setVehiculos(respuesta.data);

        } catch (error) {

            console.error(error);

            alert("Error cargando los vehículos.");

        }

    };

    const eliminar = async (id) => {

        const confirmar = window.confirm("¿Desea eliminar este vehículo?");

        if (!confirmar) return;

        try {

            await eliminarVehiculo(id);

            cargarVehiculos();

        } catch (error) {

            console.error(error);

            alert("No fue posible eliminar.");

        }

    };

    const vehiculosFiltrados = vehiculos.filter((vehiculo) =>

        vehiculo.placa
            .toLowerCase()
            .includes(busqueda.toLowerCase())

    );

    return (

        <div className="lista">

            <h1>Vehículos Registrados</h1>

            <input

                className="buscar"

                type="text"

                placeholder="Buscar por placa..."

                value={busqueda}

                onChange={(e) => setBusqueda(e.target.value)}

            />

            <table>

                <thead>

                    <tr>

                        <th>Placa</th>

                        <th>Marca</th>

                        <th>Modelo</th>

                        <th>Color</th>

                        <th>Km</th>

                        <th>Propietario</th>

                        <th>Teléfono</th>

                        <th>Motivo</th>

                        <th>Acciones</th>

                    </tr>

                </thead>

                <tbody>

                    {

                        vehiculosFiltrados.length === 0 ?

                            (

                                <tr>

                                    <td colSpan="9">

                                        No existen vehículos registrados.

                                    </td>

                                </tr>

                            )

                            :

                            (

                                vehiculosFiltrados.map((vehiculo) => (

                                    <tr key={vehiculo.id}>

                                        <td>{vehiculo.placa}</td>

                                        <td>{vehiculo.marca}</td>

                                        <td>{vehiculo.modelo}</td>

                                        <td>{vehiculo.color}</td>

                                        <td>{vehiculo.kilometraje}</td>

                                        <td>{vehiculo.propietarioActual}</td>

                                        <td>{vehiculo.telefonoActual}</td>

                                        <td>{vehiculo.motivoIngreso}</td>

                                        <td>

                                            <button className="btn-ver">

                                                Ver

                                            </button>

                                            <button className="btn-editar">

                                                Editar

                                            </button>

                                            <button

                                                className="btn-eliminar"

                                                onClick={() => eliminar(vehiculo.id)}

                                            >

                                                Eliminar

                                            </button>

                                        </td>

                                    </tr>

                                ))

                            )

                    }

                </tbody>

            </table>

        </div>

    );

}