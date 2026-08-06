import { useState } from "react";
import Modal from "../../components/Modal/Modal";
import Button from "../../components/Button/Button";
import Input from "../../components/Input/Input";
import Select from "../../components/Select/Select";
import { useToast } from "../../context/ToastContext";
import { crearUsuario, actualizarUsuario } from "../../services/usuarioService";

function formularioVacio() {
    return {
        nombre: "",
        correo: "",
        telefono: "",
        cargo: "",
        usuario: "",
        contrasena: "",
        rolId: "",
    };
}

export default function UsuarioFormModal({ usuario, roles, cerrar, alGuardar }) {
    const toast = useToast();
    const abierto = usuario !== undefined;
    const editando = Boolean(usuario);

    const [form, setForm] = useState(formularioVacio());
    const [guardando, setGuardando] = useState(false);

    // Reinicia el formulario cuando cambia el usuario a editar/crear (patrón de
    // "ajustar estado durante el render", sin useEffect: react.dev/learn/you-might-not-need-an-effect)
    const [usuarioPrevio, setUsuarioPrevio] = useState(usuario);
    if (usuario !== usuarioPrevio) {
        setUsuarioPrevio(usuario);
        if (usuario !== undefined) {
            setForm(
                usuario
                    ? {
                          nombre: usuario.nombre,
                          correo: usuario.correo ?? "",
                          telefono: usuario.telefono ?? "",
                          cargo: usuario.cargo ?? "",
                          usuario: usuario.usuario,
                          contrasena: "",
                          rolId: usuario.rolId ?? "",
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

        if (!editando && form.contrasena.length < 4) {
            toast.error("La contraseña debe tener al menos 4 caracteres.");
            return;
        }

        setGuardando(true);
        try {
            if (editando) {
                const cambios = { ...form };
                if (!cambios.contrasena) delete cambios.contrasena;
                await actualizarUsuario(usuario.id, cambios);
                toast.exito("Usuario actualizado.");
            } else {
                await crearUsuario(form);
                toast.exito("Usuario creado.");
            }
            alGuardar();
        } catch (error) {
            toast.error(error.message ?? "No se pudo guardar el usuario.");
        } finally {
            setGuardando(false);
        }
    };

    return (
        <Modal
            abierto={abierto}
            titulo={editando ? `Editar usuario — ${usuario.nombre}` : "Nuevo usuario"}
            cerrar={cerrar}
            pie={
                <>
                    <Button variante="secundario" onClick={cerrar} disabled={guardando}>
                        Cancelar
                    </Button>
                    <Button type="submit" form="form-usuario" disabled={guardando}>
                        {guardando ? "Guardando..." : "Guardar"}
                    </Button>
                </>
            }
        >
            <form id="form-usuario" onSubmit={alEnviar} className="formulario-vertical">
                <Input
                    label="Nombre completo"
                    required
                    value={form.nombre}
                    onChange={actualizarCampo("nombre")}
                />
                <Input
                    label="Correo"
                    type="email"
                    value={form.correo}
                    onChange={actualizarCampo("correo")}
                    placeholder="Opcional"
                />
                <Input
                    label="Teléfono"
                    value={form.telefono}
                    onChange={actualizarCampo("telefono")}
                    placeholder="Opcional"
                />
                <Input
                    label="Cargo"
                    value={form.cargo}
                    onChange={actualizarCampo("cargo")}
                    placeholder="Ej. Mecánico de motos, Recepción..."
                />
                <Input
                    label="Usuario (para iniciar sesión)"
                    required
                    value={form.usuario}
                    onChange={actualizarCampo("usuario")}
                />
                <Input
                    label={editando ? "Nueva contraseña" : "Contraseña"}
                    type="password"
                    required={!editando}
                    value={form.contrasena}
                    onChange={actualizarCampo("contrasena")}
                    placeholder={editando ? "Dejar en blanco para no cambiarla" : ""}
                />
                <Select
                    label="Rol"
                    required
                    value={form.rolId}
                    onChange={actualizarCampo("rolId")}
                    opciones={roles.map((r) => ({ value: r.id, label: r.nombre }))}
                />
            </form>
        </Modal>
    );
}
