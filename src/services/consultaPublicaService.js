import api from "./api";

export async function consultarMoto({ placa, tipoDocumento, numeroDocumento }) {
    const { data } = await api.post("/api/publico/moto", { placa, tipoDocumento, numeroDocumento });
    return data;
}
