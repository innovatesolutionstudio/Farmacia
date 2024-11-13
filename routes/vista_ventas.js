// Invocamos a express
const express = require("express");
const router = express.Router();

// Invocamos a la conexión de la base de datos
const connection = require("../database/db");
const session = require("express-session");

router.get("/vista_ventas", (req, res) => {
  if (req.session.loggedin) {
    res.render("./ventas/vista_ventas");
  } else {
    res.render("./paginas/logout");
  }
});

// Función para obtener las ventas de la semana actual
const ObtenerVentasSemana = (ID_Sucursal) => {
  return new Promise((resolve, reject) => {
    const sql = `
        SELECT IFNULL(SUM(Total_Venta), 0) AS totalVentasSemana
        FROM ventas
        WHERE ID_Sucursal = ? 
          AND WEEK(Fecha_Venta) = WEEK(CURRENT_DATE())
          AND YEAR(Fecha_Venta) = YEAR(CURRENT_DATE())
      `;

    connection.query(sql, [ID_Sucursal], (err, results) => {
      if (err) return reject(err);
      resolve(results[0].totalVentasSemana);
    });
  });
};

// Función para obtener el total de productos en el inventario
const ObtenerTotalProductos = (ID_Sucursal) => {
  return new Promise((resolve, reject) => {
    const sql = `
        SELECT COUNT(*) AS totalproductos FROM inventario WHERE ID_Sucursal = ?;
      `;
    connection.query(sql, [ID_Sucursal], (err, results) => {
      if (err) return reject(err);
      resolve(results[0].totalproductos);
    });
  });
};

// Función para obtener las ventas del mes actual
const ObtenerVentasDelMesActual = (ID_Sucursal) => {
  return new Promise((resolve, reject) => {
    const sql = `
        SELECT IFNULL(SUM(Total_Venta), 0) AS VentasMes
        FROM ventas
        WHERE ID_Sucursal = ? 
          AND MONTH(Fecha_Venta) = MONTH(CURRENT_DATE())
          AND YEAR(Fecha_Venta) = YEAR(CURRENT_DATE())
      `;

    connection.query(sql, [ID_Sucursal], (err, results) => {
      if (err) return reject(err);
      resolve(results[0].VentasMes);
    });
  });
};

// Ruta para obtener los datos en formato JSON
router.get("/datosventas", async (req, res) => {
  if (req.session.loggedin) {
    const { ID_Sucursal } = req.session;

    if (!ID_Sucursal) {
      return res.status(400).send("Sucursal no especificada en la sesión.");
    }

    try {
      const [VentasSemana, ProductosInventario, VentasMes] = await Promise.all([
        ObtenerVentasSemana(ID_Sucursal),
        ObtenerTotalProductos(ID_Sucursal),
        ObtenerVentasDelMesActual(ID_Sucursal),
      ]);

      res.json({
        VentasSemana,
        ProductosInventario,
        VentasMes,
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
