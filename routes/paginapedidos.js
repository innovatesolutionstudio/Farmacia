// Invocamos a Express
const express = require("express");
const router = express.Router();
// Invocamos a la conexión de la base de datos
const connection = require("../database/db");
const pool = require('../database/db');



const axios = require('axios'); // Importar Axios



router.get('/pagina_pedidos/clientes_index', (req, res) => {      
    res.render('pagina_pedidos/clientes_index');
});


// Ruta para buscar productos
router.get('/buscar_productos_cli', (req, res) => {
    const search = req.query.search || ''; // Término de búsqueda
    const idSucursal = parseInt(req.query.idSucursal, 10); // ID de la sucursal

    if (!idSucursal) {
        return res.status(400).json({ error: 'Se requiere un ID de sucursal válido.' });
    }

    // Consulta SQL para buscar productos
    const query = `
        SELECT 
            p.ID_Producto,
            p.Nombre,
            p.Precio_Unitario,
            p.Fotografia,
            p.Descripcion,
            p.Indicaciones,
            p.Efectos_Secundarios,
            i.Cantidad AS Stock,
            u.Nombre AS Unidad_Venta
        FROM 
            productos p
        JOIN 
            inventario i ON p.ID_Producto = i.ID_Producto
        JOIN 
            sucursales s ON i.ID_Sucursal = s.ID_Sucursal
        LEFT JOIN
            unidad_venta u ON p.ID_Unidad_Venta = u.ID_Unidad_Venta
        WHERE 
            i.ID_Sucursal = ? AND p.Nombre LIKE ?
    `;

    const values = [idSucursal, `%${search}%`];

    // Ejecutar la consulta
    connection.query(query, values, (err, results) => {
        if (err) {
            console.error('Error al realizar la consulta:', err);
            return res.status(500).json({ error: 'Error interno del servidor.' });
        }

        res.json(results);
    });
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
   
    res.status(200).send('Carrito guardado exitosamente');
});


router.get('/pagina_pedidos/confirmar_pedido', (req, res) => {
    const carrito = JSON.parse(req.query.carrito || '[]'); // Parsear el carrito desde los parámetros de consulta

    // Validación del carrito
    if (!Array.isArray(carrito) || carrito.length === 0) {
        console.error('Carrito vacío o inválido recibido');
        return res.status(400).send('El carrito está vacío o es inválido');
    }


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
    const { nombre, apellido, direccion, ci_nit, telefono, distrito, notas, tarifaEnvio, productos } = req.body;

    console.log('Datos recibidos del cliente:', {
        nombre, apellido, direccion, ci_nit, telefono, distrito, tarifaEnvio, productos,notas
    });

    if (!Array.isArray(productos) || productos.length === 0) {
        console.error('El carrito está vacío o inválido');
        return res.status(400).send('El carrito está vacío o es inválido');
    }

    let connection;
    try {
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

        // Registrar pedido en la tabla pedidos
        const pedidoId = await new Promise(async (resolve, reject) => {
            const query = `
                INSERT INTO pedidos (ID_Venta, ID_Empleado, ID_Cliente, ID_Distrito, Direccion, Estado, Fecha_Entrega,notas)
                VALUES (?, ?, ?, ?, ?, 1, ?,?)
            `;

            try {
                const distritoInfo = await new Promise((resolve, reject) => {
                    const queryDistrito = `
                        SELECT Tiempo_Estimado FROM distritos WHERE ID_Distritos = ?
                    `;
                    connection.query(queryDistrito, [distrito], (err, results) => {
                        if (err) return reject(err);
                        if (results.length === 0) return reject(new Error('Distrito no encontrado'));
                        resolve(results[0]);
                    });
                });

                const tiempoEstimadoMinutos = parseInt(distritoInfo.Tiempo_Estimado, 10);
                const fechaEntrega = new Date(new Date().getTime() + tiempoEstimadoMinutos * 60000);

                connection.query(
                    query,
                    [ventaId, 24, clienteId, distrito, direccion, fechaEntrega,notas],
                    (err, results) => {
                        if (err) return reject(err);
                        resolve(results.insertId);
                    }
                );
            } catch (err) {
                return reject(err);
            }
        });

        console.log('Pedido registrado con ID:', pedidoId);

        await new Promise((resolve, reject) => {
            connection.commit(err => {
                if (err) return reject(err);
                resolve();
            });
        });

        const facturaData = {
            ID_Empleado: 1,
            nombre,
            apellido,
            nit: ci_nit,
            carnet: ci_nit,
            fechaVenta: new Date().toISOString(),
            detalles: productos.map(producto => ({
                cantidad: producto.quantity,
                producto: producto.name.trim(),
                precio: producto.price,
            })),
            totalVenta: productos.reduce((total, producto) => total + producto.price * producto.quantity, 0),
            tarifaEnvio: parseFloat(tarifaEnvio),
            ID_Caja: 1,
            ID_Sucursal: 1,
        };

        console.log('Datos enviados a generar_factura_pedido:', facturaData);

        let facturaResponse;

        try {
            const response = await axios.post(
                'http://localhost:3001/pagina_pedidos/generar_factura_pedido',
                facturaData,
                { headers: { 'Content-Type': 'application/json' } }
            );

            if (response.status === 200) {
                facturaResponse = response.data;
            } else {
                throw new Error('Error al generar la factura');
            }
        } catch (error) {
            console.error('Error al generar la factura:', error.message);
            throw new Error('Error al generar la factura');
        }

        console.log('Factura generada correctamente:', facturaResponse);

        req.session.carrito = [];
        res.status(200).json({
            message: 'Pedido finalizado y factura generada',
            facturaUrl: facturaResponse.url,
        });
    } catch (err) {
        console.error('Error al procesar el pedido:', err);
        if (connection) {
            await new Promise((resolve) => {
                connection.rollback(() => resolve());
            });
        }
        if (!res.headersSent) {
            res.status(500).send('Ocurrió un error al procesar tu pedido');
        }
    } finally {
        if (connection) connection.release();
    }
});


const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
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
  
      // Función para generar código y contraseña dinámicos
      const generarCodigoYContrasena = (nombre, apellido, carnet, nit) => {
        const codigoBase = `${nombre.charAt(0).toLowerCase()}${apellido.charAt(0).toLowerCase()}`;
        const codigo = carnet
          ? `${codigoBase}${carnet}`
          : nit
          ? `${codigoBase}${nit}`
          : "sin-codigo";
        const contrasena = carnet || nit || "sin-contrasena";
        return { codigo, contrasena };
      };
  
      // Consulta para obtener o generar los datos del cliente
      const obtenerDatosCliente = () => {
        return new Promise((resolve, reject) => {
          const query = "SELECT Telefono, Codigo, Contrasena FROM clientes WHERE CI = ? OR Nit = ?";
          connection.query(query, [carnet, nit], (error, results) => {
            if (error) {
              reject(error);
            } else if (results.length > 0) {
              resolve(results[0]); // Retorna los datos del cliente
            } else {
              // Generar código y contraseña dinámicos para un nuevo cliente
              const datosGenerados = generarCodigoYContrasena(nombre, apellido, carnet, nit);
              resolve({ Telefono: "N/A", ...datosGenerados });
            }
          });
        });
      };
  
      // Obtener los datos del cliente
      const clienteDatos = await obtenerDatosCliente();
      const {
        Telefono: telefonoCliente,
        Codigo: codigoCliente,
        Contrasena: contrasenaCliente,
      } = clienteDatos;
  
      console.log("Datos del cliente recuperados:", clienteDatos);
  
      // Calcular el total con envío
      const totalConEnvio = parseFloat(totalVenta) + parseFloat(tarifaEnvio);
  
      // Configuración del archivo
      const timestamp = Date.now();
      const fileName = `venta_${timestamp}.pdf`;
      const filePath = path.join(__dirname, "../facturas_ventas", fileName);
  
      // Crear el documento PDF
      const generarPDF = () => {
        return new Promise((resolve, reject) => {
          try {
            const doc = new PDFDocument({ size: [300, 600], margin: 10 });
            const stream = fs.createWriteStream(filePath);
  
            doc.pipe(stream);
  
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
            doc.text(`Teléfono: ${telefonoCliente || "N/A"}`);
            doc.text(`NIT: ${nit || "N/A"}`);
            doc.text(`Carnet: ${carnet || "N/A"}`);
            doc.text(`Fecha de Venta: ${fechaVenta}`);
            doc.text(`Código de Vendedor: ${ID_Empleado}`);
            doc.text(`Código de Sucursal: ${ID_Sucursal}`);
            doc.text(`Código de Caja: ${ID_Caja}`);
            doc.moveDown(1);
            doc.font("Helvetica-Bold").text("Datos para el Sitio Web:", { align: "left" });
            doc.font("Helvetica").text(`Codigo de Usuario: ${codigoCliente}`);
            doc.text(`Contraseña de Usuario: ${contrasenaCliente}`);
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
                  `${detalle.cantidad} x ${detalle.producto} x ${detalle.precio.toFixed(2)} Bs = ${subtotal.toFixed(2)} Bs`
                );
            });
  
            doc.moveDown(1);
  
            // Totales
            doc.font("Helvetica-Bold").fontSize(10).text(`Descuento: 0 Bs`, { align: "right" });
            doc.text(`Costo de Envío: ${tarifaEnvio.toFixed(2)} Bs`, { align: "right" });
            doc.text(`Sub Total: ${totalVenta.toFixed(2)} Bs`, { align: "right" });
            doc.text(`Total a Pagar: ${totalConEnvio.toFixed(2)} Bs`, { align: "right" });
  
            doc.moveDown(1);
  
            const leftMargin = 10; // Asigna un valor a leftMargin
            const rightMargin = 10;
            const textWidth = 300 - leftMargin - rightMargin; // Ancho total menos los márgenes
            // Derechos reservados
            doc.font('Helvetica').fontSize(6).text(
              `Derechos Reservados © ${new Date().getFullYear()} FARMACIA 25 de Julio. Todos los derechos reservados. Este recibo y su contenido están protegidos por las leyes de derechos de autor y no pueden ser reproducidos, distribuidos, transmitidos, exhibidos, publicados o transmitidos sin el permiso previo por escrito del titular de los derechos de autor.`,
              leftMargin, // Usamos la variable `leftMargin` definida
              doc.y, 
              { 
                align: 'justify', 
                width: textWidth 
              }
            );
  
            // Finalizar y guardar el PDF
            doc.end();
  
            stream.on("finish", () => resolve());
            stream.on("error", (error) => reject(error));
          } catch (error) {
            reject(error);
          }
        });
      };
  
      // Generar PDF y responder
      await generarPDF();
      console.log("Factura generada en:", filePath);
  
      return res.status(200).json({
        message: "Factura generada correctamente",
        url: `/facturas_ventas/${fileName}`,
      });
    } catch (error) {
      console.error("Error al generar la factura:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error al generar la factura" });
      }
    }
  });
  
////////////////////////////////////////////////////////////////////////////rutas para sistema clientes////////////////////////////////




router.post('/pagina_pedidos/otros/login_clientes/', (req, res) => {
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


            res.redirect('/pagina_pedidos/otros/perfil'); 
        } else {
            res.status(401).json({ error: 'Código o contraseña incorrectos' });
        }
    });
});


  // Ruta para mostrar la vista de perfil después de iniciar sesión
router.get('/pagina_pedidos/otros/perfil', (req, res) => {
    if (req.session.loggedinCliente) {

        res.render('pagina_pedidos/otros/perfil', { cliente: req.session.clienteDatos });
    } else {

        res.redirect('/pagina_pedidos/404');
    }
});

// Ruta para cerrar sesión
router.get('/pagina_pedidos/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Error al cerrar sesión');
        }

        // Redirección completa fuera del dashboard
        res.send(`
            <script>
                window.location.href = '/pagina_pedidos/clientes_index';
            </script>
        `);
    });
});


//ruta de consulta de IA
router.get('/pagina_pedidos/otros/contactanos', (req, res) => {

    res.render('pagina_pedidos/otros/contactanos');
});

//ruta de consulta de IA
router.get('/pagina_pedidos/otros/contactanosP', (req, res) => {

    res.render('pagina_pedidos/contactanosP');
});

//ruta de consulta de IA
router.get('/pagina_pedidos/404', (req, res) => {

    
    res.render('pagina_pedidos/otros/404');
});


//ruta de consulta de IA
router.get('/pagina_pedidos/otros/consultas', (req, res) => {

    if (!req.session.loggedinCliente) {
        return res.redirect('/pagina_pedidos/404');
    }
    res.render('pagina_pedidos/otros/consultas');
});



router.get('/pagina_pedidos/otros/miscompras', (req, res) => {
    const idCliente = req.session.userIdCliente;

    const sqlVentas = `
    SELECT 
        pedidos.ID_Pedido,
        pedidos.ID_Venta,
        empleados.Nombre AS Empleado,  
        clientes.Nombre AS Cliente,    
        pedidos.Direccion,
        pedidos.ID_Distrito,
        ventas.Fecha_Venta,
        ventas.Total_Venta,
        Sucursales.Nombre AS Sucursal
    FROM pedidos 
    JOIN ventas ON pedidos.ID_Venta = ventas.ID_Venta
    JOIN Sucursales ON ventas.ID_Sucursal = Sucursales.ID_Sucursal
    JOIN empleados ON pedidos.ID_Empleado = empleados.ID_Empleado
    JOIN clientes ON pedidos.ID_Cliente = clientes.ID_Cliente      
    WHERE pedidos.ID_Cliente = ? 
    ORDER BY ventas.Fecha_Venta DESC
`;

    connection.query(sqlVentas, [idCliente], (error, resultados) => {
        if (error) {
            console.error('Error al obtener los pedidos:', error);
            return res.status(500).send('Error al obtener los pedidos');
        }

        res.render('pagina_pedidos/otros/miscompras', { 
            pedidos: resultados,
            loggedin: req.session.loggedin,
            nombre: req.session.nombre
        }); 
    });
});



// Ruta para obtener los detalles de la venta por ID_Detalle_Venta
router.get('/pagina_pedidos/detalleVenta/:ID_Detalle_Venta', (req, res) => {
    const { ID_Detalle_Venta } = req.params;

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

    connection.query(sqlDetalles, [ID_Detalle_Venta], (error, detalles) => {
        if (error) {
            console.error('Error al obtener los detalles de la venta:', error);
            return res.status(500).send('Error al obtener los detalles de la venta.');
        }

        res.json(detalles);
    });
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
    

router.post('/api/crear-recordatorio', async (req, res) => {
    try {
        if (!req.session.loggedinCliente) {
            return res.status(401).json({ error: 'No autorizado' });
        }

        // Verifica que el cliente esté autenticado
        console.log('Sesión completa:', req.session);
        console.log('ID Cliente en sesión:', req.session.userIdCliente);

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
            [req.session.userIdCliente, productoId, telefonoLimpio],
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



      // Ruta para mostrar el historial de ventas
router.get('/pagina_pedidos/otros/recordatorio', (req, res) => {
    if (!req.session.loggedinCliente) {
        return res.redirect('/pagina_pedidos/404');
    }

    const idCliente = req.session.userIdCliente;

    // Verificar si el cliente está logueado
    if (!idCliente) {
        return res.status(401).json({ error: 'No autorizado. El cliente no está logueado.' });
    }

    const query = `
        SELECT 
            ventas.Fecha_Venta,
            ventas.Total_Venta,
            empleados.Nombre AS Empleado,
            sucursales.Nombre AS Sucursal,
            cajas.Codigo
        FROM ventas
        JOIN empleados ON ventas.ID_Empleado = empleados.ID_Empleado
        JOIN sucursales ON ventas.ID_Sucursal = sucursales.ID_Sucursal
        JOIN cajas ON ventas.ID_Caja = cajas.ID_Caja
        WHERE ventas.ID_Cliente = ?
        ORDER BY ventas.Fecha_Venta DESC;

    `;

    connection.query(query, [idCliente], (err, results) => {
        if (err) {
            console.error('Error al obtener historial de ventas:', err);
            return res.status(500).json({ error: 'Error al obtener el historial de ventas' });
        }
        
        // Log the results for debugging
        console.log('Ventas encontradas:', results);
        
        // Renderizar la vista y pasarle los resultados
        res.render('pagina_pedidos/otros/recordatorio', { 
            ventas: results,
            cliente: req.session.cliente // Pasar información del cliente para consistencia
        });
    });
});


// Ruta para obtener productos de pedido
router.get('/api/mis-productos-comprados', async (req, res) => {
    try {
        console.log('Estado de la sesión:', {
            sesionActiva: req.session.loggedinCliente,
            idCliente: req.session.userIdCliente  // Cambiado para usar userIdCliente
        });
    
        if (!req.session.loggedinCliente) {
            console.log('Cliente no ha iniciado sesión');
            return res.redirect('/pagina_pedidos/404');
        }
    
        const query = `
            SELECT 
                p.ID_Producto AS id_producto,
                p.Nombre AS nombre_producto,
                dv.Cantidad AS cantidad,
                p.Indicaciones AS indicaciones,
                p.Precauciones AS precauciones
            FROM pedidos ped
            INNER JOIN ventas v ON ped.ID_Venta = v.ID_Venta
            INNER JOIN Detalles_Venta dv ON v.ID_Venta = dv.ID_Venta
            INNER JOIN Productos p ON dv.ID_Producto = p.ID_Producto
            WHERE ped.ID_Cliente = ?  
            ORDER BY p.Nombre`;
    
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
        res.status(500).json({ error: 'Error del servidor' });
    }
    });


    router.get('/api/obtener-recordatorio/:id', (req, res) => {
        if (!req.session.loggedinCliente) {
            return res.status(401).json({ error: 'No autorizado' });
        }
    
        const id = req.params.id;
        const query = `
            SELECT 
                r.ID_Recordatorio,
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
                r.ID_Recordatorio = ? AND r.ID_Cliente = ?
        `;
    
        connection.query(query, [id, req.session.userIdCliente], (error, results) => {
            if (error) {
                console.error('Error al obtener recordatorio:', error);
                return res.status(500).json({ error: 'Error al obtener el recordatorio' });
            }
    
            if (results.length === 0) {
                return res.status(404).json({ error: 'Recordatorio no encontrado' });
            }
    
            res.json(results[0]);
        });
    });
module.exports = router;
