const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');

// Endpoint liviano para mantener activa la conexión a Supabase
// y confirmar que el servidor + base de datos están funcionando.
router.get('/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.status(200).send('OK');
    } catch (err) {
        console.error('Health check falló:', err);
        res.status(500).send('DB no disponible');
    }
});

module.exports = router;