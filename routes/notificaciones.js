const express = require("express");
const router = express.Router();
const coneccion = require("../database/db");

router.post('/notificar', (req, res) => {
  const { correo, descripcion } = req.body;

  // Verificar que ambos campos estén presentes
  if (!correo || !descripcion) {
    return res.status(400).json({
      alert: true,
      alertTitle: 'Campos incompletos',
      alertMessage: 'Debe proporcionar un correo y una descripción.',
      alertIcon: 'warning',
      showConfirmButton: true,
      timer: false,
      ruta: 'login'
    });
  }

  // Buscar el empleado por correo
  const queryBuscarEmpleado = 'SELECT ID_Empleado FROM empleados WHERE Email = ?';
  coneccion.query(queryBuscarEmpleado, [correo], (err, results) => {
    if (err) {
      console.error('Error al buscar el empleado:', err);
      return res.status(500).send('Error al buscar el empleado');
    }

    if (results.length === 0) {
      // Si no se encuentra el correo
      return res.status(404).json({
        alert: true,
        alertTitle: 'Correo no encontrado',
        alertMessage: 'El correo no está registrado en el sistema.',
        alertIcon: 'error',
        showConfirmButton: true,
        timer: false,
        ruta: 'login'
      });
    }

    // Obtener el ID del empleado
    const empleadoID = results[0].ID_Empleado;

    // Insertar la notificación en la tabla notificaciones
    const queryInsertarNotificacion = `
      INSERT INTO notificaciones (ID_Empleado, Descripcion, Estado)
      VALUES (?, ?, 1)
    `;
    coneccion.query(queryInsertarNotificacion, [empleadoID, descripcion], (err) => {
      if (err) {
        console.error('Error al insertar la notificación:', err);
        return res.status(500).send('Error al insertar la notificación');
      }

      // Responder con éxito
      return res.status(200).json({
        alert: true,
        alertTitle: 'Notificación enviada',
        alertMessage: 'La notificación ha sido enviada correctamente.',
        alertIcon: 'success',
        showConfirmButton: true,
        timer: 2000,
        ruta: 'login'
      });
    });
  });
});


router.get("/notificaciones", (req, res) => {
  if (req.session.loggedin) {
    console.log(req.session.ID_Rol);
    const { ID_Sucursal } = req.session;
    const rol = req.session.ID_Rol;
    const query = `
      SELECT 
        e.Nombre AS Nombre,
        e.Email AS Correo,
        IFNULL(r.Nombre, 'Sin rol asignado') AS Rol,
        n.Descripcion,
        n.Fecha
      FROM notificaciones n
      JOIN empleados e ON n.ID_Empleado = e.ID_Empleado
      LEFT JOIN roles r ON e.ID_Rol = r.ID_Rol
      WHERE n.Estado = 1 AND e.ID_Sucursal = ?
      ORDER BY n.Fecha DESC
    `;
    coneccion.query(query, [ID_Sucursal], (err, results) => {
      if (err) {
        console.error("Error al obtener notificaciones:", err);
        return res.status(500).send("Error al obtener notificaciones");
      }

     
      res.render("notificaciones", { notificaciones: results,rol});
    });
  } else {
    res.render("./paginas/logout");
  }
});


// Ruta para desbloquear empleados y actualizar notificaciones
router.post("/notificaciones/desbloquear", (req, res) => {
  const { correo } = req.body;

  if (!correo) {
    return res.status(400).json({ message: "El correo es requerido" });
  }

  // Consulta para actualizar el Grado del empleado
  const queryActualizarGrado = "UPDATE empleados SET Grado = 0 WHERE Email = ?";

  // Ejecutar la actualización del Grado
  coneccion.query(queryActualizarGrado, [correo], (errorGrado, resultadoGrado) => {
    if (errorGrado) {
      console.error("Error al actualizar el grado del empleado:", errorGrado);
      return res.status(500).json({ message: "Error al actualizar el grado del empleado" });
    }

    if (resultadoGrado.affectedRows === 0) {
      return res.status(404).json({ message: "No se encontró un empleado con ese correo" });
    }

    // Consulta para actualizar el Estado de las notificaciones relacionadas
    const queryActualizarEstado = "UPDATE notificaciones SET Estado = 2 WHERE ID_Empleado = (SELECT ID_Empleado FROM empleados WHERE Email = ?)";

    // Ejecutar la actualización del Estado
    coneccion.query(queryActualizarEstado, [correo], (errorEstado, resultadoEstado) => {
      if (errorEstado) {
        console.error("Error al actualizar el estado de las notificaciones:", errorEstado);
        return res.status(500).json({ message: "Error al actualizar el estado de las notificaciones" });
      }

      // Responder con éxito
      res.json({ message: "Empleado desbloqueado y notificaciones actualizadas correctamente" });
    });
  });
});



module.exports = router;
