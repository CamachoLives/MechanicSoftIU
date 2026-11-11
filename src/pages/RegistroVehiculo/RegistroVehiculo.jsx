import { useState } from "react";
import {
    TbDeviceFloppy, TbUser, TbMotorbike, TbClipboardText,
    TbInfoCircle, TbCircleCheck,
} from "react-icons/tb";
import "./RegistroVehiculo.css";
import { guardarVehiculo, buscarVehiculoPorPlaca } from "../../services/vehiculoService";
import { crearCliente, actualizarCliente, buscarClientePorDocumento } from "../../services/clienteService";
import { crearOrden } from "../../services/ordenServicioService";
import { useToast } from "../../context/ToastContext";
import Input from "../../components/Input/Input";
import Select from "../../components/Select/Select";
import Button from "../../components/Button/Button";

const TIPOS_DOC = [
    { value: "CC",  label: "CC – Cédula de Ciudadanía" },
    { value: "CE",  label: "CE – Cédula de Extranjería" },
    { value: "TI",  label: "TI – Tarjeta de Identidad" },
    { value: "PP",  label: "PP – Pasaporte" },
    { value: "NIT", label: "NIT" },
    { value: "PEP", label: "PEP" },
];

const VACIO = {
    // Cliente
    tipoDocumento: "", numeroDocumento: "",
    nombre: "", apellido: "", telefono: "", correo: "",
    // Vehículo
    placa: "", marca: "", modelo: "", anio: "",
    color: "", kilometraje: "", cilindrajeCc: "", observaciones: "",
    // Orden
    kilometrajeIngreso: "", motivoIngreso: "",
};

export default function RegistroVehiculo({ alCrearOrden }) {
    const toast = useToast();

    const [form, setForm]       = useState(VACIO);
    const [guardando, setGuardando] = useState(false);

    // Autocompletado
    const [clienteExistente, setClienteExistente] = useState(null);
    const [vehiculoExistente, setVehiculoExistente] = useState(null);
    const [buscandoDoc, setBuscandoDoc] = useState(false);
    const [buscandoPlaca, setBuscandoPlaca] = useState(false);

    const cambiar = (e) => {
        const { name, value } = e.target;
        setForm((f) => ({ ...f, [name]: value }));
    };

    // Auto-buscar cliente por documento cuando el campo pierde el foco
    const buscarCliente = async () => {
        if (!form.tipoDocumento || !form.numeroDocumento.trim()) return;
        setBuscandoDoc(true);
        try {
            const cliente = await buscarClientePorDocumento(form.tipoDocumento, form.numeroDocumento.trim());
            if (cliente) {
                setClienteExistente(cliente);
                setForm((f) => ({
                    ...f,
                    nombre:    cliente.nombre   ?? f.nombre,
                    apellido:  cliente.apellido ?? f.apellido,
                    telefono:  cliente.telefono ?? f.telefono,
                    correo:    cliente.correo   ?? f.correo,
                }));
                toast.info?.(`Cliente encontrado: ${cliente.nombre} ${cliente.apellido ?? ""}`.trim());
            } else {
                setClienteExistente(null);
            }
        } catch {
            setClienteExistente(null);
        } finally {
            setBuscandoDoc(false);
        }
    };

    // Auto-buscar vehículo por placa cuando el campo pierde el foco
    const buscarVehiculo = async () => {
        const placa = form.placa.trim().toUpperCase();
        if (!placa) return;
        setBuscandoPlaca(true);
        try {
            const v = await buscarVehiculoPorPlaca(placa);
            if (v) {
                setVehiculoExistente(v);
                setForm((f) => ({
                    ...f,
                    placa:          v.placa,
                    marca:          v.marca          ?? f.marca,
                    modelo:         v.modelo         ?? f.modelo,
                    anio:           String(v.anio    ?? f.anio),
                    color:          v.color          ?? f.color,
                    kilometraje:    String(v.kilometraje ?? f.kilometraje),
                    cilindrajeCc:   String(v.cilindrajeCc ?? f.cilindrajeCc),
                    observaciones:  v.observaciones  ?? f.observaciones,
                    kilometrajeIngreso: String(v.kilometraje ?? f.kilometrajeIngreso),
                }));
                toast.info?.(`Moto encontrada: ${v.placa} – ${v.marca} ${v.modelo}`);
            } else {
                setVehiculoExistente(null);
            }
        } catch {
            setVehiculoExistente(null);
        } finally {
            setBuscandoPlaca(false);
        }
    };

    const registrar = async (e) => {
        e.preventDefault();
        setGuardando(true);

        try {
            // 1. Encontrar o crear cliente
            let clienteId;
            if (clienteExistente) {
                // Actualizar sus datos por si cambiaron
                const actualizado = await actualizarCliente(clienteExistente.id, {
                    nombre:          form.nombre,
                    apellido:        form.apellido,
                    telefono:        form.telefono,
                    correo:          form.correo,
                    tipoDocumento:   form.tipoDocumento,
                    numeroDocumento: form.numeroDocumento,
                });
                clienteId = actualizado.id;
            } else {
                const nuevo = await crearCliente({
                    nombre:          form.nombre,
                    apellido:        form.apellido,
                    telefono:        form.telefono,
                    correo:          form.correo || undefined,
                    tipoDocumento:   form.tipoDocumento || undefined,
                    numeroDocumento: form.numeroDocumento || undefined,
                });
                clienteId = nuevo.id;
            }

            // 2. Encontrar o crear vehículo
            let vehiculoId;
            if (vehiculoExistente) {
                vehiculoId = vehiculoExistente.id;
            } else {
                const nuevoV = await guardarVehiculo({
                    placa:         form.placa.trim().toUpperCase(),
                    marca:         form.marca,
                    modelo:        form.modelo,
                    anio:          Number(form.anio),
                    color:         form.color,
                    kilometraje:   Number(form.kilometraje),
                    cilindrajeCc:  Number(form.cilindrajeCc),
                    observaciones: form.observaciones || undefined,
                    cliente:       { id: clienteId },
                });
                vehiculoId = nuevoV.id;
            }

            // 3. Crear la orden de servicio (empieza como RECIBIDO automáticamente)
            const orden = await crearOrden({
                vehiculo:           { id: vehiculoId },
                kilometrajeIngreso: Number(form.kilometrajeIngreso),
                motivoIngreso:      form.motivoIngreso,
            });

            toast.exito(`✓ Ingreso registrado. Orden #${orden.id} abierta.`);
            setForm(VACIO);
            setClienteExistente(null);
            setVehiculoExistente(null);

            // Ir directo a la orden creada si el padre lo soporta
            if (typeof alCrearOrden === "function") {
                alCrearOrden(orden.id);
            }

        } catch (error) {
            toast.error(error.message ?? "Ocurrió un error al registrar el ingreso.");
        } finally {
            setGuardando(false);
        }
    };

    return (
        <div className="registro-container">
            <h1>Registrar ingreso al taller</h1>

            <form onSubmit={registrar} className="registro-ingreso-grid">

                {/* ── Sección 1: Propietario ── */}
                <div className="card">
                    <h2><TbUser /> Propietario</h2>

                    <div className="ri-doc-row">
                        <Select
                            label="Tipo de documento"
                            name="tipoDocumento"
                            value={form.tipoDocumento}
                            onChange={cambiar}
                            onBlur={buscarCliente}
                            opciones={TIPOS_DOC}
                            className="ri-tipo-doc"
                        />
                        <div className="ri-numero-doc-wrap">
                            <Input
                                label="Número de documento"
                                name="numeroDocumento"
                                value={form.numeroDocumento}
                                onChange={cambiar}
                                onBlur={buscarCliente}
                                placeholder="Ej. 1098765432"
                                maxLength={30}
                            />
                            {buscandoDoc && <span className="ri-buscando">Buscando…</span>}
                            {clienteExistente && !buscandoDoc && (
                                <span className="ri-hallado"><TbCircleCheck /> Cliente existente</span>
                            )}
                        </div>
                    </div>

                    <div className="grid-form">
                        <Input label="Nombre" name="nombre" value={form.nombre} onChange={cambiar} required maxLength={100} />
                        <Input label="Apellido" name="apellido" value={form.apellido} onChange={cambiar} maxLength={100} />
                        <Input
                            label="Teléfono"
                            name="telefono"
                            value={form.telefono}
                            onChange={cambiar}
                            required
                            pattern="[0-9+()\s\-]{7,20}"
                            maxLength={20}
                        />
                        <Input
                            label="Correo (opcional)"
                            type="email"
                            name="correo"
                            value={form.correo}
                            onChange={cambiar}
                            maxLength={150}
                        />
                    </div>
                </div>

                {/* ── Sección 2: Moto ── */}
                <div className="card">
                    <h2><TbMotorbike /> Moto</h2>

                    <div className="ri-placa-wrap">
                        <Input
                            label="Placa"
                            name="placa"
                            value={form.placa}
                            onChange={cambiar}
                            onBlur={buscarVehiculo}
                            required
                            pattern="[A-Za-z0-9\-]{4,10}"
                            maxLength={10}
                            title="4 a 10 caracteres: letras, números y guiones"
                            style={{ textTransform: "uppercase", letterSpacing: "2px" }}
                        />
                        {buscandoPlaca && <span className="ri-buscando">Buscando moto…</span>}
                        {vehiculoExistente && !buscandoPlaca && (
                            <span className="ri-hallado"><TbCircleCheck /> Moto existente — solo se creará la orden</span>
                        )}
                    </div>

                    <div className="grid-form">
                        <Input label="Marca" name="marca" value={form.marca} onChange={cambiar} required={!vehiculoExistente} maxLength={100} />
                        <Input label="Modelo" name="modelo" value={form.modelo} onChange={cambiar} required={!vehiculoExistente} maxLength={100} />
                        <Input label="Año" type="number" name="anio" min="1900" max="2100" value={form.anio} onChange={cambiar} required={!vehiculoExistente} />
                        <Input label="Color" name="color" value={form.color} onChange={cambiar} required={!vehiculoExistente} maxLength={50} />
                        <Input label="Kilometraje" type="number" min="0" name="kilometraje" value={form.kilometraje} onChange={cambiar} required={!vehiculoExistente} />
                        <Input label="Cilindraje (cc)" type="number" min="50" name="cilindrajeCc" value={form.cilindrajeCc} onChange={cambiar} required={!vehiculoExistente} />
                    </div>

                    <Input
                        label="Observaciones del vehículo (opcional)"
                        multilinea filas={2}
                        maxLength={500}
                        name="observaciones"
                        value={form.observaciones}
                        onChange={cambiar}
                        placeholder="Rayones, detalles visibles, accesorios…"
                    />
                </div>

                {/* ── Sección 3: Ingreso ── */}
                <div className="card card-ingreso">
                    <h2><TbClipboardText /> Motivo de ingreso</h2>

                    <Input
                        label="Kilometraje al ingresar"
                        type="number"
                        min="0"
                        name="kilometrajeIngreso"
                        value={form.kilometrajeIngreso}
                        onChange={cambiar}
                        required
                        placeholder="Ej. 15000"
                    />

                    <Input
                        label="¿Por qué trae la moto? *"
                        multilinea
                        filas={4}
                        name="motivoIngreso"
                        value={form.motivoIngreso}
                        onChange={cambiar}
                        required
                        maxLength={500}
                        placeholder="Ej. Revisión general, ruido en motor, cambio de aceite y filtro…"
                    />

                    <div className="ri-nota">
                        <TbInfoCircle />
                        <span>Al guardar se creará automáticamente la orden de servicio con estado <strong>Recibida</strong>. Puedes ver y actualizar el avance desde <strong>Órdenes</strong>.</span>
                    </div>

                    <div className="resumen">
                        <p><strong>Fecha:</strong> {new Date().toLocaleDateString("es-CO", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
                        <Button
                            type="submit"
                            icono={<TbDeviceFloppy />}
                            anchoCompleto
                            disabled={guardando}
                        >
                            {guardando ? "Registrando ingreso…" : "Registrar ingreso al taller"}
                        </Button>
                    </div>
                </div>

            </form>
        </div>
    );
}
