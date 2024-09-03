//invocamos a express
const express = require('express');
const router = express.Router();

//invocamos ala coneccion de la bd
const coneccion = require('../database/db');


router.get('/paises', function(req, res) {
    // Realiza la consulta a la base de datos para obtener los datos de la tabla "ciudades"
    coneccion.query('SELECT * FROM paises', (error, results) => {
        if (error) {
            console.error('Error al obtener datos de la tabla paises:', error);
            res.status(500).send('Error al obtener datos de la tabla paises');
        } else {
            // Renderiza la vista EJS y pasa los resultados de la consulta como variable
            res.render('./paises/paises', { results: results });
        }
    });
});
router.post('/paises/:id?', function(req, res) {
    const id = req.params.id; // Obtener el ID del país, si se proporciona
    const opcion = req.body.opcion; // Obtener la opción (crear, editar, eliminar)
    
    switch(opcion) {
        case 'crear':
            const nuevoPais = {
                Nombre: req.body.Nombre // Obtener el nombre del país del cuerpo de la solicitud
            };
            coneccion.query('INSERT INTO paises SET ?', nuevoPais, (error, result) => {
                if (error) {
                    console.error('Error al crear un nuevo país:', error);
                    res.status(500).send('Error al crear un nuevo país');
                } else {
                    res.send('País creado correctamente');
                }
            });
            break;
        case 'editar':
            const paisEditado = {
                Nombre: req.body.Nombre // Obtener el nuevo nombre del país del cuerpo de la solicitud
            };
            coneccion.query('UPDATE paises SET ? WHERE ID_Pais = ?', [paisEditado, id], (error, result) => {
                if (error) {
                    console.error('Error al editar el país:', error);
                    res.status(500).send('Error al editar el país');
                } else {
                    res.send('País editado correctamente');
                }
            });
            break;
        case 'eliminar':
            coneccion.query('DELETE FROM paises WHERE ID_Pais = ?', id, (error, result) => {
                if (error) {
                    console.error('Error al eliminar el país:', error);
                    res.status(500).send('Error al eliminar el país');
                } else {
                    res.send('País eliminado correctamente');
                }
            });
            break;
        default:
            res.status(400).send('Opción no válida');
            break;
    }
});

module.exports = router;
