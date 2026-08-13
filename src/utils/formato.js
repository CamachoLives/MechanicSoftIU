// Reutilizado en Repuestos, OrdenesServicio y OrdenDetalle — antes cada uno
// declaraba su propia instancia idéntica de Intl.NumberFormat.
export const formatoMoneda = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
});
