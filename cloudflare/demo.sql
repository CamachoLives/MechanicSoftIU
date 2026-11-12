-- Datos de ejemplo para mostrar la aplicación (opcional). Se pueden borrar desde la app o recreando la base.
INSERT OR IGNORE INTO clientes (id, nombre, apellido, telefono, correo, tipo_documento, numero_documento, created_at, activo) VALUES
  (1, 'Andrés', 'Martínez', '3104567890', 'andres.martinez@ejemplo.com', 'CC', '1012345678', '2026-11-03T09:15:00.000', 1),
  (2, 'Paola', 'Rincón', '3157894561', NULL, 'CC', '52987654', '2026-11-05T14:40:00.000', 1),
  (3, 'Kevin', 'Suárez', '3001239876', 'kevin.suarez@ejemplo.com', 'CE', 'E8812345', '2026-11-08T11:05:00.000', 1);

INSERT OR IGNORE INTO vehiculos (id, placa, marca, modelo, anio, color, kilometraje, cilindraje_cc, foto_vehiculo, observaciones, cliente_id, activo, created_at, updated_at) VALUES
  (1, 'ABC12D', 'Yamaha', 'FZ 2.0', 2021, 'Azul', 18450, 150, NULL, NULL, 1, 1, '2026-11-03T09:20:00.000', '2026-11-03T09:20:00.000'),
  (2, 'XYZ98K', 'Honda', 'CB 190R', 2022, 'Rojo', 9800, 184, NULL, 'Rayón en el tanque', 2, 1, '2026-11-05T14:45:00.000', '2026-11-05T14:45:00.000'),
  (3, 'JKL45M', 'Suzuki', 'Gixxer 150', 2020, 'Negro', 32100, 155, NULL, NULL, 3, 1, '2026-11-08T11:10:00.000', '2026-11-08T11:10:00.000');

INSERT OR IGNORE INTO repuestos (id, nombre, codigo, descripcion, precio, cantidad_disponible, activo, created_at, version) VALUES
  (1, 'Aceite 20W-50 1L', 'ACE-2050', 'Aceite mineral para motor 4T', 32000, 24, 1, '2026-11-01T08:00:00.000', 0),
  (2, 'Filtro de aceite', 'FIL-ACE-01', 'Compatible Yamaha FZ / Suzuki Gixxer', 18000, 15, 1, '2026-11-01T08:00:00.000', 0),
  (3, 'Pastillas de freno delanteras', 'PAS-DEL-02', NULL, 45000, 8, 1, '2026-11-01T08:00:00.000', 0),
  (4, 'Kit de arrastre', 'KIT-ARR-150', 'Cadena, piñón y corona 150cc', 185000, 4, 1, '2026-11-01T08:00:00.000', 0),
  (5, 'Bujía', 'BUJ-CR7', 'NGK CR7HSA', 15000, 30, 1, '2026-11-01T08:00:00.000', 0);

INSERT OR IGNORE INTO ordenes_servicio (id, vehiculo_id, kilometraje_ingreso, fecha_ingreso, motivo_ingreso, diagnostico, trabajo_realizado, observaciones, estado, valor_total, fecha_entrega, created_at, updated_at) VALUES
  (1, 1, 18450, '2026-11-09T10:00:00.000', 'Cambio de aceite y revisión general', 'Aceite degradado, filtro sucio', NULL, NULL, 'EN_REPARACION', 105000, NULL, '2026-11-09T10:00:00.000', '2026-11-09T10:30:00.000'),
  (2, 2, 9800, '2026-11-10T16:20:00.000', 'Ruido al frenar', NULL, NULL, 'Cliente espera llamada', 'RECIBIDO', 0, NULL, '2026-11-10T16:20:00.000', '2026-11-10T16:20:00.000');

INSERT OR IGNORE INTO servicios_orden (id, orden_id, nombre_servicio, descripcion, cantidad, precio_unitario, subtotal) VALUES
  (1, 1, 'Mano de obra cambio de aceite', NULL, 1, 25000, 25000),
  (2, 1, 'Revisión general', 'Frenos, luces y suspensión', 1, 30000, 30000);

INSERT OR IGNORE INTO repuestos_orden (id, orden_id, repuesto_id, cantidad_utilizada, precio_unitario, subtotal) VALUES
  (1, 1, 1, 1, 32000, 32000),
  (2, 1, 2, 1, 18000, 18000);

INSERT OR IGNORE INTO orden_mecanicos (orden_id, usuario_id) VALUES (1, 3);
