import { useEffect, useState } from "react";
import Modal from "../../components/Modal/Modal";
import Button from "../../components/Button/Button";
import Input from "../../components/Input/Input";
import Select from "../../components/Select/Select";
import { useToast } from "../../context/ToastContext";
import { actualizarAsignacion } from "../../services/tallerService";
import { obtenerUsuarios } from "../../services/usuarioService";
import { obtenerRoles } from "../../services/rolService";
import { obtenerGrupos } from "../../services/grupoService";
import { tienePermiso } from "../../utils/rbac";

function aInputDatetimeLocal(iso) {
    if (!iso) return "";
    const fecha = new Date(iso);
    const desfaseMinutos = fecha.getTimezoneOffset();
    const local = new Date(fecha.getTime() - desfaseMinutos * 60000);
    return local.toISOString().slice(0, 16);
}

export default function ActualizarBahiaModal({ asignacion, cerrar, alGuardar }) {
    const toast = useToast();
    const abierto = Boolean(asignacion);

    const [form, setForm] = useState(null);
    const [mecanicos, setMecanicos] = useState([]);
    const [guardando, setGuardando] = useState(false);

    // Reinicia el formulario cuando cambia la asignación a editar (patrón de
    // "ajustar estado durante el render", sin useEffect: react.dev/learn/you-might-not-need-an-effect)
    const [asignacionPrevia, setAsignacionPrevia] = useState(asignacion);
    if (asignacion !== asignacionPrevia) {
        setAsignacionPrevia(asignacion);
        if (asignacion) {
            setForm({
                estado: asignacion.estado,
                progreso: asignacion.progreso,
                mecanicoId: asignacion.mecanicoId ?? "",
                prioridad: asignacion.prioridad,
                notas: asignacion.notas ?? "",
                fechaEstimada: aInputDatetimeLocal(asignacion.fechaEstimada),
            });
        }
    }

    useEffect(() => {
        if (!asignacion) return;

        (async () => {
            const [usuarios, roles, grupos] = await Promise.all([
                obtenerUsuarios(),
                obtenerRoles(),
                obtenerGrupos(),
            ]);
            setMecanicos(
                usuarios.filter(
                    (u) => u.activo && tienePermiso(u, "taller.gestionar", { roles, grupos })
                )
            );
        })();
    }, [asignacion]);

    if (!abierto || !form) return null;

    const actualizarCampo = (campo) => (e) => {
        setForm((actual) => ({ ...actual, [campo]: e.target.value }));
    };

    const alEnviar = async (e) => {
        e.preventDefault();

        const mecanico = mecanicos.find((m) => m.id === form.mecanicoId);

        setGuardando(true);
        try {
            await actualizarAsignacion(asignacion.id, {
                estado: form.estado,
                progreso: Number(form.progreso),
                mecanicoId: mecanico?.id ?? null,
                mecanicoNombre: mecanico?.nombre ?? null,
                prioridad: form.prioridad,
                notas: form.notas,
                fechaEstimada: form.fechaEstimada
                    ? new Date(form.fechaEstimada).toISOString()
                    : null,
            });
            toast.exito(`Se actualizó ${asignacion.placaVehiculo}.`);
            alGuardar();
        } catch (error) {
            toast.error(error.message ?? "No se pudo actualizar la bahía.");
        } finally {
            setGuardando(false);
        }
    };

    return (
        <Modal
            abierto={abierto}
            titulo={`Actualizar — ${asignacion.placaVehiculo}`}
            cerrar={cerrar}
            pie={
                <>
                    <Button variante="secundario" onClick={cerrar} disabled={guardando}>
                        Cancelar
                    </Button>
                    <Button type="submit" form="form-actualizar-bahia" disabled={guardando}>
                        {guardando ? "Guardando..." : "Guardar cambios"}
                    </Button>
                </>
            }
        >
            <form id="form-actualizar-bahia" onSubmit={alEnviar} className="formulario-vertical">
                <Select
                    label="Estado"
                    required
                    value={form.estado}
                    onChange={actualizarCampo("estado")}
                    opciones={[
                        { value: "en_espera", label: "En espera" },
                        { value: "en_progreso", label: "En progreso" },
                        { value: "en_pausa", label: "En pausa" },
                    ]}
                />

                <Input
                    label={`Progreso (${form.progreso}%)`}
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={form.progreso}
                    onChange={actualizarCampo("progreso")}
                />

                <Select
                    label="Mecánico asignado"
                    placeholder="Sin asignar"
                    value={form.mecanicoId}
                    onChange={actualizarCampo("mecanicoId")}
                    opciones={mecanicos.map((m) => ({ value: m.id, label: m.nombre }))}
                />

                <Select
                    label="Prioridad"
                    value={form.prioridad}
                    onChange={actualizarCampo("prioridad")}
                    opciones={[
                        { value: "baja", label: "Baja" },
                        { value: "normal", label: "Normal" },
                        { value: "alta", label: "Alta" },
                        { value: "urgente", label: "Urgente" },
                    ]}
                />

                <Input
                    label="Fecha estimada de entrega"
                    type="datetime-local"
                    value={form.fechaEstimada}
                    onChange={actualizarCampo("fechaEstimada")}
                />

                <Input
                    label="Notas"
                    multilinea
                    filas={3}
                    value={form.notas}
                    onChange={actualizarCampo("notas")}
                />
            </form>
        </Modal>
    );
}
