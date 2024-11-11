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

// Ruta para registrar nuevos clientes
router.post('/registrar', (req, res) => {
    const nombre = req.body.name;   // Nombre del cliente
    const apellido = req.body.apellido;  // Apellido del cliente
    const telefono = req.body.telefono;  // Teléfono del cliente
    const ci = req.body.ci;  // CI del cliente
    const nit = req.body.nit;  // Nit del cliente
    const gmail = req.body.email;  // Gmail del cliente

    connection.query('INSERT INTO clientes SET ?', {
        Nombre: nombre,
        Apellido: apellido,
        Telefono: telefono,
        CI: ci,
        Nit: nit,
        Gmail: gmail
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
        SELECT Inventario.ID_Producto, Productos.Nombre, Productos.Descripcion, 
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
router.get('/pagina_pedidos/carritopedidos', (req, res) => {
    res.render('pagina_pedidos/carritopedidos'); // Asegúrate de que el nombre de la vista sea correcto
});



// Ruta para mostrar la vista del carrito de pedidos
router.get('/pagina_pedidos/productos/:idSucursal', (req, res) => {
    const idSucursal = req.params.idSucursal;

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
           res.render('pagina_pedidos/productos', { results, products, idSucursal });
       });
   });
});


// Ruta para mostrar la vista del carrito de pedidos
router.get('/pagina_pedidos/consultas', (req, res) => {
    res.render('pagina_pedidos/consultas'); // Asegúrate de que el nombre de la vista sea correcto
});

// Ruta para mostrar la vista del carrito de pedidos
router.get('/pagina_pedidos/miscompras', (req, res) => {
    res.render('pagina_pedidos/miscompras'); // Asegúrate de que el nombre de la vista sea correcto
});




// Autenticación de clientes
router.post('/authas', (req, res) => {
    const gmail = req.body.email;
    const ci = req.body.password;

    connection.query('SELECT * FROM clientes WHERE Gmail = ?', [gmail], (error, results) => {
        if (error) {
            return res.status(500).send('Error en la consulta a la base de datos');
        }
        if (results.length === 0 || results[0].CI !== ci) {
            return res.send('Usuario o contraseña incorrectos');
        }

        req.session.loggedinCliente = true;
        req.session.userIdCliente = results[0].ID_Cliente;

        return res.redirect(`/pagina_pedidos/clientes_index/${req.session.userIdCliente}`);
    });
});

// Autenticación de administradores (por ejemplo)
router.post('/authAdmin', (req, res) => {
    const adminEmail = req.body.email;
    const adminPass = req.body.password;

    connection.query('SELECT * FROM administradores WHERE email = ?', [adminEmail], (error, results) => {
        if (error) {
            return res.status(500).send('Error en la consulta a la base de datos');
        }
        if (results.length === 0 || results[0].password !== adminPass) {
            return res.send('Usuario o contraseña incorrectos');
        }

        req.session.loggedinAdmin = true;
        req.session.userIdAdmin = results[0].ID_Admin;

        return res.redirect('/admin/dashboard');
    });
});


// Nueva ruta para verificar sesión
router.get('/pagina_pedidos/verificar-sesion', (req, res) => {
    if (req.session && req.session.loggedin) {
        res.json({ estaLogueado: true });
    } else {
        res.json({ estaLogueado: false });
    }
});


router.get('/pagina_pedidos/clientes_index/:idSucursal', (req, res) => {
    const idSucursal = req.params.idSucursal;
    const estaLogueadoCliente = req.session.loggedinCliente === true;


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
            // Envía 'estaLogueado' a la vista
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






module.exports = router;