import { useEffect, useState } from "react";
import { TbArrowLeft, TbDeviceFloppy, TbTrash, TbPlus, TbCoins } from "react-icons/tb";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import Button from "../../components/Button/Button";
import Input from "../../components/Input/Input";
import Select from "../../components/Select/Select";
import Badge from "../../components/Badge/Badge";
import ConfirmModal from "../../components/Modal/ConfirmModal";
import {
    buscarOrdenPorId,
    actualizarOrden,
    cambiarEstadoOrden,
    obtenerServiciosDeOrden,
    agregarServicioAOrden,
    eliminarServicioDeOrden,
    obtenerRepuestosDeOrden,
    agregarRepuestoAOrden,
    eliminarRepuestoDeOrden,
    obtenerPagosDeOrden,
    obtenerResumenPagoDeOrden,
} from "../../services/ordenServicioService";
import { obtenerUsuarios } from "../../services/usuarioService";
import { obtenerRepuestos } from "../../services/repuestoService";
import { ESTADOS_ORDEN, TRANSICIONES, ESTADOS_INMUTABLES } from "./estadosOrden";
import RegistrarPagoModal from "./RegistrarPagoModal";
import { formatoMoneda } from "../../utils/formato";
import "./OrdenesServicio.css";


export default function OrdenDetalle({ ordenId, volver }) {
    const { tienePermiso } = useAuth();
    const toast = useToast();

    const [orden, setOrden] = useState(null);
    const [servicios, setServicios] = useState([]);
    const [repuestosOrden, setRepuestosOrden] = useState([]);
    const [pagos, setPagos] = useState([]);
    const [resumenPago, setResumenPago] = useState(null);
    const [usuarios, setUsuarios] = useState([]);
    const [catalogoRepuestos, setCatalogoRepuestos] = useState([]);
    const [cargando, setCargando] = useState(true);

    const [formTexto, setFormTexto] = useState({ diagnostico: "", trabajoRealizado: "", observaciones: "", mecanicoIds: [] });
    const [guardandoTexto, setGuardandoTexto] = useState(false);

    const [nuevoServicio, setNuevoServicio] = useState({ nombreServicio: "", descripcion: "", cantidad: "1", precioUnitario: "" });
    const [nuevoRepuesto, setNuevoRepuesto] = useState({ repuestoId: "", cantidadUtilizada: "1" });
    const [procesandoLinea, setProcesandoLinea] = useState(false);

    const [estadoParaConfirmar, setEstadoParaConfirmar] = useState(null);
    const [cambiandoEstado, setCambiandoEstado] = useState(false);
    const [pagoModalAbierto, setPagoModalAbierto] = useState(false);

    const puedeEditar = tienePermiso("ordenes.editar");
    const puedeCambiarEstado = tienePermiso("ordenes.cambiarEstado");
    const puedeServicios = tienePermiso("ordenes.gestionarServicios");
    const puedeRepuestos = tienePermiso("ordenes.gestionarRepuestos");
    const puedePagos = tienePermiso("pagos.registrar");

    const cargarTodo = async () => {
        setCargando(true);
        try {
            const [datosOrden, listaServicios, listaRepuestos, listaPagos, resumen, listaUsuarios, listaRepuestosCatalogo] =
                await Promise.all([
                    buscarOrdenPorId(ordenId),
                    obtenerServiciosDeOrden(ordenId),
                    obtenerRepuestosDeOrden(ordenId),
                    obtenerPagosDeOrden(ordenId),
                    obtenerResumenPagoDeOrden(ordenId),
                    obtenerUsuarios(),
                    obtenerRepuestos(),
                ]);
            setOrden(datosOrden);
            setServicios(listaServicios);
            setRepuestosOrden(listaRepuestos);
            setPagos(listaPagos);
            setResumenPago(resumen);
            setUsuarios(listaUsuarios.filter((u) => u.activo));
            setCatalogoRepuestos(listaRepuestosCatalogo.filter((r) => r.activo));
            setFormTexto({
                diagnostico: datosOrden.diagnostico ?? "",
                trabajoRealizado: datosOrden.trabajoRealizado ?? "",
                observaciones: datosOrden.observaciones ?? "",
                mecanicoIds: (datosOrden.mecanicos ?? []).map((m) => m.id),
            });
        } catch {
            toast.error("No se pudo cargar la orden.");
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        (async () => {
            await cargarTodo();
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ordenId]);

    if (cargando || !orden) {
        return <p className="tabla-datos-cargando">Cargando orden...</p>;
    }

    const esInmutable = ESTADOS_INMUTABLES.includes(orden.estado);
    const estadoInfo = ESTADOS_ORDEN[orden.estado] ?? ESTADOS_ORDEN.RECIBIDO;
    const EstadoIcono = estadoInfo.Icono;
    const siguientesEstados = TRANSICIONES[orden.estado] ?? [];

    const alternarMecanico = (id) => {
        setFormTexto((actual) => ({
            ...actual,
            mecanicoIds: actual.mecanicoIds.includes(id)
                ? actual.mecanicoIds.filter((m) => m !== id)
                : [...actual.mecanicoIds, id],
        }));
    };

    const guardarTexto = async (e) => {
        e.preventDefault();
        setGuardandoTexto(true);
        try {
            await actualizarOrden(ordenId, {
                diagnostico: formTexto.diagnostico,
                trabajoRealizado: formTexto.trabajoRealizado,
                observaciones: formTexto.observaciones,
                mecanicos: formTexto.mecanicoIds.map((id) => ({ id })),
            });
            toast.exito("Se guardó la información de la orden.");
            await cargarTodo();
        } catch (error) {
            toast.error(error.message ?? "No se pudo guardar.");
        } finally {
            setGuardandoTexto(false);
        }
    };

    const confirmarCambioEstado = async () => {
        setCambiandoEstado(true);
        try {
            await cambiarEstadoOrden(ordenId, estadoParaConfirmar);
            toast.exito(`La orden pasó a "${ESTADOS_ORDEN[estadoParaConfirmar]?.etiqueta}".`);
            setEstadoParaConfirmar(null);
            await cargarTodo();
        } catch (error) {
            toast.error(error.message ?? "No se pudo cambiar el estado.");
        } finally {
            setCambiandoEstado(false);
        }
    };

    const agregarServicio = async (e) => {
        e.preventDefault();
        if (!nuevoServicio.nombreServicio || !nuevoServicio.precioUnitario) {
            toast.error("Completa el nombre y el precio del servicio.");
            return;
        }
        setProcesandoLinea(true);
        try {
            await agregarServicioAOrden(ordenId, {
                nombreServicio: nuevoServicio.nombreServicio,
                descripcion: nuevoServicio.descripcion,
                cantidad: Number(nuevoServicio.cantidad),
                precioUnitario: Number(nuevoServicio.precioUnitario),
            });
            toast.exito("Servicio agregado.");
            setNuevoServicio({ nombreServicio: "", descripcion: "", cantidad: "1", precioUnitario: "" });
            await cargarTodo();
        } catch (error) {
            toast.error(error.message ?? "No se pudo agregar el servicio.");
        } finally {
            setProcesandoLinea(false);
        }
    };

    const quitarServicio = async (lineaId) => {
        setProcesandoLinea(true);
        try {
            await eliminarServicioDeOrden(ordenId, lineaId);
            await cargarTodo();
        } catch (error) {
            toast.error(error.message ?? "No se pudo quitar el servicio.");
        } finally {
            setProcesandoLinea(false);
        }
    };

    const agregarRepuesto = async (e) => {
        e.preventDefault();
        if (!nuevoRepuesto.repuestoId) {
            toast.error("Selecciona un repuesto.");
            return;
        }
        setProcesandoLinea(true);
        try {
            await agregarRepuestoAOrden(ordenId, {
                repuesto: { id: nuevoRepuesto.repuestoId },
                cantidadUtilizada: Number(nuevoRepuesto.cantidadUtilizada),
            });
            toast.exito("Repuesto agregado y descontado del inventario.");
            setNuevoRepuesto({ repuestoId: "", cantidadUtilizada: "1" });
            await cargarTodo();
        } catch (error) {
            toast.error(error.message ?? "No se pudo agregar el repuesto.");
        } finally {
            setProcesandoLinea(false);
        }
    };

    const quitarRepuesto = async (lineaId) => {
        setProcesandoLinea(true);
        try {
            await eliminarRepuestoDeOrden(ordenId, lineaId);
            toast.info("Se restauró el stock del repuesto.");
            await cargarTodo();
        } catch (error) {
            toast.error(error.message ?? "No se pudo quitar el repuesto.");
        } finally {
            setProcesandoLinea(false);
        }
    };

    return (
        <div className="ordenes-pagina">
            <button type="button" className="ordenes-volver" onClick={volver}>
                <TbArrowLeft /> Volver a órdenes
            </button>

            <div className="orden-detalle-encabezado panel-cristal">
                <div>
                    <h1>Orden #{orden.id}</h1>
                    <p className="ordenes-subtitulo">
                        {orden.vehiculo?.placa} — {orden.vehiculo?.marca} {orden.vehiculo?.modelo} ·{" "}
                        {orden.vehiculo?.cliente?.nombre}
                    </p>
                </div>
                <Badge tono={estadoInfo.tono} icono={<EstadoIcono />}>
                    {estadoInfo.etiqueta}
                </Badge>
            </div>

            {puedeCambiarEstado && siguientesEstados.length > 0 && (
                <div className="orden-detalle-estados">
                    <span>Cambiar a:</span>
                    {siguientesEstados.map((clave) => (
                        <Button
                            key={clave}
                            variante={clave === "CANCELADO" ? "peligro" : "secundario"}
                            onClick={() => setEstadoParaConfirmar(clave)}
                        >
                            {ESTADOS_ORDEN[clave].etiqueta}
                        </Button>
                    ))}
                </div>
            )}

            <div className="orden-detalle-grid">
                <div className="orden-detalle-columna">
                    <div className="panel-cristal orden-detalle-card">
                        <h2>Información del ingreso</h2>
                        <div className="orden-detalle-datos">
                            <span>
                                <strong>Kilometraje de ingreso:</strong> {orden.kilometrajeIngreso} km
                            </span>
                            <span>
                                <strong>Fecha de ingreso:</strong>{" "}
                                {orden.fechaIngreso ? new Date(orden.fechaIngreso).toLocaleString() : ""}
                            </span>
                            <span>
                                <strong>Motivo:</strong> {orden.motivoIngreso}
                            </span>
                        </div>
                    </div>

                    <form className="panel-cristal orden-detalle-card" onSubmit={guardarTexto}>
                        <h2>Diagnóstico y trabajo</h2>
                        <fieldset disabled={!puedeEditar || esInmutable} className="formulario-vertical">
                            <Input
                                label="Diagnóstico"
                                multilinea
                                value={formTexto.diagnostico}
                                onChange={(e) => setFormTexto((f) => ({ ...f, diagnostico: e.target.value }))}
                            />
                            <Input
                                label="Trabajo realizado"
                                multilinea
                                value={formTexto.trabajoRealizado}
                                onChange={(e) => setFormTexto((f) => ({ ...f, trabajoRealizado: e.target.value }))}
                            />
                            <Input
                                label="Observaciones"
                                multilinea
                                filas={2}
                                value={formTexto.observaciones}
                                onChange={(e) => setFormTexto((f) => ({ ...f, observaciones: e.target.value }))}
                            />

                            <div className="campo-input">
                                <span className="campo-input-label">Mecánicos asignados</span>
                                <div className="selector-chips">
                                    {usuarios.length === 0 && (
                                        <span className="selector-chips-vacio">No hay usuarios activos.</span>
                                    )}
                                    {usuarios.map((u) => (
                                        <button
                                            type="button"
                                            key={u.id}
                                            className={`chip-seleccionable ${
                                                formTexto.mecanicoIds.includes(u.id) ? "seleccionado" : ""
                                            }`}
                                            onClick={() => alternarMecanico(u.id)}
                                        >
                                            {u.nombre}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </fieldset>

                        {puedeEditar && !esInmutable && (
                            <Button
                                type="submit"
                                icono={<TbDeviceFloppy />}
                                disabled={guardandoTexto}
                                className="orden-detalle-guardar"
                            >
                                {guardandoTexto ? "Guardando..." : "Guardar cambios"}
                            </Button>
                        )}
                    </form>
                </div>

                <div className="orden-detalle-columna">
                    <div className="panel-cristal orden-detalle-card">
                        <h2>Servicios</h2>
                        <table className="tabla-datos tabla-datos-compacta">
                            <thead>
                                <tr>
                                    <th scope="col">Servicio</th>
                                    <th scope="col">Cant.</th>
                                    <th scope="col">Precio</th>
                                    <th scope="col">Subtotal</th>
                                    {puedeServicios && !esInmutable && <th scope="col"></th>}
                                </tr>
                            </thead>
                            <tbody>
                                {servicios.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="tabla-datos-vacio">
                                            Sin servicios agregados.
                                        </td>
                                    </tr>
                                ) : (
                                    servicios.map((s) => (
                                        <tr key={s.id}>
                                            <td>{s.nombreServicio}</td>
                                            <td>{s.cantidad}</td>
                                            <td>{formatoMoneda.format(s.precioUnitario)}</td>
                                            <td>{formatoMoneda.format(s.subtotal)}</td>
                                            {puedeServicios && !esInmutable && (
                                                <td>
                                                    <button
                                                        type="button"
                                                        className="orden-detalle-quitar"
                                                        onClick={() => quitarServicio(s.id)}
                                                        disabled={procesandoLinea}
                                                        aria-label="Quitar servicio"
                                                    >
                                                        <TbTrash />
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>

                        {puedeServicios && !esInmutable && (
                            <form className="orden-detalle-form-linea" onSubmit={agregarServicio}>
                                <Input
                                    placeholder="Nombre del servicio"
                                    maxLength={150}
                                    value={nuevoServicio.nombreServicio}
                                    onChange={(e) =>
                                        setNuevoServicio((f) => ({ ...f, nombreServicio: e.target.value }))
                                    }
                                />
                                <Input
                                    placeholder="Cant."
                                    type="number"
                                    min="1"
                                    value={nuevoServicio.cantidad}
                                    onChange={(e) => setNuevoServicio((f) => ({ ...f, cantidad: e.target.value }))}
                                />
                                <Input
                                    placeholder="Precio unitario"
                                    type="number"
                                    min="0"
                                    value={nuevoServicio.precioUnitario}
                                    onChange={(e) =>
                                        setNuevoServicio((f) => ({ ...f, precioUnitario: e.target.value }))
                                    }
                                />
                                <Button type="submit" icono={<TbPlus />} disabled={procesandoLinea}>
                                    Agregar
                                </Button>
                            </form>
                        )}
                    </div>

                    <div className="panel-cristal orden-detalle-card">
                        <h2>Repuestos</h2>
                        <table className="tabla-datos tabla-datos-compacta">
                            <thead>
                                <tr>
                                    <th scope="col">Repuesto</th>
                                    <th scope="col">Cant.</th>
                                    <th scope="col">Precio</th>
                                    <th scope="col">Subtotal</th>
                                    {puedeRepuestos && !esInmutable && <th scope="col"></th>}
                                </tr>
                            </thead>
                            <tbody>
                                {repuestosOrden.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="tabla-datos-vacio">
                                            Sin repuestos agregados.
                                        </td>
                                    </tr>
                                ) : (
                                    repuestosOrden.map((r) => (
                                        <tr key={r.id}>
                                            <td>{r.repuesto?.nombre}</td>
                                            <td>{r.cantidadUtilizada}</td>
                                            <td>{formatoMoneda.format(r.precioUnitario)}</td>
                                            <td>{formatoMoneda.format(r.subtotal)}</td>
                                            {puedeRepuestos && !esInmutable && (
                                                <td>
                                                    <button
                                                        type="button"
                                                        className="orden-detalle-quitar"
                                                        onClick={() => quitarRepuesto(r.id)}
                                                        disabled={procesandoLinea}
                                                        aria-label="Quitar repuesto"
                                                    >
                                                        <TbTrash />
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>

                        {puedeRepuestos && !esInmutable && (
                            <form className="orden-detalle-form-linea" onSubmit={agregarRepuesto}>
                                <Select
                                    placeholder="Repuesto"
                                    value={nuevoRepuesto.repuestoId}
                                    onChange={(e) =>
                                        setNuevoRepuesto((f) => ({ ...f, repuestoId: e.target.value }))
                                    }
                                    opciones={catalogoRepuestos.map((r) => ({
                                        value: r.id,
                                        label: `${r.nombre} (${r.cantidadDisponible} disp.)`,
                                    }))}
                                />
                                <Input
                                    placeholder="Cant."
                                    type="number"
                                    min="1"
                                    value={nuevoRepuesto.cantidadUtilizada}
                                    onChange={(e) =>
                                        setNuevoRepuesto((f) => ({ ...f, cantidadUtilizada: e.target.value }))
                                    }
                                />
                                <Button type="submit" icono={<TbPlus />} disabled={procesandoLinea}>
                                    Agregar
                                </Button>
                            </form>
                        )}
                    </div>

                    <div className="panel-cristal orden-detalle-card">
                        <div className="orden-detalle-pagos-encabezado">
                            <h2>Pagos</h2>
                            <span className="orden-detalle-total">{formatoMoneda.format(orden.valorTotal)}</span>
                        </div>

                        {resumenPago && (
                            <div className="orden-detalle-resumen-pago">
                                <Badge
                                    tono={
                                        resumenPago.estado === "PAGADO"
                                            ? "success"
                                            : resumenPago.estado === "PAGO_PARCIAL"
                                              ? "warning"
                                              : "neutral"
                                    }
                                >
                                    {resumenPago.estado === "PAGADO"
                                        ? "Pagado"
                                        : resumenPago.estado === "PAGO_PARCIAL"
                                          ? "Pago parcial"
                                          : "Pendiente"}
                                </Badge>
                                <span>Pagado: {formatoMoneda.format(resumenPago.totalPagado)}</span>
                                <span>Saldo: {formatoMoneda.format(resumenPago.saldoPendiente)}</span>
                            </div>
                        )}

                        <ul className="orden-detalle-lista-pagos">
                            {pagos.length === 0 && <li className="tabla-datos-vacio">Sin pagos registrados.</li>}
                            {pagos.map((p) => (
                                <li key={p.id}>
                                    <span>{formatoMoneda.format(p.monto)}</span>
                                    <span>{p.metodoPago}</span>
                                    <Badge tono={p.estado === "ANULADO" ? "danger" : "success"}>{p.estado}</Badge>
                                </li>
                            ))}
                        </ul>

                        {puedePagos && (
                            <Button icono={<TbCoins />} onClick={() => setPagoModalAbierto(true)}>
                                Registrar pago
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            <ConfirmModal
                abierto={Boolean(estadoParaConfirmar)}
                titulo="Cambiar estado de la orden"
                mensaje={`¿Confirmas pasar la orden #${orden.id} a "${ESTADOS_ORDEN[estadoParaConfirmar]?.etiqueta}"?`}
                textoConfirmar="Confirmar"
                variantePeligro={estadoParaConfirmar === "CANCELADO"}
                cargando={cambiandoEstado}
                confirmar={confirmarCambioEstado}
                cancelar={() => setEstadoParaConfirmar(null)}
            />

            {pagoModalAbierto && (
                <RegistrarPagoModal
                    ordenId={ordenId}
                    saldoPendiente={resumenPago?.saldoPendiente}
                    cerrar={() => setPagoModalAbierto(false)}
                    alRegistrar={async () => {
                        setPagoModalAbierto(false);
                        await cargarTodo();
                    }}
                />
            )}
        </div>
    );
}
