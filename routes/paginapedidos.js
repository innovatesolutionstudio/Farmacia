// Invocamos a Express
const express = require("express");
const router = express.Router();
// Invocamos a la conexión de la base de datos
const connection = require("../database/db");
const pool = require('../database/db');
const axios = require('axios'); // Importar Axios
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");








router.get('/pagina_pedidos/clientes_index', (req, res) => {      
    res.render('pagina_pedidos/clientes_index');
});



router.get("/pagina_pedidos/productos/:idSucursal", (req, res) => {
    const idSucursal = req.params.idSucursal;
    const searchTerm = req.query.search || "";
    const clienteId = req.session.userIdCliente;
    const currentPage = parseInt(req.query.page) || 1;
    const productsPerPage = 12;

    const sqlCliente = "SELECT * FROM clientes WHERE ID_Cliente = ?";
    const sqlSucursales = `SELECT * FROM Sucursales`;
    const sqlCount = `
      SELECT COUNT(*) AS total
      FROM Inventario
      JOIN Productos ON Inventario.ID_Producto = Productos.ID_Producto
      WHERE Inventario.ID_Sucursal = ? AND Productos.Nombre LIKE ? AND Inventario.Cantidad > 5
    `;
    const sqlProductos = `
      SELECT 
          Inventario.ID_Producto, 
          Productos.Fotografia, 
          Productos.Nombre, 
          Productos.Descripcion,
          Productos.Precio_Unitario, 
          Inventario.Cantidad, 
          Unidad_Venta.Nombre AS Unidad_Venta
      FROM Inventario
      JOIN Productos ON Inventario.ID_Producto = Productos.ID_Producto
      LEFT JOIN Unidad_Venta ON Productos.ID_Unidad_Venta = Unidad_Venta.ID_Unidad_Venta
      WHERE Inventario.ID_Sucursal = ? AND Productos.Nombre LIKE ? AND Inventario.Cantidad > 5
      LIMIT ?, ?;
    `;

    connection.query(sqlCliente, [clienteId], (error, clienteResults) => {
        if (error) return res.status(500).send("Error al obtener cliente.");

        const cliente = clienteResults[0];

        connection.query(sqlSucursales, (error, results) => {
            if (error) return res.status(500).send("Error al obtener sucursales.");

            connection.query(sqlCount, [idSucursal, `%${searchTerm}%`], (error, countResult) => {
                if (error) return res.status(500).send("Error al contar productos.");

                const totalProducts = countResult[0].total;
                const totalPages = Math.ceil(totalProducts / productsPerPage);
                const offset = (currentPage - 1) * productsPerPage;

                connection.query(sqlProductos, [idSucursal, `%${searchTerm}%`, offset, productsPerPage], (error, products) => {
                    if (error) return res.status(500).send("Error al obtener productos.");

                    // Renderizar vista
                    res.render("./pagina_pedidos/productos", {
                        results, // Sucursales
                        products, // Productos
                        idSucursal,
                        searchTerm,
                        cliente,
                        currentPage,
                        totalPages,
                        pageButtons: calculatePageButtons(currentPage, totalPages),
                    });
                });
            });
        });
    });
});

// Función para calcular los botones de paginación
function calculatePageButtons(currentPage, totalPages) {
    const pageButtons = [];
    if (totalPages <= 5) {
        for (let i = 1; i <= totalPages; i++) {
            pageButtons.push(i);
        }
    } else {
        if (currentPage <= 3) {
            pageButtons.push(1, 2, 3, "...", totalPages);
        } else if (currentPage > totalPages - 3) {
            pageButtons.push(1, "...", totalPages - 2, totalPages - 1, totalPages);
        } else {
            pageButtons.push(1, "...", currentPage, "...", totalPages);
        }
    }
    return pageButtons;
}


// Ruta para mostrar la vista de login de clientes
router.get("/pagina_pedidos/login_clientes", (req, res) => {
  res.render("pagina_pedidos/login_clientes");
});



router.get("/api/productos/:id", (req, res) => {
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
      console.error("Error al obtener detalles del producto:", error);
      return res
        .status(500)
        .json({ error: "Error al obtener detalles del producto" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json(results[0]);
  });
});

router.get('/pagina_pedidos/continuar_pedido', (req, res) => {
    // Renderiza la vista de continuar pedido
    res.render('pagina_pedidos/continuar_pedido', {
        // Puedes pasar datos adicionales si es necesario
    });
});



// Ruta para mostrar la vista de login de clientes
router.get("/pagina_pedidos/login_clientes", (req, res) => {
    res.render("pagina_pedidos/login_clientes");
  });
  
  router.post('/pagina_pedidos/login_clientes', (req, res) => {
    const { Codigo, Contrasena } = req.body;

    const sql = 'SELECT * FROM clientes WHERE Codigo = ? AND Contrasena = ?';
    connection.query(sql, [Codigo, Contrasena], (err, results) => {
        if (err) {
            console.error('Error al autenticar al cliente:', err);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }

        if (results.length > 0) {
            const cliente = results[0];
            req.session.loggedinCliente = true;
            req.session.userIdCliente = cliente.ID_Cliente;
            req.session.clienteDatos = cliente;
            res.status(200).json(cliente);
        } else {
            res.status(401).json({ error: 'Código o contraseña incorrectos' });
        }
    });
});


router.get('/pagina_pedidos/continuar_pedido', (req, res) => {
    // Renderiza la vista de continuar pedido
    res.render('pagina_pedidos/continuar_pedido', {
        // Puedes pasar datos adicionales si es necesario
    });
});

router.post('/pagina_pedidos/guardar_carrito', (req, res) => {
    const carrito = req.body; // Obtener los detalles del carrito del cuerpo de la solicitud
    if (!Array.isArray(carrito) || carrito.length === 0) {
        return res.status(400).send('El carrito está vacío o es inválido');
    }

    // Guardar el carrito en la sesión
    req.session.carrito = carrito;
    console.log('Carrito guardado en sesión:', carrito);
    res.status(200).send('Carrito guardado exitosamente');
});


router.get('/pagina_pedidos/confirmar_pedido', (req, res) => {
    const carrito = JSON.parse(req.query.carrito || '[]'); // Parsear el carrito desde los parámetros de consulta

    // Validación del carrito
    if (!Array.isArray(carrito) || carrito.length === 0) {
        console.error('Carrito vacío o inválido recibido');
        return res.status(400).send('El carrito está vacío o es inválido');
    }

    console.log("Detalles del carrito recibidos:", carrito);

    // Obtener distritos desde la base de datos
    const sqlDistritos = `SELECT ID_Distritos, Numero_Distrito, Tatifa, Tiempo_Estimado FROM distritos`;

    connection.query(sqlDistritos, (err, distritos) => {
        if (err) {
            console.error("Error al obtener distritos:", err);
            return res.status(500).send("Error al obtener distritos");
        }

        const totalCarrito = carrito.reduce((total, item) => total + item.price * item.quantity, 0);

        if (!req.session.loggedinCliente) {
            // Si no hay sesión iniciada, renderizar la vista sin cliente
            return res.render('pagina_pedidos/confirmar_pedido', {
                cliente: null,
                distritos, // Enviar los distritos a la vista
                carrito, // Enviar el carrito a la vista
                totalCarrito // Enviar el total del carrito a la vista
            });
        }

        // Si hay sesión iniciada, renderiza la página con los datos del cliente
        const clienteDatos = req.session.clienteDatos;
        res.render('pagina_pedidos/confirmar_pedido', {
            cliente: clienteDatos,
            distritos, // Enviar los distritos a la vista
            carrito, // Enviar el carrito a la vista
            totalCarrito // Enviar el total del carrito a la vista
        });
    });
});

router.post('/pagina_pedidos/finalizar_pedido', async (req, res) => {
    const { nombre, apellido, direccion, ci_nit, telefono, distrito, tarifaEnvio, productos } = req.body;
    console.log('Datos recibidos del cliente:');
    console.log('Nombre:', nombre);
    console.log('Apellido:', apellido);
    console.log('Dirección:', direccion);
    console.log('CI/NIT:', ci_nit);
    console.log('Teléfono:', telefono);
    console.log('Distrito:', distrito);
    console.log('Tarifa de envío:', tarifaEnvio);
    console.log('Productos recibidos:', productos);

    let connection;
    try {
        if (!Array.isArray(productos) || productos.length === 0) {
            console.error('El carrito está vacío o inválido');
            return res.status(400).send('El carrito está vacío o es inválido');
        }

        const productosMapeados = productos.map((producto) => ({
            ID_Producto: producto.id,
            cantidad: producto.quantity,
        }));

        console.log('Productos mapeados:', productosMapeados);

        connection = await new Promise((resolve, reject) => {
            pool.getConnection((err, conn) => {
                if (err) return reject(err);
                resolve(conn);
            });
        });

        await new Promise((resolve, reject) => {
            connection.beginTransaction(err => {
                if (err) return reject(err);
                resolve();
            });
        });

        let clienteId = null;
        const clienteExistente = await new Promise((resolve, reject) => {
            const query = 'SELECT ID_Cliente FROM clientes WHERE CI = ?';
            connection.query(query, [ci_nit], (err, results) => {
                if (err) return reject(err);
                resolve(results[0]);
            });
        });

        if (clienteExistente) {
            clienteId = clienteExistente.ID_Cliente;
        } else {
            const nuevoCliente = await new Promise((resolve, reject) => {
                const query = `
                    INSERT INTO clientes (Nombre, Apellido, Telefono, CI, Nit)
                    VALUES (?, ?, ?, ?, ?)
                `;
                connection.query(query, [nombre, apellido, telefono, ci_nit, ci_nit], (err, results) => {
                    if (err) return reject(err);
                    resolve(results);
                });
            });
            clienteId = nuevoCliente.insertId;
        }

        const timestamp = Date.now();
        const fileName = `venta_${timestamp}.pdf`;
        const ventaId = await new Promise((resolve, reject) => {
            const query = `
                INSERT INTO ventas (Fecha_Venta, ID_Cliente, ID_Empleado, ID_Sucursal, ID_Caja, Estado, Nombre_Recibo)
                VALUES (NOW(), ?, ?, ?, ?, 1, ?)
            `;
            connection.query(query, [clienteId, 1, 1, 1, fileName], (err, results) => {
                if (err) return reject(err);
                resolve(results.insertId);
            });
        });

        console.log('Venta registrada con ID:', ventaId);

        const detallesVentaValues = productosMapeados.map(item => [ventaId, item.ID_Producto, item.cantidad]);
        await new Promise((resolve, reject) => {
            const query = `
                INSERT INTO detalles_venta (ID_Venta, ID_Producto, Cantidad)
                VALUES ?
            `;
            connection.query(query, [detallesVentaValues], (err) => {
                if (err) return reject(err);
                resolve();
            });
        });

        console.log('Detalles de la venta registrados.');

        await new Promise((resolve, reject) => {
            connection.commit(err => {
                if (err) return reject(err);
                resolve();
            });
        });

        // Llamar a la ruta de generar factura
        const facturaData = {
            ID_Empleado: 1,
            nombre,
            apellido,
            nit: ci_nit,
            carnet: ci_nit,
            fechaVenta: new Date().toISOString(),
            detalles: productos.map(producto => ({
                cantidad: producto.quantity,
                producto: producto.name.replace(/\s+/g, ' ').trim(), // Limpiar saltos de línea
                precio: producto.price
            })),
            totalVenta: productos.reduce((total, producto) => total + producto.price * producto.quantity, 0),
            tarifaEnvio: parseFloat(tarifaEnvio),
            ID_Caja: 1,
            ID_Sucursal: 1
        };
        

        try {
            const facturaResponse = await axios.post(
                'http://localhost:3001/pagina_pedidos/generar_factura_pedido',
                facturaData,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
        
            if (facturaResponse.status !== 200) {
                throw new Error('Error al generar la factura');
            }
        
            const facturaResult = facturaResponse.data;
            console.log('Factura generada correctamente:', facturaResult);
            res.status(200).json({
                message: 'Pedido finalizado y factura generada',
                facturaUrl: facturaResult.url
            });
        } catch (error) {
            console.error('Error al generar la factura:', error.response ? error.response.data : error.message);
            throw new Error('Error al generar la factura');
        }
        console.log('Datos enviados a generar_factura_pedido:', facturaData);

        if (!facturaResponse.ok) {
            throw new Error('Error al generar la factura');
        }

        const facturaResult = await facturaResponse.json();

        console.log('Factura generada correctamente:', facturaResult);

        req.session.carrito = [];
        res.status(200).json({
            message: 'Pedido finalizado y factura generada',
            facturaUrl: facturaResult.url
        });
    } catch (err) {
        console.error('Error al procesar el pedido:', err);
        if (connection) {
            await new Promise((resolve) => {
                connection.rollback(() => resolve());
            });
        }
        res.status(500).send('Ocurrió un error al procesar tu pedido');
    } finally {
        if (connection) connection.release();
    }
});


router.post("/pagina_pedidos/generar_factura_pedido", async (req, res) => {
    try {
        console.log("Datos recibidos para generar factura:", req.body);

        const {
            ID_Empleado,
            nombre,
            apellido,
            nit,
            carnet,
            fechaVenta,
            detalles,
            totalVenta,
            tarifaEnvio,
            ID_Caja,
            ID_Sucursal,
        } = req.body;

        // Validaciones de datos
        if (
            !ID_Empleado ||
            !nombre ||
            !apellido ||
            !fechaVenta ||
            !Array.isArray(detalles) ||
            isNaN(totalVenta) ||
            isNaN(tarifaEnvio)
        ) {
            return res.status(400).json({ error: "Datos faltantes o inválidos para generar factura" });
        }

        console.log("Datos validados correctamente. Generando factura...");

        // Calcular el total con envío
        const totalConEnvio = totalVenta + parseFloat(tarifaEnvio);

        // Configuración del archivo
        const timestamp = Date.now();
        const fileName = `venta_${timestamp}.pdf`;
        const filePath = path.join(__dirname, "../facturas_ventas", fileName);

        // Crear el documento PDF
        const doc = new PDFDocument({ size: [300, 600], margin: 10 });
        doc.pipe(fs.createWriteStream(filePath));

        // Encabezado
        const pageWidth = doc.page.width;
        const logoWidth = 50;
        const centerX = (pageWidth - logoWidth) / 2;

        doc.image("assets/images/logo/logo_fm.png", centerX, 10, { width: logoWidth });
        doc.moveDown(5);
        doc.font("Helvetica-Bold").fontSize(12).text("FARMACIA 25 DE JULIO", { align: "center" });
        doc.font("Helvetica").fontSize(8).text("Dirección: Av. Principal #123", { align: "center" });
        doc.text("Teléfono: (123) 456-7890", { align: "center" });
        doc.moveDown(1);

        doc.font("Helvetica-Bold").fontSize(16).text("RECIBO", { align: "center" });
        doc
            .font("Helvetica")
            .fontSize(10)
            .text(`Número de Recibo: ${timestamp}`, { align: "center" });
        doc.moveDown(1);

        // Datos del cliente
        doc.font("Helvetica-Bold").text("Datos del Cliente:", { align: "left" });
        doc.moveDown(0.7);
        doc.font("Helvetica").fontSize(10).text(`Nombre Completo: ${nombre} ${apellido}`);
        doc.text(`Teléfono: N/A`); // Asume que el teléfono no está disponible
        doc.text(`NIT: ${nit || "N/A"}`);
        doc.text(`Carnet: ${carnet || "N/A"}`);
        doc.text(`Fecha de Venta: ${fechaVenta}`);
        doc.text(`Código de Vendedor: ${ID_Empleado}`);
        doc.text(`Código de Sucursal: ${ID_Sucursal}`);
        doc.text(`Código de Caja: ${ID_Caja}`);
        doc.moveDown(1);

        // Detalles de Compra
        doc.font("Helvetica-Bold").text("Detalles de Compra:");
        doc.moveDown(1);
        doc.font("Helvetica-Bold").text("Cantidad   -   Producto   -   Precio Unitario   - Subtotal");
        detalles.forEach((detalle) => {
            const subtotal = detalle.cantidad * detalle.precio;
            doc
                .font("Helvetica")
                .fontSize(10)
                .text(
                    `${detalle.cantidad}      x      ${detalle.producto}    x    ${detalle.precio.toFixed(2)} Bs = ${subtotal.toFixed(2)} Bs`
                );
        });

        doc.moveDown(1);

        // Totales
        doc.font("Helvetica-Bold").fontSize(10).text(`Descuento: 0 Bs`, { align: "right" });
        doc.text(`Costo de Envío: ${tarifaEnvio.toFixed(2)} Bs`, { align: "right" });
        doc.text(`Sub Total: ${totalVenta.toFixed(2)} Bs`, { align: "right" });
        doc.text(`Total a Pagar: ${totalConEnvio.toFixed(2)} Bs`, { align: "right" });

        doc.moveDown(1);

        // Derechos reservados
        doc.font("Helvetica").fontSize(6).text(
            `Derechos Reservados © ${new Date().getFullYear()} FARMACIA 25 de Julio.`,
            { align: "justify" }
        );

        // Finalizar y guardar el PDF
        doc.end();

        console.log("Factura generada en:", filePath);

        res.status(200).json({
            message: "Factura generada correctamente",
            url: `/facturas_ventas/${fileName}`,
        });
    } catch (error) {
        console.error("Error al generar la factura:", error);
        res.status(500).json({ error: "Error al generar la factura" });
    }
});


module.exports = router;
