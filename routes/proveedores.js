//invocamos a express
const express = require("express");
const router = express.Router();

//invocamos ala coneccion de la bd
const coneccion = require("../database/db");

// Ruta para obtener todos los registros de proveedores
router.get("/proveedores", function (req, res) {
  if (req.session.loggedin) {
    // Consultar todos los proveedores
    coneccion.query(
      "SELECT * FROM proveedores WHERE Figura = 1",
      (error, proveedores) => {
        if (error) {
          console.error(
            "Error al obtener datos de la tabla proveedores:",
            error
          );
          res
            .status(500)
            .send("Error al obtener datos de la tabla proveedores");
          return;
        }

        // Consultar nombres de ciudades para cada proveedor
        const consultasCiudades = proveedores.map((proveedor) => {
          return new Promise((resolve, reject) => {
            coneccion.query(
              "SELECT Nombre FROM ciudades WHERE ID_Ciudad = ?",
              proveedor.ID_Ciudad,
              (error, resultadosCiudad) => {
                if (error) {
                  reject(error);
                } else {
                  proveedor.Nombre_Ciudad = resultadosCiudad[0]?.Nombre || ""; // Usar el nombre de ciudad o cadena vacía si no hay resultados
                  resolve();
                }
              }
            );
          });
        });

        // Consultar nombres de departamentos para cada proveedor
        const consultasDepartamentos = proveedores.map((proveedor) => {
          return new Promise((resolve, reject) => {
            coneccion.query(
              "SELECT Nombre FROM departamentos WHERE ID_Departamento = ?",
              proveedor.ID_Departamento,
              (error, resultadosDepartamento) => {
                if (error) {
                  reject(error);
                } else {
                  proveedor.Nombre_Departamento =
                    resultadosDepartamento[0]?.Nombre || ""; // Usar el nombre de departamento o cadena vacía si no hay resultados
                  resolve();
                }
              }
            );
          });
        });

        // Consultar todos los países disponibles
        coneccion.query("SELECT * FROM paises", (error, resultadosPaises) => {
          if (error) {
            console.error("Error al obtener datos de la tabla paises:", error);
            res.status(500).send("Error al obtener datos de la tabla paises");
            return;
          }

          // Mapear los IDs de los países a sus nombres para facilitar la referencia
          const nombresPaises = {};
          resultadosPaises.forEach((pais) => {
            nombresPaises[pais.ID_Pais] = pais.Nombre;
          });

          // Asignar nombres de países a cada proveedor
          proveedores.forEach((proveedor) => {
            proveedor.Nombre_Pais = nombresPaises[proveedor.ID_Pais] || ""; // Usar el nombre de país o cadena vacía si no hay coincidencia
          });

          // Esperar a que todas las consultas de ciudades y departamentos se completen
          Promise.all([...consultasCiudades, ...consultasDepartamentos])
            .then(() => {
              // Renderizar la vista EJS y pasar los resultados de la consulta como variables
              res.render("./proveedores/proveedores", {
                proveedores: proveedores,
                paises: resultadosPaises,
              });
            })
            .catch((error) => {
              console.error("Error al obtener datos adicionales:", error);
              res.status(500).send("Error al obtener datos adicionales");
            });
        });
      }
    );
  } else {
    res.render("./paginas/logout");
  }
});

// Ruta para obtener todos los registros de proveedores
router.get("/proveedoresP", function (req, res) {
  if (req.session.loggedin) {
    // Consultar todos los proveedores
    coneccion.query(
      "SELECT * FROM proveedores WHERE Figura = 2",
      (error, proveedores) => {
        if (error) {
          console.error(
            "Error al obtener datos de la tabla proveedores:",
            error
          );
          res
            .status(500)
            .send("Error al obtener datos de la tabla proveedores");
          return;
        }

        // Consultar nombres de ciudades para cada proveedor
        const consultasCiudades = proveedores.map((proveedor) => {
          return new Promise((resolve, reject) => {
            coneccion.query(
              "SELECT Nombre FROM ciudades WHERE ID_Ciudad = ?",
              proveedor.ID_Ciudad,
              (error, resultadosCiudad) => {
                if (error) {
                  reject(error);
                } else {
                  proveedor.Nombre_Ciudad = resultadosCiudad[0]?.Nombre || ""; // Usar el nombre de ciudad o cadena vacía si no hay resultados
                  resolve();
                }
              }
            );
          });
        });

        // Consultar nombres de departamentos para cada proveedor
        const consultasDepartamentos = proveedores.map((proveedor) => {
          return new Promise((resolve, reject) => {
            coneccion.query(
              "SELECT Nombre FROM departamentos WHERE ID_Departamento = ?",
              proveedor.ID_Departamento,
              (error, resultadosDepartamento) => {
                if (error) {
                  reject(error);
                } else {
                  proveedor.Nombre_Departamento =
                    resultadosDepartamento[0]?.Nombre || ""; // Usar el nombre de departamento o cadena vacía si no hay resultados
                  resolve();
                }
              }
            );
          });
        });

        // Consultar todos los países disponibles
        coneccion.query("SELECT * FROM paises", (error, resultadosPaises) => {
          if (error) {
            console.error("Error al obtener datos de la tabla paises:", error);
            res.status(500).send("Error al obtener datos de la tabla paises");
            return;
          }

          // Mapear los IDs de los países a sus nombres para facilitar la referencia
          const nombresPaises = {};
          resultadosPaises.forEach((pais) => {
            nombresPaises[pais.ID_Pais] = pais.Nombre;
          });

          // Asignar nombres de países a cada proveedor
          proveedores.forEach((proveedor) => {
            proveedor.Nombre_Pais = nombresPaises[proveedor.ID_Pais] || ""; // Usar el nombre de país o cadena vacía si no hay coincidencia
          });

          // Esperar a que todas las consultas de ciudades y departamentos se completen
          Promise.all([...consultasCiudades, ...consultasDepartamentos])
            .then(() => {
              // Renderizar la vista EJS y pasar los resultados de la consulta como variables
              res.render("./proveedores/Papeleria_proveedores", {
                proveedores: proveedores,
                paises: resultadosPaises,
              });
            })
            .catch((error) => {
              console.error("Error al obtener datos adicionales:", error);
              res.status(500).send("Error al obtener datos adicionales");
            });
        });
      }
    );
  } else {
    res.render("./paginas/logout");
  }
});

router.get("/CrearProveedor", (req, res) => {
  if (req.session.loggedin) {
    res.render("./proveedores/nuevoproveedor");
  } else {
    res.render("./paginas/logout");
  }
});

router.get("/detalleProveedores/:id", async (req, res) => {
  if (req.session.loggedin) {
    const id = req.params.id;

    const query = `
        SELECT 
          p.ID_Proveedor, 
          p.Nombre AS NombreProveedor,
          p.Dirección,
          p.Nit,
          p.Nombre_encargado,
          p.Teléfono,
          p.Telefono_referencia,
          p.Email,
          pa.Nombre AS Pais,
          c.Nombre AS Ciudad,
          d.Nombre AS Departamento
        FROM proveedores p
        JOIN paises pa ON p.ID_Pais = pa.ID_Pais
        JOIN ciudades c ON p.ID_Ciudad = c.ID_Ciudad
        JOIN departamentos d ON p.ID_Departamento = d.ID_Departamento
        WHERE p.ID_Proveedor = ?
        LIMIT 1;
      `;

    coneccion.query(query, [id], (error, results) => {
      if (error) {
        console.error("Error al obtener datos del proveedor:", error);
        res.status(500).send("Error en la consulta");
      } else {
        res.render("./proveedores/detalleProveedor", { results: results });
      }
    });
  } else {
    res.render("./paginas/logout");
  }
});

router.get("/detalleProveedoresP/:id", async (req, res) => {
  if (req.session.loggedin) {
    const id = req.params.id;

    const query = `
        SELECT 
          p.ID_Proveedor, 
          p.Nombre AS NombreProveedor,
          p.Dirección,
          p.Nit,
          p.Nombre_encargado,
          p.Teléfono,
          p.Telefono_referencia,
          p.Email,
          pa.Nombre AS Pais,
          c.Nombre AS Ciudad,
          d.Nombre AS Departamento
        FROM proveedores p
        JOIN paises pa ON p.ID_Pais = pa.ID_Pais
        JOIN ciudades c ON p.ID_Ciudad = c.ID_Ciudad
        JOIN departamentos d ON p.ID_Departamento = d.ID_Departamento
        WHERE p.ID_Proveedor = ?
        LIMIT 1;
      `;

    coneccion.query(query, [id], (error, results) => {
      if (error) {
        console.error("Error al obtener datos del proveedor:", error);
        res.status(500).send("Error en la consulta");
      } else {
        res.render("./proveedores/detalleProveedorP", { results: results });
      }
    });
  } else {
    res.render("./paginas/logout");
  }
});

router.get("/EditProveedor/:id", async (req, res) => {
  if (req.session.loggedin) {
    const proveedorId = req.params.id;
    const sql = `
      SELECT 
        p.ID_Proveedor, p.Nombre, p.Dirección, p.Nit, p.Nombre_encargado, 
        p.Teléfono, p.Telefono_referencia, p.Email, 
        p.ID_Pais, p.ID_Ciudad, p.ID_Departamento,
        paises.Nombre AS Pais, ciudades.Nombre AS Ciudad, departamentos.Nombre AS Departamento
      FROM proveedores p
      LEFT JOIN paises ON p.ID_Pais = paises.ID_Pais
      LEFT JOIN ciudades ON p.ID_Ciudad = ciudades.ID_Ciudad
      LEFT JOIN departamentos ON p.ID_Departamento = departamentos.ID_Departamento
      WHERE p.ID_Proveedor = ?
    `;

    coneccion.query(sql, [proveedorId], (err, results) => {
      if (err) {
        console.error("Error al obtener proveedor:", err);
        res.status(500).json({ error: "Error interno del servidor" });
        return;
      }

      if (results.length > 0) {
        const proveedor = results[0];
        res.render("proveedores/editarproveedor", { proveedor });
      } else {
        res.status(404).send("Proveedor no encontrado");
      }
    });
  } else {
    res.render("./paginas/logout");
  }
});

router.post("/proveedores/:id?", function (req, res) {
  const id = req.params.id || req.body.ID; // Obtener el ID del proveedor, si se proporciona
  const opcion = req.body.opcion; // Obtener la opción (crear, editar, eliminar)

  console.log(req.body);
  switch (opcion) {
    case "crear":
      const nuevoProveedor = {
        Nombre: req.body.Nombre,
        Dirección: req.body.Dirección,
        Nit: req.body.Nit,
        Nombre_encargado: req.body.Nombre_encargado,
        Teléfono: req.body.Teléfono,
        Telefono_referencia: req.body.Telefono_referencia,
        Email: req.body.Email,
        ID_Pais: req.body.ID_Pais,
        ID_Ciudad: req.body.ID_Ciudad,
        ID_Departamento: req.body.ID_Departamento,
        Figura: 1,
      };
      console.log(nuevoProveedor);
      coneccion.query(
        "INSERT INTO proveedores SET ?",
        nuevoProveedor,
        (error, result) => {
          if (error) {
            console.error("Error al insertar un nuevo proveedor:", error);
            res.status(500).send("Error al insertar un nuevo proveedor");
          } else {
            res.redirect("/proveedores?success=create");
          }
        }
      );
      break;

    case "editar":
      const datosProveedor = {
        Nombre: req.body.nombre,
        Dirección: req.body.direccion,
        Nit: req.body.nit,
        Nombre_encargado: req.body.nombre_encargado,
        Teléfono: req.body.telefono,
        Telefono_referencia: req.body.telefono_referencia,
        Email: req.body.email,
        ID_Pais: req.body.pais,
        ID_Ciudad: req.body.ciudad,
        ID_Departamento: req.body.departamento,
      };
      coneccion.query(
        "UPDATE proveedores SET ? WHERE ID_Proveedor = ?",
        [datosProveedor, id],
        (error, result) => {
          if (error) {
            console.error("Error al actualizar el proveedor:", error);
            res.status(500).send("Error al actualizar el proveedor");
          } else {
            // Redirige a la página de detalles del proveedor con el parámetro success=edit
            res.redirect(`/proveedores`);
          }
        }
      );
      break;

    case "eliminar":
      coneccion.query(
        "UPDATE proveedores SET Figura = 2 WHERE ID_Proveedor = ?",
        id,
        (error, result) => {
          if (error) {
            console.error("Error al eliminar el proveedor:", error);
            res.status(500).send("Error al eliminar el proveedor");
          } else {
            res.redirect("/proveedores?success=delete");
          }
        }
      );
      break;
    case "restaurar":
      coneccion.query(
        "UPDATE proveedores SET Figura = 1 WHERE ID_Proveedor = ?",
        id,
        (error, result) => {
          if (error) {
            console.error("Error al restaurar el proveedor:", error);
            res.status(500).send("Error al restaurar el proveedor");
          } else {
            res.redirect("/proveedores?success=restaurar");
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
