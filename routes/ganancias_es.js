// Invocamos a express
const express = require('express');
const router = express.Router();

// Invocamos a la conexión de la base de datos
const conexion = require('../database/db');
router.get('/vista_ganancias', function(req, res) {
  const { ID_Sucursal } = req.session; // Asegúrate de que ID_Sucursal está en la sesión

  if (!ID_Sucursal) {
    // Si no hay sucursal en la sesión, redirige o muestra un mensaje de error
    res.render('./paginas/logout');
    return;
  }

  // Consulta a la vista en lugar de construir la lógica en la ruta
  const query = `
    SELECT 
      Ano, Ventas_Total_Anual, Ganancia_Total_Anual
    FROM 
      vista_ganancias
    WHERE 
      Sucursal = ?
    ORDER BY 
      Ano;
  `;

  // Ejecuta la consulta y pasa el ID de la sucursal como parámetro
  conexion.query(query, [ID_Sucursal], (error, results) => {
    if (error) {
      console.error('Error al obtener datos de la vista vista_ganancias:', error);
      res.status(500).send('Error al obtener datos de la vista vista_ganancias');
    } else {
      // Renderiza la vista EJS y pasa los resultados de la consulta como variable
      res.render('./ganancias/ganancias_es', { results: results });
    }
  });
});




const ProductoConMasGanancias = (ID_Sucursal) => {
  return new Promise((resolve, reject) => {
      const sql = `
          SELECT Producto
          FROM vista_producto_con_mas_ganancias
          WHERE Sucursal = ?
          LIMIT 1;
      `;

      conexion.query(sql, [ID_Sucursal], (err, results) => {
          if (err) return reject(err);

          resolve(results.length > 0 ? results[0].Producto : null); // extraer el producto
      });
  });
};


const GananciasGetion = (ID_Sucursal) => {
  return new Promise((resolve, reject) => {
      const sql = `
          SELECT Ganancia_Anual AS GananciaAnual
          FROM vista_ganancias_anuales
          WHERE Sucursal = ? AND Ano = YEAR(CURDATE());
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
          SELECT Ganancia_Mensual AS GananciaMensual
          FROM vista_ganancias_mensuales
          WHERE Sucursal = ? 
          AND Ano = YEAR(CURDATE()) 
          AND Mes = MONTH(CURDATE());
      `;

      conexion.query(sql, [ID_Sucursal], (err, results) => {
          if (err) return reject(err);

          resolve(results.length > 0 ? results[0].GananciaMensual : 0); // extraer la ganancia mensual
      });
  });
};


const ObtenerNombreSucursal = (ID_Sucursal) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT s.Nombre AS NombreSucursal
      FROM sucursales s
      WHERE s.ID_Sucursal = ?;
    `;

    conexion.query(sql, [ID_Sucursal], (err, results) => {
      if (err) return reject(err);
      
      resolve(results.length > 0 ? results[0].NombreSucursal : null); // Retornar solo el nombre de la sucursal
    });
  });
};



router.get('/datosgananciasmetricas', async (req, res) => {
    const { ID_Sucursal } = req.session;
  
    if (!ID_Sucursal) {
      return res.status(400).send('Sucursal no especificada en la sesión.');
    }
  
    try {
      const [
        prodconmayorganancias,
        gananciaAnual,
        gananciaMensual,
        nombreSuc
      ] = await Promise.all([
        ProductoConMasGanancias(ID_Sucursal),
        GananciasGetion(ID_Sucursal),
        GananciaMensual(ID_Sucursal),
        ObtenerNombreSucursal(ID_Sucursal)
      ]);
     
      res.json({
        prodconmayorganancias: prodconmayorganancias || "no hay datos",  // verificar valores nulos
        gananciaAnual: gananciaAnual || "no hay datos",
        gananciaMensual: gananciaMensual || "no hay datos",
        nombreSuc : nombreSuc || "no hay datos"
      });
    } catch (err) {
      console.error('Error al obtener los datos:', err);
      res.status(500).send('Error al obtener los datos');
    }
});

module.exports = router;
