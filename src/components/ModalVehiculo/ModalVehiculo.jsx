import Modal from "../Modal/Modal";
import "./ModalVehiculo.css";

export default function ModalVehiculo({ abierto, vehiculo, cerrar }) {
    if (!vehiculo) return null;

    return (
        <Modal abierto={abierto} titulo="Información del vehículo" cerrar={cerrar}>
            <div className="detalle-vehiculo">
                <div className="detalle-fila">
                    <strong>Placa</strong>
                    <span>{vehiculo.placa}</span>
                </div>

                <div className="detalle-fila">
                    <strong>Marca / Modelo</strong>
                    <span>
                        {vehiculo.marca} {vehiculo.modelo}
                    </span>
                </div>

                <div className="detalle-fila">
                    <strong>Año</strong>
                    <span>{vehiculo.anio}</span>
                </div>

                <div className="detalle-fila">
                    <strong>Color</strong>
                    <span>{vehiculo.color}</span>
                </div>

                <div className="detalle-fila">
                    <strong>Cilindraje</strong>
                    <span>{vehiculo.cilindrajeCc} cc</span>
                </div>

                <div className="detalle-fila">
                    <strong>Kilometraje</strong>
                    <span>{vehiculo.kilometraje} km</span>
                </div>

                <div className="detalle-fila">
                    <strong>Propietario</strong>
                    <span>{vehiculo.cliente?.nombre ?? "—"}</span>
                </div>

                <div className="detalle-fila">
                    <strong>Teléfono</strong>
                    <span>{vehiculo.cliente?.telefono ?? "—"}</span>
                </div>

                <div className="detalle-fila">
                    <strong>Registrado</strong>
                    <span>
                        {vehiculo.createdAt ? new Date(vehiculo.createdAt).toLocaleDateString() : ""}
                    </span>
                </div>

                {vehiculo.observaciones && (
                    <div className="detalle-motivo">
                        <strong>Observaciones</strong>
                        <p>{vehiculo.observaciones}</p>
                    </div>
                )}
            </div>
        </Modal>
    );
}
