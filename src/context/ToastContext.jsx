import { createContext, useCallback, useContext, useState } from "react";
import Toast from "../components/Toast/Toast";
import "./ToastContext.css";

const ToastContext = createContext(null);

let contadorToast = 0;

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const quitarToast = useCallback((id) => {
        setToasts((actuales) => actuales.filter((t) => t.id !== id));
    }, []);

    const mostrarToast = useCallback(
        (mensaje, tipo = "info", duracion = 4500) => {
            const id = ++contadorToast;
            setToasts((actuales) => [...actuales, { id, mensaje, tipo }]);
            if (duracion > 0) {
                setTimeout(() => quitarToast(id), duracion);
            }
        },
        [quitarToast]
    );

    const valor = {
        mostrarToast,
        exito: (mensaje) => mostrarToast(mensaje, "exito"),
        error: (mensaje) => mostrarToast(mensaje, "error"),
        info: (mensaje) => mostrarToast(mensaje, "info"),
    };

    return (
        <ToastContext.Provider value={valor}>
            {children}
            <div className="toast-contenedor">
                {toasts.map((t) => (
                    <Toast key={t.id} tipo={t.tipo} cerrar={() => quitarToast(t.id)}>
                        {t.mensaje}
                    </Toast>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

// Hook colocado deliberadamente junto a su Provider (patrón común de Context);
// solo le cuesta el fast-refresh a este archivo, nada funcional.
// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
    const contexto = useContext(ToastContext);
    if (!contexto) {
        throw new Error("useToast debe usarse dentro de <ToastProvider>.");
    }
    return contexto;
}
