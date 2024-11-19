const express = require("express");
const router = express.Router();
const pool = require("../database/db"); // Importar el pool

router.post("/auth", async (req, res) => {
  const email = req.body.Email.toLowerCase();
  const password = req.body.pass;

  // Verificar si los campos están llenos
  if (!email || !password) {
    return res.render("login", {
      alert: true,
      alertTitle: "Advertencia",
      alertMessage: "Ingrese su correo electrónico y contraseña",
      alertIcon: "warning",
      showConfirmButton: true,
      timer: false,
      ruta: "login",
    });
  }

  // Verificar si la contraseña cumple con los requisitos de longitud
  if (password.length < 8) {
    return res.render("login", {
      alert: true,
      alertTitle: "Advertencia",
      alertMessage: "La contraseña debe tener al menos 8 caracteres.",
      alertIcon: "warning",
      showConfirmButton: true,
      timer: false,
      ruta: "login",
    });
  }

  // Verificar si la contraseña contiene al menos un número y un carácter especial
  if (!/\d/.test(password) || !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return res.render("login", {
      alert: true,
      alertTitle: "Advertencia",
      alertMessage:
        "La contraseña debe contener al menos un número y un carácter especial.",
      alertIcon: "warning",
      showConfirmButton: true,
      timer: false,
      ruta: "login",
    });
  }

  // Consultar la base de datos para verificar las credenciales
  pool.query(
    "SELECT * FROM empleados WHERE Email = ?",
    [email],
    async (error, results) => {
      if (error) {
        console.error("Error en la consulta:", error);
        return res.status(500).send("Error interno del servidor");
      }

      const userData = results[0];

      // Verificar si el usuario existe
      if (!userData) {
        return res.render("login", {
          alert: true,
          alertTitle: "Error",
          alertMessage: "Usuario o contraseña incorrectos",
          alertIcon: "error",
          showConfirmButton: true,
          timer: false,
          ruta: "login",
        });
      }

      // Verificar si la cuenta está bloqueada
      if (userData.Grado >= 4) {
        return res.render("login", {
          alert: true,
          alertTitle: "¡Cuenta bloqueada!",
          alertMessage: "Por favor, contáctese con el administrador.",
          alertIcon: "warning",
          showConfirmButton: true,
          timer: false,
          ruta: "login",
        });
      }

      // Verificar credenciales correctas
      if (userData.Email === email && userData.Contrasena === password) {
        const fecha = new Date();
        const ID_empleado = userData.ID_Empleado;

        if (userData.Situacion === 2) {
          return res.render("login", {
            alert: true,
            alertTitle: "Sesión Activa en Otro Dispositivo",
            alertMessage: "Tu cuenta ha iniciado sesión en otro dispositivo.",
            alertIcon: "info",
            showConfirmButton: true,
            timer: false,
            ruta: "login",
          });
        } else if (userData.Situacion === 1) {
          pool.query(
            "UPDATE empleados SET Situacion = 1 WHERE Email = ?",
            [email],
            (updateError, updateResults) => {
              if (updateError) {
                console.log("Error al actualizar Situacion:", updateError);
              }
            }
          );

          pool.query(
            "INSERT INTO historial (Fecha, ID_Empleado) VALUES (?, ?)",
            [fecha, ID_empleado],
            (insertError, insertResults) => {
              if (insertError) {
                console.error(
                  "Error al insertar en el historial:",
                  insertError
                );
              }
            }
          );

          req.session.loggedin = true;
          req.session.Nombre = userData.Nombre;
          req.session.Apellido = userData.Apellido;
          req.session.Fotografia = userData.Fotografia;
          req.session.Dirección = userData.Dirección;
          req.session.Teléfono = userData.Teléfono;
          req.session.ID_Rol = userData.ID_Rol;
          req.session.ID_Empleado = userData.ID_Empleado;
          req.session.ID_Sucursal = userData.ID_Sucursal;
          req.session.ID_Caja = userData.ID_Caja;
          req.session.Situacion = userData.Situacion;

          return res.render("login", {
            alert: true,
            alertTitle: "Conexión exitosa",
            alertMessage: "Inicio de sesión correcto",
            alertIcon: "success",
            showConfirmButton: true,
            timer: false,
            ruta: "index",
          });
        }
      }

      if (userData.Email === email && userData.Contrasena !== password) {
        const newGrado = userData.Grado + 1;
        pool.query(
          "UPDATE empleados SET Grado = ? WHERE Email = ?",
          [newGrado, email],
          (updateError, updateResults) => {
            if (updateError) {
              console.log("Error al actualizar el grado:", updateError);
            }
          }
        );
        return res.render("login", {
          alert: true,
          alertTitle: "Contraseña Incorrecta",
          alertMessage:
            "Ingrese su contraseña correcta o su cuenta será bloqueada",
          alertIcon: "warning",
          showConfirmButton: true,
          timer: false,
          ruta: "login",
        });
      }

      return res.render("login", {
        alert: true,
        alertTitle: "Error",
        alertMessage: "Ha ocurrido un error inesperado",
        alertIcon: "error",
        showConfirmButton: true,
        timer: false,
        ruta: "login",
      });
    }
  );
});

module.exports = router;
