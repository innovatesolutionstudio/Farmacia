// Invocamos a express
const express = require('express');
const router = express.Router();

// Invocamos a la conexión de la base de datos
const connection = require('../database/db');

router.get('/venta_espe', function(req, res) {
    // Realiza la consulta a la base de datos para obtener los datos de la tabla "ventas"
    connection.query('SELECT * FROM ventas ORDER BY Fecha_Venta DESC LIMIT 200;', (error, results) => {
        if (error) {
            console.error('Error al obtener datos de la tabla ventas:', error);
            res.status(500).send('Error al obtener datos de la tabla ventas');
        } else {
            // Renderiza la vista EJS y pasa los resultados de la consulta como variable
            res.render('./ventas/venta_espe', { results: results });
        }
    });
    
});

// Ruta para obtener los datos filtrados
router.get('/venta_espe/filtrar', function(req, res) {
    const { fechaInicio, fechaFin } = req.query;
    const query = `SELECT * FROM ventas WHERE Fecha_Venta BETWEEN ? AND ?`;
    connection.query(query, [fechaInicio + ' 00:00:00', fechaFin + ' 23:59:59'], (error, results) => {
        if (error) {
            return res.status(500).json({ error: error.message });
        }
        res.json(results);
    });
});


module.exports = router;
