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

router.get('/ventas/ventas_p/:year/:month', async (req, res) => {
    const  month= req.params.month;
    const  year = req.params.year;
  
        const  query =`
        SELECT pv.Nombre AS Proveedor, SUM(dv.Cantidad) AS Cantidad_Total
        FROM detalles_venta dv
        JOIN ventas v ON dv.ID_Venta = v.ID_Venta
        JOIN productos p ON dv.ID_Producto = p.ID_Producto
        JOIN proveedores pv ON p.ID_Proveedor = pv.ID_Proveedor
        WHERE YEAR(v.Fecha_Venta) = ? AND MONTH(v.Fecha_Venta) = ?
        GROUP BY pv.Nombre;
        
        `;
        connection.query(query, [year, month], (error, results) => {
            if (error) {
                console.error('Error al generar el reporte:', error);
                res.status(500).json({ error: 'Error interno del servidor' });
            } else {
                res.json(results);
            }
        });
});


  module.exports = router;
