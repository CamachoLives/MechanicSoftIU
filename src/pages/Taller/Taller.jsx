import { useCallback, useEffect, useState } from "react";
import { TbBuildingWarehouse, TbHourglass, TbTool, TbHistory, TbAlertTriangle } from "react-icons/tb";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import {
    obtenerEstadoBahias,
    obtenerActividadReciente,
    finalizarAsignacion,
    cancelarAsignacion,
} from "../../services/tallerService";
import { obtenerVehiculos } from "../../services/vehiculoService";
import ConfirmModal from "../../components/Modal/ConfirmModal";
import BahiaCard from "./BahiaCard";
import AsignarBahiaModal from "./AsignarBahiaModal";
import ActualizarBahiaModal from "./ActualizarBahiaModal";
import "./Taller.css";

function esHoy(fechaIso) {
    if (!fechaIso) return false;
    const fecha = new Date(fechaIso);
    const ahora = new Date();
    return (
        fecha.getDate() === ahora.getDate() &&
        fecha.getMonth() === ahora.getMonth() &&
        fecha.getFullYear() === ahora.getFullYear()
    );
}

export default function Taller() {
    const { usuarioActual, tienePermiso } = useAuth();
    const toast = useToast();

    const [bahias, setBahias] = useState([]);
    const [actividadTodas, setActividadTodas] = useState([]);
    const [vehiculos, setVehiculos] = useState([]);
    const [errorVehiculos, setErrorVehiculos] = useState("");
    const [cargando, setCargando] = useState(true);

    const [bahiaParaAsignar, setBahiaParaAsignar] = useState(null);
    const [asignacionParaActualizar, setAsignacionParaActualizar] = useState(null);
    const [asignacionParaFinalizar, setAsignacionParaFinalizar] = useState(null);
    const [asignacionParaCancelar, setAsignacionParaCancelar] = useState(null);
    const [procesando, setProcesando] = useState(false);

    const puedeAsignar = tienePermiso("taller.asignar");
    const puedeGestionar = tienePermiso("taller.gestionar");

    const cargarTaller = useCallback(async () => {
        const [estadoBahias, actividad] = await Promise.all([
            obtenerEstadoBahias(),
            obtenerActividadReciente(200),
        ]);
        setBahias(estadoBahias);
        setActividadTodas(actividad);
    }, []);

    const cargarVehiculos = useCallback(async () => {
        try {
            setErrorVehiculos("");
            const respuesta = await obtenerVehiculos();
            setVehiculos(respuesta?.data ?? []);
        } catch {
            setErrorVehiculos(
                "No se pudo conectar con el backend de vehículos (localhost:9769). El taller funciona, pero no podrás asignar vehículos nuevos hasta que el backend esté disponible."
            );
        }
    }, []);

    useEffect(() => {
        (async () => {
            setCargando(true);
            await Promise.all([cargarTaller(), cargarVehiculos()]);
            setCargando(false);
        })();
    }, [cargarTaller, cargarVehiculos]);

    const alConfirmarFinalizar = async () => {
        setProcesando(true);
        try {
            await finalizarAsignacion(asignacionParaFinalizar.id);
            toast.exito(`Bahía liberada. ${asignacionParaFinalizar.placaVehiculo} salió del taller.`);
            setAsignacionParaFinalizar(null);
            await cargarTaller();
        } catch (error) {
            toast.error(error.message ?? "No se pudo finalizar la asignación.");
        } finally {
            setProcesando(false);
        }
    };

    const alConfirmarCancelar = async () => {
        setProcesando(true);
        try {
            await cancelarAsignacion(asignacionParaCancelar.id);
            toast.info(`Se canceló la orden de ${asignacionParaCancelar.placaVehiculo}.`);
            setAsignacionParaCancelar(null);
            await cargarTaller();
        } catch (error) {
            toast.error(error.message ?? "No se pudo cancelar la asignación.");
        } finally {
            setProcesando(false);
        }
    };

    if (cargando) {
        return <div className="taller-cargando">Cargando el taller...</div>;
    }

    const ocupadas = bahias.filter((b) => b.asignacion).length;
    const enEspera = bahias.filter((b) => b.asignacion?.estado === "en_espera").length;
    const finalizadosHoy = actividadTodas.filter(
        (a) => a.estado === "finalizado" && esHoy(a.fechaFin)
    ).length;
    const actividadReciente = actividadTodas.slice(0, 6);

    return (
        <div className="taller">
            <div className="taller-encabezado">
                <div>
                    <h1>
                        <TbBuildingWarehouse /> Taller
                    </h1>
                    <p className="taller-subtitulo">Vista en vivo de las 4 bahías de trabajo.</p>
                </div>
            </div>

            {errorVehiculos && (
                <p className="taller-aviso">
                    <TbAlertTriangle /> {errorVehiculos}
                </p>
            )}

            <div className="taller-stats">
                <div className="stat-tile panel-cristal">
                    <span className="stat-tile-label">Bahías ocupadas</span>
                    <span className="stat-tile-valor">{ocupadas}/4</span>
                </div>
                <div className="stat-tile panel-cristal">
                    <span className="stat-tile-label">
                        <TbHourglass /> En espera
                    </span>
                    <span className="stat-tile-valor">{enEspera}</span>
                </div>
                <div className="stat-tile panel-cristal">
                    <span className="stat-tile-label">
                        <TbTool /> Finalizados hoy
                    </span>
                    <span className="stat-tile-valor">{finalizadosHoy}</span>
                </div>
            </div>

            <div className="taller-grid">
                {bahias.map((bahia) => (
                    <BahiaCard
                        key={bahia.id}
                        bahia={bahia}
                        puedeAsignar={puedeAsignar}
                        puedeGestionar={puedeGestionar}
                        onAsignar={() => setBahiaParaAsignar(bahia)}
                        onActualizar={() => setAsignacionParaActualizar(bahia.asignacion)}
                        onFinalizar={() => setAsignacionParaFinalizar(bahia.asignacion)}
                        onCancelar={() => setAsignacionParaCancelar(bahia.asignacion)}
                    />
                ))}
            </div>

            <div className="taller-actividad panel-cristal">
                <h3>
                    <TbHistory /> Actividad reciente
                </h3>
                {actividadReciente.length === 0 ? (
                    <p className="taller-actividad-vacio">Aún no hay órdenes finalizadas ni canceladas.</p>
                ) : (
                    <ul>
                        {actividadReciente.map((a) => (
                            <li key={a.id}>
                                <span className={`punto-actividad punto-${a.estado}`} />
                                <span className="taller-actividad-texto">
                                    <strong>{a.placaVehiculo}</strong> · {a.marcaModelo} —{" "}
                                    {a.estado === "finalizado" ? "finalizado" : "cancelado"}
                                </span>
                                <span className="taller-actividad-fecha">
                                    {a.fechaFin ? new Date(a.fechaFin).toLocaleString() : ""}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <AsignarBahiaModal
                bahia={bahiaParaAsignar}
                vehiculos={vehiculos}
                creadoPor={usuarioActual?.id}
                cerrar={() => setBahiaParaAsignar(null)}
                alGuardar={async () => {
                    setBahiaParaAsignar(null);
                    await cargarTaller();
                }}
            />

            <ActualizarBahiaModal
                asignacion={asignacionParaActualizar}
                cerrar={() => setAsignacionParaActualizar(null)}
                alGuardar={async () => {
                    setAsignacionParaActualizar(null);
                    await cargarTaller();
                }}
            />

            <ConfirmModal
                abierto={Boolean(asignacionParaFinalizar)}
                titulo="Finalizar orden de trabajo"
                mensaje={`¿Confirmas que "${asignacionParaFinalizar?.placaVehiculo}" quedó listo y debe salir del taller?`}
                textoConfirmar="Finalizar"
                cargando={procesando}
                confirmar={alConfirmarFinalizar}
                cancelar={() => setAsignacionParaFinalizar(null)}
            />

            <ConfirmModal
                abierto={Boolean(asignacionParaCancelar)}
                titulo="Cancelar orden de trabajo"
                mensaje={`¿Deseas cancelar la orden de "${asignacionParaCancelar?.placaVehiculo}"? La bahía quedará libre.`}
                textoConfirmar="Sí, cancelar"
                variantePeligro
                cargando={procesando}
                confirmar={alConfirmarCancelar}
                cancelar={() => setAsignacionParaCancelar(null)}
            />
        </div>
    );
}
