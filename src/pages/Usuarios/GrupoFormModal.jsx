import { useState } from "react";
import Modal from "../../components/Modal/Modal";
import Button from "../../components/Button/Button";
import Input from "../../components/Input/Input";
import Select from "../../components/Select/Select";
import { useToast } from "../../context/ToastContext";
import { crearGrupo, actualizarGrupo } from "../../services/grupoService";

function formularioVacio() {
    return { nombre: "", descripcion: "", miembroIds: [], rolBonusId: "" };
}

export default function GrupoFormModal({ grupo, usuarios, roles, cerrar, alGuardar }) {
    const toast = useToast();
    const abierto = grupo !== undefined;
    const editando = Boolean(grupo);

    const [form, setForm] = useState(formularioVacio());
    const [guardando, setGuardando] = useState(false);

    // Reinicia el formulario cuando cambia el grupo a editar/crear (patrón de
    // "ajustar estado durante el render", sin useEffect: react.dev/learn/you-might-not-need-an-effect)
    const [grupoPrevio, setGrupoPrevio] = useState(grupo);
    if (grupo !== grupoPrevio) {
        setGrupoPrevio(grupo);
        if (grupo !== undefined) {
            setForm(
                grupo
                    ? {
                          nombre: grupo.nombre,
                          descripcion: grupo.descripcion ?? "",
                          miembroIds: grupo.miembroIds ?? [],
                          rolBonusId: grupo.rolBonusId ?? "",
                      }
                    : formularioVacio()
            );
        }
    }

    const actualizarCampo = (campo) => (e) => {
        setForm((actual) => ({ ...actual, [campo]: e.target.value }));
    };

    const alternarMiembro = (usuarioId) => {
        setForm((actual) => ({
            ...actual,
            miembroIds: actual.miembroIds.includes(usuarioId)
                ? actual.miembroIds.filter((id) => id !== usuarioId)
                : [...actual.miembroIds, usuarioId],
        }));
    };

    const alEnviar = async (e) => {
        e.preventDefault();

        setGuardando(true);
        try {
            const datos = { ...form, rolBonusId: form.rolBonusId || null };
            if (editando) {
                await actualizarGrupo(grupo.id, datos);
                toast.exito("Grupo actualizado.");
            } else {
                await crearGrupo(datos);
                toast.exito("Grupo creado.");
            }
            alGuardar();
        } catch (error) {
            toast.error(error.message ?? "No se pudo guardar el grupo.");
        } finally {
            setGuardando(false);
        }
    };

    return (
        <Modal
            abierto={abierto}
            titulo={editando ? `Editar grupo — ${grupo.nombre}` : "Nuevo grupo"}
            cerrar={cerrar}
            pie={
                <>
                    <Button variante="secundario" onClick={cerrar} disabled={guardando}>
                        Cancelar
                    </Button>
                    <Button type="submit" form="form-grupo" disabled={guardando}>
                        {guardando ? "Guardando..." : "Guardar"}
                    </Button>
                </>
            }
        >
            <form id="form-grupo" onSubmit={alEnviar} className="formulario-vertical">
                <Input
                    label="Nombre del grupo"
                    required
                    value={form.nombre}
                    onChange={actualizarCampo("nombre")}
                />
                <Input
                    label="Descripción"
                    multilinea
                    filas={2}
                    value={form.descripcion}
                    onChange={actualizarCampo("descripcion")}
                />

                <Select
                    label="Rol bono (opcional)"
                    placeholder="Ninguno"
                    value={form.rolBonusId}
                    onChange={actualizarCampo("rolBonusId")}
                    opciones={roles.map((r) => ({ value: r.id, label: r.nombre }))}
                />
                <p className="formulario-nota">
                    Si eliges un rol bono, todos los miembros de este grupo obtienen además los
                    permisos de ese rol, sin perder su rol individual.
                </p>

                <div className="campo-input">
                    <span className="campo-input-label">Miembros</span>
                    <div className="selector-chips">
                        {usuarios.length === 0 && (
                            <span className="selector-chips-vacio">No hay usuarios creados.</span>
                        )}
                        {usuarios.map((u) => (
                            <button
                                type="button"
                                key={u.id}
                                className={`chip-seleccionable ${
                                    form.miembroIds.includes(u.id) ? "seleccionado" : ""
                                }`}
                                onClick={() => alternarMiembro(u.id)}
                            >
                                {u.nombre}
                            </button>
                        ))}
                    </div>
                </div>
            </form>
        </Modal>
    );
}
