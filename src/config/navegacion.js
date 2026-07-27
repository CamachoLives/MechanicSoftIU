import { TbBuildingWarehouse, TbClipboardText, TbCar, TbUsers } from "react-icons/tb";

export const NAV_ITEMS = [
    { clave: "taller", etiqueta: "Taller", icono: TbBuildingWarehouse, permiso: "taller.ver" },
    {
        clave: "vehiculos-registro",
        etiqueta: "Registrar",
        icono: TbClipboardText,
        permiso: "vehiculos.crear",
    },
    { clave: "vehiculos-lista", etiqueta: "Vehículos", icono: TbCar, permiso: "vehiculos.ver" },
    { clave: "usuarios", etiqueta: "Usuarios", icono: TbUsers, permiso: "usuarios.ver" },
];
