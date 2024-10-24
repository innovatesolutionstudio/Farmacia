// Invocamos a Express y creamos un router
const express = require('express');
const router = express.Router();

// Invocamos a la conexión de la base de datos
const coneccion = require('../database/db');

// Ruta para obtener todas las sucursales
router.get('/sucursales', (req, res) => {
    coneccion.query(`
         SELECT s.ID_Sucursal, s.Nombre, s.Direccion, s.Telefono, s.Encargado, 
             c.Nombre as CiudadNombre, d.Nombre as DepartamentoNombre, p.Nombre as PaisNombre
      FROM sucursales s
      INNER JOIN ciudades c ON s.ID_Ciudad = c.ID_Ciudad
      INNER JOIN departamentos d ON s.ID_Departamento = d.ID_Departamento
      INNER JOIN paises p ON s.ID_Pais = p.ID_Pais
    `, (error, results) => {
        if (error) {
            console.error('Error al obtener datos de la tabla sucursales:', error);
            res.status(500).send('Error al obtener datos de la tabla sucursales');
        } else {
            res.render('./sucursales/sucursales', { results: results }); // Renderiza la vista EJS con los datos de sucursales
        }
    });
});



// Ruta para operaciones CRUD de sucursales
router.post('/sucursales/:id?', (req, res) => {
    const id = req.params.id; // Obtener el ID de la sucursal, si se proporciona
    const opcion = req.body.opcion; // Obtener la opción (crear, editar, eliminar)
    
    switch(opcion) {
        case 'crear':
            const nuevaSucursal = {
                Nombre: req.body.Nombre,
                Direccion: req.body.Direccion,
                Telefono: req.body.Telefono,
                Encargado: req.body.Encargado,
                ID_Ciudad: req.body.ID_Ciudad,
                ID_Departamento: req.body.ID_Departamento,
                ID_Pais: req.body.ID_Pais
            };
            coneccion.query('INSERT INTO sucursales SET ?', nuevaSucursal, (error, result) => {
                if (error) {
                    console.error('Error al crear una nueva sucursal:', error);
                    res.status(500).send('Error al crear una nueva sucursal');
                } else {
                    res.send('Sucursal creada correctamente');
                }
            });
            break;
        case 'editar':
            const sucursalEditada = {
                Nombre: req.body.Nombre,
                Direccion: req.body.Direccion,
                Telefono: req.body.Telefono,
                Encargado: req.body.Encargado,
                ID_Ciudad: req.body.ID_Ciudad,
                ID_Departamento: req.body.ID_Departamento,
                ID_Pais: req.body.ID_Pais
            };
            coneccion.query('UPDATE sucursales SET ? WHERE ID_Sucursal = ?', [sucursalEditada, id], (error, result) => {
                if (error) {
                    console.error('Error al editar la sucursal:', error);
                    res.status(500).send('Error al editar la sucursal');
                } else {
                    res.send('Sucursal editada correctamente');
                }
            });
            break;
        case 'eliminar':
            coneccion.query('DELETE FROM sucursales WHERE ID_Sucursal = ?', id, (error, result) => {
                if (error) {
                    console.error('Error al eliminar la sucursal:', error);
                    res.status(500).send('Error al eliminar la sucursal');
                } else {
                    res.send('Sucursal eliminada correctamente');
                }
            });
            break;
        default:
            res.status(400).send('Opción no válida');
            break;
    }
});

module.exports = router;
