require('dotenv').config();

const path = require('node:path');
const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = Number(process.env.PORT || 3000);
const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL, max: 5 })
  : null;

app.use(express.json({ limit: '20kb' }));
app.use(express.static(path.join(__dirname, 'public')));

function requireDatabase(_req, res, next) {
  if (!pool) {
    return res.status(503).json({
      error: 'Falta configurar DATABASE_URL. Copia .env.example como .env y agrega la conexión de Supabase.'
    });
  }
  next();
}

function validDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

app.get('/api/health', (_req, res) => {
  res.json({ databaseConfigured: Boolean(pool) });
});

app.get('/api/areas', requireDatabase, async (_req, res, next) => {
  try {
    const result = await pool.query('select id, nombre from rrhh_demo.areas order by nombre');
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

app.get('/api/solicitudes', requireDatabase, async (req, res, next) => {
  try {
    const values = [];
    let filter = '';
    if (['pendiente', 'aprobada', 'rechazada'].includes(req.query.estado)) {
      values.push(req.query.estado);
      filter = `and s.estado = $${values.length}`;
    }
    const result = await pool.query(`
      select s.id, s.codigo_trabajador, a.nombre as area, s.area_id,
             s.tipo, s.fecha_inicio, s.fecha_fin, s.estado, s.creado_en
      from rrhh_demo.solicitudes s
      join rrhh_demo.areas a on a.id = s.area_id
      where s.codigo_trabajador like 'DEMO-%' ${filter}
      order by s.fecha_inicio desc, s.id desc
      limit 200
    `, values);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
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
    return res.status(400).json({ error: 'Revisa las fechas: ambas son obligatorias y la fecha final no puede ser anterior.' });
  }
  if (!Number.isInteger(Number(areaId)) || Number(areaId) < 1) {
    return res.status(400).json({ error: 'Selecciona un área válida.' });
  }

  try {
    const result = await pool.query(`
      insert into rrhh_demo.solicitudes
        (codigo_trabajador, area_id, tipo, fecha_inicio, fecha_fin, estado, observacion_demo)
      values ($1, $2, $3, $4, $5, 'pendiente', 'Registro ficticio desde la demo web')
      returning id, codigo_trabajador, area_id, tipo, fecha_inicio, fecha_fin, estado
    `, [codigo.trim().toUpperCase(), Number(areaId), tipo, inicio, fin]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23503') return res.status(400).json({ error: 'El área seleccionada no existe.' });
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
    const result = await pool.query(`
      update rrhh_demo.solicitudes
      set estado = $1
      where id = $2 and estado = 'pendiente' and codigo_trabajador like 'DEMO-%'
      returning id, estado
    `, [estado, id]);
    if (!result.rowCount) return res.status(404).json({ error: 'No se encontró una solicitud ficticia pendiente con ese código.' });
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

app.use('/api', (error, _req, res, _next) => {
  console.error(error.message);
  res.status(500).json({ error: 'No se pudo completar la operación. Revisa la conexión y que hayas ejecutado sql/schema.sql.' });
});

app.listen(port, '127.0.0.1', () => {
  console.log(`Demo RR. HH. disponible en http://localhost:${port}`);
  if (!pool) console.log('Configura DATABASE_URL en .env para habilitar la base de datos.');
});

async function closePool() {
  if (pool) await pool.end();
  process.exit(0);
}
process.on('SIGINT', closePool);
process.on('SIGTERM', closePool);
