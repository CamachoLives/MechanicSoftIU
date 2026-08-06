import { useState } from "react";
import Modal from "../../components/Modal/Modal";
import Button from "../../components/Button/Button";
import Input from "../../components/Input/Input";

export default function MovimientoStockModal({ movimiento, cargando, confirmar, cancelar }) {
    const abierto = Boolean(movimiento);
    const [cantidad, setCantidad] = useState("1");

    const [movimientoPrevio, setMovimientoPrevio] = useState(movimiento);
    if (movimiento !== movimientoPrevio) {
        setMovimientoPrevio(movimiento);
        if (movimiento) setCantidad("1");
    }

    const esEntrada = movimiento?.tipo === "entrada";

    const alEnviar = (e) => {
        e.preventDefault();
        const valor = Number(cantidad);
        if (valor > 0) confirmar(valor);
    };

    return (
        <Modal
            abierto={abierto}
            titulo={`${esEntrada ? "Registrar entrada" : "Registrar salida"} — ${movimiento?.repuesto?.nombre ?? ""}`}
            cerrar={cancelar}
            pie={
                <>
                    <Button variante="secundario" onClick={cancelar} disabled={cargando}>
                        Cancelar
                    </Button>
                    <Button type="submit" form="form-movimiento-stock" disabled={cargando}>
                        {cargando ? "Guardando..." : "Confirmar"}
                    </Button>
                </>
            }
        >
            <form id="form-movimiento-stock" onSubmit={alEnviar} className="formulario-vertical">
                <p className="formulario-nota">
                    Stock actual: {movimiento?.repuesto?.cantidadDisponible ?? 0} unidades.
                </p>
                <Input
                    label="Cantidad"
                    type="number"
                    min="1"
                    required
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                />
            </form>
        </Modal>
    );
}
