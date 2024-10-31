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

router.get("/reporte-ventas", (req, res) => {
  const sucursalID = req.session.ID_Sucursal;
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0))
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");
  const endOfDay = new Date(today.setHours(23, 59, 59, 999))
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");

  connection.query(
    "SELECT * FROM ventas WHERE Fecha_Venta BETWEEN ? AND ? AND ID_Sucursal = ?",
    [startOfDay, endOfDay, sucursalID],
    (error, results) => {
      if (error) {
        console.error("Error al obtener las ventas del día:", error);
        res.status(500).send("Error interno del servidor");
        return;
      }

      // Crear un nuevo documento PDF
      const doc = new PDFDocument();

      // Establecer el nombre del archivo PDF
      const fileName = "reporte_ventas.pdf";
      const filePath = path.join(__dirname, "..", "public", "pdf", fileName);

      // Establecer las cabeceras para indicar que se envía un archivo PDF
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);

      // Pipe el documento PDF a la respuesta HTTP
      doc.pipe(res);

      // Agregar el contenido al PDF (ventas del día)
      doc
        .fontSize(20)
        .text("Informe de Ventas del Día", { align: "center" })
        .moveDown();

      results.forEach((venta, index) => {
        doc
          .fontSize(14)
          .text(`Venta ${index + 1}: ${venta.Total_Venta}`, { align: "left" })
          .moveDown();
        // Puedes agregar más información de la venta si lo necesitas
      });

      // Finalizar el documento PDF
      doc.end();
    }
  );
});

module.exports = router;
