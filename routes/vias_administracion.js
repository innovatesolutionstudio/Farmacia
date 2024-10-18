// Invocamos a express
const express = require('express');
const router = express.Router();

// Invocamos a la conexión de la base de datos
const connection = require('../database/db');

// Ruta para obtener todas las vías de administración
router.get('/vias_administracion', function(req, res) {
    // Realiza la consulta a la base de datos para obtener los datos de la tabla "vias_administracion"
    connection.query('SELECT * FROM tipo_vias_administracion_producto', (error, results) => {
        if (error) {
            console.error('Error al obtener datos de la tabla vias_administracion_producto:', error);
            res.status(500).send('Error al obtener datos de la tabla vias_administracion_producto');
        } else {
            // Renderiza la vista EJS y pasa los resultados de la consulta como variable
            res.render('./vias_administracion/vias_administracion', { results: results });
        }
    });
});

// Ruta para realizar operaciones CRUD sobre las vías de administración
router.post('/vias_administracion/:id?', function(req, res) {
    const id = req.params.id; // Obtener el ID de la vía de administración, si se proporciona
    const opcion = req.body.opcion; // Obtener la opción (crear, editar, eliminar)

    switch(opcion) {
        case 'crear':
            const nuevaViaAdministracion = {
                Nombre: req.body.Nombre // Obtener el nombre de la vía de administración del cuerpo de la solicitud
            };
            connection.query('INSERT INTO tipo_vias_administracion_producto SET ?', nuevaViaAdministracion, (error, result) => {
                if (error) {
                    console.error('Error al crear una nueva vía de administración:', error);
                    res.status(500).send('Error al crear una nueva vía de administración');
                } else {
                    res.send('Vía de administración creada correctamente');
                }
            });
            break;
        case 'editar':
            const viaAdministracionEditada = {
                Nombre: req.body.Nombre // Obtener el nuevo nombre de la vía de administración del cuerpo de la solicitud
            };
            connection.query('UPDATE tipo_vias_administracion_producto SET ? WHERE ID_Tipo_Administracion_Producto = ?', [viaAdministracionEditada, id], (error, result) => {
                if (error) {
                    console.error('Error al editar la vía de administración:', error);
                    res.status(500).send('Error al editar la vía de administración');
                } else {
                    res.send('Vía de administración editada correctamente');
                }
            });
            break;
        case 'eliminar':
            connection.query('DELETE FROM tipo_vias_administracion_producto WHERE ID_Tipo_Administracion_Producto = ?', id, (error, result) => {
                if (error) {
                    console.error('Error al eliminar la vía de administración:', error);
                    res.status(500).send('Error al eliminar la vía de administración');
                } else {
                    res.send('Vía de administración eliminada correctamente');
                }
            });
            break;
        default:
            res.status(400).send('Opción no válida');
            break;
    }
});

module.exports = router;
