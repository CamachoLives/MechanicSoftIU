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
        motivoIngreso: "",

        cliente: {
            nombre: "",
            telefono: "",
            correo: ""
        }
    });

    const cambiarValor = (e) => {

        const { name, value } = e.target;

        if (["nombre", "telefono", "correo"].includes(name)) {

            setVehiculo({
                ...vehiculo,
                cliente: {
                    ...vehiculo.cliente,
                    [name]: value
                }
            });

        } else {

            setVehiculo({
                ...vehiculo,
                [name]: value
            });

        }

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
                motivoIngreso: "",

                cliente: {
                    nombre: "",
                    telefono: "",
                    correo: ""
                }

            });

        } catch (error) {

            console.error(error);

            alert("Ocurrió un error al registrar el vehículo.");

        }

    };

    return (

        <div className="registro-container">

            <h1>Registrar Ingreso de Vehículo</h1>

            <form onSubmit={registrar} className="registro-grid">

                {/* DATOS DEL VEHÍCULO */}

                <div className="card grande">

                    <h2>Datos del Vehículo</h2>

                    <div className="grid-form">

                        <div className="campo">
                            <label>Placa</label>
                            <input
                                type="text"
                                name="placa"
                                value={vehiculo.placa}
                                onChange={cambiarValor}
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
                                required
                            />
                        </div>

                    </div>

                </div>

                {/* CLIENTE */}

                <div className="card">

                    <h2>Datos del Cliente</h2>

                    <div className="campo">

                        <label>Nombre</label>

                        <input
                            type="text"
                            name="nombre"
                            value={vehiculo.cliente.nombre}
                            onChange={cambiarValor}
                            required
                        />

                    </div>

                    <div className="campo">

                        <label>Teléfono</label>

                        <input
                            type="text"
                            name="telefono"
                            value={vehiculo.cliente.telefono}
                            onChange={cambiarValor}
                            required
                        />

                    </div>

                    <div className="campo">

                        <label>Correo</label>

                        <input
                            type="email"
                            name="correo"
                            value={vehiculo.cliente.correo}
                            onChange={cambiarValor}
                            placeholder="Opcional"
                        />

                    </div>

                </div>

                {/* MOTIVO */}

                <div className="card grande">

                    <h2>Motivo del Ingreso</h2>

                    <textarea

                        rows="8"

                        name="motivoIngreso"

                        value={vehiculo.motivoIngreso}

                        onChange={cambiarValor}

                        required

                    />

                </div>

                {/* RESUMEN */}

                <div className="card">

                    <h2>Resumen</h2>

                    <div className="resumen">

                        <p>

                            <strong>Estado:</strong> Recepción

                        </p>

                        <p>

                            <strong>Fecha:</strong> {new Date().toLocaleDateString()}

                        </p>

                        <button
                            className="btn-registrar"
                            type="submit"
                        >

                            Registrar Vehículo

                        </button>

                    </div>

                </div>

            </form>

        </div>

    );

}