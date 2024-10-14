// Invocamos a Express y creamos un router
const express = require('express');
const router = express.Router();

// Invocamos a la conexión de la base de datos
const connection = require('../database/db');

// Ruta para obtener todos los roles
router.get('/roles', function(req, res) {
    // Realiza la consulta a la base de datos para obtener los datos de la tabla "roles"
    connection.query('SELECT * FROM roles', (error, results) => {
        if (error) {
            console.error('Error al obtener datos de la tabla roles:', error);
            res.status(500).send('Error al obtener datos de la tabla roles');
        } else {
            // Renderiza la vista EJS y pasa los resultados de la consulta como variable
            res.render('./roles/roles', { results: results });
        }
    });
});

// Ruta para crear, editar o eliminar un rol
router.post('/roles/:id?', function(req, res) {
    const id = req.params.id; // Obtener el ID del rol, si se proporciona
    const opcion = req.body.opcion; // Obtener la opción (crear, editar, eliminar)
    
    switch(opcion) {
        case 'crear':
            const nuevoRol = {
                Nombre: req.body.Nombre // Obtener el nombre del rol del cuerpo de la solicitud
            };
            connection.query('INSERT INTO roles SET ?', nuevoRol, (error, result) => {
                if (error) {
                    console.error('Error al crear un nuevo rol:', error);
                    res.status(500).send('Error al crear un nuevo rol');
                } else {
                    res.send('Rol creado correctamente');
                }
            });
            break;
        case 'editar':
            const rolEditado = {
                Nombre: req.body.Nombre // Obtener el nuevo nombre del rol del cuerpo de la solicitud
            };
            connection.query('UPDATE roles SET ? WHERE ID_Rol = ?', [rolEditado, id], (error, result) => {
                if (error) {
                    console.error('Error al editar el rol:', error);
                    res.status(500).send('Error al editar el rol');
                } else {
                    res.send('Rol editado correctamente');
                }
            });
            break;
        case 'eliminar':
            connection.query('DELETE FROM roles WHERE ID_Rol = ?', id, (error, result) => {
                if (error) {
                    console.error('Error al eliminar el rol:', error);
                    res.status(500).send('Error al eliminar el rol');
                } else {
                    res.send('Rol eliminado correctamente');
                }
            });
            break;
        default:
            res.status(400).send('Opción no válida');
            break;
    }
});

module.exports = router;
