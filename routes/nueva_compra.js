const express = require('express');
const router = express.Router();
const connection = require('../database/db');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

router.get('/nueva_compra', (req, res) => {
    if (req.session.loggedin) {
        const idCaja = req.session.ID_Caja;
        
        const query = 'SELECT Estado FROM cajas WHERE ID_Caja = ?';
        
        connection.query(query, [idCaja], (err, results) => {
            if (err) {
                console.error('Error ejecutando la consulta:', err);
                return res.status(500).send('Error en el servidor');
            }
            
            if (results.length > 0) {
                const estadoCaja = results[0].Estado;
                
                if (estadoCaja === 1) {
                    res.render('./nueva_compra/nueva_compra', {
                        ID_Empleado: req.session.ID_Empleado,
                        ID_Sucursal: req.session.ID_Sucursal,
                        ID_Caja: req.session.ID_Caja 
                    });
                } else if (estadoCaja === 2) {
                    res.render('./paginas/caja_c');
                } else {
                    res.send('Estado de la caja no válido');
                }
            } else {
                res.send('Caja no encontrada');
            }
        });
    } else {
        res.render('./paginas/logout');
    }
});
router.post('/nueva_compra', async (req, res) => {
    const { ID_Empleado, ID_Sucursal, ID_Proveedor, fechaCompra, productos } = req.body;

    try {
        // Insertar en la tabla compras
        const nuevaCompraQuery = 'INSERT INTO compras (Fecha_Compra, ID_Proveedor, ID_Empleado, ID_Sucursal) VALUES (?, ?, ?, ?)';
        const compraValues = [fechaCompra, ID_Proveedor, ID_Empleado, ID_Sucursal];

        connection.query(nuevaCompraQuery, compraValues, (error, insertCompra) => {
            if (error) {
                throw error;
            }

            const ID_Compra = insertCompra.insertId;

            // Preparar datos para insertar en la tabla detalles_compra
            const detallesCompraValues = productos.map(producto => [
                ID_Compra,
                producto.ID_Producto,
                producto.cantidadEmpaque,
                producto.cantidadUnitario,
                producto.fechaVencimiento,
                producto.precioUnitario,
                producto.ID_Unidad_Empaque
            ]);

            // Insertar en la tabla detalles_compra
            const detallesCompraQuery = 'INSERT INTO detalles_compra (ID_Compra, ID_Producto, Cantidad_Empaque, Cantidad_Unitario, Fecha_Vencimiento, Precio_Unitario, ID_Unidad_Empaque) VALUES ?';
            connection.query(detallesCompraQuery, [detallesCompraValues], async (error) => {
                if (error) {
                    throw error;
                }

                // Actualizar o insertar en la tabla inventario
                for (const producto of productos) {
                    const { ID_Producto, cantidadEmpaque, cantidadUnitario, ID_Unidad_Empaque } = producto;

                    // Consultar si el producto ya existe en el inventario de la sucursal
                    const consultaInventarioQuery = 'SELECT * FROM inventario WHERE ID_Producto = ? AND ID_Sucursal = ?';
                    const inventarioExistente = await new Promise((resolve, reject) => {
                        connection.query(consultaInventarioQuery, [ID_Producto, ID_Sucursal], (error, results) => {
                            if (error) {
                                reject(error);
                            } else {
                                resolve(results[0]);
                            }
                        });
                    });

                    if (inventarioExistente) {
                        // Si existe, actualizar la cantidad
                        const nuevaCantidad = inventarioExistente.Cantidad + (cantidadEmpaque * cantidadUnitario);
                        const actualizarInventarioQuery = 'UPDATE inventario SET Cantidad = ? WHERE ID_Inventario = ?';
                        connection.query(actualizarInventarioQuery, [nuevaCantidad, inventarioExistente.ID_Inventario], (error) => {
                            if (error) {
                                throw error;
                            }
                        });
                    } else {
                        // Si no existe, insertar nuevo registro
                        const insertarInventarioQuery = 'INSERT INTO inventario (ID_Producto, Cantidad, ID_Sucursal) VALUES (?, ?, ?)';
                        connection.query(insertarInventarioQuery, [ID_Producto, cantidadEmpaque * cantidadUnitario, ID_Sucursal], (error) => {
                            if (error) {
                                throw error;
                            }
                        });
                    }
                }

                res.status(200).json({ message: 'Compra registrada exitosamente' });
            });
        });
    } catch (error) {
        console.error('Error al registrar la compra:', error);
        res.status(500).json({ error: 'Error interno al procesar la compra' });
    }
});


  

router.get('/buscar_productos', (req, res) => {
    const terminoBusqueda = req.query.q;
    const query = `
        SELECT p.ID_Producto, p.Nombre AS NombreProducto, u.Nombre AS UnidadVenta
        FROM productos p
        JOIN unidad_venta u ON p.ID_Unidad_Venta = u.ID_Unidad_Venta
        WHERE p.Nombre LIKE ?
    `;
    connection.query(query, [`%${terminoBusqueda}%`], (err, results) => {
        if (err) {
            console.error('Error ejecutando la consulta:', err);
            return res.status(500).send('Error en el servidor');
        }
        res.json(results);
    });
});

router.get('/obtener_unidades_empaque', (req, res) => {
    const query = 'SELECT ID_Unidad_Empaque, Nombre FROM unidad_empaque';
    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener unidades de empaque:', err);
            return res.status(500).send('Error en el servidor');
        }
        res.json(results);
    });
});
router.get('/obtener_id_producto', (req, res) => {
    let nombreProducto = req.query.nombre;
    
    // Truncar el nombre del producto en la posición del primer guion
    const index = nombreProducto.indexOf(' - ');
    if (index !== -1) {
        nombreProducto = nombreProducto.substring(0, index);
    }

    const query = `
        SELECT ID_Producto
        FROM productos
        WHERE TRIM(Nombre) LIKE TRIM(?)
    `;
    connection.query(query, [`%${nombreProducto}%`], (err, results) => {
        if (err) {
            console.error('Error al obtener ID del producto:', err);
            return res.status(500).send('Error en el servidor');
        }
        if (results.length > 0) {
            res.json({ ID_Producto: results[0].ID_Producto });
            console.log("Producto encontrado");
        } else {
            console.log('Producto no encontrado');
            res.status(404).send('Producto no encontrado');
        }
    });
});

router.get('/obtener_id_unidad_empaque', (req, res) => {
    const nombreUnidadEmpaque = req.query.nombre;
    const query = `
        SELECT ID_Unidad_Empaque
        FROM unidad_empaque
        WHERE Nombre = ?
    `;
    connection.query(query, [nombreUnidadEmpaque], (err, results) => {
        if (err) {
            console.error('Error al obtener ID de la unidad de empaque:', err);
            return res.status(500).send('Error en el servidor');
        }
        if (results.length > 0) {
            res.json({ ID_Unidad_Empaque: results[0].ID_Unidad_Empaque });
            console.log("unidad encontrado");
        } else {
            res.status(404).send('Unidad de empaque no encontrada');
            console.log('unidad no encontrado');
        }
    });
});
// Ruta para obtener las sucursales
router.get('/obtener_sucursales', (req, res) => {
    const query = `
        SELECT ID_Sucursal, Nombre
        FROM sucursales
    `;
    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener sucursales:', err);
            return res.status(500).send('Error en el servidor');
        }
        res.json(results); // Devuelve las sucursales como JSON
    });
});

router.get('/obtener_proveedores', (req, res) => {
    const query = 'SELECT ID_Proveedor, Nombre FROM proveedores';

    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener los proveedores:', err);
            return res.status(500).send('Error en el servidor');
        }
        res.json(results);
    });
});


module.exports = router;
