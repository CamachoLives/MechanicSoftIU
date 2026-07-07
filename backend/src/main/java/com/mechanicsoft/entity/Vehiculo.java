package com.mechanicsoft.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor

@Entity
@Table(name = "vehiculos")
public class Vehiculo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "La placa es obligatoria")
    @Column(nullable = false, unique = true, length = 20)
    private String placa;

    @NotBlank(message = "La marca es obligatoria")
    @Column(nullable = false, length = 100)
    private String marca;

    @NotBlank(message = "El modelo es obligatorio")
    @Column(nullable = false, length = 100)
    private String modelo;

    @NotBlank(message = "El color es obligatorio")
    @Column(nullable = false, length = 50)
    private String color;

    @NotNull
    @Min(0)
    @Column(nullable = false)
    private Integer kilometraje;

    @NotNull
    @Min(50)
    @Column(name = "cilindraje_cc", nullable = false)
    private Integer cilindrajeCc;

    @Column(name = "foto_vehiculo")
    private String fotoVehiculo;

    @NotBlank(message = "El motivo de ingreso es obligatorio")
    @Column(name = "motivo_ingreso", nullable = false, length = 500)
    private String motivoIngreso;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    // ===========================
    // RELACIÓN CON CLIENTE
    // ===========================

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "cliente_id")
    private Cliente cliente;

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
    }

}