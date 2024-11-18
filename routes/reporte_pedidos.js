const express = require('express');
const router = express.Router();
const connection = require('../database/db');




  
  router.get('/pedidos/pedidos_anuales/:year', (req, res) => {
    const year = req.params.year;

    const query = `
      SELECT MONTH(p.Fecha_Entrega) AS Mes, COUNT(p.ID_Pedido) AS TotalPedidos
      FROM pedidos p
      WHERE YEAR(p.Fecha_Entrega) = ?
      GROUP BY MONTH(p.Fecha_Entrega)
    `;

    connection.query(query, [year], (error, results) => {
        if (error) {
            console.error('Error al generar el reporte de pedidos:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        } else {
            res.json(results);
        }
    });
});
  module.exports = router;
