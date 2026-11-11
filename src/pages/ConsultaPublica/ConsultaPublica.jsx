import { useState } from "react";
import {
    TbMotorbike, TbSearch, TbIdBadge2, TbHash, TbLogin2,
    TbAlertCircle, TbClockHour4, TbCircleCheck, TbX,
    TbTool, TbEngine, TbCar, TbCalendar, TbRoad,
    TbPhone, TbMail, TbShieldCheck, TbClipboardList,
    TbBolt, TbChevronDown,
} from "react-icons/tb";
import { consultarMoto } from "../../services/consultaPublicaService";
import "./ConsultaPublica.css";

const TIPOS_DOCUMENTO = [
    { value: "CC",  label: "CC – Cédula de Ciudadanía" },
    { value: "CE",  label: "CE – Cédula de Extranjería" },
    { value: "TI",  label: "TI – Tarjeta de Identidad" },
    { value: "PP",  label: "PP – Pasaporte" },
    { value: "NIT", label: "NIT" },
    { value: "PEP", label: "PEP – Permiso Especial de Permanencia" },
];

const ESTADO_CONFIG = {
    RECIBIDO:          { etiqueta: "Recibida",             tono: "info",        icono: TbClockHour4 },
    EN_DIAGNOSTICO:    { etiqueta: "En diagnóstico",       tono: "info",        icono: TbSearch },
    ESPERA_APROBACION: { etiqueta: "Esperando aprobación", tono: "advertencia", icono: TbClockHour4 },
    APROBADO:          { etiqueta: "Aprobada",             tono: "exito",       icono: TbCircleCheck },
    EN_REPARACION:     { etiqueta: "En reparación",        tono: "serio",       icono: TbTool },
    FINALIZADO:        { etiqueta: "Finalizada",           tono: "exito",       icono: TbCircleCheck },
    ENTREGADO:         { etiqueta: "Entregada",            tono: "neutral",     icono: TbCircleCheck },
    CANCELADO:         { etiqueta: "Cancelada",            tono: "critico",     icono: TbX },
};

const PASOS = [
    { icono: TbIdBadge2, titulo: "Ingresa tu documento", desc: "Selecciona el tipo de identificación e ingresa tu número." },
    { icono: TbMotorbike, titulo: "Escribe la placa",     desc: "La placa de tu moto tal como aparece en la tarjeta de propiedad." },
    { icono: TbClipboardList, titulo: "Ve el estado",    desc: "Consulta el diagnóstico, el trabajo realizado y el historial completo." },
];

function formatearFecha(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("es-CO", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
}

function formatearPesos(valor) {
    if (valor == null) return "—";
    return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(valor);
}

export default function ConsultaPublica({ onLoginClick }) {
    const [form, setForm]       = useState({ tipoDocumento: "", numeroDocumento: "", placa: "" });
    const [cargando, setCargando] = useState(false);
    const [error, setError]     = useState("");
    const [resultado, setResultado] = useState(null);

    const cambiar = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

    const buscar = async (e) => {
        e.preventDefault();
        setCargando(true);
        setError("");
        setResultado(null);
        try {
            const data = await consultarMoto({
                placa: form.placa.trim().toUpperCase(),
                tipoDocumento: form.tipoDocumento,
                numeroDocumento: form.numeroDocumento.trim(),
            });
            setResultado(data);
        } catch (err) {
            const status = err.response?.status;
            if (status === 429) {
                const seg = err.response.data?.esperarSegundos ?? "un momento";
                setError(`Has superado el límite de consultas. Intenta de nuevo en ${seg} segundos.`);
            } else if (status === 404) {
                setError(err.response.data?.message ?? "No se encontró ninguna moto con esos datos.");
            } else {
                setError("Ocurrió un error al consultar. Verifica tu conexión e intenta de nuevo.");
            }
        } finally {
            setCargando(false);
        }
    };

    const limpiar = () => {
        setResultado(null);
        setError("");
        setForm({ tipoDocumento: "", numeroDocumento: "", placa: "" });
    };

    return (
        <div className="cp-pantalla fondo-grid">
            <div className="cp-blob cp-blob-1" />
            <div className="cp-blob cp-blob-2" />
            <div className="cp-blob cp-blob-3" />

            {/* ── Topbar ── */}
            <header className="cp-topbar">
                <div className="cp-topbar-marca">
                    <TbMotorbike className="cp-topbar-icono" />
                    <span className="cp-topbar-nombre texto-glow">MechanicSoft</span>
                </div>
                <button type="button" className="cp-topbar-login" onClick={onLoginClick}>
                    <TbLogin2 />
                    Área mecánicos
                </button>
            </header>

            <div className="cp-cuerpo">

                {/* ── HERO ── */}
                <section className="cp-hero">
                    <div className="cp-hero-badge">
                        <TbBolt /> Consulta en tiempo real
                    </div>
                    <h1 className="cp-hero-titulo">
                        ¿Cómo va tu<br />
                        <span className="texto-glow">moto en el taller?</span>
                    </h1>
                    <p className="cp-hero-subtitulo">
                        Consulta el estado, el diagnóstico y el historial de servicios<br className="cp-br-desktop" />
                        de tu vehículo sin necesidad de llamar al taller.
                    </p>
                    <div className="cp-hero-scroll">
                        <TbChevronDown /> Ver consulta
                    </div>
                </section>

                {/* ── FORMULARIO ── */}
                {!resultado && (
                    <form className="cp-panel panel-cristal" onSubmit={buscar}>
                        <div className="cp-panel-titulo">
                            <TbSearch /> Consultar estado de mi moto
                        </div>

                        <div className="cp-form-fila">
                            <label className="cp-campo">
                                <span className="cp-campo-label"><TbIdBadge2 /> Tipo de documento</span>
                                <select className="cp-select" value={form.tipoDocumento} onChange={cambiar("tipoDocumento")} required>
                                    <option value="" disabled hidden>Selecciona…</option>
                                    {TIPOS_DOCUMENTO.map((t) => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                            </label>

                            <label className="cp-campo">
                                <span className="cp-campo-label"><TbHash /> Número de documento</span>
                                <input
                                    className="cp-input"
                                    type="text"
                                    placeholder="Ej. 1098765432"
                                    value={form.numeroDocumento}
                                    onChange={cambiar("numeroDocumento")}
                                    required maxLength={30}
                                />
                            </label>

                            <label className="cp-campo">
                                <span className="cp-campo-label"><TbMotorbike /> Placa del vehículo</span>
                                <input
                                    className="cp-input cp-input-placa"
                                    type="text"
                                    placeholder="Ej. OES58H"
                                    value={form.placa}
                                    onChange={cambiar("placa")}
                                    required maxLength={10}
                                />
                            </label>
                        </div>

                        {error && (
                            <div className="cp-error">
                                <TbAlertCircle />
                                <span>{error}</span>
                            </div>
                        )}

                        <button type="submit" className="cp-btn-buscar" disabled={cargando}>
                            {cargando ? <span className="cp-spinner" /> : <TbSearch />}
                            {cargando ? "Consultando…" : "Consultar estado"}
                        </button>

                        <p className="cp-panel-nota">
                            <TbShieldCheck /> Tu información es privada y solo tú puedes ver el estado de tu moto.
                        </p>
                    </form>
                )}

                {/* ── RESULTADOS ── */}
                {resultado && (
                    <div className="cp-resultados">
                        <div className="cp-vehiculo panel-cristal">
                            <div className="cp-vehiculo-cabeza">
                                <div className="cp-vehiculo-placa">
                                    <TbMotorbike />
                                    {resultado.vehiculo.placa}
                                </div>
                                <button type="button" className="cp-btn-volver" onClick={limpiar}>
                                    Nueva consulta
                                </button>
                            </div>
                            <div className="cp-vehiculo-datos">
                                <div className="cp-dato">
                                    <TbCar className="cp-dato-icono" />
                                    <span className="cp-dato-label">Marca / Modelo</span>
                                    <span className="cp-dato-valor">{resultado.vehiculo.marca} {resultado.vehiculo.modelo}</span>
                                </div>
                                <div className="cp-dato">
                                    <TbCalendar className="cp-dato-icono" />
                                    <span className="cp-dato-label">Año</span>
                                    <span className="cp-dato-valor">{resultado.vehiculo.anio}</span>
                                </div>
                                <div className="cp-dato">
                                    <TbRoad className="cp-dato-icono" />
                                    <span className="cp-dato-label">Kilometraje</span>
                                    <span className="cp-dato-valor">{resultado.vehiculo.kilometraje?.toLocaleString("es-CO")} km</span>
                                </div>
                                <div className="cp-dato">
                                    <TbEngine className="cp-dato-icono" />
                                    <span className="cp-dato-label">Cilindraje</span>
                                    <span className="cp-dato-valor">{resultado.vehiculo.cilindrajeCc} cc</span>
                                </div>
                            </div>
                        </div>

                        <h2 className="cp-ordenes-titulo">
                            Historial de servicios
                            <span className="cp-ordenes-count">{resultado.ordenes.length}</span>
                        </h2>

                        {resultado.ordenes.length === 0 ? (
                            <div className="cp-sin-ordenes panel-cristal">
                                <TbClockHour4 />
                                <p>No hay órdenes de servicio registradas para este vehículo aún.</p>
                            </div>
                        ) : (
                            <div className="cp-ordenes-lista">
                                {resultado.ordenes.map((orden) => {
                                    const cfg = ESTADO_CONFIG[orden.estado] ?? { etiqueta: orden.estado, tono: "neutral", icono: TbClockHour4 };
                                    const Icono = cfg.icono;
                                    return (
                                        <div key={orden.id} className="cp-orden panel-cristal">
                                            <div className="cp-orden-cabeza">
                                                <span className={`cp-badge cp-badge-${cfg.tono}`}>
                                                    <Icono /> {cfg.etiqueta}
                                                </span>
                                                <span className="cp-orden-fecha">{formatearFecha(orden.fechaIngreso)}</span>
                                            </div>
                                            <p className="cp-orden-motivo">{orden.motivoIngreso}</p>
                                            {orden.diagnostico && (
                                                <div className="cp-orden-seccion">
                                                    <span className="cp-orden-seccion-titulo">Diagnóstico</span>
                                                    <p>{orden.diagnostico}</p>
                                                </div>
                                            )}
                                            {orden.trabajoRealizado && (
                                                <div className="cp-orden-seccion">
                                                    <span className="cp-orden-seccion-titulo">Trabajo realizado</span>
                                                    <p>{orden.trabajoRealizado}</p>
                                                </div>
                                            )}
                                            {orden.observaciones && (
                                                <div className="cp-orden-seccion">
                                                    <span className="cp-orden-seccion-titulo">Observaciones</span>
                                                    <p>{orden.observaciones}</p>
                                                </div>
                                            )}
                                            <div className="cp-orden-pie">
                                                <span className="cp-orden-valor">{formatearPesos(orden.valorTotal)}</span>
                                                {orden.fechaEntrega && (
                                                    <span className="cp-orden-entrega">
                                                        Entregada: {formatearFecha(orden.fechaEntrega)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ── CÓMO FUNCIONA ── */}
                {!resultado && (
                    <section className="cp-como">
                        <h2 className="cp-como-titulo">¿Cómo funciona?</h2>
                        <div className="cp-pasos">
                            {PASOS.map((paso, i) => {
                                const Icono = paso.icono;
                                return (
                                    <div key={i} className="cp-paso panel-cristal">
                                        <div className="cp-paso-num">{i + 1}</div>
                                        <Icono className="cp-paso-icono" />
                                        <h3>{paso.titulo}</h3>
                                        <p>{paso.desc}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}
            </div>

            {/* ── FOOTER ── */}
            <footer className="cp-footer">
                <div className="cp-footer-inner">
                    <div className="cp-footer-marca">
                        <TbMotorbike className="cp-footer-icono" />
                        <div>
                            <span className="cp-footer-nombre">MechanicSoft</span>
                            <span className="cp-footer-desc">Sistema de gestión para talleres de motos</span>
                        </div>
                    </div>

                    <div className="cp-footer-contacto">
                        <a href="tel:3148917721" className="cp-footer-link">
                            <TbPhone /> 314 891 7721
                        </a>
                        <a href="mailto:rfcamacris@gmail.com" className="cp-footer-link">
                            <TbMail /> rfcamacris@gmail.com
                        </a>
                    </div>

                    <div className="cp-footer-dev">
                        <span>Desarrollado por <strong>NexCam</strong></span>
                        <span>Christian Alexander Camacho</span>
                        <span>En compañía de <strong>Thomas Prado</strong></span>
                        <span className="cp-footer-year">© {new Date().getFullYear()}</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
