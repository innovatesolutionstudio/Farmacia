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
            res.status(403).json({ error: 'No estás logueado.' });
        }
    });
});

        
    router.get('/pagina_pedidos/continuar_pedido', (req, res) => {
        console.log('Sesión cliente:', req.session);
    
        if (!req.session.loggedinCliente) {
            return res.redirect('/pagina_pedidos/login_clientes');
        }
    
        const clienteId = req.session.userIdCliente;
    
        // Consultar los datos del cliente
        const queryCliente = `SELECT * FROM clientes WHERE ID_Cliente = ?`;
        connection.query(queryCliente, [clienteId], (err, resultsCliente) => {
            if (err) {
                console.error('Error obteniendo datos del cliente:', err);
                return res.status(500).send('Error interno');
            }
    
            // Consultar la venta más reciente
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
                const totalCarrito = req.query.totalCarrito || 0;
    
                // Obtener empleados con rol 5
                const queryEmpleadosRol5 = `SELECT * FROM empleados WHERE ID_rol = 5`;
                connection.query(queryEmpleadosRol5, (err, empleadosRol5) => {
                    if (err) {
                        console.error('Error obteniendo empleados con rol 5:', err);
                        return res.status(500).send('Error interno');
                    }
    
                    // Obtener empleados con rol 7
                    const queryEmpleadosRol7 = `SELECT * FROM empleados WHERE ID_rol = 7`;
                    connection.query(queryEmpleadosRol7, (err, empleadosRol7) => {
                        if (err) {
                            console.error('Error obteniendo empleados con rol 7:', err);
                            return res.status(500).send('Error interno');
                        }
    
                        // Obtener distritos (corregido el nombre de la columna)
                        const queryDistritos = `SELECT d.ID_distritos,  c.ID_ciudad
                                                FROM distritos d
                                                INNER JOIN ciudades c ON d.ID_ciudad = c.ID_ciudad;
                                                `;
                        connection.query(queryDistritos, (err, distritos) => {
                            if (err) {
                                console.error('Error obteniendo distritos:', err);
                                return res.status(500).send('Error interno');
                            }
    
                            const idSucursal = resultsVenta.length > 0 ? resultsVenta[0].ID_Sucursal : null;
    
                            if (resultsVenta.length > 0) {
                                const venta = resultsVenta[0]; 
                                res.render('pagina_pedidos/continuar_pedido', {
                                    cliente: resultsCliente[0],
                                    venta: venta,
                                    totalCarrito: totalCarrito,
                                    empleadosRol5: empleadosRol5,
                                    empleadosRol7: empleadosRol7,
                                    distritos: distritos,
                                    idSucursal: idSucursal
                                });
                            } else {
                                res.render('pagina_pedidos/continuar_pedido', {
                                    cliente: resultsCliente[0],
                                    mensaje: 'No hay ventas recientes.',
                                    totalCarrito: totalCarrito,
                                    empleadosRol5: empleadosRol5,
                                    empleadosRol7: empleadosRol7,
                                    distritos: distritos,
                                    idSucursal: idSucursal
                                });
                            }
                        });
                    });
                });
            });
        });
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
  

    module.exports = router;