import axios from "axios";

const API = "http://localhost:9769/api/vehiculos";

export const obtenerVehiculos = () => {
    return axios.get(API);
};

export const guardarVehiculo = (vehiculo) => {
    return axios.post(API, vehiculo);
};

export const eliminarVehiculo = (id) => {
    return axios.delete(`${API}/${id}`);
};

export const actualizarVehiculo = (id, vehiculo) => {
    return axios.put(`${API}/${id}`, vehiculo);
};