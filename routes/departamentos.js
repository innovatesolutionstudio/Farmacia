// Invocamos a Express y creamos un enrutador
const express = require("express");
const router = express.Router();

// Invocamos a la conexión de la base de datos
const connection = require("../database/db");

// Ruta para obtener todos los departamentos
router.get("/departamentos", function (req, res) {
  if (req.session.loggedin) {
    // Realiza la consulta a la base de datos para obtener los datos de la tabla "departamentos"
    connection.query(
      "SELECT * FROM departamentos WHERE Figura = 1",
      (error, results) => {
        if (error) {
          console.error(
            "Error al obtener datos de la tabla departamentos:",
            error
          );
          res
            .status(500)
            .send("Error al obtener datos de la tabla departamentos");
        } else {
          // Renderiza la vista EJS y pasa los resultados de la consulta como variable
          res.render("./departamentos/departamentos", { results: results });
        }
      }
    );
  } else {
    res.render("./paginas/logout");
  }
});

// Ruta para obtener todos los departamentos
router.get("/Papeleria_departamentos", function (req, res) {
  if (req.session.loggedin) {
    // Realiza la consulta a la base de datos para obtener los datos de la tabla "departamentos"
    connection.query(
      "SELECT * FROM departamentos WHERE Figura = 2",
      (error, results) => {
        if (error) {
          console.error(
            "Error al obtener datos de la tabla departamentos:",
            error
          );
          res
            .status(500)
            .send("Error al obtener datos de la tabla departamentos");
        } else {
          // Renderiza la vista EJS y pasa los resultados de la consulta como variable
          res.render("./departamentos/Papeleria_departamentos", {
            results: results,
          });
        }
      }
    );
  } else {
    res.render("./paginas/logout");
  }
});
router.post("/departamentos/:id?", function (req, res) {
  const id = req.params.id; // Obtener el ID del departamento, si se proporciona
  const opcion = req.body.opcion; // Obtener la opción (crear, editar, eliminar)

  switch (opcion) {
    case "crear":
      const nuevoDepartamento = {
        Nombre: req.body.Nombre,
        Figura: 1,
      };

      // Verificar si el departamento ya existe
      connection.query(
        "SELECT COUNT(*) AS count FROM departamentos WHERE Nombre = ?",
        [nuevoDepartamento.Nombre],
        (error, results) => {
          if (error) {
            console.error(
              "Error al verificar la existencia del departamento:",
              error
            );
            return res
              .status(500)
              .send("Error al verificar la existencia del departamento");
          } else if (results[0].count > 0) {
            return res
              .status(400)
              .json({ message: "El nombre del departamento ya existe" });
          } else {
            // Insertar el nuevo departamento si no existe
            connection.query(
              "INSERT INTO departamentos SET ?",
              nuevoDepartamento,
              (error, result) => {
                if (error) {
                  console.error("Error al crear un nuevo departamento:", error);
                  res.status(500).send("Error al crear un nuevo departamento");
                } else {
                  res.send("Departamento creado correctamente");
                }
              }
            );
          }
        }
      );
      break;

    case "editar":
      const departamentoEditado = {
        Nombre: req.body.Nombre,
      };

      // Verificar si el nuevo nombre ya existe en otro departamento
      connection.query(
        "SELECT COUNT(*) AS count FROM departamentos WHERE Nombre = ? AND ID_Departamento != ?",
        [departamentoEditado.Nombre, id],
        (error, results) => {
          if (error) {
            console.error(
              "Error al verificar la existencia del departamento:",
              error
            );
            return res
              .status(500)
              .send("Error al verificar la existencia del departamento");
          } else if (results[0].count > 0) {
            return res
              .status(400)
              .json({ message: "El nombre del departamento ya existe" });
          } else {
            // Actualizar el departamento si el nombre no está en uso por otro departamento
            connection.query(
              "UPDATE departamentos SET ? WHERE ID_Departamento = ?",
              [departamentoEditado, id],
              (error, result) => {
                if (error) {
                  console.error("Error al editar el departamento:", error);
                  res.status(500).send("Error al editar el departamento");
                } else {
                  res.send("Departamento editado correctamente");
                }
              }
            );
          }
        }
      );
      break;

    case "eliminar":
      connection.query(
        "UPDATE departamentos SET Figura = 2 WHERE ID_Departamento = ?",
        id,
        (error, result) => {
          if (error) {
            console.error("Error al eliminar el departamento:", error);
            res.status(500).send("Error al eliminar el departamento");
          } else {
            res.send("Departamento eliminado correctamente");
          }
        }
      );
      break;

    case "restaurar":
      connection.query(
        "UPDATE departamentos SET Figura = 1 WHERE ID_Departamento = ?",
        id,
        (error, result) => {
          if (error) {
            console.error("Error al restaurar el departamento:", error);
            res.status(500).send("Error al restaurar el departamento");
          } else {
            res.send("Departamento restaurado correctamente");
          }
        }
      );
      break;

    default:
      res.status(400).send("Opción no válida");
      break;
  }
});

// Exportamos el enrutador
module.exports = router;
