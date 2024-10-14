// Invocamos a express
const express = require('express');
const router = express.Router();

// Invocamos a la conexión de la base de datos
const connection = require('../database/db');

router.get('/compras_p', function(req, res) {
    connection.query(`
        SELECT c.ID_Compra, c.Fecha_Compra, c.Total_Compra, p.Nombre AS NombreProveedor
        FROM compras c
        INNER JOIN proveedores p ON c.ID_Proveedor = p.ID_Proveedor
        WHERE c.Estado = 2
        ORDER BY c.Fecha_Compra DESC
        LIMIT 200;
    `, (error, results) => {
        if (error) {
            console.error('Error al obtener datos de la tabla compras:', error);
            res.status(500).send('Error al obtener datos de la tabla compras');
        } else {
            res.render('./papeleria/compras', { results: results });
        }
    });
});

router.post('/compras_p/:id?', function(req, res) {
    const id = req.params.id;
    const opcion = req.body.opcion;
    
    switch(opcion) {
      
        case 'restaurar':
            connection.query('UPDATE compras SET Estado = 1 WHERE ID_Compra = ?', id, (error, result) => {
                if (error) {
                    console.error('Error al eliminar la Compra:', error);
                    res.status(500).send('Error al eliminar la Compra');
                } else {
                    res.status(200).send('Compra eliminada correctamente');
                }
            });
            break;
        default:
            res.status(400).send('Opción no válida');
            break;
    }
});

module.exports = router;
