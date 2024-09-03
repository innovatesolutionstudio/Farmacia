// Invocamos a Express
const express = require('express');
const router = express.Router();

// Invocamos a la conexión de la base de datos
const connection = require('../database/db');

// Ruta GET '/clientes'
router.get('/clientes', function(req, res) {
    // Realiza la consulta a la base de datos para obtener los datos de la tabla "clientes"
    connection.query('SELECT * FROM clientes', (error, results) => {
        if (error) {
            console.error('Error al obtener datos de la tabla clientes:', error);
            res.status(500).send('Error al obtener datos de la tabla clientes');
        } else {
            // Renderiza la vista EJS y pasa los resultados de la consulta como variable
            res.render('./clientes/clientes', { results: results });
        }
    });
});

// Ruta POST '/clientes/:id?'
router.post('/clientes/:id?', function(req, res) {
    const id = req.params.id; // Obtener el ID del cliente, si se proporciona
    const opcion = req.body.opcion; // Obtener la opción (crear, editar, eliminar)
    
    switch(opcion) {
        case 'crear':
            const nuevoCliente = {
                Nombre: req.body.Nombre,
                Apellido: req.body.Apellido,
                Telefono: req.body.Telefono,
                CI: req.body.CI,
                Nit: req.body.Nit,
                Gmail: req.body.Gmail
            };
            connection.query('INSERT INTO clientes SET ?', nuevoCliente, (error, result) => {
                if (error) {
                    console.error('Error al insertar un nuevo cliente:', error);
                    res.status(500).send('Error al insertar un nuevo cliente');
                } else {
                    res.status(200).send('Cliente creado correctamente');
                }
            });
            break;
        case 'editar':
            const datosCliente = {
                Nombre: req.body.Nombre,
                Apellido: req.body.Apellido,
                Telefono: req.body.Telefono,
                CI: req.body.CI,
                Nit: req.body.Nit,
                Gmail: req.body.Gmail
            };
            connection.query('UPDATE clientes SET ? WHERE ID_Cliente = ?', [datosCliente, id], (error, result) => {
                if (error) {
                    console.error('Error al actualizar el cliente:', error);
                    res.status(500).send('Error al actualizar el cliente');
                } else {
                    res.status(200).send('Cliente actualizado correctamente');
                }
            });
            break;
        case 'eliminar':
            connection.query('DELETE FROM clientes WHERE ID_Cliente = ?', id, (error, result) => {
                if (error) {
                    console.error('Error al eliminar el cliente:', error);
                    res.status(500).send('Error al eliminar el cliente');
                } else {
                    res.status(200).send('Cliente eliminado correctamente');
                }
            });
            break;
        default:
            res.status(400).send('Opción no válida');
            break;
    }
});

module.exports = router;
