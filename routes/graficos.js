// Invocamos a express
const express = require("express");
const router = express.Router();

// Invocamos a la conexión de la BD
const conexion = require("../database/db");
// Ya no necesitas Chart.js en el backend a menos que generes gráficos del lado del servidor
// const Chart = require('chart.js');

// Ruta para obtener los datos de ventas anuales
router.get("/graficos", (req, res) => {

  if (req.session.loggedin) {
    const { ID_Empleado, ID_Sucursal } = req.session;

    if (!ID_Sucursal) {
      return res.status(400).send("Sucursal no especificada en la sesión.");
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
        console.error("Error en la consulta de ventas anuales:", error);
        return res
          .status(500)
          .send("Error al obtener los datos de ventas anuales.");
      }

      // Procesar los resultados para generar los datos del gráfico
      const labels = results.map((row) => row.Anio);
      const data = results.map((row) => row.TotalAnual);

      // Renderizar la plantilla HTML con el gráfico de ventas anuales
      res.render("./graficos/graficos", {
        ID_Empleado,
        ID_Sucursal,
        labels,
        data,
      });
    });
  } else {
    res.render("./paginas/logout");
  }
});

// funcion de consulta para hacer la consulta y recuperar datos de - el numero total ventas del mes en dinero metrica 1
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

// funcion de consulta para hacer la consulta y recuperar datos de - el numero total de clientes registrados en el mes - metrica 2
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

// funcion de consulta para hacer la consulta y recuperar datos de - el numero ventas de la semana metrica 3
const obtenerComprasMes = (ID_Sucursal) => {
  return new Promise((resolve, reject) => {
    const sql = `
    SELECT COUNT(*) AS ComprasMesActual
    FROM compras
    WHERE MONTH(Fecha_Compra) = MONTH(CURRENT_DATE())
    AND YEAR(Fecha_Compra) = YEAR(CURRENT_DATE())
    AND ID_Sucursal = ?

    `;
    conexion.query(sql, [ID_Sucursal], (err, results) => {
      if (err) return reject(err);
      resolve(results[0].ComprasMesActual);
    });
  });
};

// funcion de consulta para hacer la consulta y recuperar datos de - numero de medicamnetos apuntos de vencerse- metrica 4
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

// funcion de consulta para hacer la consulta y recuperar datos de - el numero de ventas del mes metrica 5
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

// funcion de consulta para hacer la consulta y recuperar datos de - obtener el producto mas vendido del mes - metrica 6
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

// funcion de consulta para hacer la consulta y recuperar datos de - total de productos vendidos en el mes metrica 7
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

// funcion de consulta para hacer la consulta y recuperar datos de - el numero total de productos en el inventario metrica 8
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

// funcion de consulta para hacer la consulta y recuperar datos de - el numero total de pedidos en el mes metrica 9
const obtenerTotalPedidosMesActual = (ID_Sucursal) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT COUNT(p.ID_Pedido) AS TotalPedidosMes
      FROM pedidos p
      JOIN ventas v ON p.ID_Venta = v.ID_Venta
      WHERE MONTH(p.Fecha_Entrega) = MONTH(NOW())
        AND YEAR(p.Fecha_Entrega) = YEAR(NOW())
        AND v.ID_Sucursal = ?
    `;
    conexion.query(sql, [ID_Sucursal], (err, results) => {
      if (err) return reject(err);
      resolve(results[0] ? results[0].TotalPedidosMes : 0); // Devuelve 0 si no hay resultados
    });
  });
};


// funcion de consulta para hacer la consulta y recuperar datos de - el numero total de pedidos con el estado pendiente - metrica 10
const obtenerTotalPedidosEstado1 = (ID_Sucursal) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT COUNT(p.ID_Pedido) AS TotalPedidosEstado1
      FROM pedidos p
      JOIN ventas v ON p.ID_Venta = v.ID_Venta
      WHERE p.Estado = 1
        AND v.ID_Sucursal = ?
    `;
    conexion.query(sql, [ID_Sucursal], (err, results) => {
      if (err) return reject(err);
      resolve(results[0] ? results[0].TotalPedidosEstado1 : 0); // Devuelve 0 si no hay resultados
    });
  });
};



// funcion de consulta para hacer la consulta y recuperar datos de - el numero totak de compras de la gestion actual - metrica 11
const obtenerTotalCompras = (ID_Sucursal) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT SUM(Total_Compra) as total FROM compras WHERE MONTH(Fecha_Compra) = MONTH(CURRENT_DATE())
        AND YEAR(Fecha_Compra) = YEAR(CURRENT_DATE())
        AND ID_Sucursal = ?
    `;

    conexion.query(sql, [ID_Sucursal], (err, results) => {
      if (err) return reject(err);

      // Asegúrate de que el resultado tenga un valor antes de resolver
      resolve(results[0] ? results[0].total : 0); // Asignar 0 si no hay resultados
    });
  });
};

// funcion de consulta para hacer la consulta y recuperar datos de - el nombre del proveedor mas comprado - metrica 12
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

// funcion de consulta para hacer la consulta y recuperar datos de - tabla 1- ventas del mes
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

// funcion de consulta para hacer la consulta y recuperar datos de - tabla  3-  las compras del mes
const obtenerDetallesComprasMes = (ID_Sucursal) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        Fecha_Compra AS Fecha, 
        DAYOFWEEK(Fecha_Compra) - 1 AS Dia,
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

// funcion de consulta para hacer la consulta y recuperar datos de - tabla 4 - obtener los medicamentos a punto de acabar
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

// funcion de consulta para hacer la consulta y recuperar datos de - grafico ventas - obtener las ventas por mes
const obtenerVentasMesActual = (ID_Sucursal) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        ELT(MONTH(Fecha_Venta), 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre') AS Mes,
        YEAR(Fecha_Venta) AS Anio,
        SUM(Total_Venta) AS Total_Venta,
        MONTH(Fecha_Venta) AS MesNumero
      FROM 
        ventas
      WHERE 
        YEAR(Fecha_Venta) = YEAR(NOW()) 
        AND ID_Sucursal = ?
      GROUP BY 
        Mes, Anio, MesNumero
      ORDER BY 
        MesNumero;
    `;

    conexion.query(sql, [ID_Sucursal], (err, results) => {
      if (err) return reject(err);

      resolve(results.length ? results : []); // Devuelve un array vacío si no hay resultados
    });
  });
};


// funcion de consulta para hacer la consulta y recuperar datos de - grafico productos - obtener los el numero de productos vendidos
const obtenerProductosVendidosMes = (ID_Sucursal) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        MONTH(v.Fecha_Venta) AS MesNumero,
        ELT(MONTH(v.Fecha_Venta), 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre') AS Mes,
        SUM(dv.Cantidad) AS Total_Productos_Vendidos
      FROM 
        detalles_venta dv
      JOIN 
        ventas v ON dv.ID_Venta = v.ID_Venta
      WHERE 
        v.ID_Sucursal = ?
      GROUP BY 
        MesNumero, Mes
      ORDER BY 
        MesNumero;
    `;

    conexion.query(sql, [ID_Sucursal], (err, results) => {
      if (err) return reject(err);

      resolve(results.length ? results : []); // Devuelve un array vacío si no hay resultados
    });
  });
};




// funcion de consulta para hacer la consulta y recuperar datos de - grafico compras - obtiene el numero total de compras de productos por mes
const obtenerTotalComprasG = (ID_Sucursal) => {
  return new Promise((resolve, reject) => {
    const sql = `
SELECT 
    MONTH(Fecha_Compra) AS MesNumero,
    ELT(MONTH(Fecha_Compra), 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre') AS Mes,
    SUM(Cantidad_Unitario) AS Total_Productos_Vendidos
FROM 
    detalles_compra
JOIN 
    compras ON detalles_compra.ID_Compra = compras.ID_Compra
WHERE 
    compras.ID_Sucursal = ?
GROUP BY 
    MesNumero, Mes 
ORDER BY 
    MesNumero;


    `;

    conexion.query(sql, [ID_Sucursal], (err, results) => {
      if (err) return reject(err);

      resolve(results.length ? results : []); // Devuelve un array vacío si no hay resultados
    });
  });
};


//funcion de consulta para hacer la consulta y recuperar datos de - grafico pedidos - obtiene el numero total de pedidos  por mes
const obtenerPedidosAnoActual = (ID_Sucursal) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        ELT(MONTH(p.Fecha_Entrega), 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre') AS Mes,
        YEAR(p.Fecha_Entrega) AS Anio,
        COUNT(p.ID_Pedido) AS Total_Pedidos,
        MONTH(p.Fecha_Entrega) AS MesNumero
      FROM 
        pedidos p
      JOIN 
        ventas v ON p.ID_Venta = v.ID_Venta
      WHERE 
        YEAR(p.Fecha_Entrega) = YEAR(NOW())
        AND v.ID_Sucursal = ?
      GROUP BY 
        Mes, Anio, MesNumero
      ORDER BY 
        MesNumero;
    `;

    conexion.query(sql, [ID_Sucursal], (err, results) => {
      if (err) return reject(err);

      resolve(results.length ? results : []); // Devuelve un array vacío si no hay resultados
    });
  });
};


router.get("/datos", async (req, res) => {
  if (req.session.loggedin) {
    const { ID_Sucursal } = req.session;

    if (!ID_Sucursal) {
      return res.status(400).send("Sucursal no especificada en la sesión.");
    }

    try {
      const [
        ventasMes,
        ComprasMesActual,
        clientesRegistradosMes,
        medicamentosapuntovencer,
        obtenerVentasMest,
        obtenerProductoMasVendido,
        obtenerTotalProductosVendidosMesSucursal,
        obtenerCantidadTotalInventario,
        comprasMestabla,
        obtenerProveedorMasComprado,
        ventasMesGrafico,
        ObtenerTablaInventarios,
        ventasMesActual,
        productosVendidosMes,
        obtenerTotalComprasC,
        obtenerTotalComprasGR,
        obtenerTotalPedidosEstado1_G,
        obtenerTotalPedidosMesActual_m,
        obtenerPedidosAnoActual_m

      ] = await Promise.all([
        obtenerVentasMes(ID_Sucursal),
        obtenerComprasMes(ID_Sucursal),
        obtenerClientesRegistradosMes(ID_Sucursal),
        obtenerMedicamentosPorAcabarse(ID_Sucursal),
        obtenerVentasMestotales(ID_Sucursal),
        obtenerProductoMasVendidos(ID_Sucursal),
        obtenerTotalProductosVendidosMesSucursalS(ID_Sucursal),
        obtenerCantidadTotalInventarioS(ID_Sucursal),
        obtenerDetallesComprasMes(ID_Sucursal),
        obtenerProveedorMasCompradoS(ID_Sucursal),
        obtenerVentasDelMesGraficoM(ID_Sucursal),
        ObtenerTablaInventario(ID_Sucursal),
        obtenerVentasMesActual(ID_Sucursal),
        obtenerProductosVendidosMes(ID_Sucursal),
        obtenerTotalCompras(ID_Sucursal),
        obtenerTotalComprasG(ID_Sucursal),
        obtenerTotalPedidosEstado1(ID_Sucursal),
        obtenerTotalPedidosMesActual(ID_Sucursal),
        obtenerPedidosAnoActual(ID_Sucursal)
      ]);

      res.json({
        ventasMes,
        ComprasMesActual,
        clientesRegistradosMes,
        medicamentosapuntovencer,
        obtenerVentasMest,
        obtenerProductoMasVendido,
        obtenerTotalProductosVendidosMesSucursal,
        obtenerCantidadTotalInventario,
        comprasMestabla,
        obtenerProveedorMasComprado,
        ventasMesGrafico,
        ObtenerTablaInventarios,
        ventasMesActual,
        productosVendidosMes,
        obtenerTotalComprasC,
        obtenerTotalComprasGR,
        obtenerTotalPedidosEstado1_G,
        obtenerTotalPedidosMesActual_m,
        obtenerPedidosAnoActual_m
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
