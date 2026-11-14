require('dotenv').config();

const path = require('path');
const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '127.0.0.1';
const pool = process.env.DB_HOST ? mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'rrhh_app',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'rrhh_demo',
  waitForConnections: true,
  connectionLimit: 5,
  dateStrings: true
}) : null;

app.use(express.json({ limit: '20kb' }));
app.use(express.static(path.join(__dirname, 'public')));

function requireDatabase(_req, res, next) {
  if (!pool) {
    return res.status(503).json({ error: 'Configura DB_HOST, DB_NAME, DB_USER y DB_PASSWORD en el entorno.' });
  }
  next();
}

function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

app.get('/api/health', async (_req, res) => {
  if (!pool) return res.json({ databaseConfigured: false });
  try {
    await pool.query('SELECT 1');
    res.json({ databaseConfigured: true });
  } catch {
    res.status(503).json({ databaseConfigured: false });
  }
});

app.get('/api/areas', requireDatabase, async (_req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT id, nombre FROM areas ORDER BY nombre');
    res.json(rows);
  } catch (error) { next(error); }
});

app.get('/api/solicitudes', requireDatabase, async (req, res, next) => {
  try {
    const values = [];
    let filter = '';
    if (['pendiente', 'aprobada', 'rechazada'].includes(req.query.estado)) {
      values.push(req.query.estado);
      filter = 'AND s.estado = ?';
    }
    const [rows] = await pool.execute(`
      SELECT s.id, s.codigo_trabajador, a.nombre AS area, s.area_id,
             s.tipo, s.fecha_inicio, s.fecha_fin, s.estado, s.creado_en
      FROM solicitudes s
      JOIN areas a ON a.id = s.area_id
      WHERE s.codigo_trabajador LIKE 'DEMO-%' ${filter}
      ORDER BY s.fecha_inicio DESC, s.id DESC
      LIMIT 200
    `, values);
    res.json(rows);
  } catch (error) { next(error); }
});

app.post('/api/solicitudes', requireDatabase, async (req, res, next) => {
  const { codigo_trabajador: codigo, area_id: areaId, tipo, fecha_inicio: inicio, fecha_fin: fin } = req.body || {};
  if (typeof codigo !== 'string' || !/^DEMO-[A-Z0-9-]{1,24}$/i.test(codigo.trim())) {
    return res.status(400).json({ error: 'Usa un código ficticio como DEMO-004.' });
  }
  if (!['vacaciones', 'permiso'].includes(tipo)) {
    return res.status(400).json({ error: 'El tipo debe ser vacaciones o permiso.' });
  }
  if (!validDate(inicio) || !validDate(fin) || fin < inicio) {
    return res.status(400).json({ error: 'Revisa las fechas: la fecha final no puede ser anterior a la inicial.' });
  }
  if (!Number.isInteger(Number(areaId)) || Number(areaId) < 1) {
    return res.status(400).json({ error: 'Selecciona un área válida.' });
  }
  try {
    const [result] = await pool.execute(`
      INSERT INTO solicitudes
        (codigo_trabajador, area_id, tipo, fecha_inicio, fecha_fin, estado, observacion_demo)
      VALUES (?, ?, ?, ?, ?, 'pendiente', 'Registro ficticio desde la demo web')
    `, [codigo.trim().toUpperCase(), Number(areaId), tipo, inicio, fin]);
    const [rows] = await pool.execute(`
      SELECT id, codigo_trabajador, area_id, tipo, fecha_inicio, fecha_fin, estado
      FROM solicitudes WHERE id = ?
    `, [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    if (error.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ error: 'El área seleccionada no existe.' });
    next(error);
  }
});

app.patch('/api/solicitudes/:id/estado', requireDatabase, async (req, res, next) => {
  const id = Number(req.params.id);
  const { estado } = req.body || {};
  if (!Number.isSafeInteger(id) || id < 1 || !['aprobada', 'rechazada'].includes(estado)) {
    return res.status(400).json({ error: 'Solicitud o decisión inválida.' });
  }
  try {
    const [result] = await pool.execute(`
      UPDATE solicitudes SET estado = ?
      WHERE id = ? AND estado = 'pendiente' AND codigo_trabajador LIKE 'DEMO-%'
    `, [estado, id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'No se encontró una solicitud ficticia pendiente con ese código.' });
    res.json({ id, estado });
  } catch (error) { next(error); }
});

app.use('/api', (error, _req, res, _next) => {
  console.error(error.message);
  res.status(500).json({ error: 'No se pudo completar la operación. Revisa MariaDB y ejecuta sql/schema.sql.' });
});

app.listen(port, host, () => {
  console.log(`Demo RR. HH. disponible en http://${host}:${port}`);
});

async function closePool() {
  if (pool) await pool.end();
  process.exit(0);
}
process.on('SIGINT', closePool);
process.on('SIGTERM', closePool);
