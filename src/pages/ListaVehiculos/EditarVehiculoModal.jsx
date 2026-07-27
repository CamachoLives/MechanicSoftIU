import { useState } from "react";
import Modal from "../../components/Modal/Modal";
import Button from "../../components/Button/Button";
import Input from "../../components/Input/Input";
import { useToast } from "../../context/ToastContext";
import { actualizarVehiculo } from "../../services/vehiculoService";

function formularioDesde(vehiculo) {
    return {
        placa: vehiculo?.placa ?? "",
        marca: vehiculo?.marca ?? "",
        modelo: vehiculo?.modelo ?? "",
        color: vehiculo?.color ?? "",
        kilometraje: vehiculo?.kilometraje ?? "",
        cilindrajeCc: vehiculo?.cilindrajeCc ?? "",
        motivoIngreso: vehiculo?.motivoIngreso ?? "",
        propietarioActual: vehiculo?.propietarioActual ?? "",
        telefonoActual: vehiculo?.telefonoActual ?? "",
    };
}

export default function EditarVehiculoModal({ vehiculo, cerrar, alGuardar }) {
    const toast = useToast();
    const abierto = Boolean(vehiculo);

    const [form, setForm] = useState(formularioDesde(null));
    const [guardando, setGuardando] = useState(false);

    // Reinicia el formulario cuando cambia el vehículo a editar (patrón de
    // "ajustar estado durante el render", sin useEffect: react.dev/learn/you-might-not-need-an-effect)
    const [vehiculoPrevio, setVehiculoPrevio] = useState(vehiculo);
    if (vehiculo !== vehiculoPrevio) {
        setVehiculoPrevio(vehiculo);
        if (vehiculo) setForm(formularioDesde(vehiculo));
    }

    const actualizarCampo = (campo) => (e) => {
        setForm((actual) => ({ ...actual, [campo]: e.target.value }));
    };

    const alEnviar = async (e) => {
        e.preventDefault();
        setGuardando(true);
        try {
            await actualizarVehiculo(vehiculo.id, form);
            toast.exito(`Se actualizó ${form.placa}.`);
            alGuardar();
        } catch (error) {
            toast.error(
                error?.response?.status === 404
                    ? "El backend aún no tiene activo el endpoint de edición. Reinicia MechanicSoftRest."
                    : "No se pudo actualizar el vehículo."
            );
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
                <Input label="Placa" required value={form.placa} onChange={actualizarCampo("placa")} />
                <Input label="Marca" required value={form.marca} onChange={actualizarCampo("marca")} />
                <Input label="Modelo" required value={form.modelo} onChange={actualizarCampo("modelo")} />
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
                <Input
                    label="Propietario"
                    required
                    value={form.propietarioActual}
                    onChange={actualizarCampo("propietarioActual")}
                />
                <Input
                    label="Teléfono"
                    required
                    value={form.telefonoActual}
                    onChange={actualizarCampo("telefonoActual")}
                />
                <Input
                    label="Motivo de ingreso"
                    multilinea
                    required
                    value={form.motivoIngreso}
                    onChange={actualizarCampo("motivoIngreso")}
                    className="formulario-vehiculo-completo"
                />
            </form>
        </Modal>
    );
}
