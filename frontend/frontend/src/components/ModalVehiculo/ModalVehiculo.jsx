import "./ModalVehiculo.css";

export default function ModalVehiculo({

    abierto,

    vehiculo,

    cerrar

}) {

    if (!abierto || !vehiculo) return null;

    return (

        <div className="modal-fondo">

            <div className="modal">

                <div className="modal-header">

                    <h2>

                        Información del Vehículo

                    </h2>

                    <button

                        className="cerrar"

                        onClick={cerrar}

                    >

                        ✕

                    </button>

                </div>

                <div className="contenido">

                    <div className="fila">

                        <strong>Placa</strong>

                        <span>{vehiculo.placa}</span>

                    </div>

                    <div className="fila">

                        <strong>Marca</strong>

                        <span>{vehiculo.marca}</span>

                    </div>

                    <div className="fila">

                        <strong>Modelo</strong>

                        <span>{vehiculo.modelo}</span>

                    </div>

                    <div className="fila">

                        <strong>Color</strong>

                        <span>{vehiculo.color}</span>

                    </div>

                    <div className="fila">

                        <strong>Cilindraje</strong>

                        <span>{vehiculo.cilindrajeCc} cc</span>

                    </div>

                    <div className="fila">

                        <strong>Kilometraje</strong>

                        <span>{vehiculo.kilometraje} km</span>

                    </div>

                    <div className="fila">

                        <strong>Propietario</strong>

                        <span>{vehiculo.propietarioActual}</span>

                    </div>

                    <div className="fila">

                        <strong>Teléfono</strong>

                        <span>{vehiculo.telefonoActual}</span>

                    </div>

                    <div className="fila">

                        <strong>Fecha</strong>

                        <span>

                            {

                                new Date(

                                    vehiculo.createdAt

                                ).toLocaleDateString()

                            }

                        </span>

                    </div>

                    <div className="motivo">

                        <strong>Motivo de ingreso</strong>

                        <p>

                            {vehiculo.motivoIngreso}

                        </p>

                    </div>

                </div>

            </div>

        </div>

    );

}