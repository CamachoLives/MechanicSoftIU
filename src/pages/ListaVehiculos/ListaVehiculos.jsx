import { useEffect, useState } from "react";
import { TbSearch, TbCalendar, TbFilterOff, TbEye, TbEdit } from "react-icons/tb";
import "./ListaVehiculos.css";

import ModalVehiculo from "../../components/ModalVehiculo/ModalVehiculo";
import EditarVehiculoModal from "./EditarVehiculoModal";

import { useAuth } from "../../context/AuthContext";
import Input from "../../components/Input/Input";
import Button from "../../components/Button/Button";

import { obtenerVehiculos } from "../../services/vehiculoService";

export default function ListaVehiculos() {
    const { tienePermiso } = useAuth();

    const [vehiculos, setVehiculos] = useState([]);
    const [busqueda, setBusqueda] = useState("");
    const [fecha, setFecha] = useState("");
    const [cargando, setCargando] = useState(true);
    const [errorCarga, setErrorCarga] = useState("");
    const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState(null);
    const [vehiculoParaEditar, setVehiculoParaEditar] = useState(null);

    const puedeEditar = tienePermiso("vehiculos.editar");

    const cargarVehiculos = async () => {
        setCargando(true);
        try {
            setErrorCarga("");
            const respuesta = await obtenerVehiculos();
            setVehiculos(respuesta || []);
        } catch (error) {
            console.error(error);
            setErrorCarga("No se pudo conectar con el backend de vehículos (localhost:9769).");
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        (async () => {
            await cargarVehiculos();
        })();
    }, []);

    const vehiculosFiltrados = vehiculos
        .filter((vehiculo) => {
            const q = busqueda.toLowerCase();
            const nombreCompleto = `${vehiculo.cliente?.nombre ?? ""} ${vehiculo.cliente?.apellido ?? ""}`.toLowerCase();
            const coincide =
                vehiculo?.placa?.toLowerCase().includes(q) ||
                nombreCompleto.includes(q) ||
                vehiculo?.marca?.toLowerCase().includes(q) ||
                vehiculo?.modelo?.toLowerCase().includes(q);

            let coincideFecha = true;
            if (fecha) {
                const fechaVehiculo = vehiculo?.createdAt
                    ? new Date(vehiculo.createdAt).toISOString().split("T")[0]
                    : null;
                coincideFecha = fechaVehiculo === fecha;
            }

            return coincide && coincideFecha;
        })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return (
        <div className="lista">
            <h1>Vehículos registrados</h1>

            {errorCarga && <p className="lista-error">{errorCarga}</p>}

            <div className="filtros">
                <Input
                    icono={<TbSearch />}
                    type="text"
                    placeholder="Buscar por placa, propietario o modelo..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="filtros-campo"
                />

                <Input
                    icono={<TbCalendar />}
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="filtros-campo"
                />

                <Button variante="secundario" icono={<TbFilterOff />} onClick={() => setFecha("")}>
                    Limpiar fecha
                </Button>
            </div>

            <div className="tabla-datos-contenedor">
                <table className="tabla-datos">
                    <thead>
                        <tr>
                            <th scope="col">Placa</th>
                            <th scope="col">Marca / Modelo</th>
                            <th scope="col">Año</th>
                            <th scope="col">Color</th>
                            <th scope="col">Km</th>
                            <th scope="col">Propietario</th>
                            <th scope="col">Teléfono</th>
                            <th scope="col">Fecha ingreso</th>
                            <th scope="col">Acciones</th>
                        </tr>
                    </thead>

                    <tbody>
                        {cargando ? (
                            <tr>
                                <td colSpan="9" className="tabla-datos-vacio">
                                    Cargando vehículos...
                                </td>
                            </tr>
                        ) : vehiculosFiltrados.length === 0 ? (
                            <tr>
                                <td colSpan="9" className="tabla-datos-vacio">
                                    No existen vehículos registrados.
                                </td>
                            </tr>
                        ) : (
                            vehiculosFiltrados.map((vehiculo) => (
                                <tr key={vehiculo.id}>
                                    <td>{vehiculo.placa}</td>
                                    <td>
                                        {vehiculo.marca} {vehiculo.modelo}
                                    </td>
                                    <td>{vehiculo.anio}</td>
                                    <td>{vehiculo.color}</td>
                                    <td>{vehiculo.kilometraje?.toLocaleString()}</td>
                                    <td>
                                        {vehiculo.cliente
                                            ? `${vehiculo.cliente.nombre ?? ""} ${vehiculo.cliente.apellido ?? ""}`.trim() || "—"
                                            : "—"}
                                    </td>
                                    <td>{vehiculo.cliente?.telefono ?? "—"}</td>
                                    <td>
                                        {vehiculo.createdAt
                                            ? new Date(vehiculo.createdAt).toLocaleDateString("es-CO")
                                            : ""}
                                    </td>
                                    <td>
                                        <div className="tabla-acciones">
                                            <Button
                                                variante="secundario"
                                                icono={<TbEye />}
                                                onClick={() => setVehiculoSeleccionado(vehiculo)}
                                            >
                                                Ver
                                            </Button>

                                            {puedeEditar && (
                                                <Button
                                                    variante="secundario"
                                                    icono={<TbEdit />}
                                                    onClick={() => setVehiculoParaEditar(vehiculo)}
                                                >
                                                    Editar
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <ModalVehiculo
                abierto={Boolean(vehiculoSeleccionado)}
                vehiculo={vehiculoSeleccionado}
                cerrar={() => setVehiculoSeleccionado(null)}
            />

            <EditarVehiculoModal
                vehiculo={vehiculoParaEditar}
                cerrar={() => setVehiculoParaEditar(null)}
                alGuardar={async () => {
                    setVehiculoParaEditar(null);
                    await cargarVehiculos();
                }}
            />
        </div>
    );
}
