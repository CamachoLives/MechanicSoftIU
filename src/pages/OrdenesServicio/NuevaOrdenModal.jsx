import { useEffect, useState } from "react";
import Modal from "../../components/Modal/Modal";
import Button from "../../components/Button/Button";
import Input from "../../components/Input/Input";
import Select from "../../components/Select/Select";
import { useToast } from "../../context/ToastContext";
import { obtenerVehiculos } from "../../services/vehiculoService";
import { crearOrden } from "../../services/ordenServicioService";

export default function NuevaOrdenModal({ cerrar, alCrear }) {
    const toast = useToast();

    const [vehiculos, setVehiculos] = useState([]);
    const [cargandoVehiculos, setCargandoVehiculos] = useState(true);
    const [vehiculoId, setVehiculoId] = useState("");
    const [kilometrajeIngreso, setKilometrajeIngreso] = useState("");
    const [motivoIngreso, setMotivoIngreso] = useState("");
    const [guardando, setGuardando] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const respuesta = await obtenerVehiculos();
                setVehiculos((respuesta?.data ?? []).filter((v) => v.activo !== false));
            } catch {
                toast.error("No se pudo cargar la lista de vehículos.");
            } finally {
                setCargandoVehiculos(false);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const alSeleccionarVehiculo = (e) => {
        const id = e.target.value;
        setVehiculoId(id);
        const vehiculo = vehiculos.find((v) => String(v.id) === String(id));
        if (vehiculo) setKilometrajeIngreso(String(vehiculo.kilometraje ?? ""));
    };

    const alEnviar = async (e) => {
        e.preventDefault();
        if (!vehiculoId) {
            toast.error("Selecciona un vehículo.");
            return;
        }

        setGuardando(true);
        try {
            const orden = await crearOrden({
                vehiculo: { id: vehiculoId },
                kilometrajeIngreso: Number(kilometrajeIngreso),
                motivoIngreso,
            });
            toast.exito(`Se creó la orden #${orden.id}.`);
            alCrear(orden.id);
        } catch (error) {
            toast.error(error.message ?? "No se pudo crear la orden.");
        } finally {
            setGuardando(false);
        }
    };

    return (
        <Modal
            abierto
            titulo="Nueva orden de servicio"
            cerrar={cerrar}
            pie={
                <>
                    <Button variante="secundario" onClick={cerrar} disabled={guardando}>
                        Cancelar
                    </Button>
                    <Button type="submit" form="form-nueva-orden" disabled={guardando}>
                        {guardando ? "Creando..." : "Crear orden"}
                    </Button>
                </>
            }
        >
            <form id="form-nueva-orden" onSubmit={alEnviar} className="formulario-vertical">
                {cargandoVehiculos ? (
                    <p className="tabla-datos-cargando">Cargando vehículos...</p>
                ) : vehiculos.length === 0 ? (
                    <p className="aviso-vacio">
                        No hay vehículos activos registrados. Registra uno primero desde "Vehículos".
                    </p>
                ) : (
                    <Select
                        label="Vehículo"
                        required
                        value={vehiculoId}
                        onChange={alSeleccionarVehiculo}
                        opciones={vehiculos.map((v) => ({
                            value: v.id,
                            label: `${v.placa} — ${v.marca} ${v.modelo} (${v.cliente?.nombre ?? "sin cliente"})`,
                        }))}
                    />
                )}

                <Input
                    label="Kilometraje de ingreso"
                    type="number"
                    min="0"
                    required
                    value={kilometrajeIngreso}
                    onChange={(e) => setKilometrajeIngreso(e.target.value)}
                />

                <Input
                    label="Motivo de ingreso"
                    multilinea
                    required
                    placeholder="Ej. Cambio de aceite, ruido en el motor..."
                    value={motivoIngreso}
                    onChange={(e) => setMotivoIngreso(e.target.value)}
                />
            </form>
        </Modal>
    );
}
