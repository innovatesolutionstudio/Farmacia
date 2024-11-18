const express = require('express');
const router = express.Router();
const connection = require('../database/db');


router.get('/ventas/ganancias_anuales/:year', (req, res) => {
    const year = req.params.year;

    const query = `
      SELECT 
          MONTH(v.Fecha_Venta) AS Mes,
          SUM(g.Ganancia_Total) AS Ganancia
      FROM ganancias g
      INNER JOIN detalles_venta dv ON g.ID_Detalle_Venta = dv.ID_Detalle_Venta
      INNER JOIN ventas v ON dv.ID_Venta = v.ID_Venta
      WHERE YEAR(v.Fecha_Venta) = ?
      GROUP BY MONTH(v.Fecha_Venta)
      ORDER BY MONTH(v.Fecha_Venta)
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
