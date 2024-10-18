// Invocamos a express
const express = require('express');
const router = express.Router();

// Invocamos a la conexión de la base de datos
const connection = require('../database/db');

// Ruta para obtener todos los registros del inventario
router.get('/inventario_vista', function(req, res) {
    // Obtén el ID de la sucursal del empleado desde la sesión
    const idSucursalEmpleado = req.session.ID_Sucursal;

    // Realiza la consulta a la base de datos para obtener los datos de la tabla "inventario" filtrados por la sucursal
    connection.query('SELECT inventario.*, productos.Nombre AS Nombre_Producto FROM inventario INNER JOIN productos ON inventario.ID_Producto = productos.ID_Producto WHERE inventario.ID_Sucursal = ?', [idSucursalEmpleado], (error, results) => {
        if (error) {
            console.error('Error al obtener datos de la tabla inventario:', error);
            res.status(500).send('Error al obtener datos de la tabla inventario');
        } else {
            // Renderiza la vista EJS y pasa los resultados de la consulta como variable
            res.render('./inventario/inventario_vista', { 
                results: results,
                ID_Sucursal: idSucursalEmpleado
            });
        }
    });
});



module.exports = router;
