import { useState } from "react";
import Modal from "../../components/Modal/Modal";
import Button from "../../components/Button/Button";
import Input from "../../components/Input/Input";
import Select from "../../components/Select/Select";
import { useToast } from "../../context/ToastContext";
import { registrarPagoDeOrden } from "../../services/ordenServicioService";

const METODOS_PAGO = [
    { value: "EFECTIVO", label: "Efectivo" },
    { value: "TRANSFERENCIA", label: "Transferencia" },
    { value: "TARJETA", label: "Tarjeta" },
    { value: "OTRO", label: "Otro" },
];

export default function RegistrarPagoModal({ ordenId, saldoPendiente, cerrar, alRegistrar }) {
    const toast = useToast();

    const [monto, setMonto] = useState(saldoPendiente > 0 ? String(saldoPendiente) : "");
    const [metodoPago, setMetodoPago] = useState("EFECTIVO");
    const [guardando, setGuardando] = useState(false);

    const alEnviar = async (e) => {
        e.preventDefault();
        setGuardando(true);
        try {
            await registrarPagoDeOrden(ordenId, { monto: Number(monto), metodoPago });
            toast.exito("Pago registrado.");
            alRegistrar();
        } catch (error) {
            toast.error(error.message ?? "No se pudo registrar el pago.");
        } finally {
            setGuardando(false);
        }
    };

    return (
        <Modal
            abierto
            titulo="Registrar pago"
            cerrar={cerrar}
            pie={
                <>
                    <Button variante="secundario" onClick={cerrar} disabled={guardando}>
                        Cancelar
                    </Button>
                    <Button type="submit" form="form-registrar-pago" disabled={guardando}>
                        {guardando ? "Guardando..." : "Registrar"}
                    </Button>
                </>
            }
        >
            <form id="form-registrar-pago" onSubmit={alEnviar} className="formulario-vertical">
                {typeof saldoPendiente === "number" && (
                    <p className="formulario-nota">Saldo pendiente actual: {saldoPendiente}</p>
                )}
                <Input
                    label="Monto"
                    type="number"
                    min="1"
                    required
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                />
                <Select
                    label="Método de pago"
                    required
                    value={metodoPago}
                    onChange={(e) => setMetodoPago(e.target.value)}
                    opciones={METODOS_PAGO}
                />
            </form>
        </Modal>
    );
}
