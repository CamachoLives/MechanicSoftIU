import { useEffect, useState } from "react";
import { TbPlus, TbEye } from "react-icons/tb";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { obtenerOrdenes } from "../../services/ordenServicioService";
import { mensajeError } from "../../utils/apiError";
import Button from "../../components/Button/Button";
import Badge from "../../components/Badge/Badge";
import Select from "../../components/Select/Select";
import { ESTADOS_ORDEN } from "./estadosOrden";
import NuevaOrdenModal from "./NuevaOrdenModal";
import OrdenDetalle from "./OrdenDetalle";
import { formatoMoneda } from "../../utils/formato";
import "./OrdenesServicio.css";


export default function OrdenesServicio() {
    const { tienePermiso } = useAuth();
    const toast = useToast();

    const [ordenes, setOrdenes] = useState([]);
    const [filtroEstado, setFiltroEstado] = useState("");
    const [cargando, setCargando] = useState(true);
    const [creandoOrden, setCreandoOrden] = useState(false);
    const [ordenSeleccionadaId, setOrdenSeleccionadaId] = useState(null);

    const puedeCrear = tienePermiso("ordenes.crear");

    const cargar = async (estado) => {
        setCargando(true);
        try {
            setOrdenes(await obtenerOrdenes({ estado: estado || undefined }));
        } catch (error) {
            toast.error(mensajeError(error, "No se pudo cargar las órdenes."));
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

    if (ordenSeleccionadaId) {
        return (
            <OrdenDetalle
                ordenId={ordenSeleccionadaId}
                volver={() => {
                    setOrdenSeleccionadaId(null);
                    cargar(filtroEstado);
                }}
            />
        );
    }

    return (
        <div className="ordenes-pagina">
            <h1>Órdenes de servicio</h1>
            <p className="ordenes-subtitulo">
                Desde que la moto ingresa al taller hasta que se entrega al cliente.
            </p>

            <div className="ordenes-filtros">
                <Select
                    label="Filtrar por estado"
                    placeholder="Todas"
                    value={filtroEstado}
                    onChange={(e) => {
                        setFiltroEstado(e.target.value);
                        cargar(e.target.value);
                    }}
                    opciones={Object.entries(ESTADOS_ORDEN).map(([clave, info]) => ({
                        value: clave,
                        label: info.etiqueta,
                    }))}
                    className="ordenes-filtro-estado"
                />
                {puedeCrear && (
                    <Button icono={<TbPlus />} onClick={() => setCreandoOrden(true)}>
                        Nueva orden
                    </Button>
                )}
            </div>

            {cargando ? (
                <p className="tabla-datos-cargando">Cargando órdenes...</p>
            ) : (
                <div className="tabla-datos-contenedor">
                    <table className="tabla-datos">
                        <thead>
                            <tr>
                                <th>Orden</th>
                                <th>Vehículo</th>
                                <th>Cliente</th>
                                <th>Estado</th>
                                <th>Valor total</th>
                                <th>Ingreso</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ordenes.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="tabla-datos-vacio">
                                        No hay órdenes de servicio con ese filtro.
                                    </td>
                                </tr>
                            ) : (
                                ordenes.map((orden) => {
                                    const estadoInfo = ESTADOS_ORDEN[orden.estado] ?? ESTADOS_ORDEN.RECIBIDO;
                                    const EstadoIcono = estadoInfo.Icono;
                                    return (
                                        <tr key={orden.id}>
                                            <td>#{orden.id}</td>
                                            <td>
                                                <div className="celda-principal">
                                                    <strong>{orden.vehiculo?.placa}</strong>
                                                    <span>
                                                        {orden.vehiculo?.marca} {orden.vehiculo?.modelo}
                                                    </span>
                                                </div>
                                            </td>
                                            <td>{orden.vehiculo?.cliente?.nombre ?? "—"}</td>
                                            <td>
                                                <Badge tono={estadoInfo.tono} icono={<EstadoIcono />}>
                                                    {estadoInfo.etiqueta}
                                                </Badge>
                                            </td>
                                            <td>{formatoMoneda.format(orden.valorTotal ?? 0)}</td>
                                            <td>
                                                {orden.fechaIngreso
                                                    ? new Date(orden.fechaIngreso).toLocaleDateString()
                                                    : ""}
                                            </td>
                                            <td>
                                                <div className="tabla-acciones">
                                                    <Button
                                                        variante="secundario"
                                                        icono={<TbEye />}
                                                        onClick={() => setOrdenSeleccionadaId(orden.id)}
                                                    >
                                                        Ver
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {creandoOrden && (
                <NuevaOrdenModal
                    cerrar={() => setCreandoOrden(false)}
                    alCrear={(ordenId) => {
                        setCreandoOrden(false);
                        setOrdenSeleccionadaId(ordenId);
                    }}
                />
            )}
        </div>
    );
}
