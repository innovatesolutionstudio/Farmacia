const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const conneccion = require('../database/db'); // Importa la conexión a la base de datos
const PDFDocument = require('pdfkit');

// Función para obtener los datos de unidad_empaque
function obtenerDatosUnidadEmpaque() {
  return new Promise((resolve, reject) => {
    const query = 'SELECT * FROM unidad_empaque';
    conneccion.query(query, (error, results, fields) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
}

// Función para obtener el mensaje del reporte
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

// Función para obtener la fecha actual
function obtenerFechaActual() {
  const ahora = new Date();
  const year = ahora.getFullYear();
  const month = String(ahora.getMonth() + 1).padStart(2, '0');
  const day = String(ahora.getDate()).padStart(2, '0');
  const hour = String(ahora.getHours()).padStart(2, '0');
  const minute = String(ahora.getMinutes()).padStart(2, '0');
  const second = String(ahora.getSeconds()).padStart(2, '0');
  const fechaHora = `${year}-${month}-${day}-${hour}-${minute}-${second}`;
  return fechaHora;
}

router.get('/impre_unidad_empaque', async (req, res) => {
  const fecha = obtenerFechaActual();
  const doc = new PDFDocument();
  const stream = fs.createWriteStream(`./impresiones/Impre_Unidad_Empaque-${fecha}.pdf`);
  
  doc.pipe(stream);

  try {
    doc.image("assets/images/logo/logo_fm.png", 35, 20, { width: 70 });
    doc.image("assets/images/logo/fnqr.png", 450, 10, { width: 110 });
    doc.fontSize(27).font("Helvetica-Bold").text("FARMACIA", 120, 40);
    doc.fontSize(15).text("San Juan de Dios", 127, 70);
    doc.moveDown();

    doc.fontSize(13).font("Helvetica-Bold").text(`REGISTRO DE UNIDAD DE EMPAQUE`, 160, 130);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.rect(50, doc.y, 235, 30).stroke();
    
    doc.fontSize(12).font("Helvetica-Bold").text(`Fecha de reporte: ${fecha}`, 55, doc.y + 10);
    doc.moveDown();
    const mensaje = await obtenerMensajeReporte(21);
    doc.fontSize(10).font("Helvetica").text(`${mensaje}`, { align: "justify" });

    const dataUnidadEmpaque = await obtenerDatosUnidadEmpaque();
    crearTablaUnidadEmpaque(doc, dataUnidadEmpaque);

    const yPos = doc.y;
    agregarFirmas(doc, yPos);

  } catch (error) {
    console.error('Error al obtener los datos de unidad de empaque:', error);
    res.status(500).send('Error al generar el PDF');
  } finally {
    doc.end();
    stream.on('finish', () => {
      res.redirect(`/impre/${path.basename(stream.path)}`);
    });
  }
});

// Función para crear una tabla en el PDF
function crearTablaUnidadEmpaque(doc, dataUnidadEmpaque) {
  const tableTop = 250;
  const cellPadding = 10;
  const fontSize = 12;
  const textColor = '#333';
  const headerColor = '#000';
  const rowColors = ['#f3f3f3', '#ffffff'];
  const tableHeaders = ["ID Unidad Empaque", "Nombre"];
  const cellWidth = (doc.page.width - 200) / tableHeaders.length;

  function drawTable() {
    let y = tableTop;
    doc.lineWidth(1).strokeColor('#000');
    for (let i = 0; i <= dataUnidadEmpaque.length + 1; i++) {
      doc.moveTo(100, y + i * (fontSize + cellPadding))
         .lineTo(100 + tableHeaders.length * cellWidth, y + i * (fontSize + cellPadding))
         .stroke();
    }
    for (let i = 0; i <= tableHeaders.length; i++) {
      doc.moveTo(100 + i * cellWidth, y)
         .lineTo(100 + i * cellWidth, y + (fontSize + cellPadding) * (dataUnidadEmpaque.length + 1))
         .stroke();
    }
    drawRow(tableHeaders, y, true, '#28A787');
    y += fontSize + cellPadding;
    dataUnidadEmpaque.forEach((unidad, index) => {
      const fillColor = rowColors[index % rowColors.length];
      doc.fillColor(fillColor);
      drawRow([unidad.ID_Unidad_Empaque, unidad.Nombre], y, false, 'black');
      y += fontSize + cellPadding;
    });
  }

  function drawRow(rowData, y, bold, backgroundColor) {
    const cellWidth = (doc.page.width - 200) / 2;
    rowData.slice(0, 2).forEach((cellData, index) => {
      const cellX = 100 + index * cellWidth + cellPadding;
      const fillColor = bold ? backgroundColor : '#fff';
      doc.rect(cellX, y, cellWidth, fontSize + cellPadding).fillAndStroke(fillColor, '#000');
      if (bold) {
        doc.font("Helvetica-Bold").fontSize(fontSize).fillColor('#fff').text(cellData.toString(), cellX, y + (fontSize + cellPadding) / 2, { width: cellWidth, align: 'center' });
      } else {
        doc.font("Helvetica").fontSize(fontSize).fillColor(textColor).text(cellData.toString(), cellX, y + (fontSize + cellPadding) / 2, { width: cellWidth, align: 'center' });
      }
    });
  }

  drawTable();
}

function agregarFirmas(doc, yPos) {
  doc.image('assets/images/firmas/firma_A.png', 140, yPos + 35, { width: 120, height: 120 });
  doc.image('assets/images/firmas/firma_f.png', 370, yPos + 30, { width: 120, height: 120 });
  doc.text("Abigail Rodriguez Fernandez", 140, yPos + 120);
  doc.text("Fernanda Mamani P.", 370, yPos + 120);
  doc.fillColor('red');
  doc.text("Lic. Farmaceutica", 160, yPos + 140);
  doc.text("Enfermera", 400, yPos + 140);
}

module.exports = router;
