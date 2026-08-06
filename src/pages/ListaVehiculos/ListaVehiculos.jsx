import { useEffect, useState } from "react";
import { TbSearch, TbCalendar, TbFilterOff, TbEye, TbEdit, TbUserCheck, TbUserX } from "react-icons/tb";
import "./ListaVehiculos.css";

import ModalVehiculo from "../../components/ModalVehiculo/ModalVehiculo";
import EditarVehiculoModal from "./EditarVehiculoModal";

import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import Input from "../../components/Input/Input";
import Button from "../../components/Button/Button";
import Badge from "../../components/Badge/Badge";

import { obtenerVehiculos, cambiarEstadoVehiculo } from "../../services/vehiculoService";

export default function ListaVehiculos() {
    const { tienePermiso } = useAuth();
    const toast = useToast();

    const [vehiculos, setVehiculos] = useState([]);
    const [busqueda, setBusqueda] = useState("");
    const [fecha, setFecha] = useState("");
    const [cargando, setCargando] = useState(true);
    const [errorCarga, setErrorCarga] = useState("");
    const [procesando, setProcesando] = useState(false);

    const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState(null);
    const [vehiculoParaEditar, setVehiculoParaEditar] = useState(null);

    const puedeEditar = tienePermiso("vehiculos.editar");

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

    const alternarActivo = async (vehiculo) => {
        setProcesando(true);
        try {
            await cambiarEstadoVehiculo(vehiculo.id, !vehiculo.activo);
            toast.exito(`${vehiculo.placa} quedó ${vehiculo.activo ? "inactivo" : "activo"}.`);
            await cargarVehiculos();
        } catch (error) {
            console.error(error);
            toast.error("No fue posible cambiar el estado del vehículo.");
        } finally {
            setProcesando(false);
        }
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
                            <th>Marca / Modelo</th>
                            <th>Año</th>
                            <th>Color</th>
                            <th>Km</th>
                            <th>Propietario</th>
                            <th>Teléfono</th>
                            <th>Fecha</th>
                            <th>Estado</th>
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
                                    <td>
                                        {vehiculo.marca} {vehiculo.modelo}
                                    </td>
                                    <td>{vehiculo.anio}</td>
                                    <td>{vehiculo.color}</td>
                                    <td>{vehiculo.kilometraje}</td>
                                    <td>{vehiculo.cliente?.nombre ?? "—"}</td>
                                    <td>{vehiculo.cliente?.telefono ?? "—"}</td>
                                    <td>
                                        {vehiculo.createdAt
                                            ? new Date(vehiculo.createdAt).toLocaleDateString()
                                            : ""}
                                    </td>
                                    <td>
                                        <Badge tono={vehiculo.activo === false ? "neutral" : "success"}>
                                            {vehiculo.activo === false ? "Inactivo" : "Activo"}
                                        </Badge>
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

                                            {puedeEditar && (
                                                <Button
                                                    variante={vehiculo.activo === false ? "secundario" : "peligro"}
                                                    icono={vehiculo.activo === false ? <TbUserCheck /> : <TbUserX />}
                                                    onClick={() => alternarActivo(vehiculo)}
                                                    disabled={procesando}
                                                >
                                                    {vehiculo.activo === false ? "Activar" : "Desactivar"}
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
