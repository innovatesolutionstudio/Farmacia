// Invocamos a Express y creamos un router
const express = require('express');
const router = express.Router();

// Invocamos a la conexión de la base de datos
const coneccion = require('../database/db');


// Ruta para obtener todas las cajas y los datos de sucursales
router.get('/Rcajas', (req, res) => {
    if (req.session.loggedin) {
        const queryCajas = `
            SELECT c.ID_Caja, c.Codigo, c.Estado, s.Nombre as NombreSucursal, c.ID_Sucursal
            FROM cajas c
            LEFT JOIN sucursales s ON c.ID_Sucursal = s.ID_Sucursal
            WHERE c.Figura = 1
        `;

        const querySucursales = `SELECT ID_Sucursal, Nombre FROM sucursales`;

        coneccion.query(queryCajas, (error, cajas) => {
            if (error) {
                console.error('Error al obtener cajas:', error);
                res.status(500).send('Error al obtener datos de cajas');
            } else {
                coneccion.query(querySucursales, (error, sucursales) => {
                    if (error) {
                        console.error('Error al obtener sucursales:', error);
                        res.status(500).send('Error al obtener datos de sucursales');
                    } else {
                        res.render('./cajas/regis_cajas', {
                            results: cajas,
                            sucursales: sucursales
                        });
                    }
                });
            }
        });
    } else {
        res.render('./paginas/logout');
    }
});

// Ruta para obtener todas las cajas y los datos de sucursales
router.get('/Rcajas-P', (req, res) => {
    if (req.session.loggedin) {
        const queryCajas = `
            SELECT c.ID_Caja, c.Codigo, c.Estado, s.Nombre as NombreSucursal, c.ID_Sucursal
            FROM cajas c
            LEFT JOIN sucursales s ON c.ID_Sucursal = s.ID_Sucursal
            WHERE c.Figura = 2
        `;

        const querySucursales = `SELECT ID_Sucursal, Nombre FROM sucursales`;

        coneccion.query(queryCajas, (error, cajas) => {
            if (error) {
                console.error('Error al obtener cajas:', error);
                res.status(500).send('Error al obtener datos de cajas');
            } else {
                coneccion.query(querySucursales, (error, sucursales) => {
                    if (error) {
                        console.error('Error al obtener sucursales:', error);
                        res.status(500).send('Error al obtener datos de sucursales');
                    } else {
                        res.render('./cajas/regis_cajas_papeleria', {
                            results: cajas,
                            sucursales: sucursales
                        });
                    }
                });
            }
        });
    } else {
        res.render('./paginas/logout');
    }
});



// Ruta para operaciones CRUD de cajas
router.post('/Rcajas/:id?', (req, res) => {
    const id = req.params.id; // Obtener el ID de la caja, si se proporciona
    const opcion = req.body.opcion; // Obtener la opción (crear, editar, eliminar)
    
    switch(opcion) {
        case 'crear':
            const nuevaCaja = {
                Codigo: req.body.Codigo,
                ID_Sucursal: req.body.ID_Sucursal,
                Estado: 1,
                Figura: 1
            };
            coneccion.query('INSERT INTO cajas SET ?', nuevaCaja, (error, result) => {
                if (error) {
                    console.error('Error al crear una nueva caja:', error);
                    res.status(500).send('Error al crear una nueva caja');
                } else {
                    res.send('Caja creada correctamente');
                }
            });
            break;
        case 'editar':
            const cajaEditada = {
                Codigo: req.body.Codigo,
                ID_Sucursal: req.body.ID_Sucursal,
                Estado: req.body.Estado || 1
            };
            coneccion.query('UPDATE cajas SET ? WHERE ID_Caja = ?', [cajaEditada, id], (error, result) => {
                if (error) {
                    console.error('Error al editar la caja:', error);
                    res.status(500).send('Error al editar la caja');
                } else {
                    res.send('Caja editada correctamente');
                }
            });
            break;
        case 'eliminar':
            coneccion.query('UPDATE cajas SET Figura = 2 WHERE ID_Caja = ?', id, (error, result) => {
                if (error) {
                    console.error('Error al eliminar la caja:', error);
                    res.status(500).send('Error al eliminar la caja');
                } else {
                    res.send('Caja eliminada correctamente');
                }
            });
            break;
        case 'restaurar':
                coneccion.query('UPDATE cajas SET Figura = 1 WHERE ID_Caja = ?', id, (error, result) => {
                    if (error) {
                        console.error('Error al restaurar la caja:', error);
                        res.status(500).send('Error al restaurar la caja');
                    } else {
                        res.send('Caja restaurada correctamente');
                    }
                });
                break;
        default:
            res.status(400).send('Opción no válida');
            break;
    }
});

module.exports = router;
