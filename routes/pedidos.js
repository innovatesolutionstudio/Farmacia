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
          CONCAT(c.Nombre, ' ', c.Apellido) AS NombreCliente,
          c.Codigo AS CodigoCliente, c.Nit,c.CI,
          v.Fecha_Venta,
          v.Total_Venta,v.ID_Venta,
          p.Direccion AS DireccionEntrega,
          DATE_FORMAT(p.Fecha_Entrega, '%Y/%m/%d') AS Fecha_Entrega,
          DATE_FORMAT(v.Fecha_Venta, '%Y/%m/%d') AS Fecha_Venta,
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
  

  router.get("/detallespedido_not/:id", async (req, res) => {
    if (req.session.loggedin) {
      const id = req.params.id;
  
      const query = `
            SELECT 
          p.ID_Pedido,
          CONCAT(c.Nombre, ' ', c.Apellido) AS NombreCliente,
          c.Codigo AS CodigoCliente, c.Nit,c.CI,
          v.Fecha_Venta,
          v.Total_Venta,v.ID_Venta,
          p.Direccion AS DireccionEntrega,
          DATE_FORMAT(p.Fecha_Entrega, '%Y/%m/%d') AS Fecha_Entrega,
          DATE_FORMAT(v.Fecha_Venta, '%Y/%m/%d') AS Fecha_Venta,
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
              res.render("./pedidos/detalle_pedido_notificacion", {
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

      // Devuelve los resultados como un objeto JSON con las claves esperadas por el frontend
      res.json({
        obtenerPedidoss: obtenerPedidoss?.totalpedidos || 0,
        ObtenerPedidosEnProcesos: ObtenerPedidosEnProcesos?.totalNotificaciones || 0,
        ObtenerPedidosEnCaminos: ObtenerPedidosEnCaminos?.totalNotificaciones || 0,
        ObtenerPedidosEntregados: ObtenerPedidosEntregados?.totalNotificaciones || 0,
      });
    } catch (err) {
      console.error("Error al obtener los datos:", err);
      res.status(500).send("Error al obtener los datos");
    }
  } else {
    res.render("./paginas/logout");
  }
});


router.get("/notificaciones_pedidos", (req, res) => {
  if (req.session.loggedin) {
    const sucursalID = req.session.ID_Sucursal;

    // Consulta para obtener los pedidos con estado 1, 2 y 3
    const query = `
      SELECT 
        p.ID_Pedido, 
        CONCAT(c.Nombre, ' ', c.Apellido) AS NombreCliente, 
        TIME_FORMAT(v.Fecha_Venta, '%H:%i') AS Hora_Venta,
        p.Estado 
      FROM pedidos p
      INNER JOIN ventas v ON p.ID_Venta = v.ID_Venta
      INNER JOIN clientes c ON p.ID_Cliente = c.ID_Cliente
      WHERE v.ID_Sucursal = ? AND p.Estado IN (1, 2, 3)
    `;

    conexion.query(query, [sucursalID], (error, results) => {
      if (error) {
        console.error("Error al obtener pedidos:", error);
        res.status(500).send("Error al obtener pedidos");
      } else {
        res.render("./pedidos/notificaciones", { pedidos: results });
      }
    });
  } else {
    res.render("./paginas/logout");
  }
});

router.get("/detalle_pedido_datos/:id", (req, res) => {
  const pedidoID = req.params.id;

  const query = `
    SELECT 
      v.Total_Venta,
      dis.Tatifa AS Tarifa,
      (v.Total_Venta + dis.Tatifa) AS Total,
      CONCAT(c.Nombre, ' ', c.Apellido) AS NombreCliente,
      c.CI AS CICliente,
      c.Telefono AS TelefonoCliente,
      p.Direccion AS Direccion,
      p.notas AS notas,
      dis.Numero_Distrito AS Distrito,
      ci.Nombre AS Ciudad
    FROM pedidos p
    INNER JOIN ventas v ON p.ID_Venta = v.ID_Venta
    LEFT JOIN distritos dis ON p.ID_Distrito = dis.ID_Distritos
    LEFT JOIN ciudades ci ON dis.ID_Ciudad = ci.ID_Ciudad
    INNER JOIN clientes c ON p.ID_Cliente = c.ID_Cliente
    WHERE p.ID_Pedido = ?
  `;

  conexion.query(query, [pedidoID], (error, results) => {
    if (error) {
      console.error("Error al obtener datos del pedido:", error);
      res.status(500).json({ error: "Error al obtener datos del pedido" });
    } else if (results.length === 0) {
      res.status(404).json({ error: "Pedido no encontrado" });
    } else {
      res.json(results[0]);
    }
  });
});
router.post("/actualizar_estado_pedido", (req, res) => {
  const { id, nuevoEstado } = req.body;

  const query = `UPDATE pedidos SET Estado = ? WHERE ID_Pedido = ?`;

  conexion.query(query, [nuevoEstado, id], (error, results) => {
    if (error) {
      console.error("Error al actualizar el estado del pedido:", error);
      res.status(500).json({ error: "Error al actualizar el estado del pedido" });
    } else {
      res.json({ message: "Estado actualizado correctamente" });
    }
  });
});



module.exports = router;
