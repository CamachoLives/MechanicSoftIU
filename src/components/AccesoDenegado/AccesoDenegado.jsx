import "./AccesoDenegado.css";

export default function AccesoDenegado({ mensaje = "No tienes permisos para ver esta sección." }) {
    return (
        <div className="acceso-denegado panel-cristal">
            <span className="acceso-denegado-icono">🔒</span>
            <h2>Acceso restringido</h2>
            <p>{mensaje}</p>
        </div>
    );
}
