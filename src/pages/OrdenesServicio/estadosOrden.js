import {
    TbInbox,
    TbStethoscope,
    TbClockPause,
    TbThumbUp,
    TbTool,
    TbFlagCheck,
    TbTruckDelivery,
    TbBan,
} from "react-icons/tb";

export const ESTADOS_ORDEN = {
    RECIBIDO: { etiqueta: "Recibido", tono: "neutral", Icono: TbInbox },
    EN_DIAGNOSTICO: { etiqueta: "En diagnóstico", tono: "info", Icono: TbStethoscope },
    ESPERA_APROBACION: { etiqueta: "Espera de aprobación", tono: "warning", Icono: TbClockPause },
    APROBADO: { etiqueta: "Aprobado", tono: "info", Icono: TbThumbUp },
    EN_REPARACION: { etiqueta: "En reparación", tono: "info", Icono: TbTool },
    FINALIZADO: { etiqueta: "Finalizado", tono: "success", Icono: TbFlagCheck },
    ENTREGADO: { etiqueta: "Entregado", tono: "success", Icono: TbTruckDelivery },
    CANCELADO: { etiqueta: "Cancelado", tono: "neutral", Icono: TbBan },
};

// Mismo mapa que TRANSICIONES_PERMITIDAS en OrdenServicioServiceImpl.java — mantener sincronizados.
export const TRANSICIONES = {
    RECIBIDO: ["EN_DIAGNOSTICO", "CANCELADO"],
    EN_DIAGNOSTICO: ["ESPERA_APROBACION", "CANCELADO"],
    ESPERA_APROBACION: ["APROBADO", "EN_DIAGNOSTICO", "CANCELADO"],
    APROBADO: ["EN_REPARACION", "CANCELADO"],
    EN_REPARACION: ["FINALIZADO", "ESPERA_APROBACION", "CANCELADO"],
    FINALIZADO: ["ENTREGADO", "EN_REPARACION"],
    ENTREGADO: [],
    CANCELADO: [],
};

export const ESTADOS_INMUTABLES = ["FINALIZADO", "ENTREGADO", "CANCELADO"];
