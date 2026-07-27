import { useEffect, useState } from "react";
import Modal from "../../components/Modal/Modal";
import Button from "../../components/Button/Button";
import Input from "../../components/Input/Input";
import Select from "../../components/Select/Select";
import { useToast } from "../../context/ToastContext";
import { obtenerVehiculosDisponibles, asignarVehiculo } from "../../services/tallerService";
import { obtenerUsuarios } from "../../services/usuarioService";
import { obtenerRoles } from "../../services/rolService";
import { obtenerGrupos } from "../../services/grupoService";
import { tienePermiso } from "../../utils/rbac";

const VACIO = {
    vehiculoId: "",
    servicio: "",
    mecanicoId: "",
    prioridad: "normal",
    fechaEstimada: "",
};

export default function AsignarBahiaModal({ bahia, vehiculos, creadoPor, cerrar, alGuardar }) {
    const toast = useToast();
    const abierto = Boolean(bahia);

    const [form, setForm] = useState(VACIO);
    const [disponibles, setDisponibles] = useState([]);
    const [mecanicos, setMecanicos] = useState([]);
    const [guardando, setGuardando] = useState(false);

    // Reinicia el formulario cuando cambia la bahía a asignar (patrón de
    // "ajustar estado durante el render", sin useEffect: react.dev/learn/you-might-not-need-an-effect)
    const [bahiaPrevia, setBahiaPrevia] = useState(bahia);
    if (bahia !== bahiaPrevia) {
        setBahiaPrevia(bahia);
        if (bahia) setForm(VACIO);
    }

    useEffect(() => {
        if (!abierto) return;

        (async () => {
            const listaDisponible = await obtenerVehiculosDisponibles(vehiculos);
            setDisponibles(listaDisponible);

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
    }, [abierto, bahia, vehiculos]);

    const actualizarCampo = (campo) => (e) => {
        setForm((actual) => ({ ...actual, [campo]: e.target.value }));
    };

    const alEnviar = async (e) => {
        e.preventDefault();

        const vehiculo = disponibles.find((v) => String(v.id) === String(form.vehiculoId));
        if (!vehiculo) {
            toast.error("Selecciona un vehículo válido.");
            return;
        }

        const mecanico = mecanicos.find((m) => m.id === form.mecanicoId);

        setGuardando(true);
        try {
            await asignarVehiculo(bahia.id, {
                vehiculoId: vehiculo.id,
                placaVehiculo: vehiculo.placa,
                marcaModelo: `${vehiculo.marca} ${vehiculo.modelo}`,
                propietario: vehiculo.propietarioActual,
                servicio: form.servicio,
                prioridad: form.prioridad,
                mecanicoId: mecanico?.id ?? null,
                mecanicoNombre: mecanico?.nombre ?? null,
                fechaEstimada: form.fechaEstimada
                    ? new Date(form.fechaEstimada).toISOString()
                    : null,
                creadoPor,
            });
            toast.exito(`${vehiculo.placa} fue asignado a ${bahia.nombre}.`);
            alGuardar();
        } catch (error) {
            toast.error(error.message ?? "No se pudo asignar el vehículo.");
        } finally {
            setGuardando(false);
        }
    };

    return (
        <Modal
            abierto={abierto}
            titulo={`Asignar vehículo — ${bahia?.nombre ?? ""}`}
            cerrar={cerrar}
            pie={
                <>
                    <Button variante="secundario" onClick={cerrar} disabled={guardando}>
                        Cancelar
                    </Button>
                    <Button type="submit" form="form-asignar-bahia" disabled={guardando || disponibles.length === 0}>
                        {guardando ? "Asignando..." : "Asignar"}
                    </Button>
                </>
            }
        >
            <form id="form-asignar-bahia" onSubmit={alEnviar} className="formulario-vertical">
                {disponibles.length === 0 ? (
                    <p className="formulario-bahia-vacio">
                        No hay vehículos registrados disponibles para asignar. Todos están en el
                        taller o aún no hay ninguno registrado.
                    </p>
                ) : (
                    <Select
                        label="Vehículo"
                        required
                        value={form.vehiculoId}
                        onChange={actualizarCampo("vehiculoId")}
                        opciones={disponibles.map((v) => ({
                            value: v.id,
                            label: `${v.placa} — ${v.marca} ${v.modelo}`,
                        }))}
                    />
                )}

                <Input
                    label="Servicio a realizar"
                    multilinea
                    required
                    placeholder="Ej. Cambio de aceite y revisión de frenos"
                    value={form.servicio}
                    onChange={actualizarCampo("servicio")}
                />

                <Select
                    label="Mecánico asignado"
                    placeholder="Sin asignar por ahora"
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
                    label="Fecha estimada de entrega (opcional)"
                    type="datetime-local"
                    value={form.fechaEstimada}
                    onChange={actualizarCampo("fechaEstimada")}
                />
            </form>
        </Modal>
    );
}
