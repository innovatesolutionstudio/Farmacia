//invocamos a express
const express = require('express');
const router = express.Router();

//invocamos ala coneccion de la bd
const coneccion = require('../database/db');

// Ruta para obtener todos los registros de proveedores
router.get('/proveedores', function(req, res) {
    // Consultar todos los proveedores
    coneccion.query('SELECT * FROM proveedores', (error, proveedores) => {
        if (error) {
            console.error('Error al obtener datos de la tabla proveedores:', error);
            res.status(500).send('Error al obtener datos de la tabla proveedores');
            return;
        }

        // Consultar nombres de ciudades para cada proveedor
        const consultasCiudades = proveedores.map((proveedor) => {
            return new Promise((resolve, reject) => {
                coneccion.query('SELECT Nombre FROM ciudades WHERE ID_Ciudad = ?', proveedor.ID_Ciudad, (error, resultadosCiudad) => {
                    if (error) {
                        reject(error);
                    } else {
                        proveedor.Nombre_Ciudad = resultadosCiudad[0]?.Nombre || ''; // Usar el nombre de ciudad o cadena vacía si no hay resultados
                        resolve();
                    }
                });
            });
        });

        // Consultar nombres de departamentos para cada proveedor
        const consultasDepartamentos = proveedores.map((proveedor) => {
            return new Promise((resolve, reject) => {
                coneccion.query('SELECT Nombre FROM departamentos WHERE ID_Departamento = ?', proveedor.ID_Departamento, (error, resultadosDepartamento) => {
                    if (error) {
                        reject(error);
                    } else {
                        proveedor.Nombre_Departamento = resultadosDepartamento[0]?.Nombre || ''; // Usar el nombre de departamento o cadena vacía si no hay resultados
                        resolve();
                    }
                });
            });
        });

        // Consultar todos los países disponibles
        coneccion.query('SELECT * FROM paises', (error, resultadosPaises) => {
            if (error) {
                console.error('Error al obtener datos de la tabla paises:', error);
                res.status(500).send('Error al obtener datos de la tabla paises');
                return;
            }

            // Mapear los IDs de los países a sus nombres para facilitar la referencia
            const nombresPaises = {};
            resultadosPaises.forEach((pais) => {
                nombresPaises[pais.ID_Pais] = pais.Nombre;
            });

            // Asignar nombres de países a cada proveedor
            proveedores.forEach((proveedor) => {
                proveedor.Nombre_Pais = nombresPaises[proveedor.ID_Pais] || ''; // Usar el nombre de país o cadena vacía si no hay coincidencia
            });

            // Esperar a que todas las consultas de ciudades y departamentos se completen
            Promise.all([...consultasCiudades, ...consultasDepartamentos])
                .then(() => {
                    // Renderizar la vista EJS y pasar los resultados de la consulta como variables
                    res.render('./proveedores/proveedores', { proveedores: proveedores, paises: resultadosPaises });
                })
                .catch((error) => {
                    console.error('Error al obtener datos adicionales:', error);
                    res.status(500).send('Error al obtener datos adicionales');
                });
        });
    });
});


router.post('/proveedores/:id?', function(req, res) {
    const id = req.params.id; // Obtener el ID del proveedor, si se proporciona
    const opcion = req.body.opcion; // Obtener la opción (crear, editar, eliminar)
    
    switch(opcion) {
        case 'crear':
            const nuevoProveedor = {
                Nombre: req.body.Nombre,
                Dirección: req.body.Dirección,
                Nit: req.body.Nit,
                Nombre_encargado: req.body.Nombre_encargado,
                Teléfono: req.body.Teléfono,
                Telefono_referencia: req.body.Telefono_referencia,
                Email: req.body.Email,
                ID_Pais: req.body.ID_Pais,
                ID_Ciudad: req.body.ID_Ciudad,
                ID_Departamento: req.body.ID_Departamento
            };
            coneccion.query('INSERT INTO proveedores SET ?', nuevoProveedor, (error, result) => {
                if (error) {
                    console.error('Error al insertar un nuevo proveedor:', error);
                    res.status(500).send('Error al insertar un nuevo proveedor');
                } else {
                    res.status(200).send('Proveedor creado correctamente');
                }
            });
            break;
        case 'editar':
            const datosProveedor = {
                Nombre: req.body.Nombre,
                Dirección: req.body.Dirección,
                Nit: req.body.Nit,
                Nombre_encargado: req.body.Nombre_encargado,
                Teléfono: req.body.Teléfono,
                Telefono_referencia: req.body.Telefono_referencia,
                Email: req.body.Email,
                ID_Pais: req.body.ID_Pais,
                ID_Ciudad: req.body.ID_Ciudad,
                ID_Departamento: req.body.ID_Departamento
            };
            coneccion.query('UPDATE proveedores SET ? WHERE ID_Proveedor = ?', [datosProveedor, id], (error, result) => {
                if (error) {
                    console.error('Error al actualizar el proveedor:', error);
                    res.status(500).send('Error al actualizar el proveedor');
                } else {
                    res.status(200).send('Proveedor actualizado correctamente');
                }
            });
            break;
        case 'eliminar':
            coneccion.query('DELETE FROM proveedores WHERE ID_Proveedor = ?', id, (error, result) => {
                if (error) {
                    console.error('Error al eliminar el proveedor:', error);
                    res.status(500).send('Error al eliminar el proveedor');
                } else {
                    res.status(200).send('Proveedor eliminado correctamente');
                }
            });
            break;
        default:
            res.status(400).send('Opción no válida');
            break;
    }
});

module.exports = router;
