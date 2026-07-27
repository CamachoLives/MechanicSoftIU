import "./Button.css";

export default function Button({
    variante = "primario",
    icono,
    anchoCompleto = false,
    className = "",
    children,
    ...resto
}) {
    const clases = ["btn", `btn-${variante}`, anchoCompleto ? "btn-ancho" : "", className]
        .filter(Boolean)
        .join(" ");

    return (
        <button className={clases} {...resto}>
            {icono && <span className="btn-icono">{icono}</span>}
            {children && <span>{children}</span>}
        </button>
    );
}
