import api from "./api";

const API = "/api/vehiculos";

export const obtenerVehiculos = () => {
    return api.get(API);
};

export const guardarVehiculo = (vehiculo) => {
    return api.post(API, vehiculo);
};

export const actualizarVehiculo = (id, vehiculo) => {
    return api.put(`${API}/${id}`, vehiculo);
};

// El backend ya no borra vehículos físicamente (tienen órdenes reales
// colgando de ellos): se desactivan en su lugar.
export const cambiarEstadoVehiculo = (id, activo) => {
    return api.patch(`${API}/${id}/estado`, { activo });
};
