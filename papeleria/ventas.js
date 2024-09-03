// Invocamos a express
const express = require('express');
const router = express.Router();

// Invocamos a la conexión de la base de datos
const connection = require('../database/db');




router.get('/ventas_p', function(req, res) {
    // Realiza la consulta a la base de datos para obtener los datos de la tabla "ventas"
    connection.query('SELECT v.ID_Venta, v.Fecha_Venta, v.Total_Venta, v.ID_Cliente, c.Nombre AS NombreCliente, e.Nombre AS NombreEmpleado FROM ventas v LEFT JOIN clientes c ON v.ID_Cliente = c.ID_Cliente LEFT JOIN empleados e ON v.ID_Empleado = e.ID_Empleado       WHERE v.Estado = 2  ORDER BY v.Fecha_Venta DESC  LIMIT 200;', (errorVentas, resultsVentas) => {
        if (errorVentas) {
            console.error('Error al obtener datos de la tabla ventas:', errorVentas);
            res.status(500).send('Error al obtener datos de la tabla ventas');
            return;
        } 

        connection.query('SELECT ID_Cliente, CONCAT(Nombre, " ", Apellido) AS NombreCompleto FROM clientes', (errorClientes, resultadosClientes) => {
            if (errorClientes) {
                console.error('Error al obtener datos de la tabla clientes:', errorClientes);
                res.status(500).send('Error al obtener datos de la tabla clientes');
                return;
            }
            // Consulta para obtener datos de empleados
            connection.query('SELECT * FROM empleados', (errorEmpleados, resultadosEmpleados) => {
                if (errorEmpleados) {
                    console.error('Error al obtener datos de la tabla empleados:', errorEmpleados);
                    res.status(500).send('Error al obtener datos de la tabla empleados');
                    return;
                }
                // Renderiza la vista EJS y pasa los resultados de la consulta como variables
                res.render('./papeleria/ventas', { 
                    results: resultsVentas,
                    clientes: resultadosClientes,
                    empleados: resultadosEmpleados
                });
            });
        });
    });
});



router.post('/ventas_p/:id?', function(req, res) {
    const id = req.params.id;
    const opcion = req.body.opcion;
    
    switch(opcion) {
      
        case 'restaurar':
            connection.query('UPDATE ventas SET Estado = 1 WHERE ID_Venta = ?', id, (error, result) => {
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
