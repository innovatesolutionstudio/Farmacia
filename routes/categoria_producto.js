// Invocamos a Express
const express = require('express');
const router = express.Router();

// Invocamos a la conexión de la base de datos
const connection = require('../database/db');

// Ruta para obtener todas las categorias de productos
router.get('/categoria_producto', function(req, res) {
    // Realiza la consulta a la base de datos para obtener los datos de la tabla "categoria_producto"
    connection.query('SELECT * FROM categorias_productos', (error, results) => {
        if (error) {
            console.error('Error al obtener datos de la tabla categoria_producto:', error);
            res.status(500).send('Error al obtener datos de la tabla categoria_producto');
        } else {
            // Renderiza la vista EJS y pasa los resultados de la consulta como variable
            res.render('./categoria_producto/categoria_producto', { results: results });
        }
    });
});

// Ruta para crear, editar o eliminar una categoria de producto
router.post('/categoria_producto/:id?', function(req, res) {
    const id = req.params.id; // Obtener el ID de la categoria de producto, si se proporciona
    const opcion = req.body.opcion; // Obtener la opcion (crear, editar, eliminar)
    
    switch(opcion) {
        case 'crear':
            const nuevaCategoriaProducto = {
                Nombre_Categoria: req.body.Nombre_Categoria // Obtener el nombre de la categoria de producto del cuerpo de la solicitud
            };
            connection.query('INSERT INTO categorias_productos SET ?', nuevaCategoriaProducto, (error, result) => {
                if (error) {
                    console.error('Error al crear una nueva categoria de producto:', error);
                    res.status(500).send('Error al crear una nueva categoria de producto');
                } else {
                    res.send('Categoria de producto creada correctamente');
                }
            });
            break;
        case 'editar':
            const categoriaProductoEditada = {
                Nombre_Categoria: req.body.Nombre_Categoria // Obtener el nuevo nombre de la categoria de producto del cuerpo de la solicitud
            };
            connection.query('UPDATE categorias_productos SET ? WHERE ID_Categoria = ?', [categoriaProductoEditada, id], (error, result) => {
                if (error) {
                    console.error('Error al editar la categoria de producto:', error);
                    res.status(500).send('Error al editar la categoria de producto');
                } else {
                    res.send('Categoria de producto editada correctamente');
                }
            });
            break;
        case 'eliminar':
            connection.query('DELETE FROM categorias_productos WHERE ID_Categoria = ?', id, (error, result) => {
                if (error) {
                    console.error('Error al eliminar la categoria de producto:', error);
                    res.status(500).send('Error al eliminar la categoria de producto');
                } else {
                    res.send('Categoria de producto eliminada correctamente');
                }
            });
            break;
        default:
            res.status(400).send('Opcion no valida');
            break;
    }
});

module.exports = router;
