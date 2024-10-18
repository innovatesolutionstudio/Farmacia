// Invocamos a express
const express = require('express');
const router = express.Router();

// Invocamos a la conexión de la base de datos
const connection = require('../database/db');

router.get('/detalles_compras', function(req, res) {
    // Realiza la consulta a la base de datos para obtener los datos de la tabla "detalles_compra"
    connection.query('SELECT * FROM detalles_compra ORDER BY ID_Detalle_Compra DESC LIMIT 200;', (error, results) => {
        if (error) {
            console.error('Error al obtener datos de la tabla detalles_compra:', error);
            res.status(500).send('Error al obtener datos de la tabla detalles_compra');
        } else {
            // Renderiza la vista EJS y pasa los resultados de la consulta como variable
            res.render('./detalles_compras/detalles_compras', { results: results });
        }
    });
});

router.post('/detalles_compras/:id?', function(req, res) {
    const id = req.params.id; // Obtener el ID del detalle de compra, si se proporciona
    const opcion = req.body.opcion; // Obtener la opción (crear, editar, eliminar)
    
    switch(opcion) {
        case 'crear':
            const nuevoDetalleCompra = {
                ID_Compra: req.body.ID_Compra,
                ID_Producto: req.body.ID_Producto,
                Cantidad_Empaque: req.body.Cantidad_Empaque,
                Cantidad_Unitario: req.body.Cantidad_Unitario,
                Fecha_Vencimiento: req.body.Fecha_Vencimiento,
                Precio_Unitario: req.body.Precio_Unitario,
                ID_Unidad_Empaque: req.body.ID_Unidad_Empaque
            };
            connection.query('INSERT INTO detalles_compra SET ?', nuevoDetalleCompra, (error, result) => {
                if (error) {
                    console.error('Error al insertar un nuevo detalle de compra:', error);
                    res.status(500).send('Error al insertar un nuevo detalle de compra');
                } else {
                    res.status(200).send('Detalle de compra creado correctamente');
                }
            });
            break;
        case 'editar':
            const datosDetalleCompra = {
                ID_Compra: req.body.ID_Compra,
                ID_Producto: req.body.ID_Producto,
                Cantidad_Empaque: req.body.Cantidad_Empaque,
                Cantidad_Unitario: req.body.Cantidad_Unitario,
                Fecha_Vencimiento: req.body.Fecha_Vencimiento,
                Precio_Unitario: req.body.Precio_Unitario,
                ID_Unidad_Empaque: req.body.ID_Unidad_Empaque
            };
            connection.query('UPDATE detalles_compra SET ? WHERE ID_Detalle_Compra = ?', [datosDetalleCompra, id], (error, result) => {
                if (error) {
                    console.error('Error al actualizar el detalle de compra:', error);
                    res.status(500).send('Error al actualizar el detalle de compra');
                } else {
                    res.status(200).send('Detalle de compra actualizado correctamente');
                }
            });
            break;
        case 'eliminar':
            connection.query('DELETE FROM detalles_compra WHERE ID_Detalle_Compra = ?', id, (error, result) => {
                if (error) {
                    console.error('Error al eliminar el detalle de compra:', error);
                    res.status(500).send('Error al eliminar el detalle de compra');
                } else {
                    res.status(200).send('Detalle de compra eliminado correctamente');
                }
            });
            break;
        default:
            res.status(400).send('Opción no válida');
            break;
    }
});

module.exports = router;
