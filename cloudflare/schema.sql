-- MechanicSoft - esquema D1 (SQLite). Equivale a las tablas que crea Hibernate en el backend Spring Boot.

CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  permisos TEXT NOT NULL DEFAULT '[]',       -- JSON con la lista de permisos
  color_badge TEXT,
  es_sistema INTEGER NOT NULL DEFAULT 0,
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario TEXT NOT NULL UNIQUE,
  contrasena TEXT NOT NULL,                  -- pbkdf2$iteraciones$sal$hash
  nombre TEXT NOT NULL,
  correo TEXT,
  telefono TEXT,
  cargo TEXT,
  rol_id INTEGER NOT NULL REFERENCES roles(id),
  activo INTEGER NOT NULL DEFAULT 1,
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS grupos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  rol_bonus_id INTEGER REFERENCES roles(id),
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS grupo_miembros (
  grupo_id INTEGER NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
  PRIMARY KEY (grupo_id, usuario_id)
);

CREATE TABLE IF NOT EXISTS clientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  apellido TEXT,
  telefono TEXT NOT NULL UNIQUE,
  correo TEXT,
  tipo_documento TEXT,
  numero_documento TEXT,
  created_at TEXT,
  activo INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS vehiculos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  placa TEXT NOT NULL UNIQUE,
  marca TEXT NOT NULL,
  modelo TEXT NOT NULL,
  anio INTEGER NOT NULL,
  color TEXT NOT NULL,
  kilometraje INTEGER NOT NULL,
  cilindraje_cc INTEGER NOT NULL,
  foto_vehiculo TEXT,
  observaciones TEXT,
  cliente_id INTEGER NOT NULL REFERENCES clientes(id),
  activo INTEGER NOT NULL DEFAULT 1,
  created_at TEXT,
  updated_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_vehiculos_cliente_id ON vehiculos(cliente_id);

CREATE TABLE IF NOT EXISTS repuestos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  codigo TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  precio REAL NOT NULL,
  cantidad_disponible INTEGER NOT NULL CHECK (cantidad_disponible >= 0),
  activo INTEGER NOT NULL DEFAULT 1,
  created_at TEXT,
  version INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS ordenes_servicio (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehiculo_id INTEGER NOT NULL REFERENCES vehiculos(id),
  kilometraje_ingreso INTEGER NOT NULL,
  fecha_ingreso TEXT,
  motivo_ingreso TEXT NOT NULL,
  diagnostico TEXT,
  trabajo_realizado TEXT,
  observaciones TEXT,
  estado TEXT NOT NULL DEFAULT 'RECIBIDO',
  valor_total REAL NOT NULL DEFAULT 0,
  fecha_entrega TEXT,
  created_at TEXT,
  updated_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_ordenes_vehiculo_id ON ordenes_servicio(vehiculo_id);

CREATE TABLE IF NOT EXISTS orden_mecanicos (
  orden_id INTEGER NOT NULL REFERENCES ordenes_servicio(id),
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
  PRIMARY KEY (orden_id, usuario_id)
);

CREATE TABLE IF NOT EXISTS servicios_orden (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  orden_id INTEGER NOT NULL REFERENCES ordenes_servicio(id),
  nombre_servicio TEXT NOT NULL,
  descripcion TEXT,
  cantidad INTEGER NOT NULL,
  precio_unitario REAL NOT NULL,
  subtotal REAL NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_servicios_orden_orden_id ON servicios_orden(orden_id);

CREATE TABLE IF NOT EXISTS repuestos_orden (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  orden_id INTEGER NOT NULL REFERENCES ordenes_servicio(id),
  repuesto_id INTEGER NOT NULL REFERENCES repuestos(id),
  cantidad_utilizada INTEGER NOT NULL,
  precio_unitario REAL NOT NULL,
  subtotal REAL NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_repuestos_orden_orden_id ON repuestos_orden(orden_id);

CREATE TABLE IF NOT EXISTS pagos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  orden_id INTEGER NOT NULL REFERENCES ordenes_servicio(id),
  monto REAL NOT NULL,
  metodo_pago TEXT NOT NULL,
  fecha_pago TEXT,
  estado TEXT NOT NULL DEFAULT 'PAGADO'
);
CREATE INDEX IF NOT EXISTS idx_pagos_orden_id ON pagos(orden_id);

-- Límite de la consulta pública: 10 intentos por IP cada hora.
CREATE TABLE IF NOT EXISTS limites_consulta (
  ip TEXT PRIMARY KEY,
  intentos INTEGER NOT NULL,
  inicio INTEGER NOT NULL                    -- epoch ms
);
