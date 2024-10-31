const express = require("express");
const router = express.Router();
const connection = require("../database/db");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

router.get("/cajas", (req, res) => {
  if (req.session.loggedin) {
    const sucursalID = req.session.ID_Sucursal;

    connection.query(
      "SELECT Nombre FROM sucursales WHERE ID_Sucursal = ?",
      [sucursalID],
      (error, results) => {
        if (error) {
          console.error("Error al obtener el nombre de la sucursal:", error);
          res.status(500).send("Error interno del servidor");
          return;
        }

        if (results.length > 0) {
          const nombreSucursal = results[0].Nombre;

          // Primera consulta: Obtener las ventas totales del día
          connection.query(
            `
                    SELECT SUM(Total_Venta) AS Ventas_Totales 
                    FROM ventas 
                    WHERE ID_Sucursal = ? 
                    AND Fecha_Venta BETWEEN CURDATE() AND NOW()
                `,
            [sucursalID],
            (error, ventasResult) => {
              if (error) {
                console.error("Error al obtener las ventas totales:", error);
                res.status(500).send("Error interno del servidor");
                return;
              }
              const ventasTotales = ventasResult[0].Ventas_Totales || 0;

              // Segunda consulta: Obtener el historial de ventas ordenado por fecha descendente
              connection.query(
                `
                        SELECT c.Codigo AS Codigo_Caja, v.Total_Venta, v.Fecha_Venta
                        FROM ventas v
                        JOIN cajas c ON v.ID_Caja = c.ID_Caja
                        WHERE c.ID_Sucursal = ? AND Fecha_Venta BETWEEN CURDATE() AND NOW()
                        ORDER BY v.Fecha_Venta DESC
                    `,
                [sucursalID],
                (error, historialVentas) => {
                  if (error) {
                    console.error(
                      "Error al obtener el historial de ventas:",
                      error
                    );
                    res.status(500).send("Error interno del servidor");
                    return;
                  }

                  // Tercera consulta: Obtener los detalles de las cajas
                  connection.query(
                    `
                           SELECT c.ID_Caja, c.Codigo, c.Estado, e.ID_Empleado, e.Nombre AS Empleado_Nombre, 
                                IFNULL(SUM(v.Total_Venta), 0) AS Total_Venta, MAX(v.Fecha_Venta) AS Fecha_Venta 
                            FROM cajas c
                            LEFT JOIN empleados e ON c.ID_Caja = e.ID_Caja
                            LEFT JOIN ventas v ON c.ID_Caja = v.ID_Caja AND v.Fecha_Venta BETWEEN CURDATE() AND NOW()
                            WHERE c.ID_Sucursal = ? AND c.ID_Caja != 8 AND c.ID_Caja != 10  AND c.Figura = 1
                            GROUP BY c.ID_Caja, e.ID_Empleado, e.Nombre;

                        `,
                    [sucursalID],
                    (error, cajasResults) => {
                      if (error) {
                        console.error(
                          "Error al obtener los detalles de las cajas:",
                          error
                        );
                        res.status(500).send("Error interno del servidor");
                        return;
                      }

                      const cajas = cajasResults;

                      // Renderizamos la vista con los datos de las cajas, ventas totales y el historial de ventas
                      res.render("./cajas/cajas", {
                        ID_Empleado: req.session.ID_Empleado,
                        ID_Sucursal: sucursalID,
                        Nombre_Sucursal: nombreSucursal,
                        Ventas_Totales: ventasTotales,
                        Cajas: cajas,
                        Historial_Ventas: historialVentas, // Enviamos el historial de ventas a la vista
                      });
                    }
                  );
                }
              );
            }
          );
        } else {
          res.status(404).send("Sucursal no encontrada");
        }
      }
    );
  } else {
    res.render("./paginas/logout");
  }
});

// Ruta para abrir una caja
router.post("/abrir-caja", (req, res) => {
  const { idCaja } = req.body;
  const currentDateTime = new Date(); // Fecha y hora actual

  // Actualizar el estado de la caja a '1' (abierto)
  connection.query(
    "UPDATE cajas SET Estado = 1 WHERE ID_Caja = ?",
    [idCaja],
    (error, results) => {
      if (error) {
        console.error("Error al abrir la caja:", error);
        res.status(500).send("Error interno del servidor");
        return;
      }

      // Insertar en el historial la fecha y hora de apertura de la caja
      connection.query(
        "INSERT INTO historial_caja_abierta (ID_Caja, Abertura) VALUES (?, ?)",
        [idCaja, currentDateTime],
        (error, results) => {
          if (error) {
            console.error(
              "Error al registrar el historial de apertura:",
              error
            );
          }

          // Redirigir a /cajas después de abrir la caja y registrar el historial
          res.redirect("/cajas");
        }
      );
    }
  );
});

// Ruta para cerrar una caja
router.post("/cerrar-caja", (req, res) => {
  const { idCaja } = req.body;
  const currentDateTime = new Date(); // Fecha y hora actual

  // Actualizar el estado de la caja a '2' (cerrado)
  connection.query(
    "UPDATE cajas SET Estado = 2 WHERE ID_Caja = ?",
    [idCaja],
    (error, results) => {
      if (error) {
        console.error("Error al cerrar la caja:", error);
        res.status(500).send("Error interno del servidor");
        return;
      }

      // Insertar en el historial la fecha y hora de cierre de la caja
      connection.query(
        "INSERT INTO historial_caja_cerrada (ID_Caja, Cierre) VALUES (?, ?)",
        [idCaja, currentDateTime],
        (error, results) => {
          if (error) {
            console.error("Error al registrar el historial de cierre:", error);
          }

          // Redirigir a /cajas después de cerrar la caja y registrar el historial
          res.redirect("/cajas");
        }
      );
    }
  );
});

router.post("/abrir-todas", (req, res) => {
  const sucursalID = req.session.ID_Sucursal;
  const currentDateTime = new Date(); // Fecha y hora actual

  // Actualizar el estado de todas las cajas de la sucursal a '1' (abierto)
  connection.query(
    "UPDATE cajas SET Estado = 1 WHERE ID_Sucursal = ? AND Figura = 1",
    [sucursalID],
    (error, results) => {
      if (error) {
        console.error("Error al abrir todas las cajas:", error);
        res.status(500).send("Error interno del servidor");
        return;
      }

      // Selecciona todas las cajas de la sucursal para insertar su historial de apertura
      connection.query(
        "SELECT ID_Caja FROM cajas WHERE ID_Sucursal = ?",
        [sucursalID],
        (error, cajas) => {
          if (error) {
            console.error("Error al obtener las cajas:", error);
            res.status(500).send("Error interno del servidor");
            return;
          }

          // Inserta el registro de apertura en la tabla historial_caja
          cajas.forEach((caja) => {
            connection.query(
              "INSERT INTO historial_caja_abierta (ID_Caja, Abertura) VALUES (?, ?)",
              [caja.ID_Caja, currentDateTime],
              (error, results) => {
                if (error) {
                  console.error(
                    "Error al registrar el historial de la caja:",
                    error
                  );
                }
              }
            );
          });

          // Redirecciona después de completar la operación
          res.redirect("/cajas");
        }
      );
    }
  );
});

router.post("/cerrar-todas", (req, res) => {
  const sucursalID = req.session.ID_Sucursal;
  const currentDateTime = new Date(); // Fecha y hora actual

  // Actualizar el estado de todas las cajas de la sucursal a '2' (cerrado)
  connection.query(
    "UPDATE cajas SET Estado = 2 WHERE ID_Sucursal = ? AND Figura = 1",
    [sucursalID],
    (error, results) => {
      if (error) {
        console.error("Error al cerrar todas las cajas:", error);
        res.status(500).send("Error interno del servidor");
        return;
      }

      // Seleccionar todas las cajas de la sucursal para insertar el historial de cierre
      connection.query(
        "SELECT ID_Caja FROM cajas WHERE ID_Sucursal = ?",
        [sucursalID],
        (error, cajas) => {
          if (error) {
            console.error("Error al obtener las cajas:", error);
            res.status(500).send("Error interno del servidor");
            return;
          }

          // Inserta el registro de cierre en la tabla historial_caja_cerrada
          cajas.forEach((caja) => {
            connection.query(
              "INSERT INTO Historial_Caja_Cerrada (ID_Caja, Cierre) VALUES (?, ?)",
              [caja.ID_Caja, currentDateTime],
              (error, results) => {
                if (error) {
                  console.error(
                    "Error al registrar el cierre de la caja:",
                    error
                  );
                }
              }
            );
          });

          // Redirecciona después de completar la operación
          res.redirect("/cajas");
        }
      );
    }
  );
});


function obtenerMensajeReporte(id) {
    return new Promise((resolve, reject) => {
      connection.query('SELECT ID_Mensaje, Texto FROM mensajes WHERE ID_Mensaje = ?', [id], (error, results, fields) => {
        if (error) {
          reject(error);
        } else {
          if (results.length > 0) {
            resolve(results[0].Texto);
          } else {
            resolve('No se encontró el mensaje para el ID especificado');
          }
        }
      });
    });
  }

// Función para obtener la fecha actual
function obtenerFechaActual() {
    const ahora = new Date();

    // Obtener el año, mes, día, hora, minuto y segundo
    const year = ahora.getFullYear();
    const month = String(ahora.getMonth() + 1).padStart(2, '0'); // El mes es 0-indexado, por lo que sumamos 1
    const day = String(ahora.getDate()).padStart(2, '0');
    const hour = String(ahora.getHours()).padStart(2, '0');
    const minute = String(ahora.getMinutes()).padStart(2, '0');
    const second = String(ahora.getSeconds()).padStart(2, '0');

    // Formatear la fecha y la hora en una sola cadena
    const fechaHora = `${year}-${month}-${day}-${hour}-${minute}-${second}`;

    return fechaHora;
}

router.get('/reporte-ventas', async (req, res) => {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString().slice(0, 19).replace('T', ' ');
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString().slice(0, 19).replace('T', ' ');

    connection.query(`
        SELECT c.Codigo AS Codigo_Caja, v.Total_Venta, v.Fecha_Venta
        FROM ventas v
        JOIN cajas c ON v.ID_Caja = c.ID_Caja
        WHERE c.ID_Sucursal = 1 AND Fecha_Venta BETWEEN CURDATE() AND NOW()
        ORDER BY v.Fecha_Venta DESC
    `, [startOfDay, endOfDay], async (error, results) => {
        if (error) {
            console.error('Error al obtener las ventas del día:', error);
            res.status(500).send('Error interno del servidor');
            return;
        }
        const fecha = obtenerFechaActual(); // Utiliza la función que ya tienes para obtener la fecha actual
        const doc = new PDFDocument();
        const fileName = 'reporte_ventas.pdf';

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);

        // Pipe el documento PDF a la respuesta HTTP
        doc.pipe(res);

        // Cabecera del PDF
        doc.image("assets/images/logo/logo_fm.png", 35, 20, { width: 70 });
        doc.image("assets/images/logo/fnqr.png", 450, 10, { width: 110 });
        doc.fontSize(27).font("Helvetica-Bold").text("FARMACIA", 120, 40);
        doc.fontSize(15).text("25 de Julio", 127, 70);
        doc.moveDown(); // Espacio vertical

        // Título del reporte
        doc.fontSize(13).font("Helvetica-Bold").text(
            `                      REPORTE DEL DIA`,
            160,
            130 // Alineado a la izquierda
        );
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.rect(50, doc.y, 235, 30).stroke();

        // Escribir la fecha dentro del cuadro
        doc.fontSize(12).font("Helvetica-Bold").text(`Fecha de reporte: ${fecha}`, 55, doc.y + 10);
        doc.moveDown();

        const mensaje = await obtenerMensajeReporte(26);
        // Imprimir el mensaje en el documento PDF
       doc.fontSize(10).font("Helvetica").text(`${mensaje}`, { align: "justify" });
        

        // Llamar a la función para crear la tabla en el PDF
        crearTablaVentas(doc, results); // Usa los resultados de la consulta

        // Finalizar el documento PDF
        doc.end();
    });
});
// Función para crear la tabla en el PDF
function crearTablaVentas(doc, dataVentas) {
    const tableTop = 250; // Altura de inicio de la tabla
    const cellPadding = 10; // Espaciado interno de las celdas
    const fontSize = 12; // Tamaño de fuente
    const textColor = '#333'; // Color del texto
    const headerColor = '#28A787'; // Color del encabezado
    const rowColors = ['#f3f3f3', '#ffffff']; // Colores de las filas
    const tableHeaders = ["Código Caja", "Total Venta", "Fecha Venta"]; // Encabezados de la tabla

    const cellWidth = (doc.page.width - 200) / tableHeaders.length; // Calcular el ancho de las celdas

    // Dibujar las líneas horizontales
    doc.lineWidth(1).strokeColor('#000'); // Grosor de línea y color negro
    for (let i = 0; i <= dataVentas.length + 1; i++) {
        doc.moveTo(100, tableTop + i * (fontSize + cellPadding))
           .lineTo(100 + tableHeaders.length * cellWidth, tableTop + i * (fontSize + cellPadding))
           .stroke();
    }
    // Dibujar las líneas verticales
    for (let i = 0; i <= tableHeaders.length; i++) {
        doc.moveTo(100 + i * cellWidth, tableTop)
           .lineTo(100 + i * cellWidth, tableTop + (fontSize + cellPadding) * (dataVentas.length + 1))
           .stroke();
    }

    // Dibujar el contenido de la tabla
    let y = tableTop;
    doc.fillColor(headerColor).fontSize(fontSize).font("Helvetica-Bold");
    tableHeaders.forEach((header, index) => {
        doc.text(header, 100 + index * cellWidth, y);
    });

    y += fontSize + cellPadding; // Mover a la siguiente línea

    dataVentas.forEach((venta, index) => {
        const fillColor = rowColors[index % rowColors.length];
        const fechaVenta = venta.Fecha_Venta.toISOString().slice(0, 10); // Solo obtener la fecha sin la hora
        drawRow(doc, [venta.Codigo_Caja, venta.Total_Venta, fechaVenta], y, false, textColor); // Dibuja cada fila
        y += fontSize + cellPadding;
    });
}


function drawRow(doc, rowData, y, bold, textColor) {
  const cellWidth = (doc.page.width - 200) / rowData.length; // Calcular el ancho de cada celda
  rowData.forEach((cellData, index) => {
      const cellX = 100 + index * cellWidth;
      doc.rect(cellX, y, cellWidth, 20).fillAndStroke('#fff', '#000'); // Dibuja el rectángulo de la celda
      doc.fillColor(textColor).fontSize(12);
      doc.text(cellData != null ? cellData.toString() : '', cellX, y + 5, { width: cellWidth, align: 'center' });
  });
}


module.exports = router;