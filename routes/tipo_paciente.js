// Invocamos a Express
const express = require('express');
const router = express.Router();

// Invocamos a la conexión de la base de datos
const connection = require('../database/db');

// Ruta para obtener todos los tipos de paciente
router.get('/tipo_paciente', function(req, res) {
    // Realiza la consulta a la base de datos para obtener los datos de la tabla "tipo_paciente"
    connection.query('SELECT * FROM tipo_paciente', (error, results) => {
        if (error) {
            console.error('Error al obtener datos de la tabla tipo_paciente:', error);
            res.status(500).send('Error al obtener datos de la tabla tipo_paciente');
        } else {
            // Renderiza la vista EJS y pasa los resultados de la consulta como variable
            res.render('./tipo_paciente/tipo_paciente', { results: results });
        }
    });
});

// Ruta para realizar operaciones CRUD en los tipos de paciente
router.post('/tipo_paciente/:id?', function(req, res) {
    const id = req.params.id; // Obtener el ID del tipo de paciente, si se proporciona
    const opcion = req.body.opcion; // Obtener la opción (crear, editar, eliminar)
    
    switch(opcion) {
        case 'crear':
            const nuevoTipoPaciente = {
                Nombre: req.body.Nombre // Obtener el nombre del tipo de paciente del cuerpo de la solicitud
            };
            connection.query('INSERT INTO tipo_paciente SET ?', nuevoTipoPaciente, (error, result) => {
                if (error) {
                    console.error('Error al crear un nuevo tipo de paciente:', error);
                    res.status(500).send('Error al crear un nuevo tipo de paciente');
                } else {
                    res.send('Tipo de paciente creado correctamente');
                }
            });
            break;
        case 'editar':
            const tipoPacienteEditado = {
                Nombre: req.body.Nombre // Obtener el nuevo nombre del tipo de paciente del cuerpo de la solicitud
            };
            connection.query('UPDATE tipo_paciente SET ? WHERE ID_Tipo_Paciente = ?', [tipoPacienteEditado, id], (error, result) => {
                if (error) {
                    console.error('Error al editar el tipo de paciente:', error);
                    res.status(500).send('Error al editar el tipo de paciente');
                } else {
                    res.send('Tipo de paciente editado correctamente');
                }
            });
            break;
        case 'eliminar':
            connection.query('DELETE FROM tipo_paciente WHERE ID_Tipo_Paciente = ?', id, (error, result) => {
                if (error) {
                    console.error('Error al eliminar el tipo de paciente:', error);
                    res.status(500).send('Error al eliminar el tipo de paciente');
                } else {
                    res.send('Tipo de paciente eliminado correctamente');
                }
            });
            break;
        default:
            res.status(400).send('Opción no válida');
            break;
    }
});

module.exports = router;
