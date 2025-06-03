const express = require("express");
const router = express.Router();
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const conexion = require("../database/db");


function formatearFechaLarga(fechaISO) {
  const f = new Date(fechaISO);
  return f.toLocaleDateString("es-BO", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}


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

router.get("/reporte_panel/:idArea", async (req, res) => {
  const idArea = req.params.idArea;
  const doc = new PDFDocument({ margin: 40 });
  const fileName = `Reporte_Panel_${idArea}_${Date.now()}.pdf`;
  const filePath = path.join(__dirname, `../impresiones/${fileName}`);
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);
  const fecha = obtenerFechaActual();


  try {
    // Cabecera del PDF
    doc.image("assets/images/logo/logo_fm.png", 35, 20, { width: 70 });
    doc.image("assets/images/logo/fnqr.png", 450, 10, { width: 110 });
    doc.fontSize(27).font("Helvetica-Bold").text("FARMACIA", 120, 40);
    doc.fontSize(15).text("San Juan de Dios", 127, 70);
    doc.moveDown(); // Espacio vertical

    // Título del reporte
    doc.fontSize(13).font("Helvetica-Bold").text(
      `CLAVES ESTRATIGICAS PARA EL CRECIMIENTO`,
      100,
      130 // Alineado a la izquierda
    );
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.rect(50, doc.y, 235, 30).stroke();

    // Escribir la fecha dentro del cuadro
    doc.fontSize(12).font("Helvetica-Bold").text(`Fecha de reporte: ${fecha}`, 60, doc.y + 10);


    const [area] = await new Promise((resolve, reject) => {
      conexion.query("SELECT * FROM area_objetivo WHERE ID_Area_objetivo = ?", [idArea], (err, result) =>
        err ? reject(err) : resolve(result)
      );
    });


    doc.moveDown().fontSize(15).text(`PLAN DE ACCION PARA - ${area.Nombre}`, { align: "center" });
    const fechaInicio = formatearFechaLarga(area.Fecha_Inicio);
    const fechaFin = formatearFechaLarga(area.Fecha_Fin);

    doc.font("Helvetica-Bold").fontSize(10).text(
      `Fecha de inicio: ${fechaInicio} — Fecha de finalización: ${fechaFin}`,
      { align: "center" }
    );
    doc.moveDown(1);
    doc.fontSize(10).font("Helvetica").text(
      "El presente reporte consolida los objetivos estratégicos que se desarrollarán durante este periodo con el fin de impulsar el crecimiento. Cada uno de los indicadores definidos representa un compromiso colectivo para mejorar procesos, alcanzar metas y aportar al desarrollo continuo de la organización.",
      { align: "justify" }
    );

    // ─── OBJETIVOS Y KPIS ─────────────────────────────────
    const objetivos = await new Promise((resolve, reject) => {
      const query = `
        SELECT o.Objetivo, k.KPI, k.Valor, k.Palanca_Inductor_Proceso, k.Iniciativa_Estrategica
        FROM objetivo o
        LEFT JOIN objetivos_kpi k ON o.ID_Objetivo = k.ID_Objetivo
        WHERE o.ID_Area_objetivo = ?
        ORDER BY o.ID_Objetivo
      `;
      conexion.query(query, [idArea], (err, result) => err ? reject(err) : resolve(result));
    });

    const objetivosAgrupados = {};
    objetivos.forEach(row => {
      if (!objetivosAgrupados[row.Objetivo]) {
        objetivosAgrupados[row.Objetivo] = [];
      }
      objetivosAgrupados[row.Objetivo].push(row);
    });

    let currentY = doc.y + 30;

    for (const [objetivo, kpis] of Object.entries(objetivosAgrupados)) {
      doc.font("Helvetica-Bold").fontSize(10).text("Objetivo:", 50, currentY);
      currentY = doc.y + 5;

      doc.font("Helvetica").fontSize(9).text(objetivo, {
        width: 500,
        align: "left"
      });

      currentY = doc.y + 10;

      const colWidths = [160, 40, 40, 120, 120];
      const headers = ["Indicador", "%", "Sem", "Inductor", "Acción"];
      headers.forEach((h, i) => {
        const x = 50 + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
        doc.rect(x, currentY, colWidths[i], 20).stroke();
        doc.font("Helvetica-Bold").fontSize(8).text(h, x + 4, currentY + 6);
      });

      currentY += 20;

      kpis.forEach(row => {
        const color = row.Valor >= 70 ? "green" : row.Valor >= 50 ? "orange" : "red";

        const fila = [
          row.KPI || "-",
          row.Valor != null ? row.Valor.toString() : "0",
          "", // semáforo
          row.Palanca_Inductor_Proceso || "-",
          row.Iniciativa_Estrategica || "-"
        ];

        fila.forEach((texto, i) => {
          const x = 50 + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
          doc.rect(x, currentY, colWidths[i], 30).stroke();

          if (i === 2) {
            doc.circle(x + colWidths[i] / 2, currentY + 15, 5).fill(color).stroke();
          } else {
            doc.font("Helvetica").fontSize(8).fillColor("black")
              .text(texto, x + 2, currentY + 10, { width: colWidths[i] - 4 });
          }
        });

        currentY += 30;
        if (currentY > 720) {
          doc.addPage();
          currentY = 50;
        }
      });

      currentY += 20;
    }

    // ─── PERSONAL ASIGNADO ────────────────────────────────
    const equipo = await new Promise((resolve, reject) => {
      const sql = `
        SELECT e.ID_Empleado, e.Nombre, e.Apellido, r.Nombre AS Rol
        FROM equipo_objetivo eo
        JOIN empleados e ON eo.ID_Empleado = e.ID_Empleado
        LEFT JOIN roles r ON r.ID_Rol = e.ID_Rol
        WHERE eo.ID_Area_objetivo = ?
      `;
      conexion.query(sql, [idArea], (err, result) => err ? reject(err) : resolve(result));
    });

    doc.addPage();
    doc.font("Helvetica-Bold").fontSize(12).text("Personal implicado a completar estos objetivos:", { align: "center" });
    doc.moveDown(1);
    doc.fontSize(10).font("Helvetica").text(
      "A continuación se presenta el listado del personal asignado. Si su nombre figura en esta tabla, usted forma parte activa del equipo responsable de contribuir al cumplimiento de los objetivos establecidos en este reporte.",
      { align: "justify" }
    );
    doc.moveDown(1);

    const headers2 = ["ID", "Nombre", "Apellido", "Rol"];
    const colW2 = [50, 150, 150, 150];
    let y2 = doc.y;

    headers2.forEach((h, i) => {
      const x = 50 + colW2.slice(0, i).reduce((a, b) => a + b, 0);
      doc.rect(x, y2, colW2[i], 20).stroke();
      doc.font("Helvetica-Bold").fontSize(10).text(h, x + 4, y2 + 6);
    });

    y2 += 20;

    equipo.forEach(p => {
      const fila = [p.ID_Empleado, p.Nombre, p.Apellido, p.Rol || "Sin Rol"];
      fila.forEach((txt, i) => {
        const x = 50 + colW2.slice(0, i).reduce((a, b) => a + b, 0);
        doc.rect(x, y2, colW2[i], 20).stroke();
        doc.font("Helvetica").fontSize(10).text(txt, x + 4, y2 + 6);
      });
      y2 += 20;
    });

  } catch (err) {
    console.error("Error al generar PDF:", err);
    doc.text("Error interno al generar el reporte.");
  } finally {
    doc.end();
    stream.on("finish", () => {
      res.redirect(`/impre/${path.basename(filePath)}`);
    });
  }
});

module.exports = router;
