import { useEffect, useState } from "react";
import { TbSearch, TbCalendar, TbFilterOff, TbEye, TbEdit, TbTrash } from "react-icons/tb";
import "./ListaVehiculos.css";

import ModalVehiculo from "../../components/ModalVehiculo/ModalVehiculo";
import EditarVehiculoModal from "./EditarVehiculoModal";

import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import ConfirmModal from "../../components/Modal/ConfirmModal";
import Input from "../../components/Input/Input";
import Button from "../../components/Button/Button";

import { obtenerVehiculos, eliminarVehiculo } from "../../services/vehiculoService";

export default function ListaVehiculos() {
    const { tienePermiso } = useAuth();
    const toast = useToast();

    const [vehiculos, setVehiculos] = useState([]);
    const [busqueda, setBusqueda] = useState("");
    const [fecha, setFecha] = useState("");
    const [cargando, setCargando] = useState(true);
    const [errorCarga, setErrorCarga] = useState("");

    const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState(null);
    const [vehiculoParaEditar, setVehiculoParaEditar] = useState(null);
    const [vehiculoParaEliminar, setVehiculoParaEliminar] = useState(null);
    const [eliminando, setEliminando] = useState(false);

    const puedeEditar = tienePermiso("vehiculos.editar");
    const puedeEliminar = tienePermiso("vehiculos.eliminar");

    const cargarVehiculos = async () => {
        setCargando(true);
        try {
            setErrorCarga("");
            const respuesta = await obtenerVehiculos();
            setVehiculos(respuesta?.data || []);
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

    const confirmarEliminar = async () => {
        setEliminando(true);
        try {
            await eliminarVehiculo(vehiculoParaEliminar.id);
            toast.exito(`Se eliminó el vehículo ${vehiculoParaEliminar.placa}.`);
            setVehiculoParaEliminar(null);
            await cargarVehiculos();
        } catch (error) {
            console.error(error);
            toast.error("No fue posible eliminar el vehículo.");
        } finally {
            setEliminando(false);
        }
    };

    const resumirMotivo = (texto) => {
        if (!texto) return "";
        const palabras = texto.split(" ");
        return palabras.length <= 3 ? texto : palabras.slice(0, 3).join(" ") + "...";
    };

    const vehiculosFiltrados = vehiculos
        .filter((vehiculo) => {
            const coincidePlaca = vehiculo?.placa?.toLowerCase().includes(busqueda.toLowerCase());

            let coincideFecha = true;
            if (fecha) {
                const fechaVehiculo = vehiculo?.createdAt
                    ? new Date(vehiculo.createdAt).toISOString().split("T")[0]
                    : null;
                coincideFecha = fechaVehiculo === fecha;
            }

            return coincidePlaca && coincideFecha;
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
                    placeholder="Buscar por placa..."
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
                        {cargando ? (
                            <tr>
                                <td colSpan="10" className="tabla-datos-vacio">
                                    Cargando vehículos...
                                </td>
                            </tr>
                        ) : vehiculosFiltrados.length === 0 ? (
                            <tr>
                                <td colSpan="10" className="tabla-datos-vacio">
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
                                            : ""}
                                    </td>
                                    <td>{resumirMotivo(vehiculo.motivoIngreso)}</td>
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

                                            {puedeEliminar && (
                                                <Button
                                                    variante="peligro"
                                                    icono={<TbTrash />}
                                                    onClick={() => setVehiculoParaEliminar(vehiculo)}
                                                >
                                                    Eliminar
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

            <ConfirmModal
                abierto={Boolean(vehiculoParaEliminar)}
                titulo="Eliminar vehículo"
                mensaje={`¿Deseas eliminar el vehículo "${vehiculoParaEliminar?.placa}"? Esta acción no se puede deshacer.`}
                textoConfirmar="Eliminar"
                variantePeligro
                cargando={eliminando}
                confirmar={confirmarEliminar}
                cancelar={() => setVehiculoParaEliminar(null)}
            />
        </div>
    );
}
