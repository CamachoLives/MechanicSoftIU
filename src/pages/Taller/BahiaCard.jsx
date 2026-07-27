import { useState } from "react";
import {
    TbHourglass,
    TbTool,
    TbPlayerPause,
    TbSquareRoundedCheck,
    TbBan,
    TbAlertOctagon,
    TbArrowUp,
    TbAlertTriangle,
    TbUserCircle,
    TbCirclePlus,
    TbEdit,
    TbFlagCheck,
} from "react-icons/tb";
import Badge from "../../components/Badge/Badge";
import Button from "../../components/Button/Button";
import "./BahiaCard.css";

const ESTADOS = {
    en_espera: { etiqueta: "En espera", tono: "neutral", Icono: TbHourglass },
    en_progreso: { etiqueta: "En progreso", tono: "info", Icono: TbTool },
    en_pausa: { etiqueta: "En pausa", tono: "warning", Icono: TbPlayerPause },
    finalizado: { etiqueta: "Finalizado", tono: "success", Icono: TbSquareRoundedCheck },
    cancelado: { etiqueta: "Cancelado", tono: "neutral", Icono: TbBan },
};

const PRIORIDADES = {
    urgente: { etiqueta: "Urgente", tono: "danger", Icono: TbAlertOctagon },
    alta: { etiqueta: "Prioridad alta", tono: "serious", Icono: TbArrowUp },
};

export default function BahiaCard({
    bahia,
    puedeAsignar,
    puedeGestionar,
    onAsignar,
    onActualizar,
    onFinalizar,
    onCancelar,
}) {
    const [expandido, setExpandido] = useState(false);
    const { asignacion } = bahia;

    if (!asignacion) {
        return (
            <div className="bahia-card bahia-libre panel-cristal">
                <div className="bahia-card-encabezado">
                    <h3>{bahia.nombre}</h3>
                    <Badge tono="neutral">Libre</Badge>
                </div>
                <div className="bahia-libre-cuerpo">
                    <span className="bahia-libre-icono">🏍️</span>
                    <p>Esta bahía está disponible.</p>
                    {puedeAsignar && (
                        <Button icono={<TbCirclePlus />} onClick={onAsignar}>
                            Asignar vehículo
                        </Button>
                    )}
                </div>
            </div>
        );
    }

    const estadoInfo = ESTADOS[asignacion.estado] ?? ESTADOS.en_espera;
    const prioridadInfo = PRIORIDADES[asignacion.prioridad];
    const retrasado =
        Boolean(asignacion.fechaEstimada) &&
        !["finalizado", "cancelado"].includes(asignacion.estado) &&
        new Date(asignacion.fechaEstimada) < new Date();

    const EstadoIcono = estadoInfo.Icono;

    return (
        <div className={`bahia-card panel-cristal estado-${asignacion.estado}`}>
            <div className="bahia-card-encabezado">
                <h3>{bahia.nombre}</h3>
                <div className="bahia-card-badges">
                    {prioridadInfo && (
                        <Badge tono={prioridadInfo.tono} icono={<prioridadInfo.Icono />}>
                            {prioridadInfo.etiqueta}
                        </Badge>
                    )}
                    <Badge tono={estadoInfo.tono} icono={<EstadoIcono />}>
                        {estadoInfo.etiqueta}
                    </Badge>
                </div>
            </div>

            <div className="bahia-vehiculo">
                <span className="bahia-placa">{asignacion.placaVehiculo}</span>
                <span className="bahia-modelo">{asignacion.marcaModelo}</span>
                <span className="bahia-propietario">{asignacion.propietario}</span>
            </div>

            <div className="bahia-servicio">
                <span className="bahia-servicio-label">Servicio</span>
                <p className={expandido ? "" : "bahia-servicio-truncado"}>{asignacion.servicio}</p>
                {asignacion.servicio?.length > 90 && (
                    <button
                        type="button"
                        className="bahia-ver-mas"
                        onClick={() => setExpandido((v) => !v)}
                    >
                        {expandido ? "ver menos" : "ver más"}
                    </button>
                )}
            </div>

            <div className="bahia-mecanico">
                <TbUserCircle />
                <span>{asignacion.mecanicoNombre ?? "Sin mecánico asignado"}</span>
            </div>

            <div className="bahia-progreso">
                <div className="bahia-progreso-encabezado">
                    <span>Progreso</span>
                    <span>{asignacion.progreso}%</span>
                </div>
                <div className={`bahia-progreso-track track-${asignacion.estado}`}>
                    <div
                        className="bahia-progreso-relleno"
                        style={{ width: `${asignacion.progreso}%` }}
                    />
                </div>
            </div>

            {retrasado && (
                <Badge tono="danger" icono={<TbAlertTriangle />} className="bahia-retrasado">
                    Retrasado
                </Badge>
            )}

            {asignacion.notas && <p className="bahia-notas">"{asignacion.notas}"</p>}

            {puedeGestionar && (
                <div className="bahia-acciones">
                    <Button variante="secundario" icono={<TbEdit />} onClick={onActualizar}>
                        Actualizar
                    </Button>
                    <Button variante="secundario" icono={<TbFlagCheck />} onClick={onFinalizar}>
                        Finalizar
                    </Button>
                    <Button variante="peligro" icono={<TbBan />} onClick={onCancelar}>
                        Cancelar
                    </Button>
                </div>
            )}
        </div>
    );
}
