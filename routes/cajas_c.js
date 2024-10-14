//invocamos a express
const express = require('express');
const router = express.Router();

//invocamos la conexión a la bd
const coneccion = require('../database/db');

router.get('/cajas_c', function(req, res) {
    // Realiza la consulta a la base de datos para obtener los datos de la tabla "cajas"
    coneccion.query('SELECT * FROM cajas', (error, results) => {
        if (error) {
            console.error('Error al obtener datos de la tabla cajas:', error);
            res.status(500).send('Error al obtener datos de la tabla cajas');
        } else {
            // Renderiza la vista EJS y pasa los resultados de la consulta como variable
            res.render('./cajas/cajas_c', { results: results });
        }
    });
});

router.post('/cajas/:id?', function(req, res) {
    const id = req.params.id; // Obtener el ID de la caja, si se proporciona
    const opcion = req.body.opcion; // Obtener la opción (crear, editar, eliminar)
    
    switch(opcion) {
        case 'crear':
            const nuevaCaja = {
                Codigo: req.body.Codigo, // Obtener el código de la caja del cuerpo de la solicitud
                ID_Sucursal: req.body.ID_Sucursal, // Obtener el ID de la sucursal del cuerpo de la solicitud
                Estado: req.body.Estado // Obtener el estado de la caja del cuerpo de la solicitud
            };
            coneccion.query('INSERT INTO cajas SET ?', nuevaCaja, (error, result) => {
                if (error) {
                    console.error('Error al crear una nueva caja:', error);
                    res.status(500).send('Error al crear una nueva caja');
                } else {
                    res.send('Caja creada correctamente');
                }
            });
            break;
        case 'editar':
            const cajaEditada = {
                Codigo: req.body.Codigo, // Obtener el nuevo código de la caja del cuerpo de la solicitud
                ID_Sucursal: req.body.ID_Sucursal, // Obtener el nuevo ID de la sucursal del cuerpo de la solicitud
                Estado: req.body.Estado // Obtener el nuevo estado de la caja del cuerpo de la solicitud
            };
            coneccion.query('UPDATE cajas SET ? WHERE ID_Caja = ?', [cajaEditada, id], (error, result) => {
                if (error) {
                    console.error('Error al editar la caja:', error);
                    res.status(500).send('Error al editar la caja');
                } else {
                    res.send('Caja editada correctamente');
                }
            });
            break;
        case 'eliminar':
            coneccion.query('DELETE FROM cajas WHERE ID_Caja = ?', id, (error, result) => {
                if (error) {
                    console.error('Error al eliminar la caja:', error);
                    res.status(500).send('Error al eliminar la caja');
                } else {
                    res.send('Caja eliminada correctamente');
                }
            });
            break;
        default:
            res.status(400).send('Opción no válida');
            break;
    }
});

module.exports = router;
