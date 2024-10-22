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


router.get('/detallesempleados/:id', async (req, res) => {
    const id = req.params.id;
   // Establecer el idioma para los nombres de mes y día en español


    const query = `
        SELECT e.ID_Empleado, e.Nombre, e.Apellido, e.Email, e.CI, e.Teléfono, e.Telefono_referencia,  e.Fotografia AS Fotografia,
       DATE_FORMAT(e.Fecha_Nacimiento, '%d/%m/%Y') AS Fecha_Nacimiento, e.Dirección,
        g.Nombre AS Genero, d.Nombre AS Departamento, c.Nombre AS Ciudad, r.Nombre AS Rol, 
        s.Nombre AS Sucursal, e.Contrasena, e.Grado, e.Estado, a.Codigo AS Caja
    FROM empleados e
    JOIN generos g ON e.ID_Genero = g.ID_Generos
    JOIN departamentos d ON e.ID_Departamento = d.ID_Departamento
    JOIN ciudades c ON e.ID_Ciudad = c.ID_Ciudad
    JOIN roles r ON e.ID_Rol = r.ID_Rol
    JOIN sucursales s ON e.ID_Sucursal = s.ID_Sucursal
    JOIN cajas a ON a.ID_Caja = a.ID_Caja
    WHERE e.ID_Empleado = ?
    LIMIT 1;

    `;

    conexion.query(query, [id], (error, results) => {
        if (error) {
            console.error('Error al obtener datos de la tabla del empleado:', error);
            res.status(500).send('Error en la consulta');
        } else {
            res.render('./empleados/detallesempleados', { results: results });
        }
    });
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

router.get('/EditEmpleados/:id', async (req, res) => {
    const empleadoId = req.params.id;
    const sql = `SELECT DATE_FORMAT(Fecha_Nacimiento, '%Y-%m-%d') AS Fecha_Nacimiento,
                  Nombre, Apellido, Dirección, Teléfono, Email, CI, Telefono_referencia, ID_Departamento,
                  ID_Ciudad, ID_Genero, ID_Rol, Contrasena, Fotografia, Estado, Grado, ID_Sucursal, ID_Caja, Situacion
                  FROM empleados 
                  WHERE ID_Empleado = ?`; 

    conexion.query(sql, [empleadoId], (err, results) => {
        if (err) {
            console.error('Error al obtener empleado:', err);
            res.status(500).json({ error: 'Error interno del servidor' });
            return;
        }

        if (results.length > 0) {
            const empleado = results[0]; // Obtenemos el primer (y único) resultado
            res.render('empleados/editarempleado', { empleado }); // Aquí pasamos el objeto 'empleado'
        } else {
            res.status(404).send('Empleado no encontrado');
        }
    });
});

router.post('/empleados/:id?', function(req, res) {
    const id = req.params.id;
    const opcion = req.body.opcion;

    console.log("Datos recibidos del formulario:", req.body); // Para ver los datos enviados

    switch(opcion) {
        case 'crear':
            const { nombre, apellido, fecha_nacimiento, direccion, telefono, correo, ci, telefono_referencia, 
                    estado, grado, situacion, contrasena, departamento, ciudad, genero, rol, sucursal, caja } = req.body;

            const sqlInsert = `
                INSERT INTO empleados 
                (Nombre, Apellido, Fecha_Nacimiento, Dirección, Teléfono, Email, CI, Telefono_referencia, 
                Estado, Grado, Situacion, Contrasena, ID_Departamento, ID_Ciudad, ID_Genero, ID_Rol, ID_Sucursal, ID_Caja) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

            conexion.query(sqlInsert, [nombre, apellido, fecha_nacimiento, direccion, telefono, correo, ci, telefono_referencia, 
                                       estado, grado, situacion, contrasena, departamento, ciudad, genero, rol, sucursal, caja], 
            (err, result) => {
                if (err) {
                    console.error('Error al crear empleado:', err);
                    res.status(500).send('Error al crear empleado');
                } else {
                    console.log("Empleado creado:", result); // Confirmar que se ha creado el empleado
                    res.redirect('/empleados');
                }
            });
            break;

        case 'editar':
            const { nombre: nombreEdit, apellido: apellidoEdit, fecha_nacimiento: fechaNacimientoEdit, 
                    direccion: direccionEdit, telefono: telefonoEdit, correo: correoEdit, ci: ciEdit, 
                    telefono_referencia: telefonoReferenciaEdit, estado: estadoEdit, grado: gradoEdit, 
                    situacion: situacionEdit, contrasena: contrasenaEdit, departamento: departamentoEdit, 
                    ciudad: ciudadEdit, genero: generoEdit, rol: rolEdit, sucursal: sucursalEdit, caja: cajaEdit } = req.body;

            const sqlUpdate = `
                UPDATE empleados 
                SET 
                    Nombre = ?, 
                    Apellido = ?, 
                    Fecha_Nacimiento = ?, 
                    Dirección = ?, 
                    Teléfono = ?, 
                    Email = ?, 
                    CI = ?, 
                    Telefono_referencia = ?, 
                    Estado = ?, 
                    Grado = ?, 
                    Situacion = ?, 
                    Contrasena = ?, 
                    ID_Departamento = ?, 
                    ID_Ciudad = ?, 
                    ID_Genero = ?, 
                    ID_Rol = ?, 
                    ID_Sucursal = ?, 
                    ID_Caja = ?
                WHERE ID_Empleado = ?`;

            conexion.query(sqlUpdate, [nombreEdit, apellidoEdit, fechaNacimientoEdit, direccionEdit, telefonoEdit, correoEdit, 
                                       ciEdit, telefonoReferenciaEdit, estadoEdit, gradoEdit, situacionEdit, contrasenaEdit, 
                                       departamentoEdit, ciudadEdit, generoEdit, rolEdit, sucursalEdit, cajaEdit, id], 
            (err, result) => {
                if (err) {
                    console.error('Error al actualizar empleado:', err);
                    res.status(500).send('Error al actualizar empleado');
                } else {
                    console.log("Empleado actualizado:", result); // Confirmar que se ha actualizado el empleado
                    res.redirect('/empleados');
                }
            });
            break;

        case 'eliminar':
            const sqlDelete = `DELETE FROM empleados WHERE ID_Empleado = ?`;
            conexion.query(sqlDelete, [id], (err, result) => {
                if (err) {
                    console.error('Error al eliminar empleado:', err);
                    res.status(500).send('Error al eliminar empleado');
                } else {
                    console.log("Empleado eliminado:", result); // Confirmar que se ha eliminado el empleado
                    res.redirect('/empleados');
                }
            });
            break;

        default:
            res.status(400).send('Opción no válida');
            break;
    }
});


module.exports = router;