package com.mechanicsoft.service.impl;

import com.mechanicsoft.entity.Vehiculo;
import com.mechanicsoft.repository.VehiculoRepository;
import com.mechanicsoft.service.interfaces.VehiculoService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class VehiculoServiceImpl implements VehiculoService {

    private final VehiculoRepository repository;

    public VehiculoServiceImpl(VehiculoRepository repository) {
        this.repository = repository;
    }

    @Override
    public Vehiculo guardar(Vehiculo vehiculo) {
        return repository.save(vehiculo);
    }

    @Override
    public List<Vehiculo> listar() {
        return repository.findAll();
    }

    @Override
    public Optional<Vehiculo> buscarPorId(Long id) {
        return repository.findById(id);
    }

    @Override
    public Optional<Vehiculo> buscarPorPlaca(String placa) {
        return repository.findByPlaca(placa);
    }

    @Override
    public Optional<Vehiculo> buscarPorTelefono(String telefono) {
        return repository.findByTelefonoActual(telefono);
    }

    @Override
    public Vehiculo actualizar(Long id, Vehiculo vehiculo) {

        Vehiculo existente = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vehículo no encontrado"));

        existente.setPlaca(vehiculo.getPlaca());
        existente.setMarca(vehiculo.getMarca());
        existente.setModelo(vehiculo.getModelo());
        existente.setColor(vehiculo.getColor());
        existente.setKilometraje(vehiculo.getKilometraje());
        existente.setCilindrajeCc(vehiculo.getCilindrajeCc());
        existente.setFotoVehiculo(vehiculo.getFotoVehiculo());
        existente.setPropietarioActual(vehiculo.getPropietarioActual());
        existente.setTelefonoActual(vehiculo.getTelefonoActual());

        return repository.save(existente);
    }

    @Override
    public void eliminar(Long id) {
        repository.deleteById(id);
    }
}