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

// Ruta para obtener los datos de ventas mensuales del último año
router.get('/ventas-mensuales-ultimo-ano', (req, res) => {
  // Calcular el año actual
  const fechaActual = new Date();
  const yearActual = fechaActual.getFullYear();

  // Consulta SQL para obtener las ventas mensuales del último año
  const sql = `SELECT MONTH(Fecha_Venta) AS Mes, SUM(Total_Venta) AS TotalMensual
               FROM ventas
               WHERE YEAR(Fecha_Venta) = ?
               GROUP BY MONTH(Fecha_Venta)
               ORDER BY MONTH(Fecha_Venta)`;

  // Ejecutar la consulta pasando el año actual como parámetro
  coneccion.query(sql, [yearActual], (error, results) => {
    if (error) {
      throw error;
    }

    // Procesar los resultados para generar los datos del gráfico
    const labels = results.map(row => row.Mes);
    const data = results.map(row => row.TotalMensual);

    // Enviar los datos como respuesta
    res.json({ labels, data });
  });
});
// Ruta para obtener las ventas por empleado en el año 2024
router.get('/ventas-por-empleado-2024', (req, res) => {
    // Consulta SQL para obtener las ventas por empleado en el año 2024
    const sql = `SELECT e.Nombre AS Empleado, SUM(v.Total_Venta) AS VentasTotales
                 FROM ventas v
                 INNER JOIN empleados e ON v.ID_Empleado = e.ID_Empleado
                 WHERE YEAR(v.Fecha_Venta) = 2024
                 GROUP BY e.Nombre`;
  
    // Ejecutar la consulta
    coneccion.query(sql, (error, results) => {
      if (error) {
        throw error;
      }
  
      // Procesar los resultados para obtener los datos del gráfico
      const labels = results.map(row => row.Empleado);
      const data = results.map(row => row.VentasTotales);
  
      // Enviar los datos como respuesta
      res.json({ labels, data });
    });
  });
  
// Ruta para obtener los datos de ventas mensuales del último año
router.get('/ventas-mensuales-ultimo-ano', (req, res) => {
    // Calcular el año actual
    const fechaActual = new Date();
    const yearActual = fechaActual.getFullYear();

    // Consulta SQL para obtener las ventas mensuales del último año
    const sql = `SELECT MONTH(Fecha_Venta) AS Mes, SUM(Total_Venta) AS TotalMensual
                 FROM ventas
                 WHERE YEAR(Fecha_Venta) = ?
                 GROUP BY MONTH(Fecha_Venta)
                 ORDER BY MONTH(Fecha_Venta)`;

    // Ejecutar la consulta pasando el año actual como parámetro
    coneccion.query(sql, [yearActual], (error, results) => {
        if (error) {
            throw error;
        }

        // Procesar los resultados para generar los datos del gráfico
        const labels = results.map(row => row.Mes);
        const data = results.map(row => row.TotalMensual);

        // Enviar los datos como respuesta
        res.json({ labels, data });
    });
});
// Ruta para obtener los datos de los productos más vendidos
router.get('/top-10-productos-vendidos', (req, res) => {
    // Consulta SQL para obtener los productos más vendidos
    const sql = `SELECT p.Nombre AS Producto, COUNT(*) AS TotalVentas
                 FROM detalles_venta d
                 INNER JOIN productos p ON d.ID_Producto = p.ID_Producto
                 GROUP BY p.Nombre
                 ORDER BY TotalVentas DESC
                 LIMIT 10`;

    // Ejecutar la consulta
    coneccion.query(sql, (error, results) => {
        if (error) {
            throw error;
        }

        // Procesar los resultados para generar los datos del gráfico
        const labels = results.map(row => row.Producto);
        const data = results.map(row => row.TotalVentas);

        // Enviar los datos como respuesta
        res.json({ labels, data });
    });
});
router.get('/datos', (req, res) => {
  // Consulta para obtener las ventas totales del mes
  coneccion.query('SELECT SUM(Total_Venta) AS VentasMes FROM ventas WHERE MONTH(Fecha_Venta) = MONTH(CURRENT_DATE()) AND YEAR(Fecha_Venta) = YEAR(CURRENT_DATE())', (err, results) => {
    if (err) throw err;
    const ventasMes = results[0].VentasMes;

    // Consulta para obtener las ventas totales de la semana
    coneccion.query('SELECT SUM(Total_Venta) AS VentasSemana FROM ventas WHERE YEARWEEK(Fecha_Venta) = YEARWEEK(CURRENT_DATE())', (err, results) => {
      if (err) throw err;
      const ventasSemana = results[0].VentasSemana;

      // Consulta para obtener el número total de clientes registrados este mes
      coneccion.query('SELECT COUNT(DISTINCT ID_Cliente) AS ClientesRegistradosMes FROM ventas WHERE MONTH(Fecha_Venta) = MONTH(CURRENT_DATE()) AND YEAR(Fecha_Venta) = YEAR(CURRENT_DATE())', (err, results) => {
        if (err) throw err;
        const clientesRegistradosMes = results[0].ClientesRegistradosMes;

        // Consulta para obtener el número total de clientes
        coneccion.query('SELECT COUNT(*) AS ClientesTotales FROM clientes', (err, results) => {
          if (err) throw err;
          const clientesTotales = results[0].ClientesTotales;

          // Consulta para obtener el total de compras realizadas este año
          coneccion.query('SELECT COUNT(*) AS ComprasTotales FROM compras WHERE YEAR(Fecha_Compra) = YEAR(CURRENT_DATE())', (err, results) => {
            if (err) throw err;
            const comprasTotales = results[0].ComprasTotales;

            // Consulta para obtener el número total de productos comprados este año
            coneccion.query('SELECT SUM(Cantidad_Empaque) AS ProductosComprados FROM detalles_compra WHERE YEAR(Fecha_Vencimiento) = YEAR(CURRENT_DATE())', (err, results) => {
              if (err) throw err;
              const productosComprados = results[0].ProductosComprados;

              // Enviar los datos al cliente
              res.json({ ventasMes, ventasSemana, clientesRegistradosMes, clientesTotales, comprasTotales, productosComprados });
            });
          });
        });
      });
    });
  });
});


router.get('/datos-compras', (req, res) => {
  // Consultas a la base de datos
  const sqlCompras = `
    SELECT MONTH(Fecha_Compra) AS Mes, SUM(Total_Compra) AS Total
    FROM compras
    WHERE YEAR(Fecha_Compra) = YEAR(CURDATE())
    GROUP BY MONTH(Fecha_Compra)
  `;
  const sqlDetalles = `
    SELECT MONTH(c.Fecha_Compra) AS Mes, COUNT(d.ID_Detalle_Compra) AS Detalles
    FROM compras c
    INNER JOIN detalles_compra d ON c.ID_Compra = d.ID_Compra
    WHERE YEAR(c.Fecha_Compra) = YEAR(CURDATE())
    GROUP BY MONTH(c.Fecha_Compra)
  `;
  const sqlProveedores = `
    SELECT MONTH(c.Fecha_Compra) AS Mes, COUNT(p.ID_Proveedor) AS Proveedores
    FROM compras c
    INNER JOIN proveedores p ON c.ID_Proveedor = p.ID_Proveedor
    WHERE YEAR(c.Fecha_Compra) = YEAR(CURDATE())
    GROUP BY MONTH(c.Fecha_Compra)
  `;

  // Ejecutar las consultas
  coneccion.query(sqlCompras, (error, comprasResults) => {
    if (error) throw error;

    coneccion.query(sqlDetalles, (error, detallesResults) => {
      if (error) throw error;

      coneccion.query(sqlProveedores, (error, proveedoresResults) => {
        if (error) throw error;

        // Enviar los resultados como JSON al cliente
        res.json({ compras: comprasResults, detalles: detallesResults, proveedores: proveedoresResults });
      });
    });
  });
});
// Ruta para obtener la lista de proveedores y la cantidad de productos comprados a cada uno
router.get('/proveedores-y-productos', (req, res) => {
  // Consulta SQL para obtener la lista de proveedores y la cantidad de productos comprados a cada uno
  const sqlQuery = `
    SELECT p.ID_Proveedor, p.Nombre, COUNT(dc.ID_Detalle_Compra) AS Cantidad_Productos
    FROM proveedores p
    LEFT JOIN compras c ON p.ID_Proveedor = c.ID_Proveedor
    LEFT JOIN detalles_compra dc ON c.ID_Compra = dc.ID_Compra
    GROUP BY p.ID_Proveedor
  `;

  // Ejecutar la consulta
  coneccion.query(sqlQuery, (err, results) => {
    if (err) {
      console.error('Error al ejecutar la consulta: ' + err.stack);
      res.status(500).json({ error: 'Error al obtener la lista de proveedores' });
      return;
    }

    // Enviar los resultados como respuesta en formato JSON
    res.json(results);
  });
});
module.exports = router;
