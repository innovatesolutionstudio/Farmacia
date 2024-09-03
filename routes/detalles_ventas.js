// Invocamos a express
const express = require('express');
const router = express.Router();

// Invocamos a la conexión de la base de datos
const connection = require('../database/db');

router.get('/detalles_ventas', function(req, res) {
    // Realiza la consulta a la base de datos para obtener los datos de la tabla "detalles_venta"
    connection.query('SELECT * FROM detalles_venta ORDER BY ID_Detalle_Venta DESC LIMIT 200;', (error, results) => {
        if (error) {
            console.error('Error al obtener datos de la tabla detalles_venta:', error);
            res.status(500).send('Error al obtener datos de la tabla detalles_venta');
        } else {
            // Renderiza la vista EJS y pasa los resultados de la consulta como variable
            res.render('./detalles_ventas/detalles_ventas', { results: results });
        }
    });
});

router.post('/detalles_ventas/:id?', function(req, res) {
    const id = req.params.id; // Obtener el ID del detalle de venta, si se proporciona
    const opcion = req.body.opcion; // Obtener la opción (crear, editar, eliminar)
    
    switch(opcion) {
        case 'crear':
            const nuevoDetalleVenta = {
                ID_Venta: req.body.ID_Venta,
                ID_Producto: req.body.ID_Producto,
                Cantidad: req.body.Cantidad
            };
            connection.query('INSERT INTO detalles_venta SET ?', nuevoDetalleVenta, (error, result) => {
                if (error) {
                    console.error('Error al insertar un nuevo detalle de venta:', error);
                    res.status(500).send('Error al insertar un nuevo detalle de venta');
                } else {
                    res.status(200).send('Detalle de venta creado correctamente');
                }
            });
            break;
        case 'editar':
            const datosDetalleVenta = {
                ID_Venta: req.body.ID_Venta,
                ID_Producto: req.body.ID_Producto,
                Cantidad: req.body.Cantidad
            };
            connection.query('UPDATE detalles_venta SET ? WHERE ID_Detalle_Venta = ?', [datosDetalleVenta, id], (error, result) => {
                if (error) {
                    console.error('Error al actualizar el detalle de venta:', error);
                    res.status(500).send('Error al actualizar el detalle de venta');
                } else {
                    res.status(200).send('Detalle de venta actualizado correctamente');
                }
            });
            break;
        case 'eliminar':
            connection.query('DELETE FROM detalles_venta WHERE ID_Detalle_Venta = ?', id, (error, result) => {
                if (error) {
                    console.error('Error al eliminar el detalle de venta:', error);
                    res.status(500).send('Error al eliminar el detalle de venta');
                } else {
                    res.status(200).send('Detalle de venta eliminado correctamente');
                }
            });
            break;
        default:
            res.status(400).send('Opción no válida');
            break;
    }
});

module.exports = router;
