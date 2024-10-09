//invocamos a express
const express = require('express');
const router = express.Router();

//invocamos ala coneccion de la bd
const coneccion = require('../database/db');
const Chart = require('chart.js');

// Ruta para obtener los datos de ventas anuales
router.get('/graficos', (req, res) => {
  // Consulta SQL para obtener las ventas totales por año
  const sql = `SELECT YEAR(Fecha_Venta) AS Anio, SUM(Total_Venta) AS TotalAnual
               FROM ventas
               GROUP BY YEAR(Fecha_Venta)
               ORDER BY YEAR(Fecha_Venta)`;

  // Ejecutar la consulta
  coneccion.query(sql, (error, results) => {
    if (error) {
      throw error;
    }

    // Procesar los resultados para generar los datos del gráfico
    const labels = results.map(row => row.Anio);
    const data = results.map(row => row.TotalAnual);

    // Renderizar la plantilla HTML con el gráfico de ventas anuales
    res.render('./graficos/graficos', { labels, data });
  });
});



// Definir una función para cada consulta
const obtenerVentasMes = () => {
  return new Promise((resolve, reject) => {
    coneccion.query(
      'SELECT IFNULL(SUM(Total_Venta), 0) AS VentasMes FROM ventas WHERE MONTH(Fecha_Venta) = MONTH(CURRENT_DATE()) AND YEAR(Fecha_Venta) = YEAR(CURRENT_DATE())',
      (err, results) => {
        if (err) return reject(err);
        resolve(results[0].VentasMes);
      }
    );
  });
};

const obtenerVentasSemana = () => {
  return new Promise((resolve, reject) => {
    coneccion.query(
      'SELECT COUNT(*) AS VentasSemana FROM ventas WHERE YEARWEEK(Fecha_Venta) = YEARWEEK(CURRENT_DATE())',
      (err, results) => {
        if (err) return reject(err);
        resolve(results[0].VentasSemana);
      }
    );
  });
};

const obtenerVentasMestotales = () => {
  return new Promise((resolve, reject) => {
    coneccion.query(
      'SELECT COUNT(*) AS VentasMes FROM ventas WHERE MONTH(Fecha_Venta) = MONTH(CURRENT_DATE()) AND YEAR(Fecha_Venta) = YEAR(CURRENT_DATE())',
      (err, results) => {
        if (err) return reject(err);
        resolve(results[0].VentasMes);
      }
    );
  });
};


const obtenerClientesRegistradosMes = () => {
  return new Promise((resolve, reject) => {
    coneccion.query(
      'SELECT COUNT(DISTINCT ID_Cliente) AS ClientesRegistradosMes FROM ventas WHERE MONTH(Fecha_Venta) = MONTH(CURRENT_DATE()) AND YEAR(Fecha_Venta) = YEAR(CURRENT_DATE())',
      (err, results) => {
        if (err) return reject(err);
        resolve(results[0].ClientesRegistradosMes);
      }
    );
  });
};

const obtenerMedicamentosPorAcabarse = () => {
  return new Promise((resolve, reject) => {
    coneccion.query(
      'SELECT COUNT(*) AS MedicamentosPorAcabarse FROM inventario WHERE Cantidad < 5',
      (err, results) => {
        if (err) return reject(err);
        resolve(results[0].MedicamentosPorAcabarse);
      }
    );
  });
};

const obtenerProductoMasVendidos = () => {
  return new Promise((resolve, reject) => {
    coneccion.query(
      `SELECT p.Nombre
      FROM detalles_venta dv
      JOIN inventario i ON dv.ID_Producto = i.ID_Producto
      JOIN productos p ON i.ID_Producto = p.ID_Producto
      JOIN ventas v ON dv.ID_Venta = v.ID_Venta
      WHERE YEAR(v.Fecha_Venta) = YEAR(CURDATE())
      GROUP BY p.Nombre
      ORDER BY SUM(dv.Cantidad) DESC
      LIMIT 1;`,
      (err, results) => {
        if (err) return reject(err);
        resolve(results[0] ? results[0].Nombre : null); // Devolver null si no hay resultados
      }
    );
  });
};


// Crear la ruta utilizando async/await
router.get('/datos', async (req, res) => {
  try {
    // Ejecutar todas las consultas de forma independiente
    const ventasMes = await obtenerVentasMes();
    const ventasSemana = await obtenerVentasSemana();
    const clientesRegistradosMes = await obtenerClientesRegistradosMes();
    const medicamentosapuntovencer = await obtenerMedicamentosPorAcabarse();
    const obtenerVentasMest = await obtenerVentasMestotales();
    const obtenerProductoMasVendido = await obtenerProductoMasVendidos();


    // Enviar los datos al cliente
    res.json({
      ventasMes,
      ventasSemana,
      clientesRegistradosMes,
      medicamentosapuntovencer,
      obtenerVentasMest,
      obtenerProductoMasVendido
   
    });
  } catch (err) {
    // Manejar errores
    res.status(500).send('Error al obtener los datos');
  }
});



module.exports = router;
