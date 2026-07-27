import { useId } from "react";
import "../Input/Input.css";
import "./Select.css";

export default function Select({
    label,
    error,
    opciones = [],
    placeholder = "Selecciona una opción",
    className = "",
    id,
    required,
    ...resto
}) {
    const idGenerado = useId();
    const selectId = id ?? idGenerado;

    return (
        <label className={`campo-input ${className}`} htmlFor={selectId}>
            {label && (
                <span className="campo-input-label">
                    {label}
                    {required && <span className="campo-input-requerido"> *</span>}
                </span>
            )}
            <span
                className={`campo-input-caja campo-select-caja ${error ? "campo-input-error" : ""}`}
            >
                <select id={selectId} required={required} {...resto}>
                    <option value="" disabled hidden>
                        {placeholder}
                    </option>
                    {opciones.map((op) => (
                        <option key={op.value} value={op.value}>
                            {op.label}
                        </option>
                    ))}
                </select>
            </span>
            {error && <span className="campo-input-mensaje">{error}</span>}
        </label>
    );
}
