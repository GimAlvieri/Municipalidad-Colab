-- Esquema educativo para MariaDB/MySQL en Google Colab.
-- Solo incluye códigos y registros ficticios.

CREATE TABLE IF NOT EXISTS areas (
    id SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY areas_nombre_uq (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS solicitudes (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    codigo_trabajador VARCHAR(30) NOT NULL,
    area_id SMALLINT UNSIGNED NOT NULL,
    tipo ENUM('vacaciones', 'permiso') NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    estado ENUM('pendiente', 'aprobada', 'rechazada') NOT NULL DEFAULT 'pendiente',
    observacion_demo VARCHAR(255) NULL,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY solicitudes_estado_idx (estado),
    KEY solicitudes_fechas_idx (fecha_inicio, fecha_fin),
    CONSTRAINT solicitudes_area_fk FOREIGN KEY (area_id) REFERENCES areas (id),
    CONSTRAINT solicitudes_fechas_chk CHECK (fecha_fin >= fecha_inicio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO areas (nombre) VALUES
    ('Administración'),
    ('Obras'),
    ('Servicios Municipales');

INSERT INTO solicitudes
    (codigo_trabajador, area_id, tipo, fecha_inicio, fecha_fin, estado, observacion_demo)
SELECT datos.codigo, areas.id, datos.tipo, datos.inicio, datos.fin, datos.estado, 'Registro ficticio'
FROM (
    SELECT 'DEMO-001' AS codigo, 'Administración' AS area, 'vacaciones' AS tipo,
           '2026-12-01' AS inicio, '2026-12-05' AS fin, 'pendiente' AS estado
    UNION ALL
    SELECT 'DEMO-002', 'Obras', 'permiso', '2026-11-20', '2026-11-20', 'aprobada'
    UNION ALL
    SELECT 'DEMO-003', 'Servicios Municipales', 'vacaciones',
           '2026-12-14', '2026-12-18', 'rechazada'
) AS datos
JOIN areas ON areas.nombre = datos.area
WHERE NOT EXISTS (
    SELECT 1 FROM solicitudes existentes
    WHERE existentes.codigo_trabajador = datos.codigo
      AND existentes.fecha_inicio = datos.inicio
      AND existentes.tipo = datos.tipo
);

CREATE OR REPLACE VIEW resumen_por_estado AS
SELECT areas.nombre AS area, solicitudes.estado, solicitudes.tipo, COUNT(*) AS cantidad
FROM solicitudes
JOIN areas ON areas.id = solicitudes.area_id
GROUP BY areas.nombre, solicitudes.estado, solicitudes.tipo;
