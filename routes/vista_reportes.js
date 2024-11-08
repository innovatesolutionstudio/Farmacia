// Invocamos a express
const express = require("express");
const router = express.Router();

// Invocamos a la conexión de la base de datos
const connection = require("../database/db");

router.get("/vista_reportes", (req, res) => {
  if (req.session.loggedin) {
    res.render("./reportes/vista_reportes");
  } else {
    res.render("./paginas/logout");
  }
});

const ObtenerGananciasGestiones = (ID_Sucursal) => {
  return new Promise((resolve, reject) => {
    const sql = `
        SELECT YEAR(v.Fecha_Venta) AS Gestion, SUM(g.Ganancia_Total) AS Ganancias
        FROM ganancias g
        JOIN detalles_venta dv ON g.ID_Detalle_Venta = dv.ID_Detalle_Venta
        JOIN ventas v ON dv.ID_Venta = v.ID_Venta
        WHERE v.ID_Sucursal = ?
          AND YEAR(v.Fecha_Venta) >= YEAR(CURDATE()) - 3
        GROUP BY YEAR(v.Fecha_Venta)
        ORDER BY YEAR(v.Fecha_Venta) DESC
      `;

    connection.query(sql, [ID_Sucursal], (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

const ObtenerPacientes = (ID_Sucursal) => {
  return new Promise((resolve, reject) => {
    const sql = `
        SELECT tp.Nombre AS Tipo_Paciente, COUNT(dv.ID_Detalle_Venta) AS Cantidad_Consumo
        FROM detalles_venta dv
        JOIN productos p ON dv.ID_Producto = p.ID_Producto
        JOIN tipo_paciente tp ON p.ID_Tipo_Paciente = tp.ID_Tipo_Paciente
        JOIN ventas v ON dv.ID_Venta = v.ID_Venta
        WHERE v.ID_Sucursal = ?
        GROUP BY tp.Nombre
        ORDER BY Cantidad_Consumo DESC
        LIMIT 4
      `;

    connection.query(sql, [ID_Sucursal], (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

// Ruta para obtener los datos en formato JSON
router.get("/datosR", async (req, res) => {
  if (req.session.loggedin) {
    const { ID_Sucursal } = req.session;

    if (!ID_Sucursal) {
      return res.status(400).send("Sucursal no especificada en la sesión.");
    }

    try {
      const [Ganancias, pacientes] = await Promise.all([
        ObtenerGananciasGestiones(ID_Sucursal),
        ObtenerPacientes(ID_Sucursal),
      ]);

      res.json({
        Ganancias,
        pacientes,
      });
    } catch (err) {
      console.error("Error al obtener los datos:", err);
      res.status(500).send("Error al obtener los datos");
    }
  } else {
    res.render("./paginas/logout");
  }
});

module.exports = router;
