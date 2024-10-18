const express = require('express');
const router = express.Router();
const connection = require('../database/db'); // Asegúrate de que la ruta es correcta

// Ruta para renderizar la vista de finanzas
router.get('/vista_Finanzas', (req, res) => {
  const { ID_Empleado, ID_Sucursal } = req.session;
  
  if (!ID_Sucursal) {
    return res.status(400).send('Sucursal no especificada en la sesión.');
  }

  res.render('./finanzas/finanzas', {
    ID_Empleado,
    ID_Sucursal
  });
});

// Función para obtener el número total de cajas activas
const ObtenerCajas = (ID_Sucursal) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT COUNT(*) AS totalCajas FROM cajas WHERE ID_Sucursal = ? AND Estado = 1;
    `;

    connection.query(sql, [ID_Sucursal], (err, results) => {
      if (err) return reject(err);
      resolve(results[0].totalCajas);
    });
  });
};

// Función para obtener las ganancias del mes actual
const ObtenerGananciasDelMesActual = (ID_Sucursal) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT SUM(g.Ganancia_Total) AS GananciasDelMes
      FROM ganancias g
      JOIN detalles_venta dv ON g.ID_Detalle_Venta = dv.ID_Detalle_Venta
      JOIN ventas v ON dv.ID_Venta = v.ID_Venta
      WHERE v.ID_Sucursal = ? 
        AND MONTH(v.Fecha_Venta) = MONTH(CURRENT_DATE())
        AND YEAR(v.Fecha_Venta) = YEAR(CURRENT_DATE());
    `;

    connection.query(sql, [ID_Sucursal], (err, results) => {
      if (err) return reject(err);
      resolve(results[0].GananciasDelMes || 0);
    });
  });
};

// Ruta para obtener los datos en formato JSON
router.get('/datos2', async (req, res) => {
  const { ID_Sucursal } = req.session;

  if (!ID_Sucursal) {
    return res.status(400).send('Sucursal no especificada en la sesión.');
  }

  try {
    const [Cajastotales, GananciasDelMesActual] = await Promise.all([
      ObtenerCajas(ID_Sucursal),
      ObtenerGananciasDelMesActual(ID_Sucursal)
    ]);


    res.json({
      Cajastotales,
      GananciasDelMesActual
    });
  } catch (err) {
    console.error('Error al obtener los datos:', err);
    res.status(500).send('Error al obtener los datos');
  }
});

module.exports = router;
