const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');

// Endpoint que hace un WRITE real en la BD para contar como actividad
// y evitar que Supabase pause el proyecto por inactividad.
router.get('/health', async (req, res) => {
    try {
        await pool.query(
            `insert into keep_alive (id, last_ping) values (1, now())
             on conflict (id) do update set last_ping = now()`
        );
        res.status(200).send('OK');
    } catch (err) {
        console.error('Health check falló:', err);
        res.status(500).send('DB no disponible');
    }
});

module.exports = router;