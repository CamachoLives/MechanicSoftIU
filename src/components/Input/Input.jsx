import { useId } from "react";
import "./Input.css";

export default function Input({
    label,
    error,
    icono,
    accionFinal,
    multilinea = false,
    filas = 4,
    className = "",
    id,
    required,
    ...resto
}) {
    const idGenerado = useId();
    const inputId = id ?? idGenerado;
    const Elemento = multilinea ? "textarea" : "input";
    const esRango = resto.type === "range";

    return (
        <label className={`campo-input ${className}`} htmlFor={inputId}>
            {label && (
                <span className="campo-input-label">
                    {label}
                    {required && <span className="campo-input-requerido"> *</span>}
                </span>
            )}
            <span
                className={`campo-input-caja ${multilinea ? "campo-input-caja-multilinea" : ""} ${
                    esRango ? "campo-input-caja-rango" : ""
                } ${error ? "campo-input-error" : ""}`}
            >
                {icono && <span className="campo-input-icono">{icono}</span>}
                <Elemento
                    id={inputId}
                    required={required}
                    rows={multilinea ? filas : undefined}
                    {...resto}
                />
                {accionFinal && <span className="campo-input-accion">{accionFinal}</span>}
            </span>
            {error && <span className="campo-input-mensaje">{error}</span>}
        </label>
    );
}
