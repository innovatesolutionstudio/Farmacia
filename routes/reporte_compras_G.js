const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const connection = require('../database/db');
const PDFDocument = require('pdfkit');
const { route } = require('./ciudades');
const bodyParser = require('body-parser');

router.get('/compras/compras_g/:year', (req, res) => {
    const year = req.params.year;
  
    const query = `
      SELECT MONTH(Fecha_Compra) AS Mes, SUM(Total_Compra) AS Total
      FROM compras
      WHERE YEAR(Fecha_Compra) = ?
      GROUP BY MONTH(Fecha_Compra)
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

