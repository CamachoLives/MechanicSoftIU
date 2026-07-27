import "./Badge.css";

const TONOS_VALIDOS = ["neutral", "info", "success", "warning", "serious", "danger"];

export default function Badge({ tono = "neutral", icono, children, className = "" }) {
    const claseTono = TONOS_VALIDOS.includes(tono) ? tono : "neutral";

    return (
        <span className={`badge badge-${claseTono} ${className}`}>
            {icono && <span className="badge-icono">{icono}</span>}
            <span>{children}</span>
        </span>
    );
}
