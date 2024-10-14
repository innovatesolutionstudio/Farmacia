// Invocamos a express
const express = require('express');
const router = express.Router();

// Invocamos a la conexión de la base de datos
const connection = require('../database/db');

router.get('/compras', function(req, res) {
    connection.query(`
        SELECT c.ID_Compra, c.Fecha_Compra, c.Total_Compra, p.Nombre AS NombreProveedor
        FROM compras c
        INNER JOIN proveedores p ON c.ID_Proveedor = p.ID_Proveedor
        WHERE c.Estado IS NULL OR c.Estado != 2
        ORDER BY c.Fecha_Compra DESC
        LIMIT 200;
    `, (error, results) => {
        if (error) {
            console.error('Error al obtener datos de la tabla compras:', error);
            res.status(500).send('Error al obtener datos de la tabla compras');
        } else {
            res.render('./compras/compras', { results: results });
        }
    });
});

router.get('/detalle_compra/:id', function(req, res) {
    var idCompra = req.params.id;
    connection.query(`
        SELECT c.ID_Compra, c.Fecha_Compra, c.Total_Compra, p.Nombre AS NombreProveedor,
               dc.Cantidad_Empaque, dc.Cantidad_Unitario, dc.Fecha_Vencimiento,
               dc.Precio_Unitario, u.Nombre AS NombreUnidadEmpaque,
               pr.Nombre AS NombreProducto
        FROM compras c
        INNER JOIN proveedores p ON c.ID_Proveedor = p.ID_Proveedor
        INNER JOIN detalles_compra dc ON c.ID_Compra = dc.ID_Compra
        INNER JOIN unidad_empaque u ON dc.ID_Unidad_Empaque = u.ID_Unidad_Empaque
        INNER JOIN productos pr ON dc.ID_Producto = pr.ID_Producto
        WHERE c.ID_Compra = ?
    `, [idCompra], (error, results) => {
        if (error) {
            console.error('Error al obtener detalles de la compra:', error);
            res.status(500).send('Error al obtener detalles de la compra');
        } else {
            if (results.length > 0) {
                // Agrupar detalles por cada compra
                const compra = {
                    ID_Compra: results[0].ID_Compra,
                    Fecha_Compra: results[0].Fecha_Compra,
                    Total_Compra: results[0].Total_Compra,
                    NombreProveedor: results[0].NombreProveedor,
                    detalles: []  // Aquí se almacenarán los detalles de productos
                };

                // Recorrer los resultados para crear objetos de detalle
                results.forEach(row => {
                    const detalle = {
                        NombreProducto: row.NombreProducto,
                        Cantidad_Empaque: row.Cantidad_Empaque,
                        Cantidad_Unitario: row.Cantidad_Unitario,
                        Fecha_Vencimiento: row.Fecha_Vencimiento,
                        Precio_Unitario: row.Precio_Unitario,
                        NombreUnidadEmpaque: row.NombreUnidadEmpaque
                    };
                    compra.detalles.push(detalle);  // Agregar detalle a la lista
                });

                // Renderizar la vista detalles_compras y pasar los datos
                res.render('./compras/detalles_compras', { compra: compra });
            } else {
                res.status(404).send('Compra no encontrada');
            }
        }
    });
});


router.post('/compras/:id?', function(req, res) {
    const id = req.params.id;
    const opcion = req.body.opcion;
    console.log("la fecha es" + req.body.Fecha);
    switch(opcion) {
        case 'crear':
            const nuevaCompra = {
                Fecha_Compra: req.body.Fecha,
                Total_Compra: req.body.Total_Compra,
                ID_Proveedor: req.body.ID_Proveedor
            };
            connection.query('INSERT INTO compras SET ?', nuevaCompra, (error, result) => {
                if (error) {
                    console.error('Error al insertar una nueva compra:', error);
                    res.status(500).send('Error al insertar una nueva compra');
                } else {
                    res.status(200).send('Compra creada correctamente');
                }
            });
            break;
        case 'editar':
            const datosCompra = {
                Fecha_Compra: req.body.Fecha,
                Total_Compra: req.body.Total_Compra,
                ID_Proveedor: req.body.ID_Proveedor
            };
            connection.query('UPDATE compras SET ? WHERE ID_Compra = ?', [datosCompra, id], (error, result) => {
                if (error) {
                    console.error('Error al actualizar la compra:', error);
                    res.status(500).send('Error al actualizar la compra');
                } else {
                    res.status(200).send('Compra actualizada correctamente');
                }
            });
            break;
        case 'eliminar':
            connection.query('UPDATE compras SET Estado = 2 WHERE ID_Compra = ?', id, (error, result) => {
                if (error) {
                    console.error('Error al eliminar la compra:', error);
                    res.status(500).send('Error al eliminar la compra');
                } else {
                    res.status(200).send('Compra eliminada correctamente');
                }
            });
            break;
        default:
            res.status(400).send('Opción no válida');
            break;
    }
});

module.exports = router;
