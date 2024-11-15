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
    
    
    
    
    router.get('/pagina_pedidos/index_clientes/:idSucursal', (req, res) => {
        // Obtener el ID de la sucursal desde los parámetros de la URL
        const idSucursal = req.params.idSucursal;
    
        // Consulta para las sucursales (lista completa para que el usuario elija)
        const sqlSucursales = `SELECT * FROM Sucursales`;
    
        // Consulta para seleccionar productos disponibles en la sucursal específica
        const sqlProductos = `
            SELECT Inventario.ID_Producto, Productos.Fotografia, Productos.Nombre, Productos.Descripcion,
                Productos.Precio_Unitario, Inventario.Cantidad, Inventario.ID_Sucursal
            FROM Inventario
            JOIN Productos ON Inventario.ID_Producto = Productos.ID_Producto
            WHERE Inventario.ID_Sucursal = ?
            ORDER BY RAND()
            LIMIT 10
        `;
    
        // Ejecutar la consulta de sucursales
        connection.query(sqlSucursales, (error, results) => {
            if (error) {
                console.error('Error al obtener las sucursales:', error);
                return res.status(500).send('Error al obtener los datos de sucursales.');
            }
    
            // Ejecutar la consulta de productos con el filtro de sucursal
            connection.query(sqlProductos, [idSucursal], (error, products) => {
                if (error) {
                    console.error('Error al obtener los productos:', error);
                    return res.status(500).send('Error al obtener los productos.');
                }
    
                // Renderizar la vista con ambos resultados
                res.render('pagina_pedidos/index_clientes', { results, products, idSucursal });
            });
        });
    });
        
  // Ruta para mostrar la vista del carrito de pedidos
router.get('/pagina_pedidos/productos/:idSucursal', (req, res) => {
    const idSucursal = req.params.idSucursal;
    const searchTerm = req.query.search || ''; // Obtiene el término de búsqueda

    // Consulta para obtener las sucursales
    const sqlSucursales = `SELECT * FROM Sucursales`;

    // Consulta para obtener los productos según el término de búsqueda y el inventario
    const sqlProductos = `
        SELECT Inventario.ID_Producto, Productos.Fotografia, Productos.Nombre, Productos.Descripcion,
            Productos.Precio_Unitario, Inventario.Cantidad, Inventario.ID_Sucursal
        FROM Inventario
        JOIN Productos ON Inventario.ID_Producto = Productos.ID_Producto
        WHERE Inventario.ID_Sucursal = ?
        AND Productos.Nombre LIKE ?
        ORDER BY RAND()
        LIMIT 12
    `;

    connection.query(sqlSucursales, (error, results) => {
        if (error) {
            console.error('Error al obtener las sucursales:', error);
            return res.status(500).send('Error al obtener los datos de sucursales.');
        }

        const queryParams = [
            idSucursal,
            `%${searchTerm}%`  // El término de búsqueda
        ];

        connection.query(sqlProductos, queryParams, (error, products) => {
            if (error) {
                console.error('Error al obtener los productos:', error);
                return res.status(500).send('Error al obtener los productos.');
            }

            // Renderiza la vista y pasa los productos y las sucursales al frontend
            res.render('pagina_pedidos/productos', { results, products, idSucursal, searchTerm });
        });
    });
});


    // Ruta para mostrar la vista del carrito de pedidos
    router.get('/pagina_pedidos/consultas', (req, res) => {
        res.render('pagina_pedidos/consultas'); // Asegúrate de que el nombre de la vista sea correcto
    });
    
    // Ruta para mostrar la vista de 'Mis Compras' del cliente con los datos de compras
    router.get('/pagina_pedidos/miscompras', (req, res) => {
        const idCliente = req.session.userIdCliente; // Obtener el ID del cliente desde la sesión
        
        // Consulta para obtener las compras del cliente
        const sqlCompras = `
            SELECT ventas.ID_Venta, ventas.Fecha_Venta, ventas.Total_Venta, Sucursales.Nombre AS Sucursal
            FROM ventas
            JOIN Sucursales ON ventas.ID_Sucursal = Sucursales.ID_Sucursal
            WHERE ventas.ID_Cliente = ?
            ORDER BY ventas.Fecha_Venta DESC
        `;
        
        connection.query(sqlCompras, [idCliente], (error, compras) => {
            if (error) {
                console.error('Error al obtener las compras:', error);
                return res.status(500).send('Error al obtener las compras.');
            }
            
            // Renderiza la vista con los datos de las compras
            res.render('pagina_pedidos/miscompras', { compras });
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
    
    
    router.get('/pagina_pedidos/continuar_pedido', (req, res) => {
        res.render('pagina_pedidos/continuar_pedido');
    });
    
    router.get('/pagina_pedidos/recordatorio', (req, res) => {
        res.render('pagina_pedidos/recordatorio');
    });

    router.get('/pagina_pedidos/carritopedidos', (req, res) => {
        res.render('pagina_pedidos/carritopedidos'); 
    });
    
    

    module.exports = router;