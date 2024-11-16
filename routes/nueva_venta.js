const express = require("express");
const router = express.Router();
const connection = require("../database/db");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

router.get("/nueva_venta", (req, res) => {
  if (req.session.loggedin) {
    const idCaja = req.session.ID_Caja;

    const query = "SELECT Estado FROM cajas WHERE ID_Caja = ?";

    connection.query(query, [idCaja], (err, results) => {
      if (err) {
        console.error("Error ejecutando la consulta:", err);
        return res.status(500).send("Error en el servidor");
      }

      if (results.length > 0) {
        const estadoCaja = results[0].Estado;

        if (estadoCaja === 1) {
          res.render("./nueva_venta/nueva_venta", {
            ID_Empleado: req.session.ID_Empleado,
            ID_Sucursal: req.session.ID_Sucursal,
            ID_Caja: req.session.ID_Caja,
          });
        } else if (estadoCaja === 2) {
          res.render("./paginas/caja_c");
        } else {
          res.send("Estado de la caja no válido");
        }
      } else {
        res.send("Caja no encontrada");
      }
    });
  } else {
    res.render("./paginas/logout");
  }
});

router.post("/buscar_cliente_por_carnet", (req, res) => {
  if (req.session.loggedin) {
    const { carnet } = req.body;

    const query = `
      SELECT Nombre, Apellido, Nit
      FROM clientes
      WHERE CI = ?
      LIMIT 1;
    `;

    connection.query(query, [carnet], (error, results) => {
      if (error) {
        console.error("Error al buscar cliente por carnet:", error);
        return res
          .status(500)
          .json({ error: "Error al buscar cliente por carnet" });
      }

      if (results.length > 0) {
        res.json(results[0]);
      } else {
        res.status(404).json({ error: "Cliente no encontrado" });
      }
    });
  } else {
    res.render("./paginas/logout");
  }
});

router.get("/obtener_cantidad_inventario/:idProducto", (req, res) => {
  if (req.session.loggedin) {
    const { idProducto } = req.params;
    const query = "SELECT Cantidad FROM inventario WHERE ID_Producto = ?";
    connection.query(query, [idProducto], (error, results) => {
      if (error) {
        console.error(
          "Error al obtener la cantidad en inventario del producto:",
          error
        );
        return res
          .status(500)
          .json({ error: "Error al obtener la cantidad en inventario" });
      }
      if (results.length > 0) {
        res.json({ cantidad: results[0].Cantidad });
      } else {
        res.status(404).json({ error: "Producto no encontrado en inventario" });
      }
    });
  } else {
    res.render("./paginas/logout");
  }
});

router.get("/obtener_productos_inventario", (req, res) => {
  if (req.session.loggedin) {
    const idSucursalEmpleado = req.session.ID_Sucursal;
    const filtroNombre = req.query.nombre || ""; // Obtén el filtro de nombre del query

    const obtenerProductosInventarioQuery = `
          SELECT p.ID_Producto, p.Nombre, p.Precio_Unitario, uv.Nombre AS Unidad_Venta
          FROM productos p 
          JOIN inventario i ON p.ID_Producto = i.ID_Producto
          JOIN unidad_venta uv ON p.ID_Unidad_Venta = uv.ID_Unidad_Venta
          WHERE i.ID_Sucursal = ? 
          AND p.Nombre LIKE ?
      `;

    connection.query(
      obtenerProductosInventarioQuery,
      [idSucursalEmpleado, `%${filtroNombre}%`],
      (error, productos) => {
        if (error) {
          console.error("Error al obtener los productos del inventario:", error);
          return res
            .status(500)
            .json({ error: "Error al obtener los productos del inventario" });
        }

        res.json(productos);
      }
    );
  } else {
    res.render("./paginas/logout");
  }
});
router.post("/buscar_producto_por_codigo", (req, res) => {
  const { codigo } = req.body;

  const query = `
    SELECT 
      p.ID_Producto,
      p.Nombre AS nombreProducto,
      i.Cantidad AS cantidadInventario
    FROM productos p
    LEFT JOIN inventario i ON p.ID_Producto = i.ID_Producto
    WHERE p.Codigo = ?
    LIMIT 1;
  `;

  connection.query(query, [codigo], (error, results) => {
    if (error) {
      console.error("Error al buscar el producto por código:", error);
      return res
        .status(500)
        .json({ error: "Error al buscar el producto por código" });
    }

    if (results.length > 0) {
      res.json(results[0]);
    } else {
      res.status(404).json({ error: "Producto no encontrado" });
    }
  });
});

router.get("/obtener_precio_producto/:idProducto", (req, res) => {
  if (req.session.loggedin) {
    const idProducto = req.params.idProducto;

    // Consulta SQL para obtener el precio del producto por su ID
    const obtenerPrecioProductoQuery =
      "SELECT Precio_Unitario FROM productos WHERE ID_Producto = ?";

    connection.query(
      obtenerPrecioProductoQuery,
      [idProducto],
      (error, resultados) => {
        if (error) {
          console.error("Error al obtener el precio del producto:", error);
          return res
            .status(500)
            .json({ error: "Error al obtener el precio del producto" });
        }

        if (resultados.length === 0) {
          return res.status(404).json({ error: "Producto no encontrado" });
        }

        const precio = resultados[0].Precio_Unitario;
        res.json({ precio: precio });
      }
    );
  } else {
    res.render("./paginas/logout");
  }
});

router.post("/nueva_venta", async (req, res) => {
  const ID_Empleado = req.body.ID_Empleado;
  const ID_Sucursal = req.body.ID_Sucursal;
  const ID_Caja = req.body.ID_Caja;
  const nombre = req.body.nombre.trim();
  const apellido = req.body.apellido.trim();
  const carnet = req.body.carnet ? req.body.carnet.trim() : null;
  const nit = req.body.nit ? req.body.nit.trim() : null;
  const fechaVenta = new Date();

  let productos = req.body.productos;
  let cantidades = req.body.cantidades;
  console.log("Datos recibidos nombre cliente:", req.body.nombre);
  console.log("Datos recibidos:", req.body);
  console.log("PRODUCTOS: ", productos);
  console.log("CANTIDADES: ", cantidades);

  // Si productos o cantidades no son arreglos, los convertimos en arreglos de un solo elemento
  if (!Array.isArray(productos)) {
    productos = [productos];
  }

  if (!Array.isArray(cantidades)) {
    cantidades = [cantidades];
  }

  try {
    const buscarClienteQuery = "SELECT * FROM clientes WHERE CI = ?";
    connection.query(buscarClienteQuery, [carnet], (error, results) => {
      if (error) {
        console.error("Error al buscar el cliente:", error);
        return res.status(500).send("Error al buscar el cliente");
      }

      const codigoBase = `${nombre.charAt(0).toLowerCase()}${apellido
        .charAt(0)
        .toLowerCase()}`;
      const codigo = carnet
        ? `${codigoBase}${carnet}`
        : nit
        ? `${codigoBase}${nit}`
        : null;

      const nuevaContrasena = carnet || nit;

      let idCliente;

      if (results.length > 0) {
        // El cliente ya existe, actualizar su información
        idCliente = results[0].ID_Cliente;
        const contrasenaActual = results[0].Contrasena;

        const actualizarClienteQuery =
          "UPDATE clientes SET nombre = ?, apellido = ?, nit = ?, codigo = ?, Contrasena = CASE WHEN Contrasena = ? THEN ? ELSE Contrasena END WHERE ID_Cliente = ?";
        connection.query(
          actualizarClienteQuery,
          [
            nombre,
            apellido,
            nit,
            codigo,
            contrasenaActual,
            nuevaContrasena,
            idCliente,
          ],
          (error) => {
            if (error) {
              console.error("Error al actualizar el cliente:", error);
              return res
                .status(500)
                .send("Error al actualizar la información del cliente");
            }
            procesarVenta(idCliente);
          }
        );
      } else {
        // El cliente no existe, crear uno nuevo
        const insertarClienteQuery =
          "INSERT INTO clientes (nombre, apellido, nit, ci, codigo, Contrasena) VALUES (?, ?, ?, ?, ?, ?)";
        connection.query(
          insertarClienteQuery,
          [nombre, apellido, nit, carnet, codigo, nuevaContrasena],
          (error, resultcli) => {
            if (error) {
              console.error("Error al registrar el cliente:", error);
              return res.status(500).send("Error al registrar el cliente");
            }
            idCliente = resultcli.insertId;
            console.log("ID del cliente insertado:", idCliente);
            procesarVenta(idCliente);
          }
        );
      }

      // Función para procesar la venta
      function procesarVenta(idCliente) {
        const insertarVentaQuery =
          "INSERT INTO ventas (ID_cliente, Fecha_Venta, ID_Empleado, ID_Sucursal, ID_Caja,Estado) VALUES (?, ?, ?, ?, ?,?)";
        connection.query(
          insertarVentaQuery,
          [idCliente, fechaVenta, ID_Empleado, ID_Sucursal, ID_Caja,1],
          (error, result) => {
            if (error) {
              console.error("Error al registrar la venta:", error);
              return res.status(500).send("Error al registrar la venta");
            }
            const idVenta = result.insertId;
            console.log("ID de la venta:", idVenta);

            const insertarDetallesPromises = productos.map(
              (producto, index) => {
                const cantidad = cantidades[index];
                const insertarDetalleQuery =
                  "INSERT INTO detalles_venta (ID_Venta, ID_Producto, Cantidad) VALUES (?, ?, ?)";
                return new Promise((resolve, reject) => {
                  connection.query(
                    insertarDetalleQuery,
                    [idVenta, producto, cantidad],
                    (error, result) => {
                      if (error) {
                        console.error(
                          "Error al registrar el detalle de la venta:",
                          error
                        );
                        reject(error);
                      } else {
                        resolve(result);
                      }
                    }
                  );
                });
              }
            );

            Promise.all(insertarDetallesPromises)
              .then(() => {
                console.log(
                  "Todos los detalles de venta insertados correctamente"
                );
                // Actualizar el inventario después de registrar la venta
                productos.forEach((productoID, index) => {
                  const cantidadVendida = cantidades[index];
                  const actualizarInventarioQuery =
                    "UPDATE inventario SET Cantidad = Cantidad - ? WHERE ID_Producto = ?";
                  connection.query(
                    actualizarInventarioQuery,
                    [cantidadVendida, productoID],
                    (error) => {
                      if (error) {
                        console.error(
                          "Error al actualizar el inventario:",
                          error
                        );
                      }
                    }
                  );
                });
                res.redirect("/nueva_venta");
              })
              .catch((error) => {
                console.error(
                  "Error al registrar los detalles de la venta:",
                  error
                );
                res
                  .status(500)
                  .send("Error al registrar los detalles de la venta");
              });
          }
        );
      }
    });
  } catch (error) {
    console.error("Error al procesar la venta:", error);
    return res.status(500).send("Error interno del servidor: " + error.message);
  }
});
// Ruta para generar la factura
router.post("/generar_factura", async (req, res) => {
  try {
    const {
      ID_Empleado,
      nombre,
      apellido,
      nit,
      carnet,
      fechaVenta,
      detalles,
      totalVenta,
      ID_Caja,
      ID_Sucursal,
    } = req.body;

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

    // Consulta para obtener el código y la contraseña del cliente
    const obtenerDatosCliente = () => {
      return new Promise((resolve, reject) => {
        const query = "SELECT codigo, contrasena FROM clientes WHERE CI = ? OR Nit = ?";
        connection.query(query, [carnet, nit], (error, results) => {
          if (error) {
            reject(error);
          } else if (results.length > 0) {
            resolve(results[0]); // Retorna el primer resultado
          } else {
            // Generar código y contraseña dinámicos para un nuevo cliente
            const datosGenerados = generarCodigoYContrasena(nombre, apellido, carnet, nit);
            resolve(datosGenerados);
          }
        });
      });
    };

    // Obtener datos del cliente (existente o dinámico)
    const clienteDatos = await obtenerDatosCliente();
    const { codigo: codigoCliente, contrasena: contrasenaCliente } = clienteDatos;

    // Validación del total de la venta
    const totalVentaNumber = typeof totalVenta === "number" ? totalVenta : parseFloat(totalVenta);
    if (isNaN(totalVentaNumber)) {
      throw new Error("El total de la venta no es un número válido.");
    }

    const timestamp = Date.now();
    const fileName = `venta_${timestamp}.pdf`;
    const filePath = path.join(__dirname, "../facturas_ventas", fileName);

    const doc = new PDFDocument({ size: [300, 600], margin: 10 });
    doc.pipe(fs.createWriteStream(filePath));

    // Logo y encabezado centrado
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

    // Datos del cliente con cabecera
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
          `${detalle.cantidad}      x      ${detalle.producto}    x    ${detalle.precio.toFixed(2)} Bs = ${subtotal.toFixed(2)} Bs`
        );
    });

    doc.moveDown(1);

    // Totales
    doc.font("Helvetica-Bold").fontSize(10).text(`Descuento: 0 Bs`, { align: "right" });
    doc.text(`Sub Total: ${totalVentaNumber.toFixed(2)} Bs`, { align: "right" });
    doc.text(`Total a Pagar: ${totalVentaNumber.toFixed(2)} Bs`, { align: "right" });

    doc.moveDown(1);

    // Derechos reservados
    doc.font("Helvetica").fontSize(6).text(
      `Derechos Reservados © ${new Date().getFullYear()} FARMACIA 25 de Julio.`,
      { align: "justify" }
    );

    // Finalizar y guardar el PDF
    doc.end();

    // Enviar respuesta al cliente con la URL del archivo
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
