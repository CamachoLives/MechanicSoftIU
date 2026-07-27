import { useEffect } from "react";
import "./Modal.css";

export default function Modal({ abierto, titulo, cerrar, children, pie, ancho = "md" }) {
    useEffect(() => {
        if (!abierto) return undefined;

        const alPresionarTecla = (e) => {
            if (e.key === "Escape") cerrar?.();
        };
        document.addEventListener("keydown", alPresionarTecla);
        return () => document.removeEventListener("keydown", alPresionarTecla);
    }, [abierto, cerrar]);

    if (!abierto) return null;

    return (
        <div
            className="modal-fondo"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) cerrar?.();
            }}
        >
            <div className={`modal-caja panel-cristal modal-${ancho}`}>
                <div className="modal-header">
                    <h2>{titulo}</h2>
                    <button
                        type="button"
                        className="modal-cerrar"
                        onClick={cerrar}
                        aria-label="Cerrar"
                    >
                        ✕
                    </button>
                </div>

                <div className="modal-cuerpo">{children}</div>

                {pie && <div className="modal-pie">{pie}</div>}
            </div>
        </div>
    );
}
