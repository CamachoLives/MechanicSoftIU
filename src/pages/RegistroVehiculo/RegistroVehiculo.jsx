import { useEffect, useState } from "react";
import { TbDeviceFloppy, TbUserPlus } from "react-icons/tb";
import "./RegistroVehiculo.css";
import { guardarVehiculo } from "../../services/vehiculoService";
import { obtenerClientes } from "../../services/clienteService";
import { useToast } from "../../context/ToastContext";
import Input from "../../components/Input/Input";
import Select from "../../components/Select/Select";
import Button from "../../components/Button/Button";
import ClienteFormModal from "../Clientes/ClienteFormModal";

const VACIO = {
    placa: "",
    marca: "",
    modelo: "",
    anio: "",
    color: "",
    kilometraje: "",
    cilindrajeCc: "",
    observaciones: "",
    clienteId: "",
};

export default function RegistroVehiculo() {
    const toast = useToast();

    const [vehiculo, setVehiculo] = useState(VACIO);
    const [clientes, setClientes] = useState([]);
    const [cargandoClientes, setCargandoClientes] = useState(true);
    const [creandoCliente, setCreandoCliente] = useState(false);
    const [guardando, setGuardando] = useState(false);

    const cargarClientes = async () => {
        setCargandoClientes(true);
        try {
            setClientes(await obtenerClientes());
        } catch {
            toast.error("No se pudo cargar la lista de clientes.");
        } finally {
            setCargandoClientes(false);
        }
    };

    useEffect(() => {
        (async () => {
            await cargarClientes();
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const cambiarValor = (e) => {
        const { name, value } = e.target;
        setVehiculo((actual) => ({ ...actual, [name]: value }));
    };

    const registrar = async (e) => {
        e.preventDefault();

        if (!vehiculo.clienteId) {
            toast.error("Selecciona el cliente propietario del vehículo.");
            return;
        }

        setGuardando(true);
        try {
            await guardarVehiculo({
                placa: vehiculo.placa,
                marca: vehiculo.marca,
                modelo: vehiculo.modelo,
                anio: Number(vehiculo.anio),
                color: vehiculo.color,
                kilometraje: Number(vehiculo.kilometraje),
                cilindrajeCc: Number(vehiculo.cilindrajeCc),
                observaciones: vehiculo.observaciones,
                cliente: { id: vehiculo.clienteId },
            });
            toast.exito("Vehículo registrado correctamente.");
            setVehiculo(VACIO);
        } catch (error) {
            toast.error(error.response?.data?.message ?? "Ocurrió un error al registrar el vehículo.");
        } finally {
            setGuardando(false);
        }
    };

    return (
        <div className="registro-container">
            <h1>Registrar ingreso de vehículo</h1>

            <form onSubmit={registrar} className="registro-grid">
                <div className="card grande">
                    <h2>Datos del vehículo</h2>
                    <div className="grid-form">
                        <Input
                            label="Placa"
                            name="placa"
                            value={vehiculo.placa}
                            onChange={cambiarValor}
                            required
                            pattern="[A-Za-z0-9-]{4,10}"
                            maxLength={10}
                            title="Solo letras, números y guiones, 4 a 10 caracteres"
                        />
                        <Input label="Marca" name="marca" value={vehiculo.marca} onChange={cambiarValor} required />
                        <Input label="Modelo" name="modelo" value={vehiculo.modelo} onChange={cambiarValor} required />
                        <Input
                            label="Año"
                            type="number"
                            name="anio"
                            value={vehiculo.anio}
                            onChange={cambiarValor}
                            required
                        />
                        <Input label="Color" name="color" value={vehiculo.color} onChange={cambiarValor} required />
                        <Input
                            label="Kilometraje"
                            type="number"
                            min="0"
                            name="kilometraje"
                            value={vehiculo.kilometraje}
                            onChange={cambiarValor}
                            required
                        />
                        <Input
                            label="Cilindraje (cc)"
                            type="number"
                            min="50"
                            name="cilindrajeCc"
                            value={vehiculo.cilindrajeCc}
                            onChange={cambiarValor}
                            required
                        />
                    </div>
                    <Input
                        label="Observaciones"
                        multilinea
                        filas={3}
                        name="observaciones"
                        value={vehiculo.observaciones}
                        onChange={cambiarValor}
                        placeholder="Opcional: rayones, detalles visibles, etc."
                        className="registro-observaciones"
                    />
                </div>

                <div className="card">
                    <h2>Propietario</h2>

                    {cargandoClientes ? (
                        <p className="tabla-datos-cargando">Cargando clientes...</p>
                    ) : (
                        <>
                            <Select
                                label="Cliente"
                                required
                                name="clienteId"
                                value={vehiculo.clienteId}
                                onChange={cambiarValor}
                                opciones={clientes.map((c) => ({
                                    value: c.id,
                                    label: `${c.nombre} — ${c.telefono}`,
                                }))}
                                className="registro-cliente"
                            />
                            <Button
                                type="button"
                                variante="secundario"
                                icono={<TbUserPlus />}
                                onClick={() => setCreandoCliente(true)}
                                anchoCompleto
                                className="registro-nuevo-cliente"
                            >
                                Crear cliente nuevo
                            </Button>
                        </>
                    )}

                    <div className="resumen">
                        <p>
                            <strong>Fecha:</strong> {new Date().toLocaleDateString()}
                        </p>
                        <Button type="submit" icono={<TbDeviceFloppy />} anchoCompleto disabled={guardando}>
                            {guardando ? "Registrando..." : "Registrar vehículo"}
                        </Button>
                    </div>
                </div>
            </form>

            {creandoCliente && (
                <ClienteFormModal
                    cliente={null}
                    cerrar={() => setCreandoCliente(false)}
                    alGuardar={async (clienteCreado) => {
                        setCreandoCliente(false);
                        await cargarClientes();
                        if (clienteCreado) {
                            setVehiculo((actual) => ({ ...actual, clienteId: clienteCreado.id }));
                        }
                    }}
                />
            )}
        </div>
    );
}
