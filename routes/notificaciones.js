const express = require('express');
const router = express.Router();
const coneccion = require('../database/db'); 

router.get('/notificacion', (req, res) => {
    if(req.session.loggedin){
    coneccion.query('SELECT * FROM notificaciones WHERE Estado = 0', (err, notificaciones) => {
        if (err) {
            console.error(err); // Muestra el error en consola
            return res.status(500).send('Error al obtener notificaciones');
        }
        console.log(notificaciones); // Log de las notificaciones obtenidas
        res.render('notificaciones', { notificaciones });
    });
} else {
    res.render('./paginas/logout');
}
    
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

    const query = 'INSERT INTO notificaciones (Nombre, Correo, Descripcion, Estado) VALUES (?, ?, ?, 0)';
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
    if(req.session.loggedin){
        connection.query('SELECT * FROM notificaciones', (err, results) => {
            if (err) {
                console.error("Error en la base de datos:", err); // Log para depuración
                return res.status(500).send('Error en la base de datos');
            }
            res.json(results);
        });
    } else {
        res.render('./paginas/logout');
    }
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


//Desbloqueamos las cuentas y ponemos en leido las notificaciones
router.post('/notificaciones/desbloquear', (req, res) => {
    const { correo } = req.body;

    if (!correo) {
        return res.status(400).json({ message: 'Correo es requerido' });
    }

    console.log('Correo recibido:', correo); // Para verificar que el correo llega correctamente

    // Consulta SQL para actualizar el Grado en empleados
    const queryGrado = `UPDATE empleados SET Grado = 0 WHERE Email = ?`;

    // Consulta SQL para actualizar el Estado en notificaciones
    const queryEstado = `UPDATE notificaciones SET Estado = 1 WHERE Correo = ?`;

    // Ejecutar la primera consulta (actualización del Grado en empleados)
    coneccion.query(queryGrado, [correo], (errorGrado, resultsGrado) => {
        if (errorGrado) {
            console.error('Error al ejecutar la consulta de grado:', errorGrado);
            return res.status(500).json({ message: 'Error en la actualización del grado' });
        }

        // Verificar si se actualizó alguna fila en empleados
        if (resultsGrado.affectedRows === 0) {
            return res.status(404).json({ message: 'No se encontró un empleado con ese correo' });
        }

        // Solo ejecutar la segunda consulta si la primera fue exitosa
        coneccion.query(queryEstado, [correo], (errorEstado, resultsEstado) => {
            if (errorEstado) {
                console.error('Error al ejecutar la consulta de estado:', errorEstado);
                return res.status(500).json({ message: 'Error en la actualización del estado' });
            }

            // Verificar si se actualizó alguna fila en notificaciones
            if (resultsEstado.affectedRows === 0) {
                return res.status(404).json({ message: 'No se encontró una notificación con ese correo' });
            }

            // Recuperar la lista actualizada de notificaciones
            const queryNotificaciones = 'SELECT Nombre, Correo, Descripcion, Fecha FROM notificaciones WHERE Estado = 0 ORDER BY Fecha DESC';
            coneccion.query(queryNotificaciones, (error, results) => {
                if (error) {
                    return res.status(500).send('Error al obtener las notificaciones actualizadas');
                }

                res.json({ message: 'Actualización exitosa en grado y estado', notificaciones: results });
            });
        });
    });
});

//validar correo de empleados y notificaiones
router.post('/login/validar-correo', (req, res) => {
    const { correo } = req.body;

    // Consulta SQL para verificar si el correo existe en la tabla empleados
    const query = 'SELECT COUNT(*) AS count FROM empleados WHERE Email = ?';
    coneccion.query(query, [correo], (error, results) => {
        if (error) {
            console.error('Error al ejecutar la consulta:', error);
            return res.status(500).json({ message: 'Error en la validación' });
        }

        // Verifica si el correo existe
        const exists = results[0].count > 0;
        res.json({ exists });
    });
});

module.exports = router;