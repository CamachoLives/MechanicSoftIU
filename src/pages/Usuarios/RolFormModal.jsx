import { useState } from "react";
import Modal from "../../components/Modal/Modal";
import Button from "../../components/Button/Button";
import Input from "../../components/Input/Input";
import { useToast } from "../../context/ToastContext";
import { crearRol, actualizarRol } from "../../services/rolService";
import { permisosPorModulo } from "../../data/permisos";

function formularioVacio() {
    return { nombre: "", descripcion: "", permisos: [] };
}

const GRUPOS_PERMISOS = permisosPorModulo();

export default function RolFormModal({ rol, cerrar, alGuardar }) {
    const toast = useToast();
    const abierto = rol !== undefined;
    const editando = Boolean(rol);

    const [form, setForm] = useState(formularioVacio());
    const [guardando, setGuardando] = useState(false);

    // Reinicia el formulario cuando cambia el rol a editar/crear (patrón de
    // "ajustar estado durante el render", sin useEffect: react.dev/learn/you-might-not-need-an-effect)
    const [rolPrevio, setRolPrevio] = useState(rol);
    if (rol !== rolPrevio) {
        setRolPrevio(rol);
        if (rol !== undefined) {
            setForm(
                rol
                    ? {
                          nombre: rol.nombre,
                          descripcion: rol.descripcion ?? "",
                          permisos: rol.permisos ?? [],
                      }
                    : formularioVacio()
            );
        }
    }

    const actualizarCampo = (campo) => (e) => {
        setForm((actual) => ({ ...actual, [campo]: e.target.value }));
    };

    const alternarPermiso = (clave) => {
        setForm((actual) => ({
            ...actual,
            permisos: actual.permisos.includes(clave)
                ? actual.permisos.filter((p) => p !== clave)
                : [...actual.permisos, clave],
        }));
    };

    const alternarModuloCompleto = (permisosDelModulo, marcar) => {
        setForm((actual) => {
            const claves = permisosDelModulo.map((p) => p.clave);
            const permisos = marcar
                ? [...new Set([...actual.permisos, ...claves])]
                : actual.permisos.filter((p) => !claves.includes(p));
            return { ...actual, permisos };
        });
    };

    const alEnviar = async (e) => {
        e.preventDefault();

        if (form.permisos.length === 0) {
            toast.error("Selecciona al menos un permiso para el rol.");
            return;
        }

        setGuardando(true);
        try {
            if (editando) {
                await actualizarRol(rol.id, form);
                toast.exito("Rol actualizado.");
            } else {
                await crearRol(form);
                toast.exito("Rol creado.");
            }
            alGuardar();
        } catch (error) {
            toast.error(error.message ?? "No se pudo guardar el rol.");
        } finally {
            setGuardando(false);
        }
    };

    return (
        <Modal
            abierto={abierto}
            ancho="lg"
            titulo={editando ? `Editar rol — ${rol.nombre}` : "Nuevo rol"}
            cerrar={cerrar}
            pie={
                <>
                    <Button variante="secundario" onClick={cerrar} disabled={guardando}>
                        Cancelar
                    </Button>
                    <Button type="submit" form="form-rol" disabled={guardando}>
                        {guardando ? "Guardando..." : "Guardar"}
                    </Button>
                </>
            }
        >
            <form id="form-rol" onSubmit={alEnviar} className="formulario-vertical">
                <Input
                    label="Nombre del rol"
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

                <div className="campo-input">
                    <span className="campo-input-label">Permisos</span>
                    <div className="matriz-permisos">
                        {GRUPOS_PERMISOS.map(({ modulo, permisos }) => {
                            const todosMarcados = permisos.every((p) =>
                                form.permisos.includes(p.clave)
                            );
                            return (
                                <div className="matriz-permisos-grupo" key={modulo}>
                                    <h4>
                                        <label className="matriz-permisos-item matriz-permisos-todo">
                                            <input
                                                type="checkbox"
                                                checked={todosMarcados}
                                                onChange={() =>
                                                    alternarModuloCompleto(permisos, !todosMarcados)
                                                }
                                            />
                                            {modulo}
                                        </label>
                                    </h4>
                                    <div className="matriz-permisos-lista">
                                        {permisos.map((permiso) => (
                                            <label
                                                className="matriz-permisos-item"
                                                key={permiso.clave}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={form.permisos.includes(permiso.clave)}
                                                    onChange={() => alternarPermiso(permiso.clave)}
                                                />
                                                {permiso.etiqueta}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </form>
        </Modal>
    );
}
