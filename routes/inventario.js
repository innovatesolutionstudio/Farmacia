// Invocamos a express
const express = require('express');
const router = express.Router();

// Invocamos a la conexión de la base de datos
const connection = require('../database/db');

// Ruta para obtener todos los registros del inventario
router.get('/inventario', function(req, res) {
    // Realiza la consulta a la base de datos para obtener los datos de la tabla "inventario"
    connection.query('SELECT inventario.*, productos.Nombre AS Nombre_Producto, sucursales.Nombre AS Nombre_Sucursal FROM inventario INNER JOIN productos ON inventario.ID_Producto = productos.ID_Producto INNER JOIN sucursales ON inventario.ID_Sucursal = sucursales.ID_Sucursal', (error, results) => {
        if (error) {
            console.error('Error al obtener datos de la tabla inventario:', error);
            res.status(500).send('Error al obtener datos de la tabla inventario');
        } else {
            // Renderiza la vista EJS y pasa los resultados de la consulta como variable
            res.render('./inventario/inventario', { results: results });
        }
    });
});


// Ruta para realizar operaciones CRUD en la tabla "inventario"
router.post('/inventario/:id?', function(req, res) {
    const id = req.params.id; // Obtener el ID del registro de inventario, si se proporciona
    const opcion = req.body.opcion; // Obtener la opción (crear, editar, eliminar)
    
    switch(opcion) {
        case 'crear':
            const nuevoRegistro = {
                ID_Producto: req.body.ID_Producto,
                Cantidad: req.body.Cantidad,
                ID_Sucursal: req.body.ID_Sucursal
            };
            connection.query('INSERT INTO inventario SET ?', nuevoRegistro, (error, result) => {
                if (error) {
                    console.error('Error al insertar un nuevo registro de inventario:', error);
                    res.status(500).send('Error al insertar un nuevo registro de inventario');
                } else {
                    res.status(200).send('Registro de inventario creado correctamente');
                }
            });
            break;
        case 'editar':
            const datosEditados = {
                ID_Producto: req.body.ID_Producto,
                Cantidad: req.body.Cantidad,
                ID_Sucursal: req.body.ID_Sucursal
            };
            connection.query('UPDATE inventario SET ? WHERE ID_Inventario = ?', [datosEditados, id], (error, result) => {
                if (error) {
                    console.error('Error al actualizar el registro de inventario:', error);
                    res.status(500).send('Error al actualizar el registro de inventario');
                } else {
                    res.status(200).send('Registro de inventario actualizado correctamente');
                }
            });
            break;
        case 'eliminar':
            connection.query('DELETE FROM inventario WHERE ID_Inventario = ?', id, (error, result) => {
                if (error) {
                    console.error('Error al eliminar el registro de inventario:', error);
                    res.status(500).send('Error al eliminar el registro de inventario');
                } else {
                    res.status(200).send('Registro de inventario eliminado correctamente');
                }
            });
            break;
        default:
            res.status(400).send('Opción no válida');
            break;
    }
});

module.exports = router;
