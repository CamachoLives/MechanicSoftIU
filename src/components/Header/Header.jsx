import { TbLogout } from "react-icons/tb";
import { useAuth } from "../../context/AuthContext";
import Badge from "../Badge/Badge";
import "./Header.css";

export default function Header() {
    const { usuarioActual, rolActual, logout } = useAuth();

    return (
        <header className="header">
            <h2 className="header-marca texto-glow">MechanicSoft</h2>

            <div className="header-usuario">
                <div className="header-usuario-info">
                    <strong>{usuarioActual?.nombre}</strong>
                    {rolActual && (
                        <Badge tono="info" className="header-usuario-rol">
                            {rolActual.nombre}
                        </Badge>
                    )}
                </div>

                <button
                    type="button"
                    className="header-logout"
                    onClick={logout}
                    aria-label="Cerrar sesión"
                    title="Cerrar sesión"
                >
                    <TbLogout />
                </button>
            </div>
        </header>
    );
}
