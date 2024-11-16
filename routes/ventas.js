// Invocamos a express
const express = require('express');
const router = express.Router();

// Invocamos a la conexión de la base de datos
const connection = require('../database/db');

router.get("/ventas", function (req, res) {
    if (req.session.loggedin) {
      const { fechaInicio, fechaFin } = req.query;
  
      let sql = `
        SELECT 
          v.ID_Venta, 
          v.Fecha_Venta, 
          v.Total_Venta, 
          v.ID_Cliente, 
          c.Nombre AS NombreCliente, 
          e.Nombre AS NombreEmpleado
        FROM ventas v
        LEFT JOIN clientes c ON v.ID_Cliente = c.ID_Cliente
        LEFT JOIN empleados e ON v.ID_Empleado = e.ID_Empleado
        WHERE (v.Estado IS NULL OR v.Estado != 2)
      `;
  
      // Si las fechas están presentes, agregar la cláusula WHERE
      if (fechaInicio && fechaFin) {
        sql += ` AND v.Fecha_Venta BETWEEN ? AND ? ORDER BY v.Fecha_Venta DESC`;
      } else {
        sql += ` ORDER BY v.Fecha_Venta DESC LIMIT 200`;
      }
  
      // Ejecutar la consulta con o sin parámetros según el filtro
      connection.query(
        sql,
        fechaInicio && fechaFin ? [fechaInicio, fechaFin] : [],
        (errorVentas, resultsVentas) => {
          if (errorVentas) {
            console.error("Error al obtener datos de la tabla ventas:", errorVentas);
            res.status(500).send("Error al obtener datos de la tabla ventas");
            return;
          }
  
          // Consultar datos de clientes
          connection.query(
            'SELECT ID_Cliente, CONCAT(Nombre, " ", Apellido) AS NombreCompleto FROM clientes',
            (errorClientes, resultadosClientes) => {
              if (errorClientes) {
                console.error("Error al obtener datos de la tabla clientes:", errorClientes);
                res.status(500).send("Error al obtener datos de la tabla clientes");
                return;
              }
  
              // Consultar datos de empleados
              connection.query(
                "SELECT * FROM empleados",
                (errorEmpleados, resultadosEmpleados) => {
                  if (errorEmpleados) {
                    console.error("Error al obtener datos de la tabla empleados:", errorEmpleados);
                    res.status(500).send("Error al obtener datos de la tabla empleados");
                    return;
                  }
  
                  // Renderizar la vista de ventas con los datos obtenidos
                  res.render("./ventas/ventas", {
                    results: resultsVentas,
                    clientes: resultadosClientes,
                    empleados: resultadosEmpleados,
                  });
                }
              );
            }
          );
        }
      );
    } else {
      res.render("./paginas/logout");
    }
  });
  

// Ruta para mostrar los detalles de una venta
router.get('/detalle_venta/:id', function(req, res) {
    var idVenta = req.params.id;
    connection.query(`
        SELECT v.ID_Venta, v.Fecha_Venta, v.Total_Venta, v.ID_Cliente,
               c.Nombre AS NombreCliente, e.Nombre AS NombreEmpleado,
               dv.Cantidad, p.Nombre AS NombreProducto, p.Precio_Unitario
        FROM ventas v
        INNER JOIN clientes c ON v.ID_Cliente = c.ID_Cliente
        INNER JOIN empleados e ON v.ID_Empleado = e.ID_Empleado
        INNER JOIN detalles_venta dv ON v.ID_Venta = dv.ID_Venta
        INNER JOIN productos p ON dv.ID_Producto = p.ID_Producto
        WHERE v.ID_Venta = ?
    `, [idVenta], (error, results) => {
        if (error) {
            console.error('Error al obtener detalles de la venta:', error);
            res.status(500).send('Error al obtener detalles de la venta');
        } else {
            if (results.length > 0) {
                // Agrupar detalles por cada venta
                const venta = {
                    ID_Venta: results[0].ID_Venta,
                    Fecha_Venta: results[0].Fecha_Venta,
                    Total_Venta: results[0].Total_Venta,
                    ID_Cliente: results[0].ID_Cliente,
                    NombreCliente: results[0].NombreCliente,
                    NombreEmpleado: results[0].NombreEmpleado,
                    detalles: []  // Aquí se almacenarán los detalles de productos
                };

                // Recorrer los resultados para crear objetos de detalle
                results.forEach(row => {
                    const detalle = {
                        NombreProducto: row.NombreProducto,
                        Cantidad: row.Cantidad,
                        Precio_Unitario: row.Precio_Unitario
                        // Agrega más campos si es necesario según tu estructura de datos
                    };
                    venta.detalles.push(detalle);  // Agregar detalle a la lista
                });

                // Renderizar la vista detalles_venta y pasar los datos
                res.render('./ventas/detalles_ventas', { venta: venta });
            } else {
                res.status(404).send('Venta no encontrada');
            }
        }
    });
});



router.post('/ventas/:id?', function(req, res) {
    const id = req.params.id; // Obtener el ID de la venta, si se proporciona
    const opcion = req.body.opcion; // Obtener la opción (crear, editar, eliminar)
    
    switch(opcion) {
        case 'crear':
            const nuevaVenta = {
                Fecha_Venta: req.body.Fecha,
                Total_Venta: req.body.Total_Venta,
                ID_Cliente: req.body.ID_Cliente,
                ID_Empleado: req.body.ID_Empleado
            };
            connection.query('INSERT INTO ventas SET ?', nuevaVenta, (error, result) => {
                if (error) {
                    console.error('Error al insertar una nueva venta:', error);
                    res.status(500).send('Error al insertar una nueva venta');
                } else {
                    res.status(200).send('Venta creada correctamente');
                }
            });
            break;
        case 'editar':
            const datosVenta = {
                Fecha_Venta: req.body.Fecha,
                Total_Venta: req.body.Total_Venta,
                ID_Cliente: req.body.ID_Cliente,
                ID_Empleado: req.body.ID_Empleado
            };
            connection.query('UPDATE ventas SET ? WHERE ID_Venta = ?', [datosVenta, id], (error, result) => {
                if (error) {
                    console.error('Error al actualizar la venta:', error);
                    res.status(500).send('Error al actualizar la venta');
                } else {
                    res.status(200).send('Venta actualizada correctamente');
                }
            });
            break;
        case 'eliminar':
            connection.query('UPDATE ventas SET Estado = 2 WHERE ID_Venta = ?', id, (error, result) => {
                if (error) {
                    console.error('Error al eliminar la venta:', error);
                    res.status(500).send('Error al eliminar la venta');
                } else {
                    res.status(200).send('Venta eliminada correctamente');
                }
            });
            break;
        default:
            res.status(400).send('Opción no válida');
            break;
    }
});

module.exports = router;
