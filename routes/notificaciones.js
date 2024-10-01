const express = require('express');
const router = express.Router();
const coneccion = require('../database/db'); 

// Ruta para obtener las notificaciones
router.get('/notificacion', (req, res) => {
    const query = 'SELECT Nombre, Correo, Descripcion, Fecha FROM notificaciones ORDER BY Fecha DESC';
    coneccion.query(query, (error, results) => {
        if (error) {
            return res.status(500).send('Error al obtener las notificaciones');
        }
        res.render('./notificaciones', { notificaciones: results }); // Asegúrate de que el nombre del archivo sea correcto
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

module.exports = router;