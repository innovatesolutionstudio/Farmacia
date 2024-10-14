// Invocamos a Express
const express = require('express');
const router = express.Router();

// Invocamos a la conexión de la base de datos
const connection = require('../database/db');

router.get('/adminCaja', (req, res) => {
    if (req.session.loggedin) {
        const codigoCaja = req.query.codigo;  // Recuperamos el código de la caja desde la URL
        const today = new Date();

  
        // Verifica si se ha pasado el código de la caja
        if (!codigoCaja) {
            return res.status(400).send('Código de caja no proporcionado');
        }



        // Obtener detalles de la caja, empleado, apertura, cierre y ventas del día
        connection.query(`
            SELECT e.Nombre AS Empleado_Nombre, e.Apellido, c.Codigo, 
                   MAX(hca.Abertura) AS Ultima_Apertura, 
                   MAX(hcc.Cierre) AS Ultimo_Cierre, 
                   IFNULL(COUNT(v.ID_Venta), 0) AS Clientes_Facturados, 
                   IFNULL(SUM(v.Total_Venta), 0) AS Ventas_Totales
            FROM cajas c
            LEFT JOIN empleados e ON e.ID_Caja = c.ID_Caja
            LEFT JOIN historial_caja_abierta hca ON hca.ID_Caja = c.ID_Caja
            LEFT JOIN historial_caja_cerrada hcc ON hcc.ID_Caja = c.ID_Caja
            LEFT JOIN ventas v ON v.ID_Caja = c.ID_Caja AND v.Fecha_Venta BETWEEN CURDATE() AND NOW()
            WHERE c.Codigo = ?
            GROUP BY e.Nombre, e.Apellido, c.Codigo
        `, [ codigoCaja], (error, results) => {
            if (error) {
                console.error('Error al obtener los detalles de la caja:', error);
                res.status(500).send('Error interno del servidor');
                return;
            }

            if (results.length > 0) {
                const cajaInfo = results[0];

                // Formatear las horas de apertura y cierre a formato HH:MM
                const aperturaCaja = cajaInfo.Ultima_Apertura ? new Date(cajaInfo.Ultima_Apertura).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'No registrado';
                const cierreCaja = cajaInfo.Ultimo_Cierre ? new Date(cajaInfo.Ultimo_Cierre).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'No registrado';

                // Realizamos una segunda consulta para obtener las ventas del día
                connection.query(`
                    SELECT v.ID_Venta, c.Nombre AS Cliente_Nombre, c.CI, v.Fecha_Venta, v.Total_Venta
                    FROM ventas v
                    JOIN clientes c ON v.ID_Cliente = c.ID_Cliente
                    WHERE v.ID_Caja = (SELECT ID_Caja FROM cajas WHERE Codigo = ?) 
                    AND v.Fecha_Venta BETWEEN CURDATE() AND NOW()
                `, [codigoCaja], (error, ventasClientes) => {
                    if (error) {
                        console.error('Error al obtener las ventas del día:', error);
                        res.status(500).send('Error interno del servidor');
                        return;
                    }

                    // Renderizamos la vista con los datos de la caja y las ventas del día
                    res.render('./cajas/admCaja', {
                        nombreEmpleado: `${cajaInfo.Empleado_Nombre} ${cajaInfo.Apellido}`,
                        codigoCaja: cajaInfo.Codigo,
                        aperturaCaja: aperturaCaja,
                        cierreCaja: cierreCaja,
                        clientesFacturados: cajaInfo.Clientes_Facturados,
                        ventasTotales: cajaInfo.Ventas_Totales,
                        ventasClientes: ventasClientes  // Pasamos las ventas del día a la vista
                    });
                });
            } else {
                res.status(404).send('Caja no encontrada');
            }
        });
    } else {
        res.render('./paginas/logout');
    }
});


module.exports = router;
