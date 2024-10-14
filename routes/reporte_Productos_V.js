const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const connection = require('../database/db');
const PDFDocument = require('pdfkit');
const { route } = require('./ciudades');
const bodyParser = require('body-parser');

const util = require('util');
const query = util.promisify(connection.query).bind(connection);

router.get('/ventas/productos_mas_vendidos/:year/:month', async (req, res) => {
    const { year, month } = req.params;
    try {
        const results = await query(
            `SELECT p.Nombre as Producto, SUM(dv.Cantidad) as TotalVendido
             FROM detalles_venta dv
             JOIN productos p ON dv.ID_Producto = p.ID_Producto
             JOIN ventas v ON dv.ID_Venta = v.ID_Venta
             WHERE YEAR(v.Fecha_Venta) = ? AND MONTH(v.Fecha_Venta) = ?
             GROUP BY dv.ID_Producto
             ORDER BY TotalVendido DESC LIMIT 20`,
            [year, month]
        );
        res.json(results);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Error fetching data' });
    }
});
module.exports = router;

