import axios from "axios";

const API = "http://localhost:9769/api/vehiculos";

export const obtenerVehiculos = () => {
    return axios.get(API);
};

export const guardarVehiculo = (vehiculo) => {
    return axios.post(API, vehiculo);
};

export const actualizarVehiculo = (id, vehiculo) => {
    return axios.put(`${API}/${id}`, vehiculo);
};

// El backend ya no borra vehículos físicamente (tienen órdenes reales
// colgando de ellos): se desactivan en su lugar.
export const cambiarEstadoVehiculo = (id, activo) => {
    return axios.patch(`${API}/${id}/estado`, { activo });
};
