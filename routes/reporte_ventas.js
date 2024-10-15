const express = require('express');
const router = express.Router();
const connection = require('../database/db');


router.get('/ventas/ventas_g/:year', (req, res) => {
    const year = req.params.year;

    const query = `
      SELECT MONTH(Fecha_Venta) AS Mes, SUM(Total_Venta) AS Total
      FROM ventas
      WHERE YEAR(Fecha_Venta) = ?
      GROUP BY MONTH(Fecha_Venta)
    `;

    connection.query(query, [year], (error, results) => {
        if (error) {
            console.error('Error al generar el reporte:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        } else {
            res.json(results);
        }
    });
});



  module.exports = router;
