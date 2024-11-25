const express = require('express');
const router = express.Router();
const connection = require('../database/db');

router.get('/pedidos_g/:year', (req, res) => {
  const year = req.params.year;

  const query = `
    SELECT MONTH(Fecha_Entrega) AS Mes, COUNT(ID_Pedido) AS TotalPedidos
    FROM pedidos
    WHERE YEAR(Fecha_Entrega) = ?
    GROUP BY MONTH(Fecha_Entrega)
    ORDER BY Mes
  `;

  connection.query(query, [year], (error, results) => {
    if (error) {
      console.error('Error al generar el reporte:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }

    res.json(results);
  });
});



module.exports = router;
