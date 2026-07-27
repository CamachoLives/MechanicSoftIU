import "./Toast.css";

const ICONOS = {
    exito: "✓",
    error: "⚠",
    info: "ℹ",
    advertencia: "⚠",
};

export default function Toast({ tipo = "info", children, cerrar }) {
    return (
        <div className={`toast toast-${tipo}`} role="status">
            <span className="toast-icono">{ICONOS[tipo] ?? ICONOS.info}</span>
            <p className="toast-mensaje">{children}</p>
            <button
                type="button"
                className="toast-cerrar"
                onClick={cerrar}
                aria-label="Cerrar aviso"
            >
                ✕
            </button>
        </div>
    );
}
