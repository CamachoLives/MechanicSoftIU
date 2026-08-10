import { useEffect, useState } from "react";
import { TbPlus, TbEdit, TbUserCheck, TbUserX, TbArrowBackUp, TbArrowForward, TbSearch } from "react-icons/tb";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import {
    obtenerRepuestos,
    cambiarEstadoRepuesto,
    registrarEntradaRepuesto,
    registrarSalidaRepuesto,
} from "../../services/repuestoService";
import { mensajeError } from "../../utils/apiError";
import Button from "../../components/Button/Button";
import Input from "../../components/Input/Input";
import Badge from "../../components/Badge/Badge";
import RepuestoFormModal from "./RepuestoFormModal";
import MovimientoStockModal from "./MovimientoStockModal";
import "./Repuestos.css";

const formatoMoneda = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

export default function Repuestos() {
    const { tienePermiso } = useAuth();
    const toast = useToast();

    const [repuestos, setRepuestos] = useState([]);
    const [busqueda, setBusqueda] = useState("");
    const [cargando, setCargando] = useState(true);
    const [procesando, setProcesando] = useState(false);

    const [repuestoEnEdicion, setRepuestoEnEdicion] = useState(undefined);
    const [movimiento, setMovimiento] = useState(null); // { repuesto, tipo: "entrada" | "salida" }

    const puedeCrear = tienePermiso("repuestos.crear");
    const puedeEditar = tienePermiso("repuestos.editar");
    const puedeMovimientos = tienePermiso("repuestos.movimientos");

    const cargar = async (texto) => {
        setCargando(true);
        try {
            setRepuestos(await obtenerRepuestos(texto));
        } catch (error) {
            toast.error(mensajeError(error, "No se pudo cargar los repuestos."));
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        (async () => {
            await cargar();
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const alBuscar = async (e) => {
        e.preventDefault();
        await cargar(busqueda);
    };

    const alternarActivo = async (repuesto) => {
        setProcesando(true);
        try {
            await cambiarEstadoRepuesto(repuesto.id, !repuesto.activo);
            toast.exito(`${repuesto.nombre} quedó ${repuesto.activo ? "inactivo" : "activo"}.`);
            await cargar(busqueda);
        } catch (error) {
            toast.error(error.message ?? "No se pudo cambiar el estado.");
        } finally {
            setProcesando(false);
        }
    };

    const confirmarMovimiento = async (cantidad) => {
        setProcesando(true);
        try {
            if (movimiento.tipo === "entrada") {
                await registrarEntradaRepuesto(movimiento.repuesto.id, cantidad);
                toast.exito(`Se registró la entrada de ${cantidad} unidades.`);
            } else {
                await registrarSalidaRepuesto(movimiento.repuesto.id, cantidad);
                toast.exito(`Se registró la salida de ${cantidad} unidades.`);
            }
            setMovimiento(null);
            await cargar(busqueda);
        } catch (error) {
            toast.error(error.message ?? "No se pudo registrar el movimiento.");
        } finally {
            setProcesando(false);
        }
    };

    if (cargando) return <p className="tabla-datos-cargando">Cargando repuestos...</p>;

    return (
        <div className="repuestos-pagina">
            <h1>Repuestos e inventario</h1>
            <p className="repuestos-subtitulo">Catálogo de repuestos y control de existencias.</p>

            <form className="repuestos-filtros" onSubmit={alBuscar}>
                <Input
                    icono={<TbSearch />}
                    placeholder="Buscar por nombre o código..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="repuestos-buscar"
                />
                <Button type="submit" variante="secundario">
                    Buscar
                </Button>
                {puedeCrear && (
                    <Button icono={<TbPlus />} onClick={() => setRepuestoEnEdicion(null)}>
                        Nuevo repuesto
                    </Button>
                )}
            </form>

            <div className="tabla-datos-contenedor">
                <table className="tabla-datos">
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th>Nombre</th>
                            <th>Precio</th>
                            <th>Stock</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {repuestos.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="tabla-datos-vacio">
                                    No hay repuestos registrados.
                                </td>
                            </tr>
                        ) : (
                            repuestos.map((repuesto) => (
                                <tr key={repuesto.id}>
                                    <td>{repuesto.codigo}</td>
                                    <td>
                                        <div className="celda-principal">
                                            <strong>{repuesto.nombre}</strong>
                                            {repuesto.descripcion && <span>{repuesto.descripcion}</span>}
                                        </div>
                                    </td>
                                    <td>{formatoMoneda.format(repuesto.precio)}</td>
                                    <td>
                                        <Badge tono={repuesto.cantidadDisponible <= 3 ? "warning" : "neutral"}>
                                            {repuesto.cantidadDisponible} un.
                                        </Badge>
                                    </td>
                                    <td>
                                        <Badge tono={repuesto.activo ? "success" : "neutral"}>
                                            {repuesto.activo ? "Activo" : "Inactivo"}
                                        </Badge>
                                    </td>
                                    <td>
                                        <div className="tabla-acciones">
                                            {puedeMovimientos && (
                                                <>
                                                    <Button
                                                        variante="secundario"
                                                        icono={<TbArrowForward />}
                                                        onClick={() => setMovimiento({ repuesto, tipo: "entrada" })}
                                                    >
                                                        Entrada
                                                    </Button>
                                                    <Button
                                                        variante="secundario"
                                                        icono={<TbArrowBackUp />}
                                                        onClick={() => setMovimiento({ repuesto, tipo: "salida" })}
                                                    >
                                                        Salida
                                                    </Button>
                                                </>
                                            )}
                                            {puedeEditar && (
                                                <Button
                                                    variante="secundario"
                                                    icono={<TbEdit />}
                                                    onClick={() => setRepuestoEnEdicion(repuesto)}
                                                >
                                                    Editar
                                                </Button>
                                            )}
                                            {puedeEditar && (
                                                <Button
                                                    variante={repuesto.activo ? "peligro" : "secundario"}
                                                    icono={repuesto.activo ? <TbUserX /> : <TbUserCheck />}
                                                    onClick={() => alternarActivo(repuesto)}
                                                    disabled={procesando}
                                                >
                                                    {repuesto.activo ? "Desactivar" : "Activar"}
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <RepuestoFormModal
                repuesto={repuestoEnEdicion}
                cerrar={() => setRepuestoEnEdicion(undefined)}
                alGuardar={async () => {
                    setRepuestoEnEdicion(undefined);
                    await cargar(busqueda);
                }}
            />

            <MovimientoStockModal
                movimiento={movimiento}
                cargando={procesando}
                confirmar={confirmarMovimiento}
                cancelar={() => setMovimiento(null)}
            />
        </div>
    );
}
