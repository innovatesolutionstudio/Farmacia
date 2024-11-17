const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const bodyParser = require("body-parser");
const bwipjs = require("bwip-js"); 
const QRCode = require("qrcode"); 


const coneccion = require("../database/db");


router.get("/generador_codigo_producto", function (req, res) {
  /*if (req.session.loggedin) {*/
   
       
    res.render("./productos/generador_codigo");
   
  /*} else {
    res.render("./paginas/logout");
  }*/
});


router.get("/buscar_productos", (req, res) => {
    const { nombre } = req.query;
    const query = `SELECT ID_Producto, Nombre, Codigo FROM productos WHERE Nombre LIKE ? LIMIT 10`;
  
    coneccion.query(query, [`%${nombre}%`], (err, results) => {
      if (err) {
        console.error("Error al buscar productos:", err);
        res.status(500).json({ error: "Error al buscar productos" });
      } else {
        res.status(200).json(results);
      }
    });
  });
  router.post("/generar_codigo_producto", async (req, res) => {
    try {
      const { ID_Producto, cantidad } = req.body;
  
      if (!ID_Producto || !cantidad) {
        return res.status(400).json({ error: "Faltan datos requeridos." });
      }
  
      // Consultar los datos del producto
      const query = "SELECT Codigo, Nombre FROM productos WHERE ID_Producto = ?";
      coneccion.query(query, [ID_Producto], async (err, results) => {
        if (err) {
          console.error("Error al consultar el producto: ", err);
          return res.status(500).json({ error: "Error al consultar el producto." });
        }
  
        if (results.length === 0) {
          return res.status(404).json({ error: "Producto no encontrado." });
        }
  
        const producto = results[0];
        const { Codigo, Nombre } = producto;
  
        // Crear un PDF con ancho de 80mm (226 puntos)
        const doc = new PDFDocument({ size: [226, 400], margin: 10 });
        const buffers = [];
        doc.on("data", buffers.push.bind(buffers));
        doc.on("end", () => {
          const pdfData = Buffer.concat(buffers);
          res.setHeader("Content-Type", "application/pdf");
          res.setHeader(
            "Content-Disposition",
            `inline; filename="codigos_${Codigo}.pdf"`
          );
          res.send(pdfData);
        });
  
        let y = 10; // Coordenada inicial Y
        const x = 10; // Coordenada X inicial
        const spacing = 120; // Espacio entre cada etiqueta
        const pageHeight = 400 - 10; // Altura de la página menos margen
  
        for (let i = 0; i < cantidad; i++) {
          if (y + spacing > pageHeight) {
            doc.addPage(); // Añadir una nueva página si se supera el tamaño
            y = 10; // Reiniciar Y para la nueva página
          }
  
          // Añadir el nombre del producto
          doc.fontSize(10).text("Producto : " + Nombre, x, y, { align: "center", width: 200 });
  
          // Añadir el código de barras
          const barcodeBuffer = await new Promise((resolve, reject) => {
            bwipjs.toBuffer(
              {
                bcid: "code128",
                text: Codigo,
                scale: 2,
                height: 8,
                includetext: true,
                textxalign: "center",
              },
              (err, png) => {
                if (err) reject(err);
                else resolve(png);
              }
            );
          });
          doc.image(barcodeBuffer, x, y + 20, { width: 150, height: 50 });
  
          // Añadir el código QR
          const qrBuffer = await QRCode.toBuffer(Codigo);
          doc.image(qrBuffer, x + 140, y + 10, { width: 70, height: 70 });
  
          y += spacing; // Mover hacia abajo para la siguiente etiqueta
        }
  
        doc.end();
      });
    } catch (error) {
      console.error("Error al generar el PDF:", error);
      res.status(500).json({ error: "Error interno al generar el PDF." });
    }
  });
  
  

module.exports = router;
