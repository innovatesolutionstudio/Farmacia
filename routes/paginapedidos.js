    // Invocamos a Express
    const express = require('express');
    const router = express.Router();
    // Invocamos a la conexión de la base de datos
    const connection = require('../database/db');
    const { boolean } = require('cohere-ai/core/schemas');
    
    
    // Ruta para mostrar la vista de login de clientes
    router.get('/pagina_pedidos/login_clientes', (req, res) => {
        res.render('pagina_pedidos/login_clientes');
    });
    
    
    // Middleware para analizar el cuerpo de las solicitudes JSON y URL-encoded
    router.use(express.json());
    router.use(express.urlencoded({ extended: true }));
    
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
        return res.redirect('/login');
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
    



    router.get('/pagina_pedidos/consultas', (req, res) => {

        if (!req.session.loggedinCliente) {
            return res.redirect('/pagina_pedidos/login_clientes');
        }
        res.render('pagina_pedidos/consultas');
    });


    // RUTA PARA MOSTRAR LAS COMPRAS
router.get('/pagina_pedidos/miscompras', (req, res) => {

    // Verificar si el usuario está logueado
    if (!req.session.loggedinCliente) {
        return res.redirect('/pagina_pedidos/login_clientes'); 
    }

    const idCliente = req.session.userIdCliente; // Obtener el ID del cliente desde la sesión

    // Consulta SQL para obtener las compras del cliente desde la base de datos
    const sqlCompras = `
        SELECT ventas.ID_Venta, ventas.Fecha_Venta, ventas.Total_Venta, Sucursales.Nombre AS Sucursal
        FROM ventas
        JOIN Sucursales ON ventas.ID_Sucursal = Sucursales.ID_Sucursal
        WHERE ventas.ID_Cliente = ?
        ORDER BY ventas.Fecha_Venta DESC
    `;

    // Realizar la consulta a la base de datos
    connection.query(sqlCompras, [idCliente], (error, compras) => {
        if (error) {
            console.error('Error al obtener las compras:', error);
            return res.status(500).send('Error al obtener las compras.'); // Manejo de errores
        }

        // Si no hay compras registradas, mostrar un mensaje
        if (compras.length === 0) {
            return res.render('pagina_pedidos/miscompras', { compras: [] });
        }

        // Si hay compras, renderizar la vista con los datos de las compras
        res.render('pagina_pedidos/miscompras', { compras });
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
    router.get('/getClientData', (req, res) => {
        // Comprobar si el cliente está autenticado
        if (req.session && req.session.loggedinCliente) {
            const userIdCliente = req.session.userIdCliente;
    
            // Realizar la consulta a la base de datos para obtener los datos del cliente
            connection.query('SELECT * FROM clientes WHERE ID_Cliente = ?', [userIdCliente], (error, results) => {
                if (error) {
                    return res.status(500).send('Error en la consulta a la base de datos');
                }
    
                if (results.length === 0) {
                    return res.status(404).send('Cliente no encontrado');
                }
    
                // Si el cliente está autenticado, devolver los datos
                res.json({
                    id_cliente: results[0].ID_Cliente,
                    nombre: results[0].Nombre,
                    apellido: results[0].Apellido,
                    telefono: results[0].Telefono,
                    ci: results[0].CI,
                    nit: results[0].Nit,
                    codigo: results[0].Codigo,
                    contrasena: results[0].Contrasena
                });
            });
        } else {
            return res.status(401).send('No estás autenticado');
        }
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
    // Ruta para actualizar los datos del cliente
        router.post('/editarPerfil', (req, res) => {
            const { name, lastname, phone, ci, nit, code } = req.body;
            const idCliente = req.session.clientId;  // Obtener el ID del cliente desde la sesión

            const sqlUpdateClient = `
                UPDATE Clientes
                SET Nombre = ?, Apellido = ?, Teléfono = ?, C.I. = ?, NIT = ?, Código = ?
                WHERE ID_Cliente = ?
            `;

            connection.query(sqlUpdateClient, [name, lastname, phone, ci, nit, code, idCliente], (error, result) => {
                if (error) {
                    console.error('Error al actualizar los datos:', error);
                    return res.status(500).send('Error al actualizar los datos del cliente.');
                }

                // Redirigir a la página de perfil o mostrar un mensaje de éxito
                res.redirect('/pagina_pedidos/clientes_index/:idSucursal');
            });
        });

    

    
    router.get('/pagina_pedidos/continuar_pedido', (req, res) => {
        console.log('Sesión cliente:', req.session);
    
        if (!req.session.loggedinCliente) {
            return res.redirect('/pagina_pedidos/login_clientes');
        }
    
        const clienteId = req.session.userIdCliente;
    
        // Consulta para obtener datos del cliente
        const queryCliente = `SELECT * FROM clientes WHERE ID_Cliente = ?`;
        connection.query(queryCliente, [clienteId], (err, resultsCliente) => {
            if (err) {
                console.error('Error obteniendo datos del cliente:', err);
                return res.status(500).send('Error interno');
            }
    
            // Ahora obtenemos los datos de la venta (ejemplo de la venta más reciente)
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
                    const venta = resultsVenta[0]; // Usamos la primera venta
                    // Pasamos tanto los datos del cliente como de la venta a la vista
                    res.render('pagina_pedidos/continuar_pedido', {
                        cliente: resultsCliente[0],
                        venta: venta
                    });
                } else {
                    // Si no hay ventas, redirigimos o mostramos un mensaje adecuado
                    res.render('pagina_pedidos/continuar_pedido', {
                        cliente: resultsCliente[0],
                        mensaje: 'No hay ventas recientes.'
                    });
                }
            });
        });
    });
    
    
// Ruta para insertar la venta
router.post('/insertarVenta', (req, res) => {
    const { cliente, totalVenta, sucursalId, estado, fecha, idEmpleado, idCaja } = req.body;

    // Consultar para insertar los datos de la venta
    const sql = `
        INSERT INTO ventas (Fecha_Venta, Total_Venta, ID_Cliente, ID_Empleado, ID_Sucursal, ID_Caja, Estado)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [fecha, totalVenta, cliente, idEmpleado, sucursalId, idCaja, estado];

    connection.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error al insertar la venta:', err);
            return res.json({ success: false, message: 'Error al insertar la venta' });
        }

        // Devolver el ID de la venta que acabamos de insertar
        res.json({ success: true, id: result.insertId });
    });
});

    
    
    
    // Ruta para guardar el pedido
    router.post('/pagina_pedidos/guardar_pedido', (req, res) => {
        const { idVenta, idEmpleado, idCliente, direccion, idDistrito } = req.body;

        // Asegúrate de que los valores estén correctamente recibidos
        console.log('Datos recibidos para el pedido:', { idVenta, idEmpleado, idCliente, direccion, idDistrito });

        // Consulta para insertar el pedido en la base de datos
        const query = `
            INSERT INTO pedidos (ID_Venta, ID_Empleado, ID_Cliente, Direccion, ID_Distrito)
            VALUES (?, ?, ?, ?, ?)
        `;

        // Usa connection.query para hacer la consulta
        connection.query(query, [idVenta, idEmpleado, idCliente, direccion, idDistrito], (err, result) => {
            if (err) {
                console.error('Error al guardar el pedido:', err);
                return res.status(500).send('Error en el servidor');
            }
            // Si todo es correcto, redirige a la vista de compras
            res.redirect('/pagina_pedidos/miscompras');
        });
    });

    
    router.get('/pagina_pedidos/recordatorio', (req, res) => {

        if (!req.session.loggedinCliente) {
            return res.redirect('/pagina_pedidos/login_clientes'); 
        }
        res.render('pagina_pedidos/recordatorio');
    });


    router.get('/pagina_pedidos/carritopedidos', (req, res) => {
        res.render('pagina_pedidos/carritopedidos'); 
    });
    
    

    module.exports = router;