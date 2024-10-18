// Invocamos a Express
const express = require('express');
const router = express.Router();

// Invocamos a la conexión de la base de datos
const connection = require('../database/db');

// Ruta para obtener todas las unidades de venta
router.get('/unidad_venta', function(req, res) {
    // Realiza la consulta a la base de datos para obtener los datos de la tabla "unidad_venta"
    connection.query('SELECT * FROM unidad_venta', (error, results) => {
        if (error) {
            console.error('Error al obtener datos de la tabla unidad_venta:', error);
            res.status(500).send('Error al obtener datos de la tabla unidad_venta');
        } else {
            // Renderiza la vista EJS y pasa los resultados de la consulta como variable
            res.render('./unidad_venta/unidad_venta', { results: results });
        }
    });
});

// Ruta para crear, editar o eliminar una unidad de venta
router.post('/unidad_venta/:id?', function(req, res) {
    const id = req.params.id; // Obtener el ID de la unidad de venta, si se proporciona
    const opcion = req.body.opcion; // Obtener la opción (crear, editar, eliminar)
    
    switch(opcion) {
        case 'crear':
            const nuevaUnidadVenta = {
                Nombre: req.body.Nombre // Obtener el nombre de la unidad de venta del cuerpo de la solicitud
            };
            connection.query('INSERT INTO unidad_venta SET ?', nuevaUnidadVenta, (error, result) => {
                if (error) {
                    console.error('Error al crear una nueva unidad de venta:', error);
                    res.status(500).send('Error al crear una nueva unidad de venta');
                } else {
                    res.send('Unidad de venta creada correctamente');
                }
            });
            break;
        case 'editar':
            const unidadVentaEditada = {
                Nombre: req.body.Nombre // Obtener el nuevo nombre de la unidad de venta del cuerpo de la solicitud
            };
            connection.query('UPDATE unidad_venta SET ? WHERE ID_Unidad_Venta = ?', [unidadVentaEditada, id], (error, result) => {
                if (error) {
                    console.error('Error al editar la unidad de venta:', error);
                    res.status(500).send('Error al editar la unidad de venta');
                } else {
                    res.send('Unidad de venta editada correctamente');
                }
            });
            break;
        case 'eliminar':
            connection.query('DELETE FROM unidad_venta WHERE ID_Unidad_Venta = ?', id, (error, result) => {
                if (error) {
                    console.error('Error al eliminar la unidad de venta:', error);
                    res.status(500).send('Error al eliminar la unidad de venta');
                } else {
                    res.send('Unidad de venta eliminada correctamente');
                }
            });
            break;
        default:
            res.status(400).send('Opción no válida');
            break;
    }
});

module.exports = router;
