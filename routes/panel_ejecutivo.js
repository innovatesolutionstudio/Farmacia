// invocamos a express
const express = require("express");
const router = express.Router();

// invocamos a la conexión de la base de datos
const conexion = require("../database/db");
const multer = require("multer");
const path = require("path");
const { Console } = require("console");

//ruta para mostrar todos los tableros de comandos
router.get("/panel_ejecutivo", (req, res) => {
  if (!req.session.loggedin) {
    return res.render("./paginas/logout");
  }

  const sql = "SELECT * FROM area_objetivo";

  conexion.query(sql, (err, results) => {
    if (err) throw err;

    res.render("./panel_ejecutivo/vista_panel_ejecutivo", {
      ID_Empleado: req.session.ID_Empleado,
      ID_Sucursal: req.session.ID_Sucursal,
      ID_Caja: req.session.ID_Caja,
      areas: results
    });
  });
});

//ruta para crear un nuevo tablero de comando 
router.post("/area_objetivo/crear", (req, res) => {
  const { nombre, fecha_inicio, fecha_fin } = req.body;
  const sql = "INSERT INTO area_objetivo (Nombre, Fecha_Inicio, Fecha_Fin) VALUES (?, ?, ?)";

  conexion.query(sql, [nombre, fecha_inicio, fecha_fin], (err, result) => {
    if (err) return res.status(500).json({ error: 'Error al crear el área' });
    res.json({ message: 'Área creada correctamente' });
  });
});

//ruta para mostrar tablero de compnado especifico
router.get("/panel_ejecutivo_crecimiento", (req, res) => {
  if (!req.session.loggedin) return res.render("./paginas/logout");

  const areaId = req.query.area;

  const sqlArea = "SELECT * FROM area_objetivo WHERE ID_Area_objetivo = ?";
  const sqlObjetivos = `
    SELECT 
    o.ID_Objetivo,
      o.Objetivo AS ObjetivoEstrategico,
      k.ID_KPI AS KPI_ID,   -- NUEVO
      k.KPI,
      k.Valor,
      k.Palanca_Inductor_Proceso,
      k.Iniciativa_Estrategica

    FROM objetivo o
    LEFT JOIN objetivos_kpi k ON k.ID_Objetivo = o.ID_Objetivo
    WHERE o.ID_Area_objetivo = ?
    ORDER BY o.ID_Objetivo
  `;
  const sqlEquipo = `
    SELECT e.ID_Empleado, e.Nombre, e.Apellido, r.Nombre AS Rol
    FROM equipo_objetivo eo
    JOIN empleados e ON e.ID_Empleado = eo.ID_Empleado
    LEFT JOIN roles r ON r.ID_Rol = e.ID_Rol
    WHERE eo.ID_Area_objetivo = ?
  `;

  // 1. Obtener el área
  conexion.query(sqlArea, [areaId], (err, areaResult) => {
    if (err) throw err;

    if (areaResult.length === 0) {
      return res.render("./panel_ejecutivo/crecimiento", {
        areaNombre: "Área no encontrada",
        fechaInicio: "-",
        fechaFin: "-",
        objetivos: {},
        equipo: [],
        ID_Area_objetivo: areaId
      });
    }

    const area = areaResult[0];
    const formatFecha = (fecha) => {
      const f = new Date(fecha);
      return f.toLocaleDateString("es-BO", {
        year: "numeric",
        month: "long",
        day: "numeric"
      });
    };

    // 2. Obtener el equipo
    conexion.query(sqlEquipo, [area.ID_Area_objetivo], (err, equipo) => {
      if (err) throw err;

      // 3. Obtener objetivos y KPI
      conexion.query(sqlObjetivos, [areaId], (err, objetivosResult) => {
        if (err) throw err;

        const objetivos = {};

        objetivosResult.forEach(row => {
          if (!objetivos[row.ObjetivoEstrategico]) {
            objetivos[row.ObjetivoEstrategico] = [];
          }

          if (row.KPI) {
            objetivos[row.ObjetivoEstrategico].push({
            id: row.ID_Objetivo, // se mantiene
            kpi_id: row.KPI_ID,   // nuevo campo para edición
            kpi: row.KPI,
            valor: row.Valor,
            semaforo: row.Valor >= 70 ? "verde" : row.Valor >= 50 ? "amarillo" : "rojo",
            inductor: row.Palanca_Inductor_Proceso,
            accion: row.Iniciativa_Estrategica
          });

          } else {
            // Objetivo sin KPI
            objetivos[row.ObjetivoEstrategico].push({
              id: row.ID_Objetivo,
              kpi: "-",
              valor: 0,
              semaforo: "rojo",
              inductor: "-",
              accion: "-"
            });
          }
        });

        res.render("./panel_ejecutivo/crecimiento", {
          areaNombre: area.Nombre,
          fechaInicio: formatFecha(area.Fecha_Inicio),
          fechaFin: formatFecha(area.Fecha_Fin),
          ID_Area_objetivo: area.ID_Area_objetivo,
          objetivos,
          
          equipo
        });
      });
    });
  });
});

//ruta para mostrar todos los objetivos de un area especifica 
router.get("/objetivos/por_area/:id", (req, res) => {
  const areaId = req.params.id;
  const sql = "SELECT ID_Objetivo, Objetivo FROM objetivo WHERE ID_Area_objetivo = ?";
  conexion.query(sql, [areaId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al obtener objetivos' });
    }
    res.json(results);
  });
});

//ruta para crear un nuevo objetivo para el tablero
router.post("/objetivo/crear", (req, res) => {
  const { ID_Area_objetivo, Objetivo } = req.body;

  if (!ID_Area_objetivo || !Objetivo) {
    return res.status(400).json({ error: "Faltan campos requeridos" });
  }

  const sql = "INSERT INTO objetivo (Objetivo, ID_Area_objetivo) VALUES (?, ?)";
  conexion.query(sql, [Objetivo, ID_Area_objetivo], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Error al insertar en la base de datos" });
    }

    res.json({ message: "Objetivo agregado correctamente" });
  });
});

//ruta para crear nuevo KPI
router.post("/kpi/crear", (req, res) => {
  const { ID_Objetivo, KPI, Valor, Palanca, Accion } = req.body;

  if (!ID_Objetivo || !KPI || !Valor || !Palanca || !Accion) {
    return res.status(400).json({ error: "Campos incompletos" });
  }

  const sql = `
    INSERT INTO objetivos_kpi 
    (KPI, ID_Objetivo, Valor, Fecha, Palanca_Inductor_Proceso, Iniciativa_Estrategica)
    VALUES (?, ?, ?, CURDATE(), ?, ?)
  `;

  conexion.query(sql, [KPI, ID_Objetivo, Valor, Palanca, Accion], (err, result) => {
    if (err) {
      console.error("Error al insertar KPI:", err); // 👈 importante
      return res.status(500).json({ error: "Error al guardar el KPI" });
    }
    res.json({ message: "Indicador agregado correctamente" });
  });
});

//verificar para ver que empleados estan disponibles
router.get("/empleados/disponibles", (req, res) => {
  const sql = "SELECT ID_Empleado, Nombre, Apellido FROM empleados WHERE Estado = 1";
  conexion.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: "Error al obtener empleados" });
    res.json(results);
  });
});

//ruta para agerar empleados al objetivo
router.post("/equipo_objetivo/asignar", (req, res) => {
  const { ID_Area_objetivo, ID_Empleado } = req.body;

  if (!ID_Area_objetivo || !ID_Empleado) {
    return res.status(400).json({ error: "Datos incompletos" });
  }

  const sql = `
    INSERT INTO equipo_objetivo (ID_Area_objetivo, ID_Empleado)
    VALUES (?, ?)
  `;
  conexion.query(sql, [ID_Area_objetivo, ID_Empleado], (err, result) => {
    if (err) {
      console.error("Error al asignar:", err);
      return res.status(500).json({ error: "No se pudo asignar al equipo" });
    }
    res.json({ message: "Empleado asignado correctamente al área" });
  });
});


router.post('/panel_ejecutivo/valor', (req, res) => {
  const { id, valor } = req.body;

  console.log(req.body);

  const valorEntero = parseInt(valor);  // ✅ Asegura tipo INT

  if (isNaN(valorEntero)) {
    return res.status(400).json({ message: 'El valor debe ser numérico.' });
  }

  const sql = 'UPDATE objetivos_kpi SET Valor = ? WHERE ID_KPI = ?';
  conexion.query(sql, [valorEntero, id], (err, result) => {
    if (err) {
      console.error('Error SQL:', err);
      return res.status(500).json({ message: 'Error al actualizar el valor del KPI.' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'No se encontró ningún KPI con ese ID.' });
    }

    res.json({ message: 'Valor del KPI actualizado correctamente.' });
  });
});

router.post('/panel_ejecutivo/eliminar', (req, res) => {
  const { id } = req.body;
  const sql = 'DELETE FROM objetivos_kpi WHERE ID_KPI = ?';

  conexion.query(sql, [id], (err) => {
    if (err) return res.status(500).json({ message: 'Error al eliminar KPI.' });
    res.json({ message: 'KPI eliminado exitosamente.' });
  });
});

router.post('/panel_ejecutivo/eliminar_objetivo', (req, res) => {
  const { id } = req.body;

  const sql = 'DELETE FROM objetivo WHERE ID_Objetivo = ?';

  conexion.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Error SQL:', err);
      return res.status(500).json({ message: 'Error al eliminar el objetivo.' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'No se encontró ningún objetivo con ese ID.' });
    }

    res.json({ message: 'Objetivo (y sus indicadores) eliminado correctamente.' });
  });
});


router.post('/equipo_objetivo/eliminar', (req, res) => {
  const { ID_Empleado, ID_Area_objetivo } = req.body;

  const sql = `DELETE FROM equipo_objetivo WHERE ID_Empleado = ? AND ID_Area_objetivo = ?`;

  conexion.query(sql, [ID_Empleado, ID_Area_objetivo], (err, result) => {
    if (err) {
      console.error('Error SQL:', err);
      return res.status(500).json({ message: 'Error al eliminar al empleado del equipo.' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'No se encontró la asignación del empleado.' });
    }

    res.json({ message: 'Empleado eliminado del área correctamente.' });
  });
});

router.get("/objetivos/promedios/:idArea", (req, res) => {
  const { idArea } = req.params;
  const sql = `
    SELECT o.Objetivo, AVG(k.Valor) AS Promedio
    FROM objetivo o
    LEFT JOIN objetivos_kpi k ON o.ID_Objetivo = k.ID_Objetivo
    WHERE o.ID_Area_objetivo = ?
    GROUP BY o.Objetivo
  `;

  conexion.query(sql, [idArea], (err, result) => {
    if (err) {
      console.error("Error al obtener promedios:", err);
      return res.status(500).json({ error: "Error al calcular promedios" });
    }
    res.json(result);
  });
});

router.post("/publicar-notificacion-area", (req, res) => {
  const { idArea, descripcion } = req.body;

  if (!idArea || !descripcion) {
    return res.status(400).json({ message: "Datos incompletos" });
  }

  const sql = `
    SELECT ID_Empleado 
    FROM equipo_objetivo 
    WHERE ID_Area_objetivo = ?
  `;

  conexion.query(sql, [idArea], (err, empleados) => {
    if (err) return res.status(500).json({ message: "Error al obtener empleados asignados" });

    if (empleados.length === 0) {
      return res.status(404).json({ message: "No hay empleados asignados a esta área" });
    }

    const notificaciones = empleados.map(emp => [emp.ID_Empleado, descripcion, 3]);
    const insertSql = "INSERT INTO notificaciones (ID_Empleado, Descripcion, Estado) VALUES ?";

    conexion.query(insertSql, [notificaciones], (err) => {
      if (err) return res.status(500).json({ message: "Error al insertar notificaciones" });
      res.json({ message: `Notificación enviada a ${empleados.length} empleado(s)` });
    });
  });
});

module.exports = router;
