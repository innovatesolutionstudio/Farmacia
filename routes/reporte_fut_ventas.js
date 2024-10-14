const express = require("express");
const router = express.Router();
/*const fs = require("fs");
const path = require("path");
const conneccion = require('../database/db'); // Importa la conexión a la base de datos
const Chart = require('chart.js/auto'); // Importar Chart.js
const PDFDocument = require("pdfkit");
const { createCanvas } = require('canvas');

// Función para obtener el año actual
function obtenerAño() {
  return new Date().getFullYear();
}

function obtenerMensajeReporte(id) {
    return new Promise((resolve, reject) => {
      try {
        conneccion.query('SELECT ID_Mensaje, Texto FROM mensajes WHERE ID_Mensaje = ?', [id], (error, results, fields) => {
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
      } catch (error) {
        reject(error);
      }
    });
  }
  
          const data = {
            datasets: [
              {
                label: 'Ventas  Ganancias',  
                data: results.map(row => ({ x: row.Ventas_Totales, y: row.Ganancias_Totales }))
              }
            ]
          };
          resolve(data);
        }
      });
    });
  }
function obtenerDatosRegresion() {
    return new Promise((resolve, reject) => {
      conneccion.query('SELECT * FROM resultados_regresion', (error, results, fields) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  }
  function nombredoc(){
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}-${now.getMinutes().toString().padStart(2, '0')}-${now.getSeconds().toString().padStart(2, '0')}`;
    return filename = `REPORTE_LINEAL_${formattedDate}.png`;
  }
  router.get("/reporte_fut_ventas", async (req, res) => {
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(
      "./reportes_generados/ganancias_reporte.pdf"
    );
  
    doc.pipe(stream);
  
    // Cabecera
    doc.image("assets/images/logo/farmacia_1.png", 20, 20, { width: 120 });
    doc.fontSize(27).font("Helvetica-Bold").text("FARMACIA",130, 40 );
    doc.fontSize(13).text("San Juan de Dios", 140, 70 );
  
    doc.moveDown(); // Espacio vertical
    const año = obtenerAño();
    doc.fontSize(13).font("Helvetica-Bold").text(
      `REPORTE DE GANANCIAS DE PRODUCTOS POR AREAS GESTION - ${año}`,
      70,
      130 // Alineado a la izquierda
    );
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.rect(50, doc.y, 220, 30).stroke();
    // Escribir la fecha dentro del cuadro
    doc.fontSize(12).font("Helvetica-Bold").text("Fecha de reporte: 22-4-2024 19:8:48", 55, doc.y + 10);
    doc.moveDown(); // Espacio vertical

    const mensaje = await obtenerMensajeReporte(18);
    // Imprimir el mensaje en el documento PDF
    doc.fontSize(10).font("Helvetica").text(`${mensaje}`, { align: "justify" }); // Alineado justificado
    

    // Contenido
  
    obtenerMensajeReporte(10)
    .then(mensaje => {
      // Imprimir el mensaje en el documento PDF
      doc.fontSize(10).font("Helvetica").text(` ${mensaje}`, { align: "justify" }); // Alineado justificado
  
      // Finalizar y enviar el PDF
      doc.end();
  
      stream.on("finish", () => {
        res.redirect(`/pdf-viewer/${path.basename(stream.path)}`); 
      });
    })
    .catch(error => {
      // Manejo de errores
      console.error('Error:', error);
    });
  });
  

router.get("/pdf/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, "..", "reportes_generados", filename);
  res.sendFile(filePath);
});

// Ruta para abrir el PDF en otra ventana
router.get("/pdf-viewer/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, "..", "reportes_generados", filename);
  res.sendFile(filePath);
});
*/
module.exports = router;
