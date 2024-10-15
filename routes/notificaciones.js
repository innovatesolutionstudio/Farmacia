const express = require('express');
const router = express.Router();
const coneccion = require('../database/db'); 

router.get('/notificacion', (req, res) => {
    coneccion.query('SELECT * FROM notificaciones WHERE Estado = 0', (err, notificaciones) => {
        if (err) {
            console.error(err); // Muestra el error en consola
            return res.status(500).send('Error al obtener notificaciones');
        }
        console.log(notificaciones); // Log de las notificaciones obtenidas
        res.render('notificaciones', { notificaciones });
    });
});





router.post('/notificar', (req, res) => {
    console.log(req.body); // Log de lo que se recibe

    const { nombre, correo, descripcion } = req.body || {};

    // Verifica si los datos están presentes
    if (!nombre || !correo || !descripcion) {
        return res.render('notificaciones', {
            alert: true,
            alertTitle: "Campos incompletos",
            alertMessage: "Todos los campos son obligatorios.",
            alertIcon: "warning",
            showConfirmButton: true,
            timer: false,
            ruta: 'notificaciones'
        });
    }

    const query = 'INSERT INTO notificaciones (Nombre, Correo, Descripcion) VALUES (?, ?, ?)';
    coneccion.query(query, [nombre, correo, descripcion], (error, results) => {
        if (error) {
            console.error('Error al insertar la notificación:', error);
            return res.status(500).send('Error al enviar la notificación');
        }
      res.redirect('/login'); 
    });


});

// Ruta para obtener notificaciones
router.get('/notificaciones', (req, res) => {
    connection.query('SELECT * FROM notificaciones', (err, results) => {
        if (err) {
            console.error("Error en la base de datos:", err); // Log para depuración
            return res.status(500).send('Error en la base de datos');
        }
        res.json(results);
    });
});


// Ruta para desbloquear cuentas
router.post('/desbloquear/:correo', (req, res) => { 
    const { correo } = req.params; // Obtener el correo de los parámetros
    console.log('Desbloqueando cuenta para:', correo); // Log para depuración

    connection.query('SELECT ID_Empleado, Grado FROM empleados WHERE Email = ?', [correo], (err, result) => {
        if (err) {
            console.error("Error al buscar el correo:", err); // Log de error
            return res.status(500).send('Error al buscar el correo');
        }

        if (result.length > 0) {
            const empleado = result[0];
            console.log('Grado del empleado:', empleado.Grado); // Log para depuración

            // Verificar si la cuenta está bloqueada (Grado >= 4)
            if (empleado.Grado >= 4) {
                // Desbloquear la cuenta
                connection.query('UPDATE empleados SET Grado = 0, Estado = 1 WHERE ID_Empleado = ?', [empleado.ID_Empleado], (err, updateResult) => {
                    if (err) {
                        console.error("Error al desbloquear la cuenta:", err); // Log de error
                        return res.status(500).send('Error al desbloquear la cuenta');
                    }
                    return res.json({ message: 'Cuenta desbloqueada exitosamente.' });
                });
            } else {
                return res.status(400).send('La cuenta no está bloqueada.');
            }
        } else {
            return res.status(404).send('Correo no encontrado.');
        }
    });
});

module.exports = router;