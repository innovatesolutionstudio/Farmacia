// Invocamos a express
const express = require('express');
const router = express.Router();

// Invocamos a la conexión de la BD
const conexion = require('../database/db');
// Ya no necesitas Chart.js en el backend a menos que generes gráficos del lado del servidor
// const Chart = require('chart.js');

// Ruta para obtener los datos de ventas anuales
router.get('/graficos', (req, res) => {
  const { ID_Empleado, ID_Sucursal } = req.session;

  if (!ID_Sucursal) {
    return res.status(400).send('Sucursal no especificada en la sesión.');
  }

  // Consulta SQL para obtener las ventas totales por año filtradas por sucursal
  const sql = `
    SELECT YEAR(Fecha_Venta) AS Anio, SUM(Total_Venta) AS TotalAnual
    FROM ventas
    WHERE ID_Sucursal = ?
    GROUP BY YEAR(Fecha_Venta)
    ORDER BY YEAR(Fecha_Venta)
  `;

  // Ejecutar la consulta con parámetros
  conexion.query(sql, [ID_Sucursal], (error, results) => {
    if (error) {
      console.error('Error en la consulta de ventas anuales:', error);
      return res.status(500).send('Error al obtener los datos de ventas anuales.');
    }

    // Procesar los resultados para generar los datos del gráfico
    const labels = results.map(row => row.Anio);
    const data = results.map(row => row.TotalAnual);

    // Renderizar la plantilla HTML con el gráfico de ventas anuales
    res.render('./graficos/graficos', { 
      ID_Empleado,
      ID_Sucursal,
      labels, 
      data 
    });
  });
});

// Definir una función para cada consulta filtrada por sucursal
const obtenerVentasMes = (ID_Sucursal) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT IFNULL(SUM(Total_Venta), 0) AS VentasMes 
      FROM ventas 
      WHERE MONTH(Fecha_Venta) = MONTH(CURRENT_DATE()) 
        AND YEAR(Fecha_Venta) = YEAR(CURRENT_DATE())
        AND ID_Sucursal = ?
    `;
    conexion.query(sql, [ID_Sucursal], (err, results) => {
      if (err) return reject(err);
      resolve(results[0].VentasMes);
    });
  });
};

const obtenerVentasSemana = (ID_Sucursal) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT COUNT(*) AS VentasSemana 
      FROM ventas 
      WHERE YEARWEEK(Fecha_Venta) = YEARWEEK(CURRENT_DATE())
        AND ID_Sucursal = ?
    `;
    conexion.query(sql, [ID_Sucursal], (err, results) => {
      if (err) return reject(err);
      resolve(results[0].VentasSemana);
    });
  });
};

const obtenerVentasMestotales = (ID_Sucursal) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT COUNT(*) AS VentasMes 
      FROM ventas 
      WHERE MONTH(Fecha_Venta) = MONTH(CURRENT_DATE()) 
        AND YEAR(Fecha_Venta) = YEAR(CURRENT_DATE())
        AND ID_Sucursal = ?
    `;
    conexion.query(sql, [ID_Sucursal], (err, results) => {
      if (err) return reject(err);
      resolve(results[0].VentasMes);
    });
  });
};

const obtenerClientesRegistradosMes = (ID_Sucursal) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT COUNT(DISTINCT ID_Cliente) AS ClientesRegistradosMes 
      FROM ventas 
      WHERE MONTH(Fecha_Venta) = MONTH(CURRENT_DATE()) 
        AND YEAR(Fecha_Venta) = YEAR(CURRENT_DATE())
        AND ID_Sucursal = ?
    `;
    conexion.query(sql, [ID_Sucursal], (err, results) => {
      if (err) return reject(err);
      resolve(results[0].ClientesRegistradosMes);
    });
  });
};

const obtenerMedicamentosPorAcabarse = (ID_Sucursal) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT COUNT(*) AS MedicamentosPorAcabarse 
      FROM inventario 
      WHERE Cantidad < 5 
        AND ID_Sucursal = ?
    `;
    conexion.query(sql, [ID_Sucursal], (err, results) => {
      if (err) return reject(err);
      resolve(results[0].MedicamentosPorAcabarse);
    });
  });
};

const obtenerProductoMasVendidos = (ID_Sucursal) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT p.Nombre
      FROM detalles_venta dv
      JOIN inventario i ON dv.ID_Producto = i.ID_Producto
      JOIN productos p ON i.ID_Producto = p.ID_Producto
      JOIN ventas v ON dv.ID_Venta = v.ID_Venta
      WHERE YEAR(v.Fecha_Venta) = YEAR(CURDATE())
        AND v.ID_Sucursal = ?
      GROUP BY p.Nombre
      ORDER BY SUM(dv.Cantidad) DESC
      LIMIT 1
    `;
    conexion.query(sql, [ID_Sucursal], (err, results) => {
      if (err) return reject(err);
      resolve(results[0] ? results[0].Nombre : null); // Devolver null si no hay resultados
    });
  });
};
const obtenerTotalProductosVendidosMesSucursalS = (ID_Sucursal) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT SUM(dv.Cantidad) AS TotalProductosVendidos
      FROM detalles_venta dv
      JOIN ventas v ON dv.ID_Venta = v.ID_Venta
      WHERE MONTH(v.Fecha_Venta) = MONTH(CURDATE())
        AND YEAR(v.Fecha_Venta) = YEAR(CURDATE())
        AND v.ID_Sucursal = ?
    `;
    conexion.query(sql, [ID_Sucursal], (err, results) => {
      if (err) return reject(err);
      resolve(results[0] ? results[0].TotalProductosVendidos : 0); // Devolver 0 si no hay resultados
    });
  });
};

const obtenerCantidadTotalInventarioS = (ID_Sucursal) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT SUM(Cantidad) AS TotalProductosInventario
      FROM inventario
      WHERE ID_Sucursal = ?
    `;
    conexion.query(sql, [ID_Sucursal], (err, results) => {
      if (err) return reject(err);
      resolve(results[0] ? results[0].TotalProductosInventario : 0); // Devolver 0 si no hay resultados
    });
  });
};


const obtenerProveedorMasCompradoS = (ID_Sucursal) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT p.Nombre
      FROM compras c
      JOIN proveedores p ON c.ID_Proveedor = p.ID_Proveedor
      GROUP BY p.ID_Proveedor
      ORDER BY COUNT(c.ID_Compra) DESC
      LIMIT 1
    `;
    conexion.query(sql, [ID_Sucursal], (err, results) => {
      if (err) return reject(err);
      resolve(results[0] ? results[0].Nombre : null); // Devolver null si no hay resultados
    });
  });
};



const obtenerVentasDelMesGraficoM = (ID_Sucursal) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        DATE(Fecha_Venta) AS Fecha,
        DAY(Fecha_Venta) AS Dia,
        SUM(Total_Venta) AS Total_Venta,
        COUNT(DISTINCT ID_Cliente) AS Clientes
      FROM ventas
      WHERE MONTH(Fecha_Venta) = MONTH(CURRENT_DATE()) 
        AND YEAR(Fecha_Venta) = YEAR(CURRENT_DATE())
        AND ID_Sucursal = ?
      GROUP BY DATE(Fecha_Venta), DAY(Fecha_Venta)
      ORDER BY Fecha;
    `;
    
    conexion.query(sql, [ID_Sucursal], (err, results) => {
      if (err) return reject(err);
      // Verificar si hay resultados
      if (results.length === 0) {
        return resolve([]); // Devolver un arreglo vacío si no hay resultados
      }
      resolve(results);
    });
  });
};
const obtenerDetallesComprasMes = (ID_Sucursal) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        Fecha_Compra AS Fecha, 
        DAYOFWEEK(Fecha_Compra) - 1 AS Dia, -- Esto te da el número del día de la semana
        Total_Compra
      FROM compras
      WHERE MONTH(Fecha_Compra) = MONTH(CURRENT_DATE())
        AND YEAR(Fecha_Compra) = YEAR(CURRENT_DATE())
        AND ID_Sucursal = ?;
    `;

    conexion.query(sql, [ID_Sucursal], (err, results) => {
      if (err) return reject(err);

      resolve(results); // Devolver todas las compras del mes
    });
  });
};

const ObtenerTablaInventario = (ID_Sucursal) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT p.Nombre, i.Cantidad
      FROM inventario i
      JOIN productos p ON i.ID_Producto = p.ID_Producto
      WHERE i.Cantidad < 5 
      AND i.ID_Sucursal = ?;
    `;

    conexion.query(sql, [ID_Sucursal], (err, results) => {
      if (err) return reject(err);

      resolve(results); // Devolver los productos con menos de 5 unidades
    });
  });
};




router.get('/datos', async (req, res) => {
  const { ID_Sucursal } = req.session;

  if (!ID_Sucursal) {
    return res.status(400).send('Sucursal no especificada en la sesión.');
  }

  try {
    // Ejecutar todas las consultas de forma independiente
    const [
     
      ventasMes,
      ventasSemana,
      clientesRegistradosMes,
      medicamentosapuntovencer,
      obtenerVentasMest,
      obtenerProductoMasVendido,
      obtenerTotalProductosVendidosMesSucursal,
      obtenerCantidadTotalInventario,
      comprasMestabla,
      obtenerProveedorMasComprado,
      ventasMesGrafico,
      ObtenerTablaInventarios
    ] = await Promise.all([
      
      obtenerVentasMes(ID_Sucursal),
      obtenerVentasSemana(ID_Sucursal),
      obtenerClientesRegistradosMes(ID_Sucursal),
      obtenerMedicamentosPorAcabarse(ID_Sucursal),
      obtenerVentasMestotales(ID_Sucursal),
      obtenerProductoMasVendidos(ID_Sucursal),
      obtenerTotalProductosVendidosMesSucursalS(ID_Sucursal),
      obtenerCantidadTotalInventarioS(ID_Sucursal),
      obtenerDetallesComprasMes(ID_Sucursal),
      obtenerProveedorMasCompradoS(ID_Sucursal),
      obtenerVentasDelMesGraficoM(ID_Sucursal),
      ObtenerTablaInventario(ID_Sucursal)
    ]);

    // Enviar los datos al cliente
    res.json({
    //
      ventasMes,
      ventasSemana,
      clientesRegistradosMes,
      medicamentosapuntovencer,
      obtenerVentasMest,
      obtenerProductoMasVendido,
      obtenerTotalProductosVendidosMesSucursal,
      obtenerCantidadTotalInventario,
      comprasMestabla,
      obtenerProveedorMasComprado,
      ventasMesGrafico,
      ObtenerTablaInventarios
    });
  } catch (err) {
    console.error('Error al obtener los datos:', err);
    // Manejar errores
    res.status(500).send('Error al obtener los datos');
  }
});



module.exports = router;
