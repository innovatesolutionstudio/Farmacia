const express = require("express");
const router = express.Router();
const coneccion = require("../database/db");


router.post("/notificar", (req, res) => {
  const { correo, descripcion } = req.body;

  // Verificar que ambos campos estén presentes
  if (!correo || !descripcion) {
    return res.render("login", {
      alert: true,
      alertTitle: "Campos incompletos",
      alertMessage: "Debe proporcionar un correo y una descripción.",
      alertIcon: "warning",
      showConfirmButton: true,
      timer: false,
      ruta: "notificaciones",
    });
  }

  // Buscar el empleado por correo
  const queryBuscarEmpleado = "SELECT ID_Empleado FROM empleados WHERE Email = ?";
  coneccion.query(queryBuscarEmpleado, [correo], (err, results) => {
    if (err) {
      console.error("Error al buscar el empleado:", err);
      return res.status(500).send("Error al buscar el empleado");
    }

    if (results.length === 0) {
      // Si no se encuentra el correo
      return res.render("login", {
        alert: true,
        alertTitle: "Correo no encontrado",
        alertMessage: "El correo no está registrado en el sistema.",
        alertIcon: "error",
        showConfirmButton: true,
        timer: false,
        ruta: "notificaciones",
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
        console.error("Error al insertar la notificación:", err);
        return res.status(500).send("Error al insertar la notificación");
      }

      // Redirigir con éxito
      return res.render("login", {
        alert: true,
        alertTitle: "Notificación enviada",
        alertMessage: "La notificación ha sido enviada correctamente.",
        alertIcon: "success",
        showConfirmButton: true,
        timer: 2000,
        ruta: "login",
      });
    });
  });
});


router.get("/notificaciones", (req, res) => {
  if (req.session.loggedin) {
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
      WHERE n.Estado = 1
      ORDER BY n.Fecha DESC
    `;
    coneccion.query(query, (err, results) => {
      if (err) {
        console.error("Error al obtener notificaciones:", err);
        return res.status(500).send("Error al obtener notificaciones");
      }

     
      res.render("notificaciones", { notificaciones: results });
    });
  } else {
    res.render("./paginas/logout");
  }
});



// Ruta para desbloquear cuentas
router.post("/desbloquear/:correo", (req, res) => {
  const { correo } = req.params; // Obtener el correo de los parámetros

  coneccion.query(
    "SELECT ID_Empleado, Grado FROM empleados WHERE Email = ?",
    [correo],
    (err, result) => {
      if (err) {
        console.error("Error al buscar el correo:", err); // Log de error
        return res.status(500).send("Error al buscar el correo");
      }

      if (result.length > 0) {
        const empleado = result[0];

        // Verificar si la cuenta está bloqueada (Grado >= 4)
        if (empleado.Grado >= 4) {
          // Desbloquear la cuenta
          coneccion.query(
            "UPDATE empleados SET Grado = 0, Estado = 1 WHERE ID_Empleado = ?",
            [empleado.ID_Empleado],
            (err, updateResult) => {
              if (err) {
                console.error("Error al desbloquear la cuenta:", err); // Log de error
                return res.status(500).send("Error al desbloquear la cuenta");
              }
              return res.json({ message: "Cuenta desbloqueada exitosamente." });
            }
          );
        } else {
          return res.status(400).send("La cuenta no está bloqueada.");
        }
      } else {
        return res.status(404).send("Correo no encontrado.");
      }
    }
  );
});

//Desbloqueamos las cuentas y ponemos en leido las notificaciones
router.post("/notificaciones/desbloquear", (req, res) => {
  const { correo } = req.body;

  if (!correo) {
    return res.status(400).json({ message: "Correo es requerido" });
  }


  // Consulta SQL para actualizar el Grado en empleados
  const queryGrado = `UPDATE empleados SET Grado = 0 WHERE Email = ?`;

  // Consulta SQL para actualizar el Estado en notificaciones
  const queryEstado = `UPDATE notificaciones SET Estado = 2 WHERE Correo = ?`;

  // Ejecutar la primera consulta (actualización del Grado en empleados)
  coneccion.query(queryGrado, [correo], (errorGrado, resultsGrado) => {
    if (errorGrado) {
      console.error("Error al ejecutar la consulta de grado:", errorGrado);
      return res
        .status(500)
        .json({ message: "Error en la actualización del grado" });
    }

    // Verificar si se actualizó alguna fila en empleados
    if (resultsGrado.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "No se encontró un empleado con ese correo" });
    }

    // Solo ejecutar la segunda consulta si la primera fue exitosa
    coneccion.query(queryEstado, [correo], (errorEstado, resultsEstado) => {
      if (errorEstado) {
        console.error("Error al ejecutar la consulta de estado:", errorEstado);
        return res
          .status(500)
          .json({ message: "Error en la actualización del estado" });
      }

      // Verificar si se actualizó alguna fila en notificaciones
      if (resultsEstado.affectedRows === 0) {
        return res
          .status(404)
          .json({ message: "No se encontró una notificación con ese correo" });
      }

      // Recuperar la lista actualizada de notificaciones
      const queryNotificaciones =
        "SELECT Nombre, Correo, Descripcion, Fecha FROM notificaciones WHERE Estado = 1 ORDER BY Fecha DESC";
        coneccion.query(queryNotificaciones, (error, results) => {
        if (error) {
          return res
            .status(500)
            .send("Error al obtener las notificaciones actualizadas");
        }

        res.json({
          message: "Actualización exitosa en grado y estado",
          notificaciones: results,
        });
      });
    });
  });
});


module.exports = router;
