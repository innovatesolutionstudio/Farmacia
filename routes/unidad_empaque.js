// Invocamos a Express
const express = require('express');
const router = express.Router();

// Invocamos a la conexión de la base de datos
const connection = require('../database/db');
// Ruta para obtener todas las unidades de empaque
router.get('/unidad_empaque', function(req, res) {
    // Realiza la consulta a la base de datos para obtener los datos de la tabla "unidad_empaque"
    connection.query('SELECT * FROM unidad_empaque', (error, results) => {
        if (error) {
            console.error('Error al obtener datos de la tabla unidad_empaque:', error);
            res.status(500).send('Error al obtener datos de la tabla unidad_empaque');
        } else {
            // Renderiza la vista EJS y pasa los resultados de la consulta como variable
            res.render('./unidad_empaque/unidad_empaque', { results: results });
        }
    });
});

// Ruta para crear, editar o eliminar una unidad de empaque
router.post('/unidad_empaque/:id?', function(req, res) {
    const id = req.params.id; // Obtener el ID de la unidad de empaque, si se proporciona
    const opcion = req.body.opcion; // Obtener la opción (crear, editar, eliminar)
    console.log("nombre:  " + req.body.Nombre )
    switch(opcion) {
        case 'crear':
            const nuevaUnidadEmpaque = {
                Nombre: req.body.Nombre // Obtener el nombre de la unidad de empaque del cuerpo de la solicitud
            };
            connection.query('INSERT INTO unidad_empaque SET ?', nuevaUnidadEmpaque, (error, result) => {
                if (error) {
                    console.error('Error al crear una nueva unidad de empaque:', error);
                    res.status(500).send('Error al crear una nueva unidad de empaque');
                } else {
                    res.send('Unidad de empaque creada correctamente');
                }
            });
            break;
        case 'editar':
            const unidadEmpaqueEditada = {
                Nombre: req.body.Nombre // Obtener el nuevo nombre de la unidad de empaque del cuerpo de la solicitud
            };
            connection.query('UPDATE unidad_empaque SET ? WHERE ID_Unidad_Empaque = ?', [unidadEmpaqueEditada, id], (error, result) => {
                if (error) {
                    console.error('Error al editar la unidad de empaque:', error);
                    res.status(500).send('Error al editar la unidad de empaque');
                } else {
                    res.send('Unidad de empaque editada correctamente');
                }
            });
            break;
        case 'eliminar':
            connection.query('DELETE FROM unidad_empaque WHERE ID_Unidad_Empaque = ?', id, (error, result) => {
                if (error) {
                    console.error('Error al eliminar la unidad de empaque:', error);
                    res.status(500).send('Error al eliminar la unidad de empaque');
                } else {
                    res.send('Unidad de empaque eliminada correctamente');
                }
            });
            break;
        default:
            res.status(400).send('Opción no válida');
            break;
    }
});

module.exports = router;
