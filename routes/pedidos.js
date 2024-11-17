// invocamos a express
const express = require("express");
const router = express.Router();

// invocamos a la conexión de la base de datos
const conexion = require("../database/db");
const multer = require("multer");
const path = require("path");
const { Console } = require("console");


router.get("/pedidos", function (req, res) {
    if (req.session.loggedin) {
      const sucursalID = req.session.ID_Sucursal;
  
      // Consulta para obtener los pedidos con datos adicionales
      const query = `
        SELECT 
          p.ID_Pedido, 
          CONCAT(c.Nombre, ' ', c.Apellido) AS NombreCliente, 
          v.Fecha_Venta, 
          p.Estado 
        FROM pedidos p
        INNER JOIN ventas v ON p.ID_Venta = v.ID_Venta
        INNER JOIN clientes c ON p.ID_Cliente = c.ID_Cliente
        WHERE v.ID_Sucursal = ?

        `;
  
      conexion.query(query, [sucursalID], (error, results) => {
        if (error) {
          console.error("Error al obtener datos de la tabla pedidos:", error);
          res.status(500).send("Error al obtener datos de la tabla pedidos");
        } else {
          // Renderiza la vista de pedidos
          res.render("./pedidos/pedidos", { results });
        }
      });
    } else {
      res.render("./paginas/logout");
    }
  });
  router.get("/detallespedido/:id", async (req, res) => {
    if (req.session.loggedin) {
        const id = req.params.id;

        const query = `
            SELECT 
                p.ID_Pedido,
                CONCAT(c.Nombre, ' ', c.Apellido) AS NombreCliente, -- Nombre completo
                c.Codigo AS CodigoCliente, -- Código del cliente
                DATE_FORMAT(v.Fecha_Venta, '%Y/%m/%d') AS Fecha_Venta, -- Formateamos la fecha
                DATE_FORMAT(p.Fecha_Entrega, '%Y/%m/%d') AS Fecha_Entrega, -- Formateamos la fecha de entrega
                v.Total_Venta,
                p.Direccion AS DireccionEntrega,
                p.Estado AS EstadoPedido,
                d.Tatifa AS TarifaDelivery,
                e.Nombre AS NombreEmpleado
            FROM pedidos p
            LEFT JOIN clientes c ON p.ID_Cliente = c.ID_Cliente
            LEFT JOIN ventas v ON p.ID_Venta = v.ID_Venta
            LEFT JOIN distritos d ON p.ID_Distrito = d.ID_Distritos
            LEFT JOIN empleados e ON p.ID_Empleado = e.ID_Empleado
            WHERE p.ID_Pedido = ?
            LIMIT 1;
        `;

        conexion.query(query, [id], (error, results) => {
            if (error) {
                console.error("Error al obtener datos del pedido:", error);
                res.status(500).send("Error en la consulta");
            } else if (results.length === 0) {
                res.status(404).send("No se encontró el pedido");
            } else {
                const pedido = results[0];
                const productosQuery = `
                    SELECT 
                        dv.ID_Producto,
                        p.Nombre AS NombreProducto,
                        dv.Cantidad
                    FROM detalles_venta dv
                    INNER JOIN productos p ON dv.ID_Producto = p.ID_Producto
                    WHERE dv.ID_Venta = ?;
                `;

                conexion.query(productosQuery, [pedido.ID_Venta], (error, productos) => {
                    if (error) {
                        console.error("Error al obtener productos del pedido:", error);
                        res.status(500).send("Error al obtener productos del pedido");
                    } else {
                        res.render("./pedidos/detalle_pedido", {
                            pedido: pedido,
                            productos: productos,
                        });
                    }
                });
            }
        });
    } else {
        res.render("./paginas/logout");
    }
});


const obtenerPedidos = (ID_Sucursal) => {
  return new Promise((resolve, reject) => {
    const sql = `
        SELECT COUNT(*) AS totalpedidos
        FROM pedidos p
        INNER JOIN ventas v ON p.ID_Venta = v.ID_Venta
        WHERE  v.ID_Sucursal = ?;

      `;
    conexion.query(sql,[ID_Sucursal], (err, results) => {
      if (err) return reject(err);
      resolve(results[0]);
    });
  });
};


const ObtenerPedidosEnProceso = (ID_Sucursal) => {
  return new Promise((resolve, reject) => {
    const sql = `
    SELECT COUNT(*) AS totalNotificaciones 
    FROM pedidos p
    INNER JOIN ventas v ON p.ID_Venta = v.ID_Venta
    WHERE p.Estado = 2 and v.ID_Sucursal = ?;


      `;
    conexion.query(sql, [ID_Sucursal],(err, results) => {
      if (err) return reject(err);
      resolve(results[0]);
    });
  });
};

const ObtenerPedidosEnCamino = (ID_Sucursal) => {
  return new Promise((resolve, reject) => {
    const sql = `
      
        SELECT COUNT(*) AS totalNotificaciones 
        FROM pedidos p
        INNER JOIN ventas v ON p.ID_Venta = v.ID_Venta
        WHERE p.Estado = 3 and v.ID_Sucursal = ?;


      `;
    conexion.query(sql,[ID_Sucursal], (err, results) => {
      if (err) return reject(err);
      resolve(results[0]);
    });
  });
};

const ObtenerPedidosEntregado = (ID_Sucursal) => {
  return new Promise((resolve, reject) => {
    const sql = `
      
        SELECT COUNT(*) AS totalNotificaciones 
        FROM pedidos p
        INNER JOIN ventas v ON p.ID_Venta = v.ID_Venta
        WHERE p.Estado = 4 and v.ID_Sucursal = ?;

      `;
    conexion.query(sql,[ID_Sucursal] ,(err, results) => {
      if (err) return reject(err);
      resolve(results[0]);
    });
  });
};
router.get("/datoPedidos", async (req, res) => {
    if (req.session.loggedin) {
      const { ID_Sucursal } = req.session;
  
      if (!ID_Sucursal) {
        return res.status(400).send("Sucursal no especificada en la sesión.");
      }
  
      try {
        const [obtenerPedidoss, ObtenerPedidosEnProcesos, ObtenerPedidosEnCaminos, ObtenerPedidosEntregados] = await Promise.all([
          obtenerPedidos(ID_Sucursal),
          ObtenerPedidosEnProceso(ID_Sucursal),
          ObtenerPedidosEnCamino(ID_Sucursal),
          ObtenerPedidosEntregado(ID_Sucursal)
        ]);
  
        // Devuelve los resultados como un objeto JSON válido
        res.json({
          totalPedidos: obtenerPedidoss.totalpedidos || 0,
          pedidosEnProceso: ObtenerPedidosEnProcesos.totalNotificaciones || 0,
          pedidosEnCamino: ObtenerPedidosEnCaminos.totalNotificaciones || 0,
          pedidosEntregados: ObtenerPedidosEntregados.totalNotificaciones || 0,
        });
      } catch (err) {
        console.error("Error al obtener los datos:", err);
        res.status(500).send("Error al obtener los datos");
      }
    } else {
      res.render("./paginas/logout");
    }
  });
  
router.get("/detallesempleados/:id", async (req, res) => {
  const id = req.params.id; // Obtener el ID del empleado de la URL
  const nombre = req.params.nombre; // Obtener el ID del empleado de la URL
  console.log("Id del empleado " + id);
  conexion.query(
    "SELECT * FROM empleados WHERE ID_Empleado = ?",
    [id],
    (error, results) => {
      if (error) {
        console.error(
          "Error al obtener datos de la tabla del empleado:",
          error
        );
      } else {
        // Renderiza la vista EJS y pasa los resultados de la consulta como variable
        res.render("./empleados/detallesempleados", { results: results });
      }
    }
  );
});

router.get("/EditEmpleados/:id", async (req, res) => {
  const empleadoId = req.params.id;
  const sql = `SELECT ID_Empleado, DATE_FORMAT(Fecha_Nacimiento, '%Y-%m-%d') AS Fecha_Nacimiento,
                  Nombre, Apellido, Dirección, Teléfono, Email, CI, Telefono_referencia, ID_Departamento,
                  ID_Ciudad, ID_Genero, ID_Rol, Contrasena, Fotografia, Estado, Grado, ID_Sucursal, ID_Caja, Situacion
                  FROM empleados 
                  WHERE ID_Empleado = ?`;

  conexion.query(sql, [empleadoId], (err, results) => {
    if (err) {
      console.error("Error al obtener empleado:", err);
      res.status(500).json({ error: "Error interno del servidor" });
      return;
    }

    if (results.length > 0) {
      const empleado = results[0]; // Obtenemos el primer (y único) resultado
      res.render("empleados/editarempleado", { empleado }); // Aquí pasamos el objeto 'empleado'
    } else {
      res.status(404).send("Empleado no encontrado");
    }
  });
});

router.get("/CrearEmpleado", (req, res) => {
  if (req.session.loggedin) {
    res.render("./empleados/nuevoempleado");
  } else {
    res.render("./paginas/logout");
  }
});

//codigo para el guardado de las imagenes
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../storage/img_empleados")); // Ruta corregida
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, "Fotografia-" + uniqueSuffix + ext); // Guardar con un nombre único
  },
});

const upload = multer({ storage: storage });

router.post(
  "/EditEmpleados/:id?",
  upload.single("fotografia"),
  function (req, res) {
    const id = req.params.id;
    const opcion = req.body.opcion;
    const nombreArchivo = req.file ? req.file.filename : req.body.fotografia; // Usar el nuevo archivo si se sube uno

    console.log("ID recibido:", id);
    console.log("Datos recibidos:", req.body);
    console.log("Nombre del archivo de fotografía:", nombreArchivo);

    const {
      nombre,
      apellido,
      fecha_nacimiento,
      direccion,
      telefono,
      correo,
      ci,
      telefono_referencia,
      estado,
      grado,
      situacion,
      contrasena,
      departamento,
      ciudad,
      genero,
      rol,
      sucursal,
      caja,
    } = req.body;

    switch (opcion) {
      case "crear":
        // Consulta SQL para insertar un nuevo empleado
        const sqlInsert = `
                INSERT INTO empleados 
                (Nombre, Apellido, Fecha_Nacimiento, Dirección, Teléfono, Email, CI, Telefono_referencia, Estado, 
                 Grado, Situacion, Contrasena, ID_Departamento, ID_Ciudad, ID_Genero, ID_Rol, ID_Sucursal, 
                 ID_Caja, Fotografia, Figura) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`;

        // Ejecutar la consulta con los datos y la foto
        conexion.query(
          sqlInsert,
          [
            nombre,
            apellido,
            fecha_nacimiento,
            direccion,
            telefono,
            correo,
            ci,
            telefono_referencia,
            estado,
            grado,
            situacion,
            contrasena,
            departamento,
            ciudad,
            genero,
            rol,
            sucursal,
            caja,
            nombreArchivo,
          ],
          (err, result) => {
            if (err) {
              console.error("Error al crear empleado:", err);
              res.status(500).send("Error al crear empleado");
            } else {
              console.log("Empleado creado:", result);
              res.redirect("/empleados");
            }
          }
        );
        break;

      case "editar":
        // Consulta SQL para actualizar los datos del empleado
        const sqlUpdate = `
                UPDATE empleados 
                SET 
                    Nombre = ?, 
                    Apellido = ?, 
                    Fecha_Nacimiento = ?, 
                    Dirección = ?, 
                    Teléfono = ?, 
                    Email = ?, 
                    CI = ?, 
                    Telefono_referencia = ?, 
                    Estado = ?, 
                    Grado = ?, 
                    Situacion = ?, 
                    Contrasena = ?, 
                    ID_Departamento = ?, 
                    ID_Ciudad = ?, 
                    ID_Genero = ?, 
                    ID_Rol = ?, 
                    ID_Sucursal = ?, 
                    ID_Caja = ?, 
                    Fotografia = ?
                WHERE ID_Empleado = ?`;

        // Ejecutar la consulta con los datos y la foto
        conexion.query(
          sqlUpdate,
          [
            nombre,
            apellido,
            fecha_nacimiento,
            direccion,
            telefono,
            correo,
            ci,
            telefono_referencia,
            estado,
            grado,
            situacion,
            contrasena,
            departamento,
            ciudad,
            genero,
            rol,
            sucursal,
            caja,
            nombreArchivo,
            id,
          ],
          (err, result) => {
            if (err) {
              console.error("Error al actualizar empleado:", err);
              res.status(500).send("Error al actualizar empleado");
            } else {
              console.log("Empleado actualizado:", result);
              res.redirect("/empleados");
            }
          }
        );
        break;

      case "eliminar":
        if (id) {
          // Consulta SQL para eliminar el empleado por ID
          const sqlDelete =
            "UPDATE empleados  SET  Figura = 2 WHERE ID_Empleado = ?";

          conexion.query(sqlDelete, [id], (err, result) => {
            if (err) {
              console.error("Error al eliminar empleado:", err);
              res.status(500).json({
                success: false,
                message: "Error al eliminar empleado",
              });
            } else {
              console.log("Empleado eliminado:", result);
              res.json({
                success: true,
                message: "Empleado eliminado con éxito",
              });
            }
          });
        } else {
          res
            .status(400)
            .json({ success: false, message: "ID no proporcionado" });
        }
        break;
      case "Restaurar":
        if (id) {
          // Consulta SQL para eliminar el empleado por ID
          const sqlDelete =
            "UPDATE empleados  SET  Figura = 1 WHERE ID_Empleado = ?";

          conexion.query(sqlDelete, [id], (err, result) => {
            if (err) {
              console.error("Error al Restaurar empleado:", err);
              res.status(500).json({
                success: false,
                message: "Error al Restaurar empleado",
              });
            } else {
              console.log("Empleado Restaurar:", result);
              res.json({
                success: true,
                message: "Empleado Restaurar con éxito",
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
