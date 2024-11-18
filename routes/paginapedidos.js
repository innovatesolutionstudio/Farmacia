    // Invocamos a Express
    const express = require('express');
    const router = express.Router();
    // Invocamos a la conexión de la base de datos
    const connection = require('../database/db');
    const { boolean } = require('cohere-ai/core/schemas');
    
    

    
    // Middleware para analizar el cuerpo de las solicitudes JSON y URL-encoded
    router.use(express.json());
    router.use(express.urlencoded({ extended: true }));
    
    // Ruta para mostrar la vista de login de clientes
    router.get('/pagina_pedidos/login_clientes', (req, res) => {
        res.render('pagina_pedidos/login_clientes');
    });
        
    // Ruta para mostrar la vista de registro de nuevos clientes
    router.get('/pagina_pedidos/registrar_clientes', (req, res) => {
        res.render('pagina_pedidos/registrar_clientes');
    });
    
    router.post('/registrar', (req, res) => {
        const nombre = req.body.name;   // Nombre del cliente
        const apellido = req.body.apellido;  // Apellido del cliente
        const telefono = req.body.telefono;  // Teléfono del cliente
        const ci = req.body.ci;  // CI del cliente
        const nit = req.body.nit;  // Nit del cliente
        const contrasena = req.body.contrasena;  // Contraseña del cliente
        const codigo = req.body.codigo;  // Código del cliente
     
        connection.query('INSERT INTO clientes SET ?', {
            Nombre: nombre,
            Apellido: apellido,
            Telefono: telefono,
            CI: ci,
            Nit: nit,
            Codigo: codigo,
            Contrasena: contrasena
        }, (error, result) => {
            if (error) {
                console.log(error);
                return res.status(500).send('Error en el registro');
            } else {
                return res.redirect('pagina_pedidos/login_clientes');
            }
        });
    });
    
        
        router.get('/pagina_pedidos/productos/:idSucursal', (req, res) => {
        // Verificar si el cliente está logueado
        if (!req.session.loggedinCliente) {
            return res.redirect('/pagina_pedidos/login_clientes');
        }

        const idSucursal = req.params.idSucursal;
        const searchTerm = req.query.search || '';
        const clienteId = req.session.userIdCliente;

        // Consulta para obtener datos del cliente
        const sqlCliente = 'SELECT * FROM clientes WHERE ID_Cliente = ?';

        // Consulta para obtener las sucursales
        const sqlSucursales = `SELECT * FROM Sucursales`;

        // Consulta para obtener los productos
        const sqlProductos =  `
        SELECT 
            Inventario.ID_Producto, 
            Productos.Fotografia, 
            Productos.Nombre, 
            Productos.Descripcion,
            Productos.Precio_Unitario, 
            Inventario.Cantidad, 
            Inventario.ID_Sucursal,
            Productos.ID_Categoria,
            Productos.ID_Area_Producto,
            Productos.Indicaciones,
            Productos.Dosis_Medicacmento,
            Productos.Efectos_Secundarios,
            Productos.Precauciones,
            Productos.ID_Unidad_Venta
        FROM Inventario
        JOIN Productos ON Inventario.ID_Producto = Productos.ID_Producto
        WHERE Inventario.ID_Sucursal = ?
        AND Productos.Nombre LIKE ?
        ORDER BY RAND()
        LIMIT 12;
    `;

        // Primero obtenemos los datos del cliente
        connection.query(sqlCliente, [clienteId], (error, clienteResults) => {
            if (error) {
                console.error('Error al obtener datos del cliente:', error);
                return res.status(500).send('Error al obtener datos del cliente.');
            }

            const cliente = clienteResults[0];

            // Luego obtenemos las sucursales
            connection.query(sqlSucursales, (error, results) => {
                if (error) {
                    console.error('Error al obtener las sucursales:', error);
                    return res.status(500).send('Error al obtener los datos de sucursales.');
                }

                // Finalmente obtenemos los productos
                const queryParams = [
                    idSucursal,
                    `%${searchTerm}%`
                ];

                connection.query(sqlProductos, queryParams, (error, products) => {
                    if (error) {
                        console.error('Error al obtener los productos:', error);
                        return res.status(500).send('Error al obtener los productos.');
                    }

                    // Renderiza la vista con todos los datos necesarios
                    res.render('pagina_pedidos/productos', {
                        results,
                        products,
                        idSucursal,
                        searchTerm,
                        cliente // Ahora pasamos los datos del cliente a la vista
                    });
                });
            });
        });
    });


    router.get('/api/productos/:id', (req, res) => {
        const productId = req.params.id;
        const sql = `
            SELECT 
                Productos.ID_Producto, 
                Productos.Fotografia, 
                Productos.Nombre, 
                Productos.Descripcion,
                Productos.Precio_Unitario, 
                Inventario.Cantidad, 
                Productos.ID_Categoria,
                Productos.ID_Area_Producto,
                Productos.Indicaciones,
                Productos.Dosis_Medicacmento,
                Productos.Efectos_Secundarios,
                Productos.Precauciones,
                Productos.ID_Unidad_Venta
            FROM Productos
            LEFT JOIN Inventario ON Inventario.ID_Producto = Productos.ID_Producto
            WHERE Productos.ID_Producto = ?
            LIMIT 1;
        `;
    
        connection.query(sql, [productId], (error, results) => {
            if (error) {
                console.error('Error al obtener detalles del producto:', error);
                return res.status(500).json({ error: 'Error al obtener detalles del producto' });
            }
    
            if (results.length === 0) {
                return res.status(404).json({ error: 'Producto no encontrado' });
            }
    
            res.json(results[0]);
        });
    });


        // RUTA PARA MOSTRAR LAS VENTAS
        router.get('/pagina_pedidos/misventas', (req, res) => {
            // Verificar si el usuario está logueado
            if (!req.session.loggedinCliente) {
                return res.redirect('/pagina_pedidos/login_clientes'); 
            }

            const idCliente = req.session.userIdCliente;

            // Consulta SQL para obtener las ventas del cliente
            const sqlVentas = `
                SELECT ventas.ID_Venta, ventas.Fecha_Venta, ventas.Total_Venta, Sucursales.Nombre AS Sucursal
                FROM ventas
                JOIN Sucursales ON ventas.ID_Sucursal = Sucursales.ID_Sucursal
                WHERE ventas.ID_Cliente = ?
                ORDER BY ventas.Fecha_Venta DESC
            `;

            connection.query(sqlVentas, [idCliente], (error, ventas) => {
                if (error) {
                    console.error('Error al obtener las ventas:', error);
                    return res.status(500).send('Error al obtener las ventas.');
                }

                if (ventas.length === 0) {
                    return res.render('pagina_pedidos/misventas', { ventas: [] });
                }

                res.render('pagina_pedidos/misventas', { ventas });
            });
        });

        // Dentro de tu ruta
        router.get('/pagina_pedidos/miscompras', (req, res) => {
            const idCliente = req.session.userIdCliente;

            const sqlVentas = `
                SELECT ventas.ID_Venta, ventas.Fecha_Venta, ventas.Total_Venta, Sucursales.Nombre AS Sucursal
                FROM ventas
                JOIN Sucursales ON ventas.ID_Sucursal = Sucursales.ID_Sucursal
                WHERE ventas.ID_Cliente = ?
                ORDER BY ventas.Fecha_Venta DESC
            `;

            connection.query(sqlVentas, [idCliente], (error, ventas) => {
                if (error) {
                    console.error('Error al obtener las ventas:', error);
                    return res.status(500).send('Error al obtener las ventas');
                }

                res.render('pagina_pedidos/miscompras', { ventas });  // Asegúrate de pasar 'ventas' aquí
            });
        });

        // Ruta para obtener los detalles de la venta por ID_Detalle_Venta
        router.get('/pagina_pedidos/detalleVenta/:ID_Detalle_Venta', (req, res) => {
            const { ID_Detalle_Venta } = req.params;

            // Consulta SQL para obtener los detalles de la venta
            const sqlDetalles = `
                SELECT 
                    D.ID_Detalle_Venta, 
                    D.ID_Venta, 
                    D.ID_Producto, 
                    D.Cantidad, 
                    P.Nombre AS Nombre_Producto
                FROM 
                    Detalles_Venta D
                JOIN 
                    Productos P ON D.ID_Producto = P.ID_Producto
                WHERE 
                    D.ID_Detalle_Venta = ?

            `;

            // Realizar la consulta a la base de datos
            connection.query(sqlDetalles, [ID_Detalle_Venta], (error, detalles) => {
                if (error) {
                    console.error('Error al obtener los detalles de la venta:', error);
                    return res.status(500).send('Error al obtener los detalles de la venta.');
                }

                // Enviar los detalles al cliente
                res.json(detalles);
            });
        });

    
    router.post('/authas', (req, res) => {
        const codigo = req.body.codigo;
        const contrasena = req.body.contrasena;
    
        // Cambiar la consulta para buscar por 'Codigo' y 'Contrasena'
        connection.query('SELECT * FROM clientes WHERE Codigo = ?', [codigo], (error, results) => {
            if (error) {
                return res.status(500).send('Error en la consulta a la base de datos');
            }
            if (results.length === 0 || results[0].Contrasena !== contrasena) {
                return res.send('Usuario o contraseña incorrectos');
            }
    
            // Inicia sesión del cliente
            req.session.loggedinCliente = true;
            req.session.userIdCliente = results[0].ID_Cliente;
    
            return res.redirect(`/pagina_pedidos/clientes_index/${req.session.userIdCliente}`);
        });
    });
    router.get('/pagina_pedidos/verificar-sesion', (req, res) => {
        if (req.session && req.session.loggedinCliente) {
            res.json({ estaLogueado: true });
        } else {
            res.json({ estaLogueado: false });
        }
    });
    
    // Ruta para cerrar sesión
    router.get('/pagina_pedidos/logout', (req, res) => {
        // Destruir la sesión
        req.session.destroy((err) => {
            if (err) {
                return res.status(500).send('Error al cerrar sesión');
            }
            // Redirigir al login después de cerrar sesión
            res.redirect('/pagina_pedidos/login_clientes');
        });
    });
    
    router.get('/pagina_pedidos/clientes_index/:idSucursal', (req, res) => {
        const idSucursal = req.params.idSucursal;
    
        // Verifica el estado de sesión del cliente
        const estaLogueadoCliente = req.session && req.session.loggedinCliente === true;
        console.log('Estado de la sesión:', req.session);
    
        // Consultas de base de datos
        const sqlSucursales = `SELECT * FROM Sucursales`;
        const sqlProductos = `
            SELECT Inventario.ID_Producto, Productos.Nombre, Productos.Descripcion,
                Productos.Precio_Unitario, Inventario.Cantidad, Inventario.ID_Sucursal
            FROM Inventario
            JOIN Productos ON Inventario.ID_Producto = Productos.ID_Producto
            WHERE Inventario.ID_Sucursal = ?
            ORDER BY RAND()
            LIMIT 12
        `;
    
        connection.query(sqlSucursales, (error, results) => {
            if (error) {
                console.error('Error al obtener las sucursales:', error);
                return res.status(500).send('Error al obtener los datos de sucursales.');
            }
    
            connection.query(sqlProductos, [idSucursal], (error, products) => {
                if (error) {
                    console.error('Error al obtener los productos:', error);
                    return res.status(500).send('Error al obtener los productos.');
                }
    
                // Envía 'estaLogueadoCliente' a la vista para controlar los botones visibles
                res.render('pagina_pedidos/clientes_index', { results, products, idSucursal, estaLogueadoCliente });
            });
        });
    });
    router.get('/getClientData', (req, res) => {
        // Verifica si el cliente está logueado
        if (req.session && req.session.loggedinCliente === true) {
            const clientId = req.session.clientId; // Suponiendo que has guardado el ID del cliente en la sesión
            const sql = `SELECT * FROM Clientes WHERE ID_Cliente = ?`;
            
            connection.query(sql, [clientId], (error, results) => {
                if (error) {
                    console.error('Error al obtener los datos del cliente:', error);
                    return res.status(500).json({ error: 'Error al obtener los datos del cliente.' });
                }
                
                if (results.length > 0) {
                    // Enviar los datos del cliente al frontend
                    const clientData = results[0];
                    res.json({
                        id_cliente: clientData.ID_Cliente,
                        nombre: clientData.Nombre,
                        apellido: clientData.Apellido,
                        telefono: clientData.Telefono,
                        ci: clientData.CI,
                        nit: clientData.NIT,
                        codigo: clientData.Codigo,
                        contrasena: clientData.Contrasena
                    });
                } else {
                    res.status(404).json({ error: 'Cliente no encontrado.' });
                }
            });
        } else {
            res.status(403).json({ error: 'No estás logueado.' });
        }
    });


        
    router.get('/pagina_pedidos/continuar_pedido', (req, res) => {
        console.log('Sesión cliente:', req.session);
    
        if (!req.session.loggedinCliente) {
            return res.redirect('/pagina_pedidos/login_clientes');
        }
    
        const clienteId = req.session.userIdCliente;
    
        const queryCliente = `SELECT * FROM clientes WHERE ID_Cliente = ?`;
        connection.query(queryCliente, [clienteId], (err, resultsCliente) => {
            if (err) {
                console.error('Error obteniendo datos del cliente:', err);
                return res.status(500).send('Error interno');
            }
    
            const queryVenta = `
            SELECT v.ID_Venta, v.Fecha_Venta, v.Total_Venta, v.ID_Cliente, v.ID_Empleado, v.ID_Sucursal, v.ID_Caja
            FROM ventas v
            WHERE v.ID_Cliente = ? 
            ORDER BY v.Fecha_Venta DESC 
            LIMIT 1;
        `;
        
            connection.query(queryVenta, [clienteId], (err, resultsVenta) => {
                if (err) {
                    console.error('Error obteniendo los datos de la venta:', err);
                    return res.status(500).send('Error interno');
                }
    
                if (resultsVenta.length > 0) {
                    const venta = resultsVenta[0]; 
                    res.render('pagina_pedidos/continuar_pedido', {
                        cliente: resultsCliente[0],
                        venta: venta
                    });
                } else {
                    res.render('pagina_pedidos/continuar_pedido', {
                        cliente: resultsCliente[0],
                        mensaje: 'No hay ventas recientes.'
                    });
                }
            });
        });
    });




    // Ruta para insertar una venta
    router.post('/confirmarVenta', (req, res) => {
        try {
            const { productos, cliente, sucursalId, total, fecha } = req.body;

            const query = `
                INSERT INTO ventas (Fecha_Venta, Total_Venta, ID_Cliente, ID_Empleado, ID_Sucursal, ID_Caja, Estado)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            const values = [fecha, total, cliente, 1, sucursalId, 1, 'pendiente'];

            connection.query(query, values, (error, results) => {
                if (error) {
                    console.error('Error al insertar la venta:', error);
                    return res.status(500).json({ success: false, message: 'Error al procesar la venta' });
                }
                res.json({ success: true });
            });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    });

    router.post('/insertarVenta', (req, res) => {
        const { cliente, totalVenta, sucursalId, estado, fecha, idEmpleado, idCaja } = req.body;
    
        // Validar los campos
        if (!cliente || !totalVenta || !sucursalId || !estado || !fecha || !idEmpleado || !idCaja) {
            return res.render('pagina_pedidos/continuar_pedido', { successMessage: 'Faltan datos requeridos' });
        }
    
        const sql = `
            INSERT INTO ventas (Fecha_Venta, Total_Venta, ID_Cliente, ID_Empleado, ID_Sucursal, ID_Caja, Estado)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [fecha, totalVenta, cliente, idEmpleado, sucursalId, idCaja, estado];
    
        connection.query(sql, values, (err, result) => {
            if (err) {
                console.error('Error al insertar la venta:', err);
                return res.render('pagina_pedidos/continuar_pedido', { successMessage: 'Error al insertar la venta' });
            }
    
            res.render('pagina_pedidos/continuar_pedido', { successMessage: 'Venta registrada con éxito!' });
        });
    });
    
    // Ruta para guardar el pedido
    router.post('/pagina_pedidos/guardar_pedido', (req, res) => {
        const { idVenta, idEmpleado, idCliente, direccion, idDistrito } = req.body;
        console.log('Datos recibidos para el pedido:', { idVenta, idEmpleado, idCliente, direccion, idDistrito });

        const query = `
            INSERT INTO pedidos (ID_Venta, ID_Empleado, ID_Cliente, Direccion, ID_Distrito)
            VALUES (?, ?, ?, ?, ?)
        `;
        connection.query(query, [idVenta, idEmpleado, idCliente, direccion, idDistrito], (err, result) => {
            if (err) {
                console.error('Error al guardar el pedido:', err);
                return res.status(500).send('Error en el servidor');
            }
            // Si todo es correcto, redirige a la vista de compras
            res.redirect('/pagina_pedidos/miscompras');
        });
    });
    router.get('/pagina_pedidos/detalleVenta/:id', async (req, res) => {
        try {
            const detallesVenta = await pool.query(`
                SELECT DISTINCT 
                    p.ID_Producto AS id, 
                    p.Nombre AS nombre, 
                    p.Descripcion AS descripcion, 
                    dr.Dosis AS dosis  
                FROM Productos p
                INNER JOIN Detalles_Venta dv ON p.ID_Producto = dv.ID_Producto
                INNER JOIN Ventas v ON dv.ID_Venta = v.ID_Venta
                INNER JOIN Recordatorios r ON p.ID_Producto = r.ID_Producto  -- Relacionamos con Recordatorios
                INNER JOIN detalle_recordatorio dr ON r.ID_Recordatorio = dr.ID_Recordatorio  -- Relacionamos con detalle_recordatorio
                WHERE v.ID_Cliente = ?
                ORDER BY p.Nombre;

            `, [req.params.id]);
            
            res.json(detallesVenta);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener los detalles de la venta' });
        }
    });


    

    
    // Ruta para mostrar la página de recordatorios
router.get('/pagina_pedidos/recordatorio', (req, res) => {
    if (!req.session.loggedinCliente) {
        return res.redirect('/pagina_pedidos/login_clientes');
    }

    const idCliente = req.session.userIdCliente;  // Usamos 'userIdCliente' en lugar de 'idCliente'

    // Verificar si el cliente está logueado
    if (!idCliente) {
        return res.status(401).json({ error: 'No autorizado. El cliente no está logueado.' });
    }

    const query = `
        SELECT 
            r.ID_Recordatorio,
            r.ID_Cliente,
            r.ID_Producto,
            r.Telefono,
            dr.fecha,
            dr.hora,
            dr.Mensaje,
            dr.Dosis,
            dr.Cantidad_Mendicamentos
        FROM 
            Recordatorios r
        JOIN 
            detalle_recordatorio dr ON r.ID_Recordatorio = dr.ID_Recordatorio
        WHERE 
            r.ID_Cliente = ?;
    `;

    connection.query(query, [idCliente], (err, results) => {
        if (err) {
            console.error('Error al obtener recordatorios:', err);
            return res.status(500).json({ error: 'Error al obtener los recordatorios' });
        }

        // Verificar si results tiene datos
        console.log("Recordatorios obtenidos: ", results);

        // Renderizar la vista y pasarle los resultados
        res.render('pagina_pedidos/recordatorio', { recordatorios: results });
    });
});

    router.delete('/pagina_pedidos/eliminar_recordatorio/:id', (req, res) => {
        const id = req.params.id;

        // Eliminar los registros relacionados en detalle_recordatorio
        const deleteDetailsQuery = 'DELETE FROM detalle_recordatorio WHERE ID_Recordatorio = ?';
        connection.query(deleteDetailsQuery, [id], (error, result) => {
            if (error) {
                console.error(error);
                return res.status(500).json({ success: false, message: 'Error al eliminar detalles del recordatorio' });
            }

            // Eliminar el recordatorio de la tabla recordatorios
            const deleteReminderQuery = 'DELETE FROM recordatorios WHERE ID_Recordatorio = ?';
            connection.query(deleteReminderQuery, [id], (error, result) => {
                if (error) {
                    console.error(error);
                    return res.status(500).json({ success: false, message: 'Error al eliminar el recordatorio' });
                }
                if (result.affectedRows > 0) {
                    res.json({ success: true, message: 'Recordatorio eliminado con éxito' });
                } else {
                    res.json({ success: false, message: 'No se encontró el recordatorio con ese ID' });
                }
            });
        });
    });
    router.post('/api/crear-recordatorio', async (req, res) => {
        try {
            if (!req.session.loggedinCliente) {
                return res.status(401).json({ error: 'No autorizado' });
            }
    
            // Verifica que el cliente esté autenticado
            console.log('Sesión completa:', req.session);
            console.log('ID Cliente en sesión:', req.session.userIdCliente);  // Usar 'userIdCliente' aquí
    
            const { productoId, dosis, cantidad, telefono, fechaHora } = req.body;
    
            if (!productoId || !dosis || !cantidad || !telefono || !fechaHora) {
                return res.status(400).json({ error: 'Todos los campos son requeridos' });
            }
    
            if (new Date(fechaHora) < new Date()) {
                return res.status(400).json({ error: 'La fecha debe ser futura' });
            }
    
            // Eliminar el prefijo '591' del teléfono si existe
            const telefonoLimpio = telefono.replace(/^591/, '');
    
            // Insertar el recordatorio principal
            connection.query(
                'INSERT INTO Recordatorios (ID_Cliente, ID_Producto, Telefono) VALUES (?, ?, ?)',
                [req.session.userIdCliente, productoId, telefonoLimpio],  // Usar 'userIdCliente'
                (err, result) => {
                    if (err) {
                        console.error('Error en la primera inserción:', err);
                        return res.status(500).json({ error: 'Error al crear el recordatorio' });
                    }
    
                    const fecha = new Date(fechaHora).toISOString().split('T')[0];
                    const hora = new Date(fechaHora).toTimeString().split(' ')[0];
                    const mensaje = `Es hora de tomar tu medicamento. Dosis: ${dosis}. Cantidad: ${cantidad} unidades.`;
    
                    // Insertar el detalle del recordatorio
                    connection.query(
                        'INSERT INTO detalle_recordatorio (ID_Recordatorio, fecha, hora, Mensaje, Dosis, Cantidad_Mendicamentos) VALUES (?, ?, ?, ?, ?, ?)',
                        [result.insertId, fecha, hora, mensaje, dosis, cantidad],
                        (err) => {
                            if (err) {
                                console.error('Error en la segunda inserción:', err);
                                return res.status(500).json({ error: 'Error al crear el detalle del recordatorio' });
                            }
                            res.json({ 
                                message: 'Recordatorio creado exitosamente', 
                                id: result.insertId 
                            });
                        }
                    );
                }
            );
        } catch (error) {
            console.error('Error general:', error);
            res.status(500).json({ error: 'Error al procesar la solicitud' });
        }
    });
    router.get('/pagina_pedidos/editar_recordatorio/:id', (req, res) => {
        const id = req.params.id;
        const query = 'SELECT * FROM recordatorios WHERE ID_Recordatorio = ? AND eliminado = 0';
        connection.query(query, [id], (error, results) => {
            if (error) {
                console.error(error);
                return res.status(500).json({ success: false, message: 'Error al obtener el recordatorio' });
            }
            if (results.length > 0) {
                res.render('editar_recordatorio', { recordatorio: results[0] });
            } else {
                res.status(404).json({ success: false, message: 'Recordatorio no encontrado' });
            }
        });
    });
    router.get('/pagina_pedidos/editar_recordatorio/:id', (req, res) => {
        const id = req.params.id;
        const query = 'SELECT * FROM recordatorios WHERE ID_Recordatorio = ?';
        
        connection.query(query, [id], (error, results) => {
            if (error) {
                console.error(error);
                return res.status(500).json({ success: false, message: 'Error al obtener el recordatorio' });
            }
            if (results.length > 0) {
                res.render('pagina_pedidos/recordatorio', { recordatorio: results[0] });
            } else {
                res.status(404).json({ success: false, message: 'Recordatorio no encontrado' });
            }
        });
    });
        




    // Ruta para obtener productos comprados
    router.get('/api/mis-productos-comprados', async (req, res) => {
        try {
            console.log('Estado de la sesión:', {
                sesionActiva: req.session.loggedinCliente,
                idCliente: req.session.userIdCliente  // Cambiado para usar userIdCliente
            });

            if (!req.session.loggedinCliente) {
                console.log('Cliente no ha iniciado sesión');
                return res.redirect('/pagina_pedidos/login_clientes');
            }

            const query = `
                SELECT DISTINCT 
                    p.ID_Producto AS id,
                    p.Nombre AS nombre
                FROM Productos p
                INNER JOIN Detalles_Venta dv ON p.ID_Producto = dv.ID_Producto
                INNER JOIN Ventas v ON dv.ID_Venta = v.ID_Venta
                WHERE v.ID_Cliente = ?
                ORDER BY p.Nombre;
            `;

            // Usar el ID del cliente desde la sesión
            connection.query(query, [req.session.userIdCliente], (error, results) => {
                if (error) {
                    console.error('Error en la consulta:', error);
                    return res.status(500).json({ error: 'Error al obtener productos' });
                }

                console.log('Productos encontrados:', results);
                res.json(results);
            });

        } catch (error) {
            console.error('Error general:', error);
            res.status(500).json({ error: 'Error del servidor' });
        }
    });

    


    // Ruta para obtener recordatorios del cliente
    router.get('/api/mis-recordatorios', async (req, res) => {
        try {
            if (!req.session.loggedinCliente) {
                return res.status(401).json({ error: 'No autorizado' });
            }

            const query = `
                SELECT 
                    r.ID_Recordatorio,
                    p.Nombre,
                    dr.Dosis,
                    dr.Cantidad_Mendicamentos AS cantidad,
                    r.Telefono,
                    dr.fecha,
                    dr.hora,
                    dr.Mensaje
                FROM 
                    Recordatorios r
                INNER JOIN 
                    detalle_recordatorio dr ON r.ID_Recordatorio = dr.ID_Recordatorio
                INNER JOIN 
                    Productos p ON r.ID_Producto = p.ID_Producto
                WHERE 
                    r.ID_Cliente = ?
                ORDER BY 
                    dr.fecha DESC, dr.hora DESC
            `;

            connection.query(query, [req.session.idCliente], (error, recordatorios) => {
                if (error) {
                    console.error('Error al obtener recordatorios:', error);
                    return res.status(500).json({ error: 'Error al obtener los recordatorios' });
                }
                res.json(recordatorios);
            });

        } catch (error) {
            console.error('Error al obtener recordatorios:', error);
            res.status(500).json({ error: 'Error al obtener los recordatorios' });
        }
    }); 

    // Actualizar un recordatorio
    router.put('/api/actualizar-recordatorio/:id', async (req, res) => {
        try {
            if (!req.session.loggedinCliente) {
                return res.status(401).json({ error: 'No autorizado' });
            }

            const { dosis, cantidad, telefono, fechaHora } = req.body;
            const idRecordatorio = req.params.id;

            // Validaciones
            if (!dosis || !cantidad || !telefono || !fechaHora) {
                return res.status(400).json({ error: 'Todos los campos son requeridos' });
            }

            // Validar formato del teléfono
            if (!/^591\d{8}$/.test(telefono)) {
                return res.status(400).json({ error: 'Formato de teléfono inválido' });
            }

            const fechaRecordatorio = new Date(fechaHora);
            const fecha = fechaRecordatorio.toISOString().split('T')[0];
            const hora = fechaRecordatorio.toTimeString().split(' ')[0];

            await connection.beginTransaction();

            try {
                // Actualizar el recordatorio principal
                await connection.query(
                    'UPDATE Recordatorio SET Telefono = ? WHERE ID_Recordatorio = ? AND ID_Cliente = ?',
                    [telefono, idRecordatorio, req.session.idCliente]
                );

                // Actualizar el detalle del recordatorio
                const mensaje = `Es hora de tomar tu medicamento. Dosis: ${dosis}. Cantidad: ${cantidad} unidades.`;
                await connection.query(
                    `UPDATE detalle_recordatorio 
                    SET fecha = ?, hora = ?, Mensaje = ?, Dosis = ?, Cantidad_medicamentos = ?
                    WHERE ID_Recordatorio = ?`,
                    [fecha, hora, mensaje, dosis, cantidad, idRecordatorio]
                );

                await connection.commit();
                res.json({ message: 'Recordatorio actualizado exitosamente' });

            } catch (error) {
                await connection.rollback();
                throw error;
            }

        } catch (error) {
            console.error('Error al actualizar recordatorio:', error);
            res.status(500).json({ error: 'Error al actualizar el recordatorio' });
        }
    });

    // Eliminar un recordatorio
    router.delete('/api/eliminar-recordatorio/:id', async (req, res) => {
        try {
            if (!req.session.loggedinCliente) {
                return res.status(401).json({ error: 'No autorizado' });
            }

            const idRecordatorio = req.params.id;

            await connection.beginTransaction();

            try {
                // Primero eliminar los detalles
                await connection.query(
                    'DELETE FROM detalle_recordatorio WHERE ID_Recordatorio = ?',
                    [idRecordatorio]
                );

                // Luego eliminar el recordatorio principal
                await connection.query(
                    'DELETE FROM Recordatorio WHERE ID_Recordatorio = ? AND ID_Cliente = ?',
                    [idRecordatorio, req.session.idCliente]
                );

                await connection.commit();
                res.json({ message: 'Recordatorio eliminado exitosamente' });

            } catch (error) {
                await connection.rollback();
                throw error;
            }

        } catch (error) {
            console.error('Error al eliminar recordatorio:', error);
            res.status(500).json({ error: 'Error al eliminar el recordatorio' });
        }
    });

    // Ruta para mostrar la consulta
    router.get('/pagina_pedidos/consultas', (req, res) => {

        if (!req.session.loggedinCliente) {
            return res.redirect('/pagina_pedidos/login_clientes');
        }
        res.render('pagina_pedidos/consultas');
    });
    
    

    module.exports = router;