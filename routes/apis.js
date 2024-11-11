// Invocamos a Express y creamos un router
const express = require("express");
const router = express.Router();

// Invocamos a la conexión de la base de datos
const coneccion = require("../database/db");

router.get("/api/generos", (req, res) => {
  const sql =
    "SELECT ID_Generos as id, Nombre as nombre FROM generos WHERE Figura = 1";
  coneccion.query(sql, (err, results) => {
    if (err) {
      console.error("Error al obtener ciudades:", err);
      res.status(500).json({ error: "Error interno del servidor" });
      return;
    }
    res.json(results);
  });
});
router.get("/api/roles", (req, res) => {
  const sql =
    "SELECT ID_Rol as id, Nombre as nombre FROM roles WHERE Figura = 1";
  coneccion.query(sql, (err, results) => {
    if (err) {
      console.error("Error al obtener ciudades:", err);
      res.status(500).json({ error: "Error interno del servidor" });
      return;
    }
    res.json(results);
  });
});
router.get("/api/sucursales", (req, res) => {
  const sql =
    "SELECT ID_Sucursal as id, Nombre as nombre FROM sucursales WHERE Figura = 1";
  coneccion.query(sql, (err, results) => {
    if (err) {
      console.error("Error al obtener ciudades:", err);
      res.status(500).json({ error: "Error interno del servidor" });
      return;
    }
    res.json(results);
  });
});
router.get("/api/cajas", (req, res) => {
  const sql =
    "SELECT ID_Caja as id, Codigo as nombre FROM cajas WHERE Figura = 1";
  coneccion.query(sql, (err, results) => {
    if (err) {
      console.error("Error al obtener ciudades:", err);
      res.status(500).json({ error: "Error interno del servidor" });
      return;
    }
    res.json(results);
  });
});
// Ruta para obtener todos los departamentos
router.get("/api/departamentos", (req, res) => {
  const sql =
    "SELECT ID_Departamento as id, Nombre as nombre FROM departamentos WHERE Figura = 1";
  coneccion.query(sql, (err, results) => {
    if (err) {
      console.error("Error al obtener departamentos:", err);
      res.status(500).json({ error: "Error interno del servidor" });
      return;
    }
    res.json(results);
  });
});

router.get("/api/ciudades", (req, res) => {
  const sql =
    "SELECT ID_Ciudad as id, Nombre as nombre FROM ciudades WHERE Figura = 1";
  coneccion.query(sql, (err, results) => {
    if (err) {
      console.error("Error al obtener ciudades:", err);
      res.status(500).json({ error: "Error interno del servidor" });
      return;
    }
    res.json(results);
  });
});
// Ruta para obtener todos los países
router.get("/api/paises", (req, res) => {
  const sql =
    "SELECT ID_Pais as id, Nombre as nombre FROM paises WHERE Figura = 1";
  coneccion.query(sql, (err, results) => {
    if (err) {
      console.error("Error al obtener países:", err);
      res.status(500).json({ error: "Error interno del servidor" });
      return;
    }
    res.json(results);
  });
});

router.get("/api/verificar-duplicados-Empleados", async (req, res) => {
  const { correo, ci, empleadoID } = req.query;

  try {
    let existeCorreo = false;
    let existeCI = false;

    // Consultas condicionales
    if (correo) {
      const [resultCorreo] = await coneccion.query(
        "SELECT COUNT(*) as count FROM empleados WHERE Email = ? AND ID_Empleado != ? AND WHERE Figura = 1",
        [correo, empleadoID]
      );
      existeCorreo = resultCorreo[0].count > 0;
    }

    if (ci) {
      const [resultCI] = await coneccion.query(
        "SELECT COUNT(*) as count FROM empleados WHERE CI = ? AND ID_Empleado != ? AND WHERE Figura = 1",
        [ci, empleadoID]
      );
      existeCI = resultCI[0].count > 0;
    }

    res.json({ existeCorreo, existeCI });
  } catch (error) {
    console.error("Error al verificar duplicados:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// APIs para cargar opciones en los selects
router.get("/api/categorias", (req, res) => {
  coneccion.query(
    "SELECT ID_Categoria AS id, Nombre_Categoria AS nombre FROM categorias_productos WHERE Figura = 1",
    (err, results) => {
      if (err) res.status(500).json({ error: "Error al obtener categorías" });
      else res.json(results);
    }
  );
});

router.get("/api/proveedores", (req, res) => {
  coneccion.query(
    "SELECT ID_Proveedor AS id, Nombre AS nombre FROM proveedores WHERE Figura = 1",
    (err, results) => {
      if (err) res.status(500).json({ error: "Error al obtener proveedores" });
      else res.json(results);
    }
  );
});

router.get("/api/area_producto", (req, res) => {
  coneccion.query(
    "SELECT ID_Area_Producto AS id, Nombre AS nombre FROM area_producto WHERE Figura = 1",
    (err, results) => {
      if (err)
        res.status(500).json({ error: "Error al obtener áreas de producto" });
      else res.json(results);
    }
  );
});

router.get("/api/tipo_paciente", (req, res) => {
  coneccion.query(
    "SELECT ID_Tipo_Paciente AS id, Nombre AS nombre FROM tipo_paciente WHERE Figura = 1",
    (err, results) => {
      if (err)
        res.status(500).json({ error: "Error al obtener tipos de paciente" });
      else res.json(results);
    }
  );
});

router.get("/api/tipo_administracion", (req, res) => {
  coneccion.query(
    "SELECT ID_Tipo_Administracion_Producto AS id, Nombre AS nombre FROM tipo_vias_administracion_producto WHERE Figura = 1",
    (err, results) => {
      if (err)
        res
          .status(500)
          .json({ error: "Error al obtener tipos de administración" });
      else res.json(results);
    }
  );
});

router.get("/api/unidad_venta", (req, res) => {
  coneccion.query(
    "SELECT ID_Unidad_Venta AS id, Nombre AS nombre FROM unidad_venta WHERE Figura = 1",
    (err, results) => {
      if (err)
        res.status(500).json({ error: "Error al obtener unidades de venta" });
      else res.json(results);
    }
  );
});

module.exports = router;
