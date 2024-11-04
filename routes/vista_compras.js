const express = require("express");
const router = express.Router();
const connection = require("../database/db"); // Asegúrate de que la ruta es correcta

// Ruta para renderizar la vista de finanzas
router.get("/vista_compras", (req, res) => {
  if (req.session.loggedin) {
    const { ID_Empleado, ID_Sucursal } = req.session;

    if (!ID_Sucursal) {
      return res.status(400).send("Sucursal no especificada en la sesión.");
    }

    res.render("./compras/vista_compras", {
      ID_Empleado,
      ID_Sucursal,
    });
  } else {
    res.render("./paginas/logout");
  }
});

// Función para obtener el número total de proveedores registrados
const ObtenerTotalProveedores = () => {
  return new Promise((resolve, reject) => {
    const sql = `
        SELECT COUNT(*) AS totalProveedores FROM proveedores;
      `;

    connection.query(sql, (err, results) => {
      if (err) return reject(err);
      resolve(results[0].totalProveedores);
    });
  });
};
// Función para obtener el número total de proveedores registrados
const ObtenerTotalProductos = () => {
  return new Promise((resolve, reject) => {
    const sql = `
        SELECT COUNT(*) AS totalproductos FROM productos;
      `;
    connection.query(sql, (err, results) => {
      if (err) return reject(err);
      resolve(results[0].totalproductos);
    });
  });
};
// Función para obtener las compras totales del mes actual
const ObtenerComprasDelMesActual = (ID_Sucursal) => {
  return new Promise((resolve, reject) => {
    const sql = `
        SELECT SUM(c.Total_Compra) AS ComprasDelMes
        FROM compras c
        WHERE c.ID_Sucursal = ? 
          AND MONTH(c.Fecha_Compra) = MONTH(CURRENT_DATE())
          AND YEAR(c.Fecha_Compra) = YEAR(CURRENT_DATE());
      `;

    connection.query(sql, [ID_Sucursal], (err, results) => {
      if (err) return reject(err);
      resolve(results[0].ComprasDelMes || 0);
    });
  });
};

// Ruta para obtener los datos en formato JSON
router.get("/datos3", async (req, res) => {
  if (req.session.loggedin) {
    const { ID_Sucursal } = req.session;

    if (!ID_Sucursal) {
      return res.status(400).send("Sucursal no especificada en la sesión.");
    }

    try {
      const [comprasmensual, proveedorestotales, productostotales] =
        await Promise.all([
          ObtenerComprasDelMesActual(ID_Sucursal),
          ObtenerTotalProveedores(ID_Sucursal),
          ObtenerTotalProductos(ID_Sucursal),
        ]);

      res.json({
        comprasmensual,
        proveedorestotales,
        productostotales,
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
