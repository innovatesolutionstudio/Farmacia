const express = require("express");
const router = express.Router();
/*
const fs = require("fs");
const path = require("path");
const conneccion = require('../database/db'); // Importa la conexión a la base de datos
const PDFDocument = require('pdfkit');
const puppeteer = require('puppeteer');


// Renderizar el gráfico de Gantt como una imagen PNG utilizando Puppeteer
async function renderizarGanttComoPNG(ganttData, imagePath) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(`
    <html>
      <head>
        <meta charset="utf-8">
        <script src="https://cdn.dhtmlx.com/gantt/edge/dhtmlxgantt.js"></script>
        <link href="https://cdn.dhtmlx.com/gantt/edge/dhtmlxgantt.css" rel="stylesheet">
        <style>
          
        </style>
      </head>
      <body>
        <div id="gantt_here" style="width:100%; height:400px;"></div>
        <script>
          gantt.config.xml_date = "%Y-%m-%d";
          gantt.config.columns = [
            { name: "text", label: "Empleado", tree: true, width: 100 },
            { name: "descripcion", label: "Descripción", align: "center", width: 250 }
          ];
          gantt.init("gantt_here");
          gantt.parse(${JSON.stringify(ganttData)});
        </script>
      </body>
    </html>
  `);
  await page.waitForSelector('#gantt_here'); // Esperar a que el gráfico se cargue completamente
  await page.setViewport({ width: 800, height: 600 }); // Establecer el tamaño de la ventana de renderizado
  await page.screenshot({ path: imagePath }); // Capturar una captura de pantalla del gráfico y guardarla como imagen PNG
  await browser.close();
}


router.get('/reporte_tareas', async (req, res) => {
  const doc = new PDFDocument();
  const stream = fs.createWriteStream('./reportes_generados/gantt_reporte.pdf');
  doc.pipe(stream);

  try {
    // Cabecera
    doc.image("assets/images/logo/logo_fm.png", 35, 20, { width: 70 });
    doc.image("assets/images/logo/fnqr.png", 450, 10, { width: 110});
    doc.fontSize(27).font("Helvetica-Bold").text("FARMACIA", 120, 40);
    doc.fontSize(15).text("San Juan de Dios", 127, 70);
    doc.moveDown(); // Espacio vertical
    
    doc.fontSize(13).font("Helvetica-Bold").text(
      `REPORTE DE TAREAS SEMANALES`,
      160,
      130 // Alineado a la izquierda
    );
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.rect(50, doc.y, 220, 30).stroke();
    // Escribir la fecha dentro del cuadro
    doc.fontSize(12).font("Helvetica-Bold").text("Fecha de reporte: 22-4-2024 19:8:48", 55, doc.y + 10);
    doc.moveDown(); // Espacio vertical
    const mensaje = await obtenerMensajeReporte(17);
    // Imprimir el mensaje en el documento PDF
    doc.fontSize(10).font("Helvetica").text(`${mensaje}`, { align: "justify" }); // Alineado justificado
    doc.moveDown(); // Espacio vertical
    doc.fontSize(13).font("Helvetica-Bold").text(
      `GRAFICO DE TAREAS SEMANAL`,
      160,
      300 // Alineado a la izquierda
    );
    doc.moveDown(); // Espacio vertical
    // Obtener los datos de las tareas
    const dataTareas = await obtenerDatosTareas();

   // Definir una paleta de colores para las barras de progreso
const colorPalette = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ff8000', '#0080ff', '#ff0080', '#80ff00'];

// Asignar colores a las tareas y completado al 100%
const ganttData = {
  data: dataTareas.map((tarea, index) => ({
    text: tarea.Nombre_Empleado,
    descripcion: tarea.descripcion,
    start_date: tarea.Fecha_inicio,
    end_date: tarea.Fecha_fin,
    color: colorPalette[index % colorPalette.length], // Asignar un color de la paleta a cada tarea
    completado: 100, // Establecer el progreso al 100% para todas las tareas
  })),
  links: [] // Si tienes enlaces entre tareas
};
    // Renderizar el gráfico de Gantt como una imagen PNG
    const ganttImagePath = path.join(__dirname, '..', 'reportes_generados', 'graficos', 'gantst.png');
    await renderizarGanttComoPNG(ganttData, ganttImagePath);

    // Agregar el gráfico de Gantt al PDF
    doc.image(ganttImagePath,  50, 350,{ width: 500 });

    // Resto del contenido del PDF como en tu código actual...

  } catch (error) {
    // Manejo de errores
    console.error('Error al obtener los datos de las tareas:', error);
    res.status(500).send('Error al generar el PDF');
  } finally {
    doc.end();
    stream.on('finish', () => {
      res.redirect(`/pdf-viewer/${path.basename(stream.path)}`);
    });
  }
});

// Función para obtener los datos de las tareas desde la base de datos
function obtenerDatosTareas() {
  return new Promise((resolve, reject) => {
      const query = 'SELECT t.ID_Tarea, e.Nombre AS Nombre_Empleado, t.Estado, t.Fecha_inicio, t.Fecha_fin, t.Descripcion AS descripcion FROM tareas t INNER JOIN empleados e ON t.ID_Empleado = e.ID_Empleado';
      conneccion.query(query, (error, results, fields) => {
          if (error) {
              reject(error);
          } else {
              resolve(results);
          }
      });
  });
}
function obtenerMensajeReporte(id) {
  return new Promise((resolve, reject) => {
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
  });
}

*/
module.exports = router;
