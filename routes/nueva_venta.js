const express = require('express');
const router = express.Router();
const connection = require('../database/db');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

router.get('/nueva_venta', (req, res) => {
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
                    res.render('./nueva_venta/nueva_venta', {
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
router.get('/obtener_cantidad_inventario/:idProducto', (req, res) => {
    const { idProducto } = req.params;
    const query = 'SELECT Cantidad FROM inventario WHERE ID_Producto = ?';
    connection.query(query, [idProducto], (error, results) => {
      if (error) {
        console.error('Error al obtener la cantidad en inventario del producto:', error);
        return res.status(500).json({ error: 'Error al obtener la cantidad en inventario' });
      }
      if (results.length > 0) {
        res.json({ cantidad: results[0].Cantidad });
      } else {
        res.status(404).json({ error: 'Producto no encontrado en inventario' });
      }
    });
  });
  
  router.get('/obtener_productos_inventario', (req, res) => {
    // Obtén el ID de la sucursal del empleado desde la sesión
    const idSucursalEmpleado = req.session.ID_Sucursal;

    const obtenerProductosInventarioQuery = `
        SELECT p.ID_Producto, p.Nombre, p.Precio_Unitario, uv.Nombre AS Unidad_Venta
        FROM productos p 
        JOIN inventario i ON p.ID_Producto = i.ID_Producto
        JOIN unidad_venta uv ON p.ID_Unidad_Venta = uv.ID_Unidad_Venta
        WHERE i.ID_Sucursal = ?
    `;

    connection.query(obtenerProductosInventarioQuery, [idSucursalEmpleado], (error, productos) => {
        if (error) {
            console.error('Error al obtener los productos del inventario:', error);
            return res.status(500).json({ error: 'Error al obtener los productos del inventario' });
        }
        res.json(productos);
    });
});


router.post('/nueva_venta', async (req, res) => {
    const ID_Empleado = req.body.ID_Empleado;
    const ID_Sucursal = req.body.ID_Sucursal;
    const ID_Caja = req.body.ID_Caja;
  
    const nombre = req.body.nombre;
    const apellido = req.body.apellido;
    const carnet = req.body.carnet;
    const nit = req.body.nit;
    const fechaVenta = new Date();
  
    let productos = req.body.productos;
    let cantidades = req.body.cantidades;
    console.log('Datos recibidos nombre cliente:', req.body.nombre);
    console.log('Datos recibidos:', req.body);
    console.log('PRODUCTOS: ', productos);
    console.log('CANTIDADES: ', cantidades);
  
    // Si productos o cantidades no son arreglos, los convertimos en arreglos de un solo elemento
    if (!Array.isArray(productos)) {
      productos = [productos];
    }
  
    if (!Array.isArray(cantidades)) {
      cantidades = [cantidades];
    }
  
    try {
      const insertClienteQuery = 'INSERT INTO clientes (nombre, apellido, nit, ci) VALUES (?, ?, ?, ?)';
      connection.query(insertClienteQuery, [nombre, apellido, nit, carnet], (error, resultcli) => {
        if (error) {
          console.error('Error al registrar el cliente:', error);
          return res.status(500).send('Error al registrar el cliente');
        }
  
        const idCliente = resultcli.insertId;
        console.log('ID del cliente insertado:', idCliente);
  
        const insertVentaQuery = 'INSERT INTO ventas (ID_cliente, Fecha_Venta, ID_Empleado,ID_Sucursal, ID_Caja) VALUES (?,?,?, ?, ?)';
        connection.query(insertVentaQuery, [idCliente, fechaVenta, ID_Empleado, ID_Sucursal, ID_Caja], (error, result) => {
          if (error) {
            console.error('Error al registrar la venta:', error);
            return res.status(500).send('Error al registrar la venta');
          }
          const idVenta = result.insertId;
          console.log("id de la venta es" + idVenta);
  
  
          const insertDetallesPromises = productos.map(async (producto, index) => {
            const cantidad = cantidades[index];
            const insertDetalleQuery = 'INSERT INTO detalles_venta (ID_Venta, ID_Producto, Cantidad) VALUES (?, ?, ?)';
            const result = await new Promise((resolve, reject) => {
              connection.query(insertDetalleQuery, [idVenta, producto, cantidad], (error, result) => {
                if (error) {
                  console.error('Error al registrar el detalle de la venta:', error);
                  reject(error);
                } else {
                  resolve(result);
                }
              });
            });
            return result;
          });
  
          Promise.all(insertDetallesPromises)
            .then(results => {
              console.log('Todos los detalles de venta insertados correctamente');
              // Actualizar el inventario después de registrar la venta
              for (let i = 0; i < productos.length; i++) {
                const productoID = productos[i];
                const cantidadVendida = cantidades[i];
                // Actualizar la cantidad en inventario
                const updateInventarioQuery = 'UPDATE inventario SET Cantidad = Cantidad - ? WHERE ID_Producto = ?';
                connection.query(updateInventarioQuery, [cantidadVendida, productoID], (error, result) => {
                  if (error) {
                    console.error('Error al actualizar el inventario:', error);
                  }
                });
              }
              res.redirect('/nueva_venta');
            })
            .catch(error => {
              console.error('Error al registrar los detalles de la venta:', error);
              res.status(500).send('Error al registrar los detalles de la venta');
            });
        });
      });
    } catch (error) {
      console.error('Error al procesar la venta:', error);
      return res.status(500).send('Error interno del servidor: ' + error.message);
    }
  });
  



// Agrega esta nueva ruta en tu archivo de rutas (por ejemplo, ventasRoutes.js)
router.get('/obtener_precio_producto/:idProducto', (req, res) => {
    const idProducto = req.params.idProducto;

    // Consulta SQL para obtener el precio del producto por su ID
    const obtenerPrecioProductoQuery = 'SELECT Precio_Unitario FROM productos WHERE ID_Producto = ?';

    connection.query(obtenerPrecioProductoQuery, [idProducto], (error, resultados) => {
        if (error) {
            console.error('Error al obtener el precio del producto:', error);
            return res.status(500).json({ error: 'Error al obtener el precio del producto' });
        }

        if (resultados.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        const precio = resultados[0].Precio_Unitario;
        res.json({ precio: precio });
    });
});

// Ruta para generar la factura
router.post('/generar_factura', async (req, res) => {
  try {
      // Obtén los datos necesarios para generar la factura desde el cuerpo de la solicitud
      const { ID_Empleado, nombre, apellido, nit, carnet, fechaVenta, detalles, totalVenta, ID_Caja,ID_Sucursal } = req.body;
      
      // Genera un nombre único para el archivo PDF basado en la fecha y hora de la venta
      const timestamp = Date.now();
      const fileName = `venta_${timestamp}.pdf`;
      const filePath = path.join(__dirname, '../facturas_ventas', fileName);

      const doc = new PDFDocument({ size: [400, 600], margin: 3 }); 
      doc.pipe(fs.createWriteStream(filePath));

      // Logo
      doc.image('assets/images/logo/logo_fm.png', 10, 5, { width: 40 });
      doc.moveDown(0.5); // Espacio vertical
      const leftMargin1 = 50;
      // Título de la farmacia
      doc.font('Helvetica-Bold').fontSize(13).text('FARMACIA', leftMargin1, doc.y + 10,  { align: 'left' });
      doc.font('Helvetica').fontSize(7).text(' San Juan de Dios', leftMargin1 , doc.y, { align: 'left' });

      // Dirección y teléfono
      doc.font('Helvetica').fontSize(4).text('Dirección: Av. Principal #123', leftMargin1 + 5, doc.y, { align: 'left' });
      doc.text('Teléfono: (123) 456-7890', leftMargin1 + 10, doc.y, { align: 'left' });
      doc.moveDown(2); 

      doc.font('Helvetica-Bold').fontSize(25).text('RECIBO', 10, 40,{ align: 'center' });
      doc.moveDown(0.5); 
      doc.font('Helvetica-Bold').fontSize(10).text(`Numero de recibo ${timestamp}`, 300, 15,{ align: 'center' });


      // Espera a que la promesa se resuelva y obtén el último ID de venta
   
      // Datos del cliente
      doc.moveDown(3); 
      doc.font('Helvetica-Bold').fontSize(15).text('Datos del Cliente:', 5, doc.y);
      doc.moveDown(0.5); // Espacio vertical
      let resultadoVenta = await obtenerUltimoIdVenta();
      doc.font('Helvetica').fontSize(10).text(`Numero de venta: ${resultadoVenta + 1}`);
      doc.font('Helvetica').fontSize(10).text(`Codigo de Vendedor: ${ID_Empleado}`);
      doc.font('Helvetica').fontSize(10).text(`Codigo de Sucursal: ${ID_Sucursal}`);
      doc.font('Helvetica').fontSize(10).text(`Codigo de Caja: ${ID_Caja}`);
      doc.font('Helvetica').fontSize(10).text(`Nombre: ${nombre} ${apellido}`);
      doc.text(`NIT: ${nit}`);
      doc.text(`Carnet: ${carnet}`);
      doc.text(`Fecha de Venta: ${fechaVenta}`);
      doc.moveDown(0.5); // Espacio vertical

      // Establecer el color de trazo en rojo
      doc.strokeColor('#7c7673')
          .moveTo(5, doc.y) // Mover al punto inicial de la línea
          .lineTo(395, doc.y) // Dibujar la línea hasta el punto final
          .stroke(); // Dibujar la línea
      doc.moveDown(0.5); // Espacio vertical

      // Detalles de compra
      doc.font('Helvetica-Bold').text('Detalles de Compra:', 5, doc.y);
      doc.moveDown(0.5); // Espacio vertical

      // Configuración de la tabla de detalles
      const startX = 5;
      let startY = doc.y;
      const columnWidth = 40;
      const productColumnWidth = 3 * columnWidth; // Ancho de la columna del producto ajustado

      // Dibujar encabezado de la tabla
      doc.font('Helvetica-Bold').text('Cantidad', startX, startY);
      doc.text('Producto', startX + 1.8 *columnWidth, startY);
      doc.text('Precio Unitario', startX + 6 * columnWidth, startY);
      doc.text('Subtotal', startX + 8 * columnWidth, startY);
      doc.moveDown(1); 

      // Dibujar filas de la tabla
      const detallesArray = Object.values(detalles);
      detallesArray.forEach(detalle => {
          console.log(detalle); 
          let y = doc.y; 
          doc.font('Helvetica').text(detalle.cantidad.toString(), startX, y);
           // Ajustar el texto del producto al ancho de la columna
        doc.text(detalle.producto, startX + 1.8 * columnWidth, y, {
          width: productColumnWidth, 
          align: 'left'
      });
          if (typeof detalle.precio === 'number') {
              doc.text(detalle.precio.toFixed(2) + ' bs', startX + 6 * columnWidth, y);
          } else {
              // Si detalle.precio no es un número, manejarlo de acuerdo a tus requerimientos
              doc.text('Precio no válido', startX + 6 * columnWidth, y);
          }
          doc.text(detalle.subtotal.toFixed(2) + ' bs', startX + 8 *  columnWidth, y);
          doc.moveDown(2); // Espacio vertical para la siguiente fila
      });

      // Definir márgenes
      const leftMargin = 20;
      doc.moveDown(5); // Espacio vertical
      // Línea horizontal
      doc.moveTo(3, doc.y).lineTo(395, doc.y).stroke();
      doc.moveDown(2); // Espacio vertical

      doc.font('Helvetica-Bold').text(`Descuento:       0 `, leftMargin, doc.y, { align: 'left' });
      doc.font('Helvetica-Bold').text(`Sub Total:         ${totalVenta}`, leftMargin, doc.y, { align: 'left' });
      doc.font('Helvetica-Bold').text(`Total a pagar:   ${totalVenta}`, leftMargin, doc.y, { align: 'left' });
      doc.moveDown(1); // Espacio vertical

      // Línea horizontal
      doc.moveTo(5, doc.y).lineTo(395, doc.y).stroke();
      doc.moveDown(0.5); // Espacio vertical

      // Definir el margen
      const rightMargin = 10;
      const textWidth = 400 - leftMargin - rightMargin; // Ancho total menos los márgenes

      // Derechos reservados
      doc.font('Helvetica').fontSize(6).text(
        `Derechos Reservados © ${new Date().getFullYear()} FARMACIA San Juan de Dios. Todos los derechos reservados. Este recibo y su contenido están protegidos por las leyes de derechos de autor y no pueden ser reproducidos, distribuidos, transmitidos, exhibidos, publicados o transmitidos sin el permiso previo por escrito del titular de los derechos de autor.`,
        leftMargin - 10, doc.y, 
        { 
          align: 'justify', 
          width: textWidth 
        }
      );

      // Finaliza y cierra el documento PDF
      doc.end();

      // Envía una respuesta de éxito al cliente
      res.status(200).json({ message: 'Factura generada correctamente', url: `/facturas_ventas/${fileName}` });
  } catch (error) {
      console.error('Error al generar la factura:', error);
      res.status(500).json({ error: 'Error al generar la factura' });
  }
});



function obtenerUltimoIdVenta() {
    return new Promise((resolve, reject) => {
      connection.query('SELECT MAX(ID_Venta) as ultimoId FROM ventas', (error, results, fields) => {
        if (error) {
          reject(error);
        } else {
          if (results.length > 0) {
            resolve(results[0].ultimoId);
          } else {
            resolve('No hay registros en la tabla ventas');
          }
        }
      });
    });
  }


module.exports = router;
