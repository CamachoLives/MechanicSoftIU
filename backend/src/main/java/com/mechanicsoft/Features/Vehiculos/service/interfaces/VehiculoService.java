package com.mechanicsoft.Features.Vehiculos.service.interfaces;

import com.mechanicsoft.Features.Vehiculos.entity.Vehiculo;

import java.util.List;
import java.util.Optional;

public interface VehiculoService {

    Vehiculo guardar(Vehiculo vehiculo);

    List<Vehiculo> listar();

    Optional<Vehiculo> buscarPorId(Long id);

    Optional<Vehiculo> buscarPorPlaca(String placa);

    Optional<Vehiculo> buscarPorTelefono(String telefono);

    Vehiculo actualizar(Long id, Vehiculo vehiculo);

    void eliminar(Long id);

}