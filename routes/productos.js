// Invocamos a express
const express = require('express');
const router = express.Router();

// Invocamos a la conexión de la base de datos
const connection = require('../database/db');

// Ruta para obtener todos los productos
router.get('/productos', function(req, res) {
    // Realiza la consulta a la base de datos para obtener los datos de la tabla "productos" y las tablas relacionadas
    connection.query(`
        SELECT 
            productos.ID_Producto,
            productos.Nombre,
            productos.Descripcion,
            productos.Precio_Unitario,
            categorias_productos.Nombre_Categoria AS Nombre_Categoria,
            proveedores.Nombre AS Nombre_Proveedor,
            area_producto.Nombre AS Nombre_Area_Producto,
            tipo_paciente.Nombre AS Nombre_Tipo_Paciente,
            tipo_vias_administracion_producto.Nombre AS Nombre_Tipo_vias_administracion,
            productos.Indicaciones,
            productos.Dosis_Medicacmento,
            productos.Riesgo_Embarazo,
            productos.Efectos_Secundarios,
            productos.Precauciones,
            productos.Generaliadades,
            unidad_venta.Nombre AS Nombre_Unidad_Venta
        FROM productos
        LEFT JOIN categorias_productos ON productos.ID_Categoria = categorias_productos.ID_Categoria
        LEFT JOIN proveedores ON productos.ID_Proveedor = proveedores.ID_Proveedor
        LEFT JOIN area_producto ON productos.ID_Area_Producto = area_producto.ID_Area_Producto
        LEFT JOIN tipo_paciente ON productos.ID_Tipo_Paciente = tipo_paciente.ID_Tipo_Paciente
        LEFT JOIN tipo_vias_administracion_producto ON productos.ID_Tipo_vias_administracion = tipo_vias_administracion_producto.ID_Tipo_Administracion_Producto
        LEFT JOIN unidad_venta ON productos.ID_Unidad_Venta = unidad_venta.ID_Unidad_Venta
    `, (error, results) => {
        if (error) {
            console.error('Error al obtener datos de la tabla productos:', error);
            res.status(500).send('Error al obtener datos de la tabla productos');
        } else {
            // Renderiza la vista EJS y pasa los resultados de la consulta como variable
            res.render('./productos/productos', { results: results });
        }
    });
});


// Ruta para realizar operaciones CRUD en la tabla "productos"
router.post('/productos/:id?', function(req, res) {
    const id = req.params.id; // Obtener el ID del producto, si se proporciona
    const opcion = req.body.opcion; // Obtener la opción (crear, editar, eliminar)
    
    switch(opcion) {
        case 'crear':
            const nuevoProducto = {
                Nombre: req.body.Nombre,
                Descripción: req.body.Descripción,
                Precio_Unitario: req.body.Precio_Unitario,
                ID_Categoría: req.body.ID_Categoría,
                ID_Proveedor: req.body.ID_Proveedor,
                ID_Area_Producto: req.body.ID_Area_Producto,
                ID_Tipo_Paciente: req.body.ID_Tipo_Paciente,
                ID_Tipo_vias_administracion: req.body.ID_Tipo_vias_administracion,
                Indicaciones: req.body.Indicaciones,
                Dosis_Medicacmento: req.body.Dosis_Medicacmento,
                Riesgo_Embarazo: req.body.Riesgo_Embarazo,
                Efectos_Secundarios: req.body.Efectos_Secundarios,
                Precauciones: req.body.Precauciones,
                Generaliadades: req.body.Generaliadades,
                ID_Unidad_Venta: req.body.ID_Unidad_Venta
            };
            connection.query('INSERT INTO productos SET ?', nuevoProducto, (error, result) => {
                if (error) {
                    console.error('Error al insertar un nuevo producto:', error);
                    res.status(500).send('Error al insertar un nuevo producto');
                } else {
                    res.status(200).send('Producto creado correctamente');
                }
            });
            break;
        case 'editar':
            const datosEditados = {
                Nombre: req.body.Nombre,
                Descripción: req.body.Descripción,
                Precio_Unitario: req.body.Precio_Unitario,
                ID_Categoría: req.body.ID_Categoría,
                ID_Proveedor: req.body.ID_Proveedor,
                ID_Area_Producto: req.body.ID_Area_Producto,
                ID_Tipo_Paciente: req.body.ID_Tipo_Paciente,
                ID_Tipo_vias_administracion: req.body.ID_Tipo_vias_administracion,
                Indicaciones: req.body.Indicaciones,
                Dosis_Medicacmento: req.body.Dosis_Medicacmento,
                Riesgo_Embarazo: req.body.Riesgo_Embarazo,
                Efectos_Secundarios: req.body.Efectos_Secundarios,
                Precauciones: req.body.Precauciones,
                Generaliadades: req.body.Generaliadades,
                ID_Unidad_Venta: req.body.ID_Unidad_Venta
            };
            connection.query('UPDATE productos SET ? WHERE ID_Producto = ?', [datosEditados, id], (error, result) => {
                if (error) {
                    console.error('Error al actualizar el producto:', error);
                    res.status(500).send('Error al actualizar el producto');
                } else {
                    res.status(200).send('Producto actualizado correctamente');
                }
            });
            break;
        case 'eliminar':
            connection.query('DELETE FROM productos WHERE ID_Producto = ?', id, (error, result) => {
                if (error) {
                    console.error('Error al eliminar el producto:', error);
                    res.status(500).send('Error al eliminar el producto');
                } else {
                    res.status(200).send('Producto eliminado correctamente');
                }
            });
            break;
        default:
            res.status(400).send('Opción no válida');
            break;
    }
});

module.exports = router;
