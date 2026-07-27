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
                    <strong>Marca</strong>
                    <span>{vehiculo.marca}</span>
                </div>

                <div className="detalle-fila">
                    <strong>Modelo</strong>
                    <span>{vehiculo.modelo}</span>
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
                    <span>{vehiculo.propietarioActual}</span>
                </div>

                <div className="detalle-fila">
                    <strong>Teléfono</strong>
                    <span>{vehiculo.telefonoActual}</span>
                </div>

                <div className="detalle-fila">
                    <strong>Fecha</strong>
                    <span>
                        {vehiculo.createdAt
                            ? new Date(vehiculo.createdAt).toLocaleDateString()
                            : ""}
                    </span>
                </div>

                <div className="detalle-motivo">
                    <strong>Motivo de ingreso</strong>
                    <p>{vehiculo.motivoIngreso}</p>
                </div>
            </div>
        </Modal>
    );
}
