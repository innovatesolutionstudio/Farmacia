const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const bodyParser = require('body-parser');
const coneccion = require('../database/db');

// Middleware para parsear el cuerpo de las solicitudes como JSON
router.use(bodyParser.json());

// Función para asegurar la existencia del directorio
function ensureDirectoryExistence(filePath) {
    const dirname = path.dirname(filePath);
    if (fs.existsSync(dirname)) {
        return true;
    }
    ensureDirectoryExistence(dirname);
    fs.mkdirSync(dirname);
}

// Función para obtener la fecha y hora actual en el formato deseado
function getFormattedDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${day}-${month}-${year}-${hours}-${minutes}-${seconds}`;
}
function obtenerMensajeReporte() {
    return " Este reporte tiene como objetivo proporcionar una visión clara y comprensible de los datos que hemos recopilado. A través de este  documento, buscamos transmitir información de manera  efectiva, permitiendo una mejor toma de decisiones y  una comprensión más profunda de los aspectos relevantes de nuestro entorno farmaceutico  " 

    }
// Función para convertir el título en un nombre corto para el archivo
function getShortTitle(title) {
    // Aquí puedes definir cómo quieres acortar el título
    // En este caso, lo simplificamos a las iniciales de cada palabra separadas por guiones bajos
    return title.split(' ').map(word => word.charAt(0).toUpperCase()).join('_');
}

// Ruta para guardar la imagen y generar el PDF
router.post('/save_chart_image', (req, res) => {
    const { image, year, month, title } = req.body;
    const base64Data = image.replace(/^data:image\/png;base64,/, "");
    const timestamp = getFormattedDate();
    const shortTitle = getShortTitle(title);  // Convertimos el título a una forma corta
    const imagePath = path.join(__dirname, 'graficos_reportes', `${shortTitle}_${year}_${timestamp}.png`);
    const pdfPath = path.join(__dirname, 'reporte_generado', `${shortTitle}_${year}_${timestamp}.pdf`);

    const fecha = getFormattedDate();
  
    ensureDirectoryExistence(imagePath);
    ensureDirectoryExistence(pdfPath);

    fs.writeFile(imagePath, base64Data, 'base64', (err) => {
        if (err) {
            console.error('Error saving image:', err);
            return res.status(500).send('Error saving image');
        }
        console.log('Image saved successfully:', imagePath);

        // Crear un documento PDF e incluir la imagen
        const doc = new PDFDocument();
        const stream = fs.createWriteStream(pdfPath);
        doc.pipe(stream);
        try {
        // Cabecera del PDF
        doc.image("assets/images/logo/logo_fm.png", 35, 20, { width: 70 });
        doc.image("assets/images/logo/fnqr.png", 450, 10, { width: 110});
        doc.fontSize(27).font("Helvetica-Bold").text("FARMACIA", 120, 40);
        doc.fontSize(15).text("San Juan de Dios", 127, 70);
        doc.moveDown(); // Espacio vertical

        doc.fontSize(13).font("Helvetica-Bold").text(title, 130,
            130);
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.rect(50, doc.y, 235, 30).stroke();
         // Escribir la fecha dentro del cuadro
        doc.fontSize(12).font("Helvetica-Bold").text(`Fecha de reporte: ${fecha}`, 55, doc.y + 10);
        doc.moveDown(); // Espacio vertical
      
        const mensaje = obtenerMensajeReporte();

        doc.fontSize(10).font("Helvetica").text(`${mensaje}`, { align: "justify" });
        doc.moveDown(); 
        doc.fontSize(13).font("Helvetica-Bold").text("Grafico de " + title, { align: "center" });
 
        doc.image(imagePath, { fit: [500, 400], align: 'center', valign: 'center' });

    } catch (error) {
        // Manejo de errores
        stream.on('error', (err) => {
            console.error('Error saving PDF:', err);
            res.status(500).send('Error saving PDF');
        });
      } finally {
        // Finalizar y enviar el PDF
        doc.end();
        stream.on('finish', () => {
            console.log('PDF saved successfully:', pdfPath);
            // Enviar la ruta del PDF en la respuesta para que el cliente pueda abrirlo en una nueva ventana
            res.json({ pdfUrl: `/reporte_generado/${shortTitle}_${year}_${timestamp}.pdf` });
        });
      }   
    });
});

// Servir los archivos estáticos de las carpetas 'graficos_reportes' y 'reporte_generado'
router.use('/graficos_reportes', express.static(path.join(__dirname, 'graficos_reportes')));
router.use('/reporte_generado', express.static(path.join(__dirname, 'reporte_generado')));

module.exports = router;
