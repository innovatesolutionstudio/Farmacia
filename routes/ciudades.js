//invocamos a express
const express = require("express");
const router = express.Router();

//invocamos ala coneccion de la bd
const coneccion = require("../database/db");

router.get("/ciudades", function (req, res) {
  if (req.session.loggedin) {
    // Realiza la consulta a la base de datos para obtener los datos de la tabla "ciudades"
    coneccion.query(
      "SELECT * FROM ciudades WHERE figura = 1",
      (error, results) => {
        if (error) {
          console.error("Error al obtener datos de la tabla ciudades:", error);
          res.status(500).send("Error al obtener datos de la tabla ciudades");
        } else {
          // Renderiza la vista EJS y pasa los resultados de la consulta como variable
          res.render("./ciudades/ciudades", { results: results });
        }
      }
    );
  } else {
    res.render("./paginas/logout");
  }
});

router.get("/Papeleria_Ciudades", function (req, res) {
  if (req.session.loggedin) {
    // Realiza la consulta a la base de datos para obtener los datos de la tabla "ciudades"
    coneccion.query(
      "SELECT * FROM ciudades WHERE figura = 2",
      (error, results) => {
        if (error) {
          console.error("Error al obtener datos de la tabla ciudades:", error);
          res.status(500).send("Error al obtener datos de la tabla ciudades");
        } else {
          // Renderiza la vista EJS y pasa los resultados de la consulta como variable
          res.render("./ciudades/Papeleria_Ciudades", { results: results });
        }
      }
    );
  } else {
    res.render("./paginas/logout");
  }
});

router.post("/ciudades/:id?", function (req, res) {
  const id = req.params.id; // Obtener el ID de la ciudad, si se proporciona
  const opcion = req.body.opcion; // Obtener la opción (crear, editar, eliminar)

  switch (opcion) {
    case "crear":
      const nuevaCiudad = {
        Nombre: req.body.Nombre,
        Figura: 1,
      };

      // Verificar si la ciudad ya existe
      coneccion.query(
        "SELECT COUNT(*) AS count FROM ciudades WHERE Nombre = ?",
        [nuevaCiudad.Nombre],
        (error, results) => {
          if (error) {
            console.error(
              "Error al verificar la existencia de la ciudad:",
              error
            );
            return res
              .status(500)
              .send("Error al verificar la existencia de la ciudad");
          } else if (results[0].count > 0) {
            return res
              .status(400)
              .json({ message: "El nombre de la ciudad ya existe" });
          } else {
            // Insertar la nueva ciudad si no existe
            coneccion.query(
              "INSERT INTO ciudades SET ?",
              nuevaCiudad,
              (error, result) => {
                if (error) {
                  console.error("Error al crear una nueva ciudad:", error);
                  res.status(500).send("Error al crear una nueva ciudad");
                } else {
                  res.send("Ciudad creada correctamente");
                }
              }
            );
          }
        }
      );
      break;

    case "editar":
      const ciudadEditada = {
        Nombre: req.body.Nombre, // Obtener el nuevo nombre de la ciudad del cuerpo de la solicitud
      };

      // Verificar si el nuevo nombre ya existe en otra ciudad
      coneccion.query(
        "SELECT COUNT(*) AS count FROM ciudades WHERE Nombre = ? AND ID_Ciudad != ?",
        [ciudadEditada.Nombre, id],
        (error, results) => {
          if (error) {
            console.error(
              "Error al verificar la existencia de la ciudad:",
              error
            );
            return res
              .status(500)
              .send("Error al verificar la existencia de la ciudad");
          } else if (results[0].count > 0) {
            return res
              .status(400)
              .json({ message: "El nombre de la ciudad ya existe" });
          } else {
            // Actualizar la ciudad si el nombre no está en uso por otra ciudad
            coneccion.query(
              "UPDATE ciudades SET ? WHERE ID_Ciudad = ?",
              [ciudadEditada, id],
              (error, result) => {
                if (error) {
                  console.error("Error al editar la ciudad:", error);
                  res.status(500).send("Error al editar la ciudad");
                } else {
                  res.send("Ciudad editada correctamente");
                }
              }
            );
          }
        }
      );
      break;

    case "eliminar":
      coneccion.query(
        "UPDATE ciudades SET Figura = 2 WHERE ID_Ciudad = ?",
        id,
        (error, result) => {
          if (error) {
            console.error("Error al eliminar la ciudad:", error);
            res.status(500).send("Error al eliminar la ciudad");
          } else {
            res.send("Ciudad eliminada correctamente");
          }
        }
      );
      break;

    case "Restaurar":
      coneccion.query(
        "UPDATE ciudades SET Figura = 1 WHERE ID_Ciudad = ?",
        id,
        (error, result) => {
          if (error) {
            console.error("Error al restaurar la ciudad:", error);
            res.status(500).send("Error al restaurar la ciudad");
          } else {
            res.send("Ciudad restaurada correctamente");
          }
        }
      );
      break;

    default:
      res.status(400).send("Opción no válida");
      break;
  }
});

module.exports = router;
