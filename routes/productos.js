// Invocamos a express
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { Console } = require("console");

// Invocamos a la conexión de la base de datos
const connection = require("../database/db");


// Ruta para obtener todos los productos con Figura = 1
router.get("/productos", function (req, res) {

  if (req.session.loggedin) {
    connection.query(
      `
          SELECT 
              productos.ID_Producto,
              productos.Codigo,
              productos.Nombre,
              productos.Precio_Unitario,
              categorias_productos.Nombre_Categoria AS Nombre_Categoria,
              proveedores.Nombre AS Nombre_Proveedor
          FROM productos
          LEFT JOIN categorias_productos ON productos.ID_Categoria = categorias_productos.ID_Categoria
          LEFT JOIN proveedores ON productos.ID_Proveedor = proveedores.ID_Proveedor
          WHERE productos.Figura = 1
      `,
      (error, results) => {
        if (error) {
          console.error("Error al obtener datos de la tabla productos:", error);
          res.status(500).send("Error al obtener datos de la tabla productos");
        } else {
          res.render("./productos/productos", { results: results });
        }
      }
    );
  } else {
    res.render("./paginas/logout");
  }
});
// Ruta para obtener todos los productos con Figura = 1
router.get("/productosP", function (req, res) {
  if (req.session.loggedin) {
    connection.query(
      `
          SELECT 
              productos.ID_Producto,
              productos.Codigo,
              productos.Nombre,
              productos.Precio_Unitario,
              categorias_productos.Nombre_Categoria AS Nombre_Categoria,
              proveedores.Nombre AS Nombre_Proveedor
          FROM productos
          LEFT JOIN categorias_productos ON productos.ID_Categoria = categorias_productos.ID_Categoria
          LEFT JOIN proveedores ON productos.ID_Proveedor = proveedores.ID_Proveedor
          WHERE productos.Figura = 2
      `,
      (error, results) => {
        if (error) {
          console.error("Error al obtener datos de la tabla productos:", error);
          res.status(500).send("Error al obtener datos de la tabla productos");
        } else {
          res.render("./productos/productosP", { results: results });
        }
      }
    );
  } else {
    res.render("./paginas/logout");
  }
});

// Ruta para obtener los detalles del producto según su ID
router.get("/productos/detalle/:id", (req, res) => {
  if (req.session.loggedin) {
    const id = req.params.id;
    const query = `
      SELECT 
        p.Generaliadades, 
        p.Precauciones, 
        p.Indicaciones, 
        p.Dosis_Medicacmento, 
        p.Efectos_Secundarios 
      FROM productos p 
      WHERE p.ID_Producto = ? 
      LIMIT 1;
    `;

    connection.query(query, [id], (error, results) => {
      if (error) {
        console.error("Error al obtener detalles del producto:", error);
        res
          .status(500)
          .json({ error: "Error al obtener los detalles del producto" });
      } else if (results.length === 0) {
        res.status(404).json({ error: "Producto no encontrado" });
      } else {
        res.json(results[0]); // Devuelve los detalles del producto
      }
    });
  } else {
    res.render("./paginas/logout");
  }
});

router.get("/detallesproductos/:id", async (req, res) => {
  if (req.session.loggedin) {
    const id = req.params.id;

    const query = `
          SELECT 
            p.ID_Producto,
            p.Nombre AS NombreProducto,
            p.Descripcion,
            p.Precio_Unitario,
            p.Codigo,
            p.Fotografia,
            p.Indicaciones,
            p.Dosis_Medicacmento,
            p.Riesgo_Embarazo,
            p.Efectos_Secundarios,
            p.Precauciones,
            p.Generaliadades,
            c.Nombre_Categoria AS Categoria,
            prov.Nombre AS Proveedor,
            area.Nombre AS AreaProducto,
            paciente.Nombre AS TipoPaciente,
            via.Nombre AS TipoAdministracion,
            unidad.Nombre AS UnidadVenta
          FROM productos p
          LEFT JOIN categorias_productos c ON p.ID_Categoria = c.ID_Categoria
          LEFT JOIN proveedores prov ON p.ID_Proveedor = prov.ID_Proveedor
          LEFT JOIN area_producto area ON p.ID_Area_Producto = area.ID_Area_Producto
          LEFT JOIN tipo_paciente paciente ON p.ID_Tipo_Paciente = paciente.ID_Tipo_Paciente
          LEFT JOIN tipo_vias_administracion_producto via ON p.ID_Tipo_vias_administracion = via.ID_Tipo_Administracion_Producto
          LEFT JOIN unidad_venta unidad ON p.ID_Unidad_Venta = unidad.ID_Unidad_Venta
          WHERE p.ID_Producto = ?
          LIMIT 1;
        `;

    connection.query(query, [id], (error, results) => {
      if (error) {
        console.error("Error al obtener datos de la tabla productos:", error);
        res.status(500).send("Error en la consulta");
      } else {
        res.render("./productos/detallesproductos", { results: results });
      }
    });
  } else {
    res.render("./paginas/logout");
  }
});

router.get("/detallesproductosP/:id", async (req, res) => {
  if (req.session.loggedin) {
    const id = req.params.id;

    const query = `
          SELECT 
            p.ID_Producto,
            p.Nombre AS NombreProducto,
            p.Descripcion,
            p.Precio_Unitario,
            p.Codigo,
            p.Fotografia,
            p.Indicaciones,
            p.Dosis_Medicacmento,
            p.Riesgo_Embarazo,
            p.Efectos_Secundarios,
            p.Precauciones,
            p.Generaliadades,
            c.Nombre_Categoria AS Categoria,
            prov.Nombre AS Proveedor,
            area.Nombre AS AreaProducto,
            paciente.Nombre AS TipoPaciente,
            via.Nombre AS TipoAdministracion,
            unidad.Nombre AS UnidadVenta
          FROM productos p
          LEFT JOIN categorias_productos c ON p.ID_Categoria = c.ID_Categoria
          LEFT JOIN proveedores prov ON p.ID_Proveedor = prov.ID_Proveedor
          LEFT JOIN area_producto area ON p.ID_Area_Producto = area.ID_Area_Producto
          LEFT JOIN tipo_paciente paciente ON p.ID_Tipo_Paciente = paciente.ID_Tipo_Paciente
          LEFT JOIN tipo_vias_administracion_producto via ON p.ID_Tipo_vias_administracion = via.ID_Tipo_Administracion_Producto
          LEFT JOIN unidad_venta unidad ON p.ID_Unidad_Venta = unidad.ID_Unidad_Venta
          WHERE p.ID_Producto = ?
          LIMIT 1;
        `;

    connection.query(query, [id], (error, results) => {
      if (error) {
        console.error("Error al obtener datos de la tabla productos:", error);
        res.status(500).send("Error en la consulta");
      } else {
        res.render("./productos/detallesproductosP", { results: results });
      }
    });
  } else {
    res.render("./paginas/logout");
  }
});

// Ruta para obtener datos del producto
router.get("/EditProducto/:id", (req, res) => {
  if (req.session.loggedin) {
    const productoId = req.params.id;
    const sql = `
      SELECT * FROM productos WHERE ID_Producto = ?`;

    connection.query(sql, [productoId], (err, results) => {
      if (err) {
        console.error("Error al obtener producto:", err);
        res.status(500).json({ error: "Error interno del servidor" });
        return;
      }

      if (results.length > 0) {
        const producto = results[0];
        res.render("productos/editarproducto", { producto });
      } else {
        res.status(404).send("Producto no encontrado");
      }
    });
  } else {
    res.render("./paginas/logout");
  }
});

// Ruta para obtener datos del producto
router.get("/NuevoProducto", (req, res) => {
  if (req.session.loggedin) {
    res.render("productos/nuevoproducto");
  } else {
    res.render("./paginas/logout");
  }
});
const storage2 = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../storage/img_productos")); // Ruta para productos
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, "Fotografia-" + uniqueSuffix + ext); // Guardar con un nombre único
  },
});

const upload = multer({ storage: storage2 });

router.post(
  "/EditProductos/:id?",
  upload.single("fotografia"),
  function (req, res) {
    const id = req.params.id;
    const opcion = req.body.opcion;
    const nombreArchivo = req.file ? req.file.filename : req.body.fotografia; // Usar el nuevo archivo si se sube uno

    const {
      Nombre,
      Descripcion,
      Precio_Unitario,
      ID_Categoria,
      ID_Proveedor,
      ID_Area_Producto,
      ID_Tipo_Paciente,
      ID_Tipo_vias_administracion,
      Indicaciones,
      Dosis_Medicacmento,
      Riesgo_Embarazo,
      Efectos_Secundarios,
      Precauciones,
      Generaliadades,
      ID_Unidad_Venta,
    } = req.body;

    switch (opcion) {
      case "crear":
        // Generar código automáticamente basado en el nombre del producto
        const codigoBase = Nombre.substring(0, 3).toUpperCase();
        const numeroAleatorio = Math.floor(Math.random() * 1000) + 20000;
        const Codigo = `${codigoBase}${numeroAleatorio}`;

        const sqlInsert = `
          INSERT INTO productos 
          (Nombre, Descripcion, Precio_Unitario, ID_Categoria, ID_Proveedor, ID_Area_Producto, 
           ID_Tipo_Paciente, ID_Tipo_vias_administracion, Indicaciones, Dosis_Medicacmento, 
           Riesgo_Embarazo, Efectos_Secundarios, Precauciones, Generaliadades, ID_Unidad_Venta, 
           Codigo, Fotografia, Figura) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`;

        connection.query(
          sqlInsert,
          [
            Nombre,
            Descripcion,
            Precio_Unitario,
            ID_Categoria,
            ID_Proveedor,
            ID_Area_Producto,
            ID_Tipo_Paciente,
            ID_Tipo_vias_administracion,
            Indicaciones,
            Dosis_Medicacmento,
            Riesgo_Embarazo,
            Efectos_Secundarios,
            Precauciones,
            Generaliadades,
            ID_Unidad_Venta,
            Codigo, // Incluye el código generado aquí
            nombreArchivo,
          ],
          (err, result) => {
            if (err) {
              console.error("Error al crear producto:", err);
              res
                .status(500)
                .json({ success: false, message: "Error al crear producto" });
            } else {
              console.log("Producto creado:", result);
              res.status(200).json({
                success: true,
                message: "Producto creado correctamente",
              });
            }
          }
        );
        break;

      case "editar":
        const sqlUpdate = `
            UPDATE productos 
            SET Nombre = ?, Descripcion = ?, Precio_Unitario = ?, ID_Categoria = ?, ID_Proveedor = ?, 
                ID_Area_Producto = ?, ID_Tipo_Paciente = ?, ID_Tipo_vias_administracion = ?, 
                Indicaciones = ?, Dosis_Medicacmento = ?, Riesgo_Embarazo = ?, Efectos_Secundarios = ?, 
                Precauciones = ?, Generaliadades = ?, ID_Unidad_Venta = ?, Fotografia = ? 
            WHERE ID_Producto = ?`;

        connection.query(
          sqlUpdate,
          [
            Nombre,
            Descripcion,
            Precio_Unitario,
            ID_Categoria,
            ID_Proveedor,
            ID_Area_Producto,
            ID_Tipo_Paciente,
            ID_Tipo_vias_administracion,
            Indicaciones,
            Dosis_Medicacmento,
            Riesgo_Embarazo,
            Efectos_Secundarios,
            Precauciones,
            Generaliadades,
            ID_Unidad_Venta,
            nombreArchivo,
            id,
          ],
          (err, result) => {
            if (err) {
              console.error("Error al actualizar producto:", err);
              res.status(500).json({
                success: false,
                message: "Error al actualizar producto",
              });
            } else {
              console.log("Producto actualizado:", result);
              res.status(200).json({
                success: true,
                message: "Producto actualizado correctamente",
              });
            }
          }
        );
        break;

      case "eliminar":
        if (id) {
          const sqlDelete =
            "UPDATE productos SET Figura = 2 WHERE ID_Producto = ?";

          connection.query(sqlDelete, [id], (err, result) => {
            if (err) {
              console.error("Error al eliminar producto:", err);
              res.status(500).json({
                success: false,
                message: "Error al eliminar producto",
              });
            } else {
              console.log("Producto eliminado:", result);
              res.json({
                success: true,
                message: "Producto eliminado con éxito",
              });
            }
          });
        } else {
          res
            .status(400)
            .json({ success: false, message: "ID no proporcionado" });
        }
        break;
      case "restaurar":
        if (id) {
          const sqlDelete =
            "UPDATE productos SET Figura = 1 WHERE ID_Producto = ?";

          connection.query(sqlDelete, [id], (err, result) => {
            if (err) {
              console.error("Error al restaurar producto:", err);
              res.status(500).json({
                success: false,
                message: "Error al restaurar producto",
              });
            } else {
              console.log("Producto restaurado:", result);
              res.json({
                success: true,
                message: "Producto restaurado con éxito",
              });
            }
          });
        } else {
          res
            .status(400)
            .json({ success: false, message: "ID no proporcionado" });
        }
        break;
      default:
        res.status(400).send("Opción no válida");
        break;
    }
  }
);

module.exports = router;
