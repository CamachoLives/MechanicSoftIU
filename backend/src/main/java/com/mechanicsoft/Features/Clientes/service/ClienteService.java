package com.mechanicsoft.Features.Clientes.service;

import com.mechanicsoft.Features.Clientes.entity.Cliente;
import java.util.List;
import java.util.Optional;

public interface ClienteService {

    List<Cliente> listar();

    Optional<Cliente> buscarPorId(Long id);

    Optional<Cliente> buscarPorTelefono(String telefono);

    Cliente guardar(Cliente cliente);

}