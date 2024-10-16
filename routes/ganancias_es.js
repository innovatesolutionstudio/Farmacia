// Invocamos a express
const express = require('express');
const router = express.Router();

// Invocamos a la conexión de la base de datos
const conexion = require('../database/db');


router.get('/vista_ganancias', function(req, res) {
    // Realiza la consulta a la base de datos para obtener las ganancias por año
    const query = `
        SELECT YEAR(v.Fecha_Venta) AS Ano, SUM(g.Ganancia_Total) AS Ganancia_Total_Anual
        FROM ganancias g
        JOIN detalles_venta dv ON g.ID_Detalle_Venta = dv.ID_Detalle_Venta
        JOIN ventas v ON dv.ID_Venta = v.ID_Venta
        GROUP BY YEAR(v.Fecha_Venta)
        ORDER BY Ano;
    `;
    conexion.query(query, (error, results) => {
        if (error) {
            console.error('Error al obtener datos de la tabla ganancias:', error);
            res.status(500).send('Error al obtener datos de la tabla ganancias');
        } else {
            // Renderiza la vista EJS y pasa los resultados de la consulta como variable
            res.render('./ganancias/ganancias_es', { results: results });
        }
    });
});


router.get('/datosgananciasmetricas', function(req, res) {
    const { ID_Sucursal } = req.session;
    const query = `
       SELECT YEAR(v.Fecha_Venta) AS Ano, SUM(g.Ganancia_Total) AS Ganancia_Total_Anual
        FROM ganancias g
        JOIN detalles_venta dv ON g.ID_Detalle_Venta = dv.ID_Detalle_Venta
        JOIN ventas v ON dv.ID_Venta = v.ID_Venta
        GROUP BY YEAR(v.Fecha_Venta)
        ORDER BY Ano;
    `;
    conexion.query(query, [ID_Sucursal], (error, results) => {
        if (error) {
            console.error('Error al obtener datos de la tabla ganancias:', error);
            res.status(500).send('Error al obtener datos de la tabla ganancias');
        } else {
            res.json(results); // Enviar los datos en formato JSON
        }
    });
});



const ProductoConMasGanancias = (ID_Sucursal) => {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT p.Nombre
        FROM ganancias g
        JOIN detalles_venta dv ON g.ID_Detalle_Venta = dv.ID_Detalle_Venta
        JOIN productos p ON dv.ID_Producto = p.ID_Producto
        JOIN ventas v ON dv.ID_Venta = v.ID_Venta
        WHERE v.ID_Sucursal = ?
        GROUP BY p.Nombre
        ORDER BY SUM(g.Ganancia_Total) DESC
        LIMIT 1;
      `;
  
      conexion.query(sql, [ID_Sucursal], (err, results) => {
        if (err) return reject(err);
  
        resolve(results.length > 0 ? results[0].Nombre : null); // extraer el nombre del producto
      });
    });
};

  
const GananciasGetion = (ID_Sucursal) => {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT SUM(g.Ganancia_Total) AS GananciaAnual
        FROM ganancias g
        JOIN detalles_venta dv ON g.ID_Detalle_Venta = dv.ID_Detalle_Venta
        JOIN ventas v ON dv.ID_Venta = v.ID_Venta
        WHERE YEAR(v.Fecha_Venta) = YEAR(CURDATE()) 
        AND v.ID_Sucursal = ?;
      `;
  
      conexion.query(sql, [ID_Sucursal], (err, results) => {
        if (err) return reject(err);
  
        resolve(results.length > 0 ? results[0].GananciaAnual : 0); // extraer la ganancia anual
      });
    });
};

const GananciaMensual = (ID_Sucursal) => {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT SUM(g.Ganancia_Total) AS GananciaMensual
        FROM ganancias g
        JOIN detalles_venta dv ON g.ID_Detalle_Venta = dv.ID_Detalle_Venta
        JOIN ventas v ON dv.ID_Venta = v.ID_Venta
        WHERE YEAR(v.Fecha_Venta) = YEAR(CURDATE()) 
        AND MONTH(v.Fecha_Venta) = MONTH(CURDATE()) 
        AND v.ID_Sucursal = ?;
      `;
  
      conexion.query(sql, [ID_Sucursal], (err, results) => {
        if (err) return reject(err);
  
        resolve(results.length > 0 ? results[0].GananciaMensual : 0); // extraer la ganancia mensual
      });
    });
};
/*

router.get('/datosgananciasmetricas', async (req, res) => {
    const { ID_Sucursal } = req.session;
  
    if (!ID_Sucursal) {
      return res.status(400).send('Sucursal no especificada en la sesión.');
    }
  
    try {
      const [
        prodconmayorganancias,
        gananciaAnual,
        gananciaMensual
      ] = await Promise.all([
        ProductoConMasGanancias(ID_Sucursal),
        GananciasGetion(ID_Sucursal),
        GananciaMensual(ID_Sucursal)
      ]);
     
      res.json({
        prodconmayorganancias: prodconmayorganancias || "no hay datos",  // verificar valores nulos
        gananciaAnual: gananciaAnual || "no hay datos",
        gananciaMensual: gananciaMensual || "no hay datos"
      });
    } catch (err) {
      console.error('Error al obtener los datos:', err);
      res.status(500).send('Error al obtener los datos');
    }
});
*/
module.exports = router;
