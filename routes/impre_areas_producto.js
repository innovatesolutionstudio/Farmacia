const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const conneccion = require('../database/db'); // Importa la conexión a la base de datos
const PDFDocument = require('pdfkit');

// Función para obtener datos de area_producto
function obtenerDatosAreaProducto() {
    return new Promise((resolve, reject) => {
        const query = 'SELECT * FROM area_producto';
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

router.get('/impre_areas_producto', async (req, res) => {
    const fecha = obtenerFechaActual();
    const doc = new PDFDocument();

    const stream = fs.createWriteStream(`./impresiones/Impre_Area_Producto-${fecha}.pdf`);

    doc.pipe(stream);

    try {
        // Cabecera del PDF
        doc.image("assets/images/logo/logo_fm.png", 35, 20, { width: 70 });
        doc.image("assets/images/logo/fnqr.png", 450, 10, { width: 110 });
        doc.fontSize(27).font("Helvetica-Bold").text("FARMACIA", 120, 40);
        doc.fontSize(15).text("San Juan de Dios", 127, 70);
        doc.moveDown(); // Espacio vertical

        // Título del reporte
        doc.fontSize(13).font("Helvetica-Bold").text(
            `REGISTRO DE ÁREA PRODUCTO`,
            160,
            130 // Alineado a la izquierda
        );
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.rect(50, doc.y, 235, 30).stroke();

        // Escribir la fecha dentro del cuadro
        doc.fontSize(12).font("Helvetica-Bold").text(`Fecha de reporte: ${fecha}`, 55, doc.y + 10);

        doc.moveDown(); // Espacio vertical
        const mensaje = await obtenerMensajeReporte(22);
        // Imprimir el mensaje en el documento PDF
        doc.fontSize(10).font("Helvetica").text(`${mensaje}`, { align: "justify" });

        // Obtener los datos de area_producto desde la base de datos
        const dataAreaProducto = await obtenerDatosAreaProducto();
        // Llamar a la función para crear la tabla en el PDF
        crearTablaAreaProducto(doc, dataAreaProducto);

        // Obtenemos la posición y actual del documento
        const yPos = doc.y;

        // Llamamos a la función para agregar las firmas debajo de la tabla
        agregarFirmas(doc, yPos);

    } catch (error) {
        // Manejo de errores
        console.error('Error al obtener los datos de area_producto:', error);
        res.status(500).send('Error al generar el PDF');
    } finally {
        // Finalizar y enviar el PDF
        doc.end();
        stream.on('finish', () => {
            res.redirect(`/impre/${path.basename(stream.path)}`);
        });
    }
});

// Función para crear una tabla en el PDF
function crearTablaAreaProducto(doc, dataAreaProducto) {
    // Definir dimensiones y estilos de la tabla
    const tableTop = 250;
    const cellPadding = 10;
    const fontSize = 12;
    const textColor = '#333';
    const headerColor = '#000';
    const rowColors = ['#f3f3f3', '#ffffff'];
    const tableHeaders = ["ID Área Producto", "Nombre"];

    // Calcular el ancho de las celdas
    const cellWidth = (doc.page.width - 200) / tableHeaders.length;

    // Definir la función para dibujar la tabla
    function drawTable() {
        let y = tableTop;
        // Dibujar las líneas horizontales
        doc.lineWidth(1).strokeColor('#000'); // Establecer el grosor de línea y color negro
        for (let i = 0; i <= dataAreaProducto.length + 1; i++) {
            doc.moveTo(100, y + i * (fontSize + cellPadding))
                .lineTo(100 + tableHeaders.length * cellWidth, y + i * (fontSize + cellPadding))
                .stroke();
        }
        // Dibujar las líneas verticales
        for (let i = 0; i <= tableHeaders.length; i++) {
            doc.moveTo(100 + i * cellWidth, y)
                .lineTo(100 + i * cellWidth, y + (fontSize + cellPadding) * (dataAreaProducto.length + 1))
                .stroke();
        }
        // Dibujar el contenido de la tabla
        drawRow(tableHeaders, y, true, '#28A787'); // Dibujar la primera fila con negrita y color diferente
        y += fontSize + cellPadding;
        dataAreaProducto.forEach((area, index) => {
            const fillColor = rowColors[index % rowColors.length];
            doc.fillColor(fillColor);
            drawRow([area.ID_Area_Producto, area.Nombre], y, false, 'black'); // Dibujar el resto de las filas sin negrita
            y += fontSize + cellPadding;
        });
    }

    // Definir la función para dibujar una fila
    function drawRow(rowData, y, bold, backgroundColor) {
        const cellWidth = (doc.page.width - 200) / 2; // Calcular el ancho de cada celda (solo 2 columnas)
        rowData.slice(0, 2).forEach((cellData, index) => { // Iterar solo sobre las dos primeras celdas
            const cellX = 100 + index * cellWidth + cellPadding;
            // Determinar el color de fondo de acuerdo al tipo de fila
            const fillColor = bold ? backgroundColor : '#fff'; // Para la cabecera, usa el color de fondo especificado, de lo contrario, blanco
            // Dibujar el rectángulo que representa cada casillero
            doc.rect(cellX, y, cellWidth, fontSize + cellPadding).fillAndStroke(fillColor, '#000');
            // Escribir el texto centrado en el casillero
            if (bold) {
                doc.font("Helvetica-Bold").fontSize(fontSize).fillColor('#fff').text(cellData.toString(), cellX, y + (fontSize + cellPadding) / 2, { width: cellWidth, align: 'center' });
            } else {
                doc.font("Helvetica").fontSize(fontSize).fillColor(textColor).text(cellData.toString(), cellX, y + (fontSize + cellPadding) / 2, { width: cellWidth, align: 'center' });
            }
        });
    }

    // Dibujar la tabla
    drawTable();
}

function agregarFirmas(doc, yPos) {
    // Insertamos la primera imagen
    doc.image('assets/images/firmas/firma_A.png', 140, yPos + 35, { width: 120, height: 120 });
    // Insertamos la segunda imagen
    doc.image('assets/images/firmas/firma_f.png', 370, yPos + 30, { width: 120, height: 120 });

    // Agregamos una fila con los nombres
    doc.text("Abigail Rodriguez Fernandez", 140, yPos + 120);
    doc.text("Fernanda Mamani P.", 370, yPos + 120);
    doc.fillColor('red');
    // Agregamos una fila con los títulos
    doc.text("Lic. Farmaceutica", 160, yPos + 140);
    doc.text("Enfermera", 400, yPos + 140);
}

module.exports = router;
