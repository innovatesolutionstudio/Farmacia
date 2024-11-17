// Invocamos a express
const express = require("express");
const router = express.Router();

// Invocamos a la conexión de la base de datos
const connection = require("../database/db");
const session = require("express-session");

router.get("/vista_pedidos", (req, res) => {
  if (req.session.loggedin) {
    res.render("./pedidos/vista_pedidos");
  } else {
    res.render("./paginas/logout");
  }
});

// Función para obtener las ventas de la semana actual
const obtenernotificaciones = (ID_Sucursal) => {
  return new Promise((resolve, reject) => {
    const sql = `
        SELECT COUNT(*) AS totalNotificaciones 
        FROM pedidos p
        INNER JOIN ventas v ON p.ID_Venta = v.ID_Venta
        WHERE p.Estado = 1 AND v.ID_Sucursal = ?;
        `;

    connection.query(sql, [ID_Sucursal], (err, results) => {
      if (err) return reject(err);
      resolve(results[0].totalNotificaciones);
    });
  });
};

// Función para obtener el total de productos en el inventario
const ObtenerTotalPedidos = (ID_Sucursal) => {
  return new Promise((resolve, reject) => {
    const sql = `
        SELECT COUNT(*) AS totalPedidosMesActual
        FROM pedidos p
        INNER JOIN ventas v ON p.ID_Venta = v.ID_Venta
        WHERE MONTH(v.Fecha_Venta) = MONTH(CURDATE())
        AND YEAR(v.Fecha_Venta) = YEAR(CURDATE())
        AND v.ID_Sucursal = ?;

      `;
    connection.query(sql, [ID_Sucursal], (err, results) => {
      if (err) return reject(err);
      resolve(results[0].totalPedidosMesActual);
    });
  });
};


// Ruta para obtener los datos en formato JSON
router.get("/datospedidos", async (req, res) => {
  if (req.session.loggedin) {
    const { ID_Sucursal } = req.session;

    if (!ID_Sucursal) {
      return res.status(400).send("Sucursal no especificada en la sesión.");
    }

    try {
      const [totalNotificaciones, totalPedidosMesActual] = await Promise.all([
        obtenernotificaciones(ID_Sucursal),
        ObtenerTotalPedidos(ID_Sucursal)
      ]);

      res.json({
        totalNotificaciones,
        totalPedidosMesActual
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
