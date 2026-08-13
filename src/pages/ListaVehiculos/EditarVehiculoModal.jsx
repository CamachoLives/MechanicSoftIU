import { useEffect, useState } from "react";
import Modal from "../../components/Modal/Modal";
import Button from "../../components/Button/Button";
import Input from "../../components/Input/Input";
import Select from "../../components/Select/Select";
import { useToast } from "../../context/ToastContext";
import { actualizarVehiculo } from "../../services/vehiculoService";
import { obtenerClientes } from "../../services/clienteService";

function formularioDesde(vehiculo) {
    return {
        placa: vehiculo?.placa ?? "",
        marca: vehiculo?.marca ?? "",
        modelo: vehiculo?.modelo ?? "",
        anio: vehiculo?.anio ?? "",
        color: vehiculo?.color ?? "",
        kilometraje: vehiculo?.kilometraje ?? "",
        cilindrajeCc: vehiculo?.cilindrajeCc ?? "",
        observaciones: vehiculo?.observaciones ?? "",
        clienteId: vehiculo?.cliente?.id ?? "",
    };
}

export default function EditarVehiculoModal({ vehiculo, cerrar, alGuardar }) {
    const toast = useToast();
    const abierto = Boolean(vehiculo);

    const [form, setForm] = useState(formularioDesde(null));
    const [clientes, setClientes] = useState([]);
    const [guardando, setGuardando] = useState(false);

    // Reinicia el formulario cuando cambia el vehículo a editar (patrón de
    // "ajustar estado durante el render", sin useEffect: react.dev/learn/you-might-not-need-an-effect)
    const [vehiculoPrevio, setVehiculoPrevio] = useState(vehiculo);
    if (vehiculo !== vehiculoPrevio) {
        setVehiculoPrevio(vehiculo);
        if (vehiculo) setForm(formularioDesde(vehiculo));
    }

    useEffect(() => {
        if (!abierto) return;
        (async () => {
            try {
                setClientes(await obtenerClientes());
            } catch {
                toast.error("No se pudo cargar la lista de clientes.");
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [abierto]);

    const actualizarCampo = (campo) => (e) => {
        setForm((actual) => ({ ...actual, [campo]: e.target.value }));
    };

    const alEnviar = async (e) => {
        e.preventDefault();
        setGuardando(true);
        try {
            await actualizarVehiculo(vehiculo.id, {
                placa: form.placa,
                marca: form.marca,
                modelo: form.modelo,
                anio: Number(form.anio),
                color: form.color,
                kilometraje: Number(form.kilometraje),
                cilindrajeCc: Number(form.cilindrajeCc),
                observaciones: form.observaciones,
                cliente: { id: form.clienteId },
            });
            toast.exito(`Se actualizó ${form.placa}.`);
            alGuardar();
        } catch (error) {
            toast.error(error?.response?.data?.message ?? "No se pudo actualizar el vehículo.");
        } finally {
            setGuardando(false);
        }
    };

    return (
        <Modal
            abierto={abierto}
            ancho="lg"
            titulo={`Editar vehículo — ${vehiculo?.placa ?? ""}`}
            cerrar={cerrar}
            pie={
                <>
                    <Button variante="secundario" onClick={cerrar} disabled={guardando}>
                        Cancelar
                    </Button>
                    <Button type="submit" form="form-editar-vehiculo" disabled={guardando}>
                        {guardando ? "Guardando..." : "Guardar cambios"}
                    </Button>
                </>
            }
        >
            <form
                id="form-editar-vehiculo"
                onSubmit={alEnviar}
                className="formulario-vehiculo-editar"
            >
                <Input
                    label="Placa"
                    required
                    pattern="[A-Za-z0-9-]{4,10}"
                    maxLength={10}
                    title="Solo letras, números y guiones, 4 a 10 caracteres"
                    value={form.placa}
                    onChange={actualizarCampo("placa")}
                />
                <Input label="Marca" required value={form.marca} onChange={actualizarCampo("marca")} />
                <Input label="Modelo" required value={form.modelo} onChange={actualizarCampo("modelo")} />
                <Input
                    label="Año"
                    type="number"
                    required
                    value={form.anio}
                    onChange={actualizarCampo("anio")}
                />
                <Input label="Color" required value={form.color} onChange={actualizarCampo("color")} />
                <Input
                    label="Kilometraje"
                    type="number"
                    min="0"
                    required
                    value={form.kilometraje}
                    onChange={actualizarCampo("kilometraje")}
                />
                <Input
                    label="Cilindraje (cc)"
                    type="number"
                    min="50"
                    required
                    value={form.cilindrajeCc}
                    onChange={actualizarCampo("cilindrajeCc")}
                />
                <Select
                    label="Cliente"
                    required
                    value={form.clienteId}
                    onChange={actualizarCampo("clienteId")}
                    opciones={clientes.map((c) => ({ value: c.id, label: `${c.nombre} — ${c.telefono}` }))}
                />
                <Input
                    label="Observaciones"
                    multilinea
                    value={form.observaciones}
                    onChange={actualizarCampo("observaciones")}
                    className="formulario-vehiculo-completo"
                />
            </form>
        </Modal>
    );
}
