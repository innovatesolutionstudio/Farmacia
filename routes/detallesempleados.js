const express = require('express');
const router = express.Router();


router.get('/detallesempleados', async (req, res) => {
    const empleadoId = req.query.id;

    try {
        const empleado = await Empleado.findById(empleadoId); // Asegúrate de tener la lógica para encontrar al empleado por su ID
        if (!empleado) {
            return res.status(404).send('Empleado no encontrado');
        }
        res.render('detallesempleados', { empleado }); // Renderiza la vista con los datos del empleado
    } catch (error) {
        console.error(error);
        res.status(500).send('Error del servidor');
    }
});

module.exports = router;
