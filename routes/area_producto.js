// Invocamos a Express
const express = require('express');
const router = express.Router();

// Invocamos a la conexión de la base de datos
const connection = require('../database/db');

// Ruta para obtener todas las áreas de producto
router.get('/area_producto', function(req, res) {
    // Realiza la consulta a la base de datos para obtener los datos de la tabla "area_producto"
    connection.query('SELECT * FROM area_producto', (error, results) => {
        if (error) {
            console.error('Error al obtener datos de la tabla area_producto:', error);
            res.status(500).send('Error al obtener datos de la tabla area_producto');
        } else {
            // Renderiza la vista EJS y pasa los resultados de la consulta como variable
            res.render('./area_producto/area_producto', { results: results });
        }
    });
});

// Ruta para crear, editar o eliminar un área de producto
router.post('/area_producto/:id?', function(req, res) {
    const id = req.params.id; // Obtener el ID del área de producto, si se proporciona
    const opcion = req.body.opcion; // Obtener la opción (crear, editar, eliminar)
    
    switch(opcion) {
        case 'crear':
            const nuevaAreaProducto = {
                Nombre: req.body.Nombre // Obtener el nombre del área de producto del cuerpo de la solicitud
            };
            connection.query('INSERT INTO area_producto SET ?', nuevaAreaProducto, (error, result) => {
                if (error) {
                    console.error('Error al crear un nuevo área de producto:', error);
                    res.status(500).send('Error al crear un nuevo área de producto');
                } else {
                    res.send('Área de producto creada correctamente');
                }
            });
            break;
        case 'editar':
            const areaProductoEditada = {
                Nombre: req.body.Nombre // Obtener el nuevo nombre del área de producto del cuerpo de la solicitud
            };
            connection.query('UPDATE area_producto SET ? WHERE ID_Area_Producto = ?', [areaProductoEditada, id], (error, result) => {
                if (error) {
                    console.error('Error al editar el área de producto:', error);
                    res.status(500).send('Error al editar el área de producto');
                } else {
                    res.send('Área de producto editada correctamente');
                }
            });
            break;
        case 'eliminar':
            connection.query('DELETE FROM area_producto WHERE ID_Area_Producto = ?', id, (error, result) => {
                if (error) {
                    console.error('Error al eliminar el área de producto:', error);
                    res.status(500).send('Error al eliminar el área de producto');
                } else {
                    res.send('Área de producto eliminada correctamente');
                }
            });
            break;
        default:
            res.status(400).send('Opción no válida');
            break;
    }
});

module.exports = router;
