// Invocamos a express
const express = require('express');
const router = express.Router();

// Invocamos a la conexión de la base de datos
const connection = require('../database/db');


// Ruta para obtener todos los registros del inventario
router.get('/inventario_vista', function(req, res) {
    if (req.session.loggedin) {
        // Obtén el ID de la sucursal del empleado desde la sesión
        const idSucursalEmpleado = req.session.ID_Sucursal;

        // Realiza la consulta a la base de datos para obtener los datos de la tabla "inventario" filtrados por la sucursal
        connection.query('SELECT inventario.*, productos.Nombre AS Nombre_Producto FROM inventario INNER JOIN productos ON inventario.ID_Producto = productos.ID_Producto WHERE inventario.ID_Sucursal = ?', [idSucursalEmpleado], (error, results) => {
            if (error) {
                console.error('Error al obtener datos de la tabla inventario:', error);
                res.status(500).send('Error al obtener datos de la tabla inventario');
            } else {
                // Renderiza la vista EJS y pasa los resultados de la consulta como variable
                res.render('./inventario/inventario_vista', { 
                    results: results,
                    ID_Sucursal: idSucursalEmpleado
                });
            }
        });
    } else {
        res.render("./paginas/logout");
    }
});

router.get("/detallesproductos_inventario/:id", async (req, res) => {
    if (req.session.loggedin) {
        const id = req.params.id;
    
        const query = `
            SELECT 
                p.ID_Producto,
                p.Nombre AS NombreProducto,
                p.Descripcion,
                p.Precio_Unitario,
                p.Codigo,
                p.Fotografia,
                p.Indicaciones,
                p.Dosis_Medicacmento,
                p.Riesgo_Embarazo,
                p.Efectos_Secundarios,
                p.Precauciones,
                p.Generaliadades,
                c.Nombre_Categoria AS Categoria,
                prov.Nombre AS Proveedor,
                area.Nombre AS AreaProducto,
                paciente.Nombre AS TipoPaciente,
                via.Nombre AS TipoAdministracion,
                unidad.Nombre AS UnidadVenta
            FROM productos p
            LEFT JOIN categorias_productos c ON p.ID_Categoria = c.ID_Categoria
            LEFT JOIN proveedores prov ON p.ID_Proveedor = prov.ID_Proveedor
            LEFT JOIN area_producto area ON p.ID_Area_Producto = area.ID_Area_Producto
            LEFT JOIN tipo_paciente paciente ON p.ID_Tipo_Paciente = paciente.ID_Tipo_Paciente
            LEFT JOIN tipo_vias_administracion_producto via ON p.ID_Tipo_vias_administracion = via.ID_Tipo_Administracion_Producto
            LEFT JOIN unidad_venta unidad ON p.ID_Unidad_Venta = unidad.ID_Unidad_Venta
            WHERE p.ID_Producto = ?
            LIMIT 1;
            `;
    
        connection.query(query, [id], (error, results) => {
        if (error) {
            console.error("Error al obtener datos de la tabla productos:", error);
            res.status(500).send("Error en la consulta");
        } else {
            res.render("./inventario/detallesproductos_inventario", { results: results });
        }
        });
    } else {
        res.render("./paginas/logout");
    }
  });
  


// Ruta para obtener todos los registros del inventario
router.get('/inventario', function(req, res) {
    if (req.session.loggedin) {
        // Realiza la consulta a la base de datos para obtener los datos de la tabla "inventario"
        connection.query('SELECT inventario.*, productos.Nombre AS Nombre_Producto, sucursales.Nombre AS Nombre_Sucursal FROM inventario INNER JOIN productos ON inventario.ID_Producto = productos.ID_Producto INNER JOIN sucursales ON inventario.ID_Sucursal = sucursales.ID_Sucursal', (error, results) => {
            if (error) {
                console.error('Error al obtener datos de la tabla inventario:', error);
                res.status(500).send('Error al obtener datos de la tabla inventario');
            } else {
                // Renderiza la vista EJS y pasa los resultados de la consulta como variable
                res.render('./inventario/inventario', { results: results });
            }
        });
    } else {
        res.render("./paginas/logout");
    }
});




// Ruta para realizar operaciones CRUD en la tabla "inventario"
router.post('/inventario/:id?', function(req, res) {
    const id = req.params.id; // Obtener el ID del registro de inventario, si se proporciona
    const opcion = req.body.opcion; // Obtener la opción (crear, editar, eliminar)
    
    switch(opcion) {
        case 'crear':
            const nuevoRegistro = {
                ID_Producto: req.body.ID_Producto,
                Cantidad: req.body.Cantidad,
                ID_Sucursal: req.body.ID_Sucursal
            };
            connection.query('INSERT INTO inventario SET ?', nuevoRegistro, (error, result) => {
                if (error) {
                    console.error('Error al insertar un nuevo registro de inventario:', error);
                    res.status(500).send('Error al insertar un nuevo registro de inventario');
                } else {
                    res.status(200).send('Registro de inventario creado correctamente');
                }
            });
            break;
        case 'editar':
            const datosEditados = {
                ID_Producto: req.body.ID_Producto,
                Cantidad: req.body.Cantidad,
                ID_Sucursal: req.body.ID_Sucursal
            };
            connection.query('UPDATE inventario SET ? WHERE ID_Inventario = ?', [datosEditados, id], (error, result) => {
                if (error) {
                    console.error('Error al actualizar el registro de inventario:', error);
                    res.status(500).send('Error al actualizar el registro de inventario');
                } else {
                    res.status(200).send('Registro de inventario actualizado correctamente');
                }
            });
            break;
        case 'eliminar':
            connection.query('DELETE FROM inventario WHERE ID_Inventario = ?', id, (error, result) => {
                if (error) {
                    console.error('Error al eliminar el registro de inventario:', error);
                    res.status(500).send('Error al eliminar el registro de inventario');
                } else {
                    res.status(200).send('Registro de inventario eliminado correctamente');
                }
            });
            break;
        default:
            res.status(400).send('Opción no válida');
            break;
    }
});

module.exports = router;
