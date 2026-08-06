import { useState } from "react";
import Modal from "../../components/Modal/Modal";
import Button from "../../components/Button/Button";
import Input from "../../components/Input/Input";
import { useToast } from "../../context/ToastContext";
import { crearRepuesto, actualizarRepuesto } from "../../services/repuestoService";

function formularioVacio() {
    return { nombre: "", codigo: "", descripcion: "", precio: "", cantidadDisponible: "" };
}

export default function RepuestoFormModal({ repuesto, cerrar, alGuardar }) {
    const toast = useToast();
    const abierto = repuesto !== undefined;
    const editando = Boolean(repuesto);

    const [form, setForm] = useState(formularioVacio());
    const [guardando, setGuardando] = useState(false);

    const [repuestoPrevio, setRepuestoPrevio] = useState(repuesto);
    if (repuesto !== repuestoPrevio) {
        setRepuestoPrevio(repuesto);
        if (repuesto !== undefined) {
            setForm(
                repuesto
                    ? {
                          nombre: repuesto.nombre,
                          codigo: repuesto.codigo,
                          descripcion: repuesto.descripcion ?? "",
                          precio: repuesto.precio,
                          cantidadDisponible: repuesto.cantidadDisponible,
                      }
                    : formularioVacio()
            );
        }
    }

    const actualizarCampo = (campo) => (e) => {
        setForm((actual) => ({ ...actual, [campo]: e.target.value }));
    };

    const alEnviar = async (e) => {
        e.preventDefault();
        setGuardando(true);
        try {
            const datos = {
                ...form,
                precio: Number(form.precio),
                cantidadDisponible: Number(form.cantidadDisponible),
            };
            if (editando) {
                await actualizarRepuesto(repuesto.id, datos);
                toast.exito("Repuesto actualizado.");
            } else {
                await crearRepuesto(datos);
                toast.exito("Repuesto creado.");
            }
            alGuardar();
        } catch (error) {
            toast.error(error.message ?? "No se pudo guardar el repuesto.");
        } finally {
            setGuardando(false);
        }
    };

    return (
        <Modal
            abierto={abierto}
            titulo={editando ? `Editar repuesto — ${repuesto.nombre}` : "Nuevo repuesto"}
            cerrar={cerrar}
            pie={
                <>
                    <Button variante="secundario" onClick={cerrar} disabled={guardando}>
                        Cancelar
                    </Button>
                    <Button type="submit" form="form-repuesto" disabled={guardando}>
                        {guardando ? "Guardando..." : "Guardar"}
                    </Button>
                </>
            }
        >
            <form id="form-repuesto" onSubmit={alEnviar} className="formulario-vertical">
                <Input label="Nombre" required value={form.nombre} onChange={actualizarCampo("nombre")} />
                <Input label="Código" required value={form.codigo} onChange={actualizarCampo("codigo")} />
                <Input
                    label="Descripción"
                    multilinea
                    filas={2}
                    value={form.descripcion}
                    onChange={actualizarCampo("descripcion")}
                    placeholder="Opcional"
                />
                <Input
                    label="Precio"
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={form.precio}
                    onChange={actualizarCampo("precio")}
                />
                <Input
                    label={editando ? "Cantidad disponible" : "Cantidad inicial"}
                    type="number"
                    min="0"
                    required
                    value={form.cantidadDisponible}
                    onChange={actualizarCampo("cantidadDisponible")}
                />
            </form>
        </Modal>
    );
}
