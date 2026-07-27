import Modal from "./Modal";
import Button from "../Button/Button";

export default function ConfirmModal({
    abierto,
    titulo = "Confirmar acción",
    mensaje,
    textoConfirmar = "Confirmar",
    variantePeligro = false,
    cargando = false,
    confirmar,
    cancelar,
}) {
    return (
        <Modal
            abierto={abierto}
            titulo={titulo}
            cerrar={cancelar}
            pie={
                <>
                    <Button variante="secundario" onClick={cancelar} disabled={cargando}>
                        Cancelar
                    </Button>
                    <Button
                        variante={variantePeligro ? "peligro" : "primario"}
                        onClick={confirmar}
                        disabled={cargando}
                    >
                        {cargando ? "Procesando..." : textoConfirmar}
                    </Button>
                </>
            }
        >
            <p className="confirm-modal-mensaje">{mensaje}</p>
        </Modal>
    );
}
