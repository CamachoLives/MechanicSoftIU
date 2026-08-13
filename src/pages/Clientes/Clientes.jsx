import { useEffect, useState } from "react";
import { TbUserPlus, TbEdit, TbUserCheck, TbUserX, TbCar, TbSearch } from "react-icons/tb";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import {
    obtenerClientes,
    cambiarEstadoCliente,
    obtenerVehiculosDeCliente,
} from "../../services/clienteService";
import { mensajeError } from "../../utils/apiError";
import Button from "../../components/Button/Button";
import Input from "../../components/Input/Input";
import Badge from "../../components/Badge/Badge";
import Modal from "../../components/Modal/Modal";
import ClienteFormModal from "./ClienteFormModal";
import "./Clientes.css";

export default function Clientes() {
    const { tienePermiso } = useAuth();
    const toast = useToast();

    const [clientes, setClientes] = useState([]);
    const [busqueda, setBusqueda] = useState("");
    const [cargando, setCargando] = useState(true);
    const [procesando, setProcesando] = useState(false);

    // undefined = modal cerrado, null = creando, objeto = editando
    const [clienteEnEdicion, setClienteEnEdicion] = useState(undefined);
    const [clienteParaVehiculos, setClienteParaVehiculos] = useState(null);
    const [vehiculosDelCliente, setVehiculosDelCliente] = useState([]);
    const [cargandoVehiculos, setCargandoVehiculos] = useState(false);

    const puedeCrear = tienePermiso("clientes.crear");
    const puedeEditar = tienePermiso("clientes.editar");

    const cargar = async (texto) => {
        setCargando(true);
        try {
            setClientes(await obtenerClientes(texto));
        } catch (error) {
            toast.error(mensajeError(error, "No se pudo cargar los clientes."));
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        (async () => {
            await cargar();
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const alBuscar = async (e) => {
        e.preventDefault();
        await cargar(busqueda);
    };

    const alternarActivo = async (cliente) => {
        setProcesando(true);
        try {
            await cambiarEstadoCliente(cliente.id, !cliente.activo);
            toast.exito(`${cliente.nombre} quedó ${cliente.activo ? "inactivo" : "activo"}.`);
            await cargar(busqueda);
        } catch (error) {
            toast.error(error.message ?? "No se pudo cambiar el estado.");
        } finally {
            setProcesando(false);
        }
    };

    const verVehiculos = async (cliente) => {
        setClienteParaVehiculos(cliente);
        setCargandoVehiculos(true);
        try {
            setVehiculosDelCliente(await obtenerVehiculosDeCliente(cliente.id));
        } catch {
            setVehiculosDelCliente([]);
        } finally {
            setCargandoVehiculos(false);
        }
    };

    if (cargando) return <p className="tabla-datos-cargando">Cargando clientes...</p>;

    return (
        <div className="clientes-pagina">
            <h1>Clientes</h1>
            <p className="clientes-subtitulo">Registro de clientes y los vehículos asociados a cada uno.</p>

            <form className="clientes-filtros" onSubmit={alBuscar}>
                <Input
                    icono={<TbSearch />}
                    placeholder="Buscar por nombre, teléfono o id..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="clientes-buscar"
                />
                <Button type="submit" variante="secundario">
                    Buscar
                </Button>
                {puedeCrear && (
                    <Button icono={<TbUserPlus />} onClick={() => setClienteEnEdicion(null)}>
                        Nuevo cliente
                    </Button>
                )}
            </form>

            <div className="tabla-datos-contenedor">
                <table className="tabla-datos">
                    <thead>
                        <tr>
                            <th scope="col">Id</th>
                            <th scope="col">Nombre</th>
                            <th scope="col">Teléfono</th>
                            <th scope="col">Correo</th>
                            <th scope="col">Registrado</th>
                            <th scope="col">Estado</th>
                            <th scope="col">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {clientes.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="tabla-datos-vacio">
                                    No hay clientes registrados.
                                </td>
                            </tr>
                        ) : (
                            clientes.map((cliente) => (
                                <tr key={cliente.id}>
                                    <td>#{cliente.id}</td>
                                    <td>
                                        <strong>{cliente.nombre}</strong>
                                    </td>
                                    <td>{cliente.telefono}</td>
                                    <td>{cliente.correo || "—"}</td>
                                    <td>
                                        {cliente.createdAt
                                            ? new Date(cliente.createdAt).toLocaleDateString()
                                            : ""}
                                    </td>
                                    <td>
                                        <Badge tono={cliente.activo ? "success" : "neutral"}>
                                            {cliente.activo ? "Activo" : "Inactivo"}
                                        </Badge>
                                    </td>
                                    <td>
                                        <div className="tabla-acciones">
                                            <Button
                                                variante="secundario"
                                                icono={<TbCar />}
                                                onClick={() => verVehiculos(cliente)}
                                            >
                                                Vehículos
                                            </Button>
                                            {puedeEditar && (
                                                <Button
                                                    variante="secundario"
                                                    icono={<TbEdit />}
                                                    onClick={() => setClienteEnEdicion(cliente)}
                                                >
                                                    Editar
                                                </Button>
                                            )}
                                            {puedeEditar && (
                                                <Button
                                                    variante={cliente.activo ? "peligro" : "secundario"}
                                                    icono={cliente.activo ? <TbUserX /> : <TbUserCheck />}
                                                    onClick={() => alternarActivo(cliente)}
                                                    disabled={procesando}
                                                >
                                                    {cliente.activo ? "Desactivar" : "Activar"}
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

            <ClienteFormModal
                cliente={clienteEnEdicion}
                cerrar={() => setClienteEnEdicion(undefined)}
                alGuardar={async () => {
                    setClienteEnEdicion(undefined);
                    await cargar(busqueda);
                }}
            />

            <Modal
                abierto={Boolean(clienteParaVehiculos)}
                titulo={`Vehículos de ${clienteParaVehiculos?.nombre ?? ""}`}
                cerrar={() => setClienteParaVehiculos(null)}
            >
                {cargandoVehiculos ? (
                    <p className="tabla-datos-cargando">Cargando...</p>
                ) : vehiculosDelCliente.length === 0 ? (
                    <p className="clientes-sin-vehiculos">Este cliente todavía no tiene vehículos registrados.</p>
                ) : (
                    <ul className="clientes-lista-vehiculos">
                        {vehiculosDelCliente.map((v) => (
                            <li key={v.id}>
                                <span className="clientes-vehiculo-placa">{v.placa}</span>
                                <span>
                                    {v.marca} {v.modelo} · {v.anio}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </Modal>
        </div>
    );
}
