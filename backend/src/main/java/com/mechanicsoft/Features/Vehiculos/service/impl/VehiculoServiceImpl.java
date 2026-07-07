package com.mechanicsoft.Features.Vehiculos.service.impl;

import com.mechanicsoft.Features.Clientes.entity.Cliente;
import com.mechanicsoft.Features.Clientes.repository.ClienteRepository;
import com.mechanicsoft.Features.Vehiculos.entity.Vehiculo;
import com.mechanicsoft.Features.Vehiculos.repository.VehiculoRepository;
import com.mechanicsoft.Features.Vehiculos.service.interfaces.VehiculoService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service // ¡Anotación vital agregada aquí!
public class VehiculoServiceImpl implements VehiculoService {

    private final VehiculoRepository repository;
    private final ClienteRepository clienteRepository;

    // Constructor limpio corregido
    public VehiculoServiceImpl(
            VehiculoRepository repository,
            ClienteRepository clienteRepository
    ) {
        this.repository = repository;
        this.clienteRepository = clienteRepository;
    }

    @Override
    public Vehiculo guardar(Vehiculo vehiculo) {

        Cliente clienteFormulario = vehiculo.getCliente();

        Optional<Cliente> clienteExistente =
                clienteRepository.findByTelefono(clienteFormulario.getTelefono());

        Cliente cliente;

        if (clienteExistente.isPresent()) {
            cliente = clienteExistente.get();
            cliente.setNombre(clienteFormulario.getNombre());
            cliente.setCorreo(clienteFormulario.getCorreo());
            clienteRepository.save(cliente);
        } else {
            cliente = clienteRepository.save(clienteFormulario);
        }

        vehiculo.setCliente(cliente);
        return repository.save(vehiculo);
    }

    @Override
    public List<Vehiculo> listar() {
        return List.of();
    }

    @Override
    public Optional<Vehiculo> buscarPorId(Long id) {
        return Optional.empty();
    }

    // Basura de Git eliminada. Método limpio.
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

        Cliente clienteFormulario = vehiculo.getCliente();

        Optional<Cliente> clienteExistente =
                clienteRepository.findByTelefono(clienteFormulario.getTelefono());

        Cliente cliente;

        if (clienteExistente.isPresent()) {
            cliente = clienteExistente.get();
            cliente.setNombre(clienteFormulario.getNombre());
            cliente.setCorreo(clienteFormulario.getCorreo());
            clienteRepository.save(cliente);
        } else {
            cliente = clienteRepository.save(clienteFormulario);
        }

        existente.setCliente(cliente);
        existente.setPlaca(vehiculo.getPlaca());
        existente.setMarca(vehiculo.getMarca());
        existente.setModelo(vehiculo.getModelo());
        existente.setColor(vehiculo.getColor());
        existente.setKilometraje(vehiculo.getKilometraje());
        existente.setCilindrajeCc(vehiculo.getCilindrajeCc());
        existente.setFotoVehiculo(vehiculo.getFotoVehiculo());
        existente.setPropietarioActual(vehiculo.getPropietarioActual());
        existente.setTelefonoActual(vehiculo.getTelefonoActual());
        existente.setMotivoIngreso(vehiculo.getMotivoIngreso());

        return repository.save(existente);
    }

    @Override
    public void eliminar(Long id) {
        repository.deleteById(id);
    }
}