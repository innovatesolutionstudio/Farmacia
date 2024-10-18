// Invocamos a Express
const express = require('express');
const router = express.Router();

// Invocamos a la conexión de la base de datos
const connection = require('../database/db');

router.get('/adminCaja', (req, res) => {
    if (req.session.loggedin) {
        const codigoCaja = req.query.codigo;
        if (!codigoCaja) {
            return res.status(400).send('Código de caja no proporcionado');
        }

        // Primera consulta: Obtener detalles de la caja y del empleado
        connection.query(`
            SELECT c.ID_Caja, c.Codigo, c.Estado, e.ID_Empleado, e.Nombre AS Empleado_Nombre, 
                   MAX(hca.Abertura) AS Ultima_Apertura, MAX(hcc.Cierre) AS Ultimo_Cierre
            FROM cajas c
            LEFT JOIN empleados e ON c.ID_Caja = e.ID_Caja
            LEFT JOIN historial_caja_abierta hca ON hca.ID_Caja = c.ID_Caja
            LEFT JOIN historial_caja_cerrada hcc ON hcc.ID_Caja = c.ID_Caja
            WHERE c.Codigo = ?
            GROUP BY c.ID_Caja, e.ID_Empleado, e.Nombre;
        `, [codigoCaja], (error, results) => {
            if (error) {
                console.error('Error al obtener los detalles de la caja:', error);
                res.status(500).send('Error interno del servidor');
                return;
            }

            if (results.length > 0) {
                const cajaInfo = results[0];
                const aperturaCaja = cajaInfo.Ultima_Apertura ? new Date(cajaInfo.Ultima_Apertura).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'No registrado';
                const cierreCaja = cajaInfo.Ultimo_Cierre ? new Date(cajaInfo.Ultimo_Cierre).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'No registrado';

                // Segunda consulta: Obtener el total de ventas del día
                connection.query(`
                    SELECT IFNULL(SUM(Total_Venta), 0) AS ventatotal, COUNT(ID_Venta) AS clientesFacturados
                    FROM ventas
                    WHERE ID_Caja = (SELECT ID_Caja FROM cajas WHERE Codigo = ?)
                    AND Fecha_Venta BETWEEN CURDATE() AND NOW();
                `, [codigoCaja], (error, ventasTotales) => {
                    if (error) {
                        console.error('Error al obtener el total de ventas:', error);
                        res.status(500).send('Error interno del servidor');
                        return;
                    }

                    // Tercera consulta: Obtener las ventas del día y detalles de los clientes
                    connection.query(`
                        SELECT v.ID_Venta, c.Nombre AS Cliente_Nombre, c.CI, v.Fecha_Venta, v.Total_Venta
                        FROM ventas v
                        JOIN clientes c ON v.ID_Cliente = c.ID_Cliente
                        WHERE v.ID_Caja = (SELECT ID_Caja FROM cajas WHERE Codigo = ?)
                        AND v.Fecha_Venta BETWEEN CURDATE() AND NOW();
                    `, [codigoCaja], (error, ventasClientes) => {
                        if (error) {
                            console.error('Error al obtener las ventas del día:', error);
                            res.status(500).send('Error interno del servidor');
                            return;
                        }

                        // Renderizamos la vista con los datos de la caja, ventas totales y ventas del día
                        res.render('./cajas/admCaja', {
                            nombreEmpleado: `${cajaInfo.Empleado_Nombre}`,
                            codigoCaja: cajaInfo.Codigo,
                            aperturaCaja: aperturaCaja,
                            cierreCaja: cierreCaja,
                            clientesFacturados: ventasTotales[0].clientesFacturados,  // Enviamos el total de clientes facturados
                            ventasTotales: ventasTotales[0].ventatotal,              // Enviamos el total de ventas
                            ventasClientes: ventasClientes                           // Enviamos los detalles de las ventas
                        });
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
