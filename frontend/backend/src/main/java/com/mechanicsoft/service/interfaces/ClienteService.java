package com.mechanicsoft.service.interfaces;

import com.mechanicsoft.entity.Cliente;

import java.util.List;
import java.util.Optional;

public interface ClienteService {

    List<Cliente> listar();

    Optional<Cliente> buscarPorId(Long id);

    Optional<Cliente> buscarPorTelefono(String telefono);

    Cliente guardar(Cliente cliente);

}