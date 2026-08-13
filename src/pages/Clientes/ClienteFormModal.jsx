import { useState } from "react";
import Modal from "../../components/Modal/Modal";
import Button from "../../components/Button/Button";
import Input from "../../components/Input/Input";
import { useToast } from "../../context/ToastContext";
import { crearCliente, actualizarCliente } from "../../services/clienteService";

function formularioVacio() {
    return { nombre: "", telefono: "", correo: "" };
}

export default function ClienteFormModal({ cliente, cerrar, alGuardar }) {
    const toast = useToast();
    const abierto = cliente !== undefined;
    const editando = Boolean(cliente);

    const [form, setForm] = useState(formularioVacio());
    const [guardando, setGuardando] = useState(false);

    const [clientePrevio, setClientePrevio] = useState(cliente);
    if (cliente !== clientePrevio) {
        setClientePrevio(cliente);
        if (cliente !== undefined) {
            setForm(
                cliente
                    ? { nombre: cliente.nombre, telefono: cliente.telefono, correo: cliente.correo ?? "" }
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
            let resultado;
            if (editando) {
                resultado = await actualizarCliente(cliente.id, form);
                toast.exito("Cliente actualizado.");
            } else {
                resultado = await crearCliente(form);
                toast.exito("Cliente creado.");
            }
            alGuardar(resultado);
        } catch (error) {
            toast.error(error.message ?? "No se pudo guardar el cliente.");
        } finally {
            setGuardando(false);
        }
    };

    return (
        <Modal
            abierto={abierto}
            titulo={editando ? `Editar cliente — ${cliente.nombre}` : "Nuevo cliente"}
            cerrar={cerrar}
            pie={
                <>
                    <Button variante="secundario" onClick={cerrar} disabled={guardando}>
                        Cancelar
                    </Button>
                    <Button type="submit" form="form-cliente" disabled={guardando}>
                        {guardando ? "Guardando..." : "Guardar"}
                    </Button>
                </>
            }
        >
            <form id="form-cliente" onSubmit={alEnviar} className="formulario-vertical">
                <Input
                    label="Nombre completo"
                    required
                    maxLength={150}
                    value={form.nombre}
                    onChange={actualizarCampo("nombre")}
                />
                <Input
                    label="Teléfono"
                    required
                    pattern="[0-9+()\s-]{7,20}"
                    maxLength={20}
                    title="Solo dígitos y separadores comunes (+, -, paréntesis), 7 a 20 caracteres"
                    value={form.telefono}
                    onChange={actualizarCampo("telefono")}
                />
                <Input
                    label="Correo"
                    type="email"
                    maxLength={150}
                    value={form.correo}
                    onChange={actualizarCampo("correo")}
                    placeholder="Opcional"
                />
            </form>
        </Modal>
    );
}
