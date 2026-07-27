import { useState } from "react";
import { TbUsers, TbShieldCheck, TbUsersGroup, TbKey } from "react-icons/tb";
import { useAuth } from "../../context/AuthContext";
import AccesoDenegado from "../../components/AccesoDenegado/AccesoDenegado";
import UsuariosTab from "./UsuariosTab";
import RolesTab from "./RolesTab";
import GruposTab from "./GruposTab";
import PermisosTab from "./PermisosTab";
import "./Usuarios.css";

const TABS = [
    { clave: "usuarios", etiqueta: "Usuarios", icono: TbUsers, permiso: "usuarios.ver" },
    { clave: "roles", etiqueta: "Roles", icono: TbShieldCheck, permiso: "roles.ver" },
    { clave: "grupos", etiqueta: "Grupos", icono: TbUsersGroup, permiso: "grupos.ver" },
    { clave: "permisos", etiqueta: "Permisos", icono: TbKey, permiso: "roles.ver" },
];

export default function Usuarios() {
    const { tienePermiso } = useAuth();
    const tabsVisibles = TABS.filter((t) => tienePermiso(t.permiso));

    const [tabActiva, setTabActiva] = useState(null);

    const tabValida = tabsVisibles.some((t) => t.clave === tabActiva)
        ? tabActiva
        : tabsVisibles[0]?.clave ?? null;

    if (!tabValida) {
        return (
            <AccesoDenegado mensaje="No tienes permisos para administrar usuarios, roles o grupos." />
        );
    }

    return (
        <div className="usuarios-pagina">
            <h1>Usuarios y accesos</h1>
            <p className="usuarios-subtitulo">
                Administra las cuentas del sistema, sus roles y sus grupos de trabajo.
            </p>

            <div className="usuarios-tabs">
                {tabsVisibles.map((tab) => {
                    const Icono = tab.icono;
                    return (
                        <button
                            key={tab.clave}
                            className={tabValida === tab.clave ? "activa" : ""}
                            onClick={() => setTabActiva(tab.clave)}
                        >
                            <Icono /> {tab.etiqueta}
                        </button>
                    );
                })}
            </div>

            <div className="usuarios-contenido">
                {tabValida === "usuarios" && <UsuariosTab />}
                {tabValida === "roles" && <RolesTab />}
                {tabValida === "grupos" && <GruposTab />}
                {tabValida === "permisos" && <PermisosTab />}
            </div>
        </div>
    );
}
