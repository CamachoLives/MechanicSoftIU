import { useState } from "react";
import "./RegistroVehiculo.css";
import { guardarVehiculo } from "../../services/vehiculoService";

export default function RegistroVehiculo() {

    const [vehiculo, setVehiculo] = useState({
        placa: "",
        marca: "",
        modelo: "",
        color: "",
        kilometraje: "",
        cilindrajeCc: "",
        propietarioActual: "",
        telefonoActual: "",
        motivoIngreso: ""
    });

    const cambiarValor = (e) => {
        setVehiculo({
            ...vehiculo,
            [e.target.name]: e.target.value
        });
    };

    const registrar = async (e) => {

        e.preventDefault();

        try {

            await guardarVehiculo(vehiculo);

            alert("✅ Vehículo registrado correctamente.");

            setVehiculo({
                placa: "",
                marca: "",
                modelo: "",
                color: "",
                kilometraje: "",
                cilindrajeCc: "",
                propietarioActual: "",
                telefonoActual: "",
                motivoIngreso: ""
            });

        } catch (error) {console.error("Error completo:", error);

            console.error("Respuesta:", error.response);

            console.error("Datos:", error.response?.data);

            alert("Ocurrió un error al registrar el vehículo.");

        }
    };

    return (

        <div className="registro-container">

            <h1>Registrar Ingreso de Vehículo</h1>

            <form onSubmit={registrar} className="registro-grid">

                <div className="card grande">

                    <h2>Datos de la Motocicleta</h2>

                    <div className="grid-form">

                        <div className="campo">
                            <label>Placa</label>
                            <input
                                type="text"
                                name="placa"
                                value={vehiculo.placa}
                                onChange={cambiarValor}
                                placeholder="ABC123"
                                required
                            />
                        </div>

                        <div className="campo">
                            <label>Marca</label>
                            <input
                                type="text"
                                name="marca"
                                value={vehiculo.marca}
                                onChange={cambiarValor}
                                placeholder="Yamaha"
                                required
                            />
                        </div>

                        <div className="campo">
                            <label>Modelo</label>
                            <input
                                type="text"
                                name="modelo"
                                value={vehiculo.modelo}
                                onChange={cambiarValor}
                                placeholder="FZ 16"
                                required
                            />
                        </div>

                        <div className="campo">
                            <label>Color</label>
                            <input
                                type="text"
                                name="color"
                                value={vehiculo.color}
                                onChange={cambiarValor}
                                placeholder="Negro"
                                required
                            />
                        </div>

                        <div className="campo">
                            <label>Kilometraje</label>
                            <input
                                type="number"
                                name="kilometraje"
                                value={vehiculo.kilometraje}
                                onChange={cambiarValor}
                                placeholder="15000"
                                required
                            />
                        </div>

                        <div className="campo">
                            <label>Cilindraje (cc)</label>
                            <input
                                type="number"
                                name="cilindrajeCc"
                                value={vehiculo.cilindrajeCc}
                                onChange={cambiarValor}
                                placeholder="150"
                                required
                            />
                        </div>

                    </div>

                </div>

                <div className="card">

                    <h2>Datos del Cliente</h2>

                    <div className="campo">

                        <label>Propietario</label>

                        <input
                            type="text"
                            name="propietarioActual"
                            value={vehiculo.propietarioActual}
                            onChange={cambiarValor}
                            placeholder="Thomas Prado"
                            required
                        />

                    </div>

                    <div className="campo">

                        <label>Teléfono</label>

                        <input
                            type="text"
                            name="telefonoActual"
                            value={vehiculo.telefonoActual}
                            onChange={cambiarValor}
                            placeholder="3001234567"
                            required
                        />

                    </div>

                </div>

                <div className="card grande">

                    <h2>Motivo del Ingreso</h2>

                    <textarea

                        rows="8"

                        name="motivoIngreso"

                        value={vehiculo.motivoIngreso}

                        onChange={cambiarValor}

                        placeholder="Describe el problema presentado por el vehículo..."

                        required

                    ></textarea>

                </div>

                <div className="card">

                    <h2>Resumen</h2>

                    <div className="resumen">

                        <p>

                            <strong>Estado:</strong>

                            Recepción

                        </p>

                        <p>

                            <strong>Fecha:</strong>

                            {new Date().toLocaleDateString()}

                        </p>

                        <button
                            type="submit"
                            className="btn-registrar"
                        >

                            Registrar Vehículo

                        </button>

                    </div>

                </div>

            </form>

        </div>

    );

}