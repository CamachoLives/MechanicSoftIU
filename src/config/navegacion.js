import { TbClipboardList, TbAddressBook, TbBox, TbClipboardText, TbCar, TbUsers } from "react-icons/tb";

export const NAV_ITEMS = [
    { clave: "ordenes", etiqueta: "Órdenes", icono: TbClipboardList, permiso: "ordenes.ver" },
    { clave: "clientes", etiqueta: "Clientes", icono: TbAddressBook, permiso: "clientes.ver" },
    {
        clave: "vehiculos-registro",
        etiqueta: "Registrar",
        icono: TbClipboardText,
        permiso: "vehiculos.crear",
    },
    { clave: "vehiculos-lista", etiqueta: "Vehículos", icono: TbCar, permiso: "vehiculos.ver" },
    { clave: "repuestos", etiqueta: "Repuestos", icono: TbBox, permiso: "repuestos.ver" },
    { clave: "usuarios", etiqueta: "Usuarios", icono: TbUsers, permiso: "usuarios.ver" },
];
