// Invocamos a express
const express = require('express');
const router = express.Router();

// Invocamos a la conexión de la base de datos
const conexion = require('../database/db');


router.get('/ganancias_es', function(req, res) {
    // Realiza la consulta a la base de datos para obtener las ganancias por año
    const query = `
        SELECT YEAR(v.Fecha_Venta) AS Ano, SUM(g.Ganancia_Total) AS Ganancia_Total_Anual
        FROM ganancias g
        JOIN detalles_venta dv ON g.ID_Detalle_Venta = dv.ID_Detalle_Venta
        JOIN ventas v ON dv.ID_Venta = v.ID_Venta
        GROUP BY YEAR(v.Fecha_Venta)
        ORDER BY Ano;
    `;
    conexion.query(query, (error, results) => {
        if (error) {
            console.error('Error al obtener datos de la tabla ganancias:', error);
            res.status(500).send('Error al obtener datos de la tabla ganancias');
        } else {
            // Renderiza la vista EJS y pasa los resultados de la consulta como variable
            res.render('./ganancias/ganancias_es', { results: results });
        }
    });
});

module.exports = router;
