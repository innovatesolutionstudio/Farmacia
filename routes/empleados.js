// invocamos a express
const express = require('express');
const router = express.Router();

// invocamos a la conexión de la base de datos
const conexion = require('../database/db');
const multer = require('multer');
const path = require('path');
// Configuración de Multer para almacenar archivos en la carpeta "resources/Fotografias"

let fotoRuta = ''; // Variable para almacenar la ruta de la foto

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './storage/img_empleados');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        fotoRuta = file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop();
        cb(null, fotoRuta);
    }
});
// Middleware de Multer para manejar la carga de archivos
const upload = multer({ storage });

router.post('/fotos', upload.single('Fotografia'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No se ha proporcionado ninguna imagen');
    }
    console.log("Imagen del empleado subida con éxito");
    res.send('Imagen subida correctamente');
});


  

router.get('/empleados', function(req, res) {
    const sucursalID = req.session.ID_Sucursal;
    // Realiza la consulta a la base de datos para obtener los datos de la tabla "empleados"
    conexion.query('SELECT * FROM empleados', (error, results) => {
        if (error) {
            console.error('Error al obtener datos de la tabla empleados:', error);
            res.status(500).send('Error al obtener datos de la tabla empleados');
        } else {
            // Consulta adicional para obtener los nombres de ciudades, departamentos, géneros, roles y sucursales
            const queries = [
                'SELECT ID_Ciudad, Nombre AS NombreCiudad FROM ciudades',
                'SELECT ID_Departamento, Nombre AS NombreDepartamento FROM departamentos',
                'SELECT ID_Generos, Nombre AS NombreGenero FROM generos',
                'SELECT ID_Rol, Nombre AS NombreRol FROM roles',
                'SELECT ID_Sucursal, Nombre AS NombreSucursal FROM sucursales',
                

            ];

            // Ejecuta las consultas en paralelo
            Promise.all(queries.map(query => new Promise((resolve, reject) => {
                conexion.query(query, (error, results) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(results);
                    }
                });
            }))).then(([ciudades, departamentos, generos, roles, sucursales]) => {
                // Mapea los resultados de las consultas a objetos clave-valor para facilitar la búsqueda
                const ciudadesMap = new Map(ciudades.map(ciudad => [ciudad.ID_Ciudad, ciudad.NombreCiudad]));
                const departamentosMap = new Map(departamentos.map(departamento => [departamento.ID_Departamento, departamento.NombreDepartamento]));
                const generosMap = new Map(generos.map(genero => [genero.ID_Generos, genero.NombreGenero]));
                const rolesMap = new Map(roles.map(rol => [rol.ID_Rol, rol.NombreRol]));
                const sucursalesMap = new Map(sucursales.map(sucursal => [sucursal.ID_Sucursal, sucursal.NombreSucursal]));
                
                // Mapea los resultados de la consulta de empleados y agrega los nombres correspondientes
                const empleados = results.map(empleado => ({
                    ...empleado,
                    NombreCiudad: ciudadesMap.get(empleado.ID_Ciudad),
                    NombreDepartamento: departamentosMap.get(empleado.ID_Departamento),
                    NombreGenero: generosMap.get(empleado.ID_Genero),
                    NombreRol: rolesMap.get(empleado.ID_Rol),
                    NombreSucursal: sucursalesMap.get(empleado.ID_Sucursal)
                }));

                // Renderiza la vista EJS y pasa los resultados de la consulta como variable
                res.render('./empleados/empleados', { results: empleados });
            }).catch(error => {
                console.error('Error al obtener datos adicionales:', error);
                res.status(500).send('Error al obtener datos adicionales');
            });
        }
    });
});

router.post('/empleados/:id?', function(req, res) {
    const id = req.params.id; // Obtener el ID del empleado, si se proporciona
    const opcion = req.body.opcion; // Obtener la opción (crear, editar, eliminar)
   
    switch(opcion) {
        case 'crear':
            const nuevoEmpleado = {
                Nombre: req.body.Nombre,
                Apellido: req.body.Apellido,
                Fecha_Nacimiento: req.body.Fecha_Nacimiento,
                Dirección: req.body.Dirección,
                Teléfono: req.body.Teléfono,
                Email: req.body.Email,
                CI: req.body.CI,
                Telefono_referencia: req.body.Telefono_referencia,
                ID_Departamento: req.body.ID_Departamento,
                ID_Ciudad: req.body.ID_Ciudad,
                ID_Genero: req.body.ID_Genero,
                ID_Rol: req.body.ID_Rol,
                Contrasena: req.body.Contrasena,
                Fotografia: fotoRuta, // Agrega la foto del empleado
                Estado: req.body.Estado, // Agrega el estado del empleado
                Grado: req.body.Grado, // Agrega el grado del empleado
                ID_Sucursal: req.body.ID_Sucursal, // Agrega el ID de la sucursal
                ID_Caja: req.body.ID_Caja // Agrega el ID de la caja
            };
            
            // Verificar si el correo electrónico ya existe en la base de datos
            conexion.query('SELECT COUNT(*) AS count FROM empleados WHERE Email = ?', nuevoEmpleado.Email, (error, result) => {
                if (error) {
                    console.error('Error al buscar el correo electrónico en la base de datos:', error);
                    res.status(500).send('Error al crear un nuevo empleado');
                } else {
                    const count = result[0].count;
                    if (count > 0) {
                        // Si el correo electrónico ya existe, enviar una alerta al cliente
                        res.render('tu_pagina', {
                            alert: true,
                            alertTitle: "Error",
                            alertMessage: "El correo electrónico ya está registrado. Por favor, ingresa otro.",
                            alertIcon: "error",
                            showConfirmButton: false, // No mostrar el botón de confirmación
                            timer: 3000, // Cerrar automáticamente la alerta después de 3 segundos
                            ruta: '/' // Ruta a la que redirigir después de cerrar la alerta (opcional)
                        });
                    } else {
                        // Si el correo electrónico no existe, insertar el nuevo empleado en la base de datos
                        conexion.query('INSERT INTO empleados SET ?', nuevoEmpleado, (error, result) => {
                            if (error) {
                                console.error('Error al crear un nuevo empleado:', error);
                                res.status(500).send('Error al crear un nuevo empleado');
                            } else {
                                res.send('Empleado creado correctamente');
                            }
                        });
                    }
                }
            });
        break;
        case 'editar':
            const empleadoEditado = {
                Nombre: req.body.Nombre,
                Apellido: req.body.Apellido,
                Fecha_Nacimiento: req.body.Fecha_Nacimiento,
                Dirección: req.body.Dirección,
                Teléfono: req.body.Teléfono,
                Email: req.body.Email,
                CI: req.body.CI,
                Telefono_referencia: req.body.Telefono_referencia,
                ID_Departamento: req.body.ID_Departamento,
                ID_Ciudad: req.body.ID_Ciudad,
                ID_Genero: req.body.ID_Genero,
                ID_Rol: req.body.ID_Rol,
                Contrasena: req.body.Contrasena,
                Fotografia: fotoRuta, // Agrega la foto del empleado
                Estado: req.body.Estado, // Agrega el estado del empleado
                Grado: req.body.Grado, // Agrega el grado del empleado
                ID_Sucursal: req.body.ID_Sucursal, // Agrega el ID de la sucursal
                ID_Caja: req.body.ID_Caja // Agrega el ID de la caja
            };
            conexion.query('UPDATE empleados SET ? WHERE ID_Empleado = ?', [empleadoEditado, id], (error, result) => {
                if (error) {
                    console.error('Error al editar el empleado:', error);
                    res.status(500).send('Error al editar el empleado');
                } else {
                    res.send('Empleado editado correctamente');
                }
            });
            break;
        case 'eliminar':
            conexion.query('DELETE FROM empleados WHERE ID_Empleado = ?', id, (error, result) => {
                if (error) {
                    console.error('Error al eliminar el empleado:', error);
                    res.status(500).send('Error al eliminar el empleado');
                } else {
                    res.send('Empleado eliminado correctamente');
                }
            });
            break;
        default:
            res.status(400).send('Opción no válida');
            break;
    }
    
});


const obtenerEmpleadoDestacado = () => {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT e.Nombre
            FROM empleados e
            JOIN ventas v ON e.ID_Empleado = v.ID_Empleado
            WHERE v.Fecha_Venta BETWEEN DATE_FORMAT(NOW(), '%Y-%m-01') AND NOW()
            GROUP BY e.ID_Empleado, e.Nombre
            ORDER BY COUNT(v.ID_Venta) DESC
            LIMIT 1;
      `;
      conexion.query(sql, (err, results) => {
        if (err) return reject(err);
        resolve(results[0]
            
         );
      });
    });
  };
  const obtenerTotalVentasEmpleado = () => {
    return new Promise((resolve, reject) => {
      const sql = `
      
  SELECT COUNT(v.ID_Venta) AS Total_Ventas
FROM empleados e
JOIN ventas v ON e.ID_Empleado = v.ID_Empleado
WHERE v.Fecha_Venta BETWEEN DATE_FORMAT(NOW(), '%Y-%m-01') AND NOW()
GROUP BY e.ID_Empleado
ORDER BY Total_Ventas DESC
LIMIT 1;

      `;
      conexion.query(sql, (err, results) => {
        if (err) return reject(err);
        resolve(results[0]
            
         );
      });
    });
  };

  const obtenerCodigoEmpleado = () => {
    return new Promise((resolve, reject) => {
      const sql = `
      
  SELECT c.Codigo AS CodigoCaja
  FROM empleados e
  JOIN ventas v ON e.ID_Empleado = v.ID_Empleado
  JOIN cajas c ON e.ID_Caja = c.ID_Caja
  WHERE v.Fecha_Venta BETWEEN DATE_FORMAT(NOW(), '%Y-%m-01') AND NOW()
  GROUP BY e.ID_Empleado, c.Codigo
  ORDER BY COUNT(v.ID_Venta) DESC
  LIMIT 1;

      `;
      conexion.query(sql, (err, results) => {
        if (err) return reject(err);
        resolve(results[0]
            
         );
      });
    });
  };
  
  const empleadosactivos = () => {
    return new Promise((resolve, reject) => {
      const sql = `
      
  SELECT COUNT(*) AS Total_Empleados_Activos
FROM empleados
WHERE Situacion = 1;

      `;
      conexion.query(sql, (err, results) => {
        if (err) return reject(err);
        resolve(results[0]
            
         );
      });
    });
  };
  

  const cajasactivas = () => {
    return new Promise((resolve, reject) => {
      const sql = `
      
  SELECT COUNT(*) AS Total_Cajas_Activas FROM cajas WHERE Estado = 1;

      `;
      conexion.query(sql, (err, results) => {
        if (err) return reject(err);
        resolve(results[0]
            
         );
      });
    });
  };
  

  router.get('/datoEmpleadoDestacado20s', async (req, res) => {
    try {
        const empleadoDestacado = await obtenerEmpleadoDestacado();
        const totalventas = await obtenerTotalVentasEmpleado();
        const codigoempleado = await obtenerCodigoEmpleado();
        const empleadoactivos = await empleadosactivos();
        const cajaactiva = await cajasactivas();
        res.json({
            empleadoDestacado: empleadoDestacado ? empleadoDestacado.Nombre : "no hay datos", // Enviando solo el nombre
            totalventas: totalventas ? totalventas.Total_Ventas : "no hay datos", // Enviando solo el nombre
            codigoempleado: codigoempleado ? codigoempleado.CodigoCaja : "no hay datos", // Enviando solo el nombre
            empleadoactivos: empleadoactivos ? empleadoactivos.Total_Empleados_Activos : "no hay datos", // Enviando solo el nombre
            cajaactiva: cajaactiva ? cajaactiva.Total_Cajas_Activas : "no hay datos" // Enviando solo el nombre
        });
    } catch (err) {
        console.error('Error al obtener los datos:', err);
        res.status(500).send('Error al obtener los datos');
    }
});

router.get('/detallesempleados/:id', async (req, res) => {
    const id = req.params.id; // Obtener el ID del empleado de la URL
    const nombre = req.params.nombre; // Obtener el ID del empleado de la URL
    console.log("Id del empleado " + id);
    conexion.query('SELECT * FROM empleados WHERE ID_Empleado = ?',[id], (error, results) => {
        if (error) {
            console.error('Error al obtener datos de la tabla del empleado:', error);
            
        } else {
            // Renderiza la vista EJS y pasa los resultados de la consulta como variable
            res.render('./empleados/detallesempleados', { results: results });
        }
    });
});





  
module.exports = router;