import { useEffect, useState } from "react";
import "./ListaVehiculos.css";

import ModalVehiculo from "../../components/ModalVehiculo/ModalVehiculo";

import {
    obtenerVehiculos,
    eliminarVehiculo
} from "../../services/vehiculoService";

export default function ListaVehiculos() {

    const [vehiculos, setVehiculos] = useState([]);
    const [busqueda, setBusqueda] = useState("");
    const [fecha, setFecha] = useState("");

    // Modal
    const [modalAbierto, setModalAbierto] = useState(false);
    const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState(null);

    useEffect(() => {
        cargarVehiculos();
    }, []);

    const cargarVehiculos = async () => {
        try {
            const respuesta = await obtenerVehiculos();
            setVehiculos(respuesta?.data || []);
        } catch (error) {
            console.error(error);
            alert("Error cargando los vehículos.");
        }
    };

    const eliminar = async (id) => {
        const confirmar = window.confirm(
            "¿Desea eliminar este vehículo?"
        );

        if (!confirmar) return;

        try {
            await eliminarVehiculo(id);
            cargarVehiculos();
        } catch (error) {
            console.error(error);
            alert("No fue posible eliminar.");
        }
    };

    const abrirModal = (vehiculo) => {
        setVehiculoSeleccionado(vehiculo);
        setModalAbierto(true);
    };

    const cerrarModal = () => {
        setModalAbierto(false);
        setVehiculoSeleccionado(null);
    };

    const resumirMotivo = (texto) => {
        if (!texto) return "";
        const palabras = texto.split(" ");
        return palabras.length <= 3
            ? texto
            : palabras.slice(0, 3).join(" ") + "...";
    };

    const vehiculosFiltrados = vehiculos
        .filter((vehiculo) => {
            const coincidePlaca = vehiculo?.placa
                ?.toLowerCase()
                .includes(busqueda.toLowerCase());

            let coincideFecha = true;

            if (fecha) {
                const fechaVehiculo = vehiculo?.createdAt
                    ? new Date(vehiculo.createdAt)
                        .toISOString()
                        .split("T")[0]
                    : null;

                coincideFecha = fechaVehiculo === fecha;
            }

            return coincidePlaca && coincideFecha;
        })
        .sort((a, b) =>
            new Date(b.createdAt) - new Date(a.createdAt)
        );

    return (
        <div className="lista">

            <h1>Vehículos Registrados</h1>

            <div className="filtros">

                <input
                    className="buscar"
                    type="text"
                    placeholder="Buscar por placa..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                />

                <input
                    className="buscar"
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                />

                <button
                    className="btn-ver"
                    onClick={() => setFecha("")}
                >
                    Limpiar Fecha
                </button>

            </div>

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
                        <th>Fecha</th>
                        <th>Motivo</th>
                        <th>Acciones</th>
                    </tr>
                </thead>

                <tbody>
                    {vehiculosFiltrados.length === 0 ? (
                        <tr>
                            <td colSpan="10">
                                No existen vehículos registrados.
                            </td>
                        </tr>
                    ) : (
                        vehiculosFiltrados.map((vehiculo) => (
                            <tr key={vehiculo.id}>
                                <td>{vehiculo.placa}</td>
                                <td>{vehiculo.marca}</td>
                                <td>{vehiculo.modelo}</td>
                                <td>{vehiculo.color}</td>
                                <td>{vehiculo.kilometraje}</td>
                                <td>{vehiculo.propietarioActual}</td>
                                <td>{vehiculo.telefonoActual}</td>
                                <td>
                                    {vehiculo.createdAt
                                        ? new Date(vehiculo.createdAt).toLocaleDateString()
                                        : ""
                                    }
                                </td>
                                <td>
                                    {resumirMotivo(vehiculo.motivoIngreso)}
                                </td>
                                <td>
                                    <button
                                        className="btn-ver"
                                        onClick={() => abrirModal(vehiculo)}
                                    >
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
                    )}
                </tbody>
            </table>

            <ModalVehiculo
                abierto={modalAbierto}
                vehiculo={vehiculoSeleccionado}
                cerrar={cerrarModal}
            />
        </div>
    );
}