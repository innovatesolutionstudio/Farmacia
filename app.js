//invocamos a express
const express = require('express');
const app = express();

const ciudadesRoutes = require('./routes/ciudades');
const proveedoresRoutes = require('./routes/proveedores');
const ventasRoutes = require('./routes/ventas');
const detallesventasRoutes = require('./routes/detalles_ventas');
const clientesRoutes = require('./routes/clientes');
const inventarioRoutes = require('./routes/inventario');
const inventario_vistaRoutes = require('./routes/inventario_vista');
const productosRoutes = require('./routes/productos');
const nuevaventaRoutes = require('./routes/nueva_venta');
const ganancias_esRoutes = require('./routes/ganancias_es');
const paisesRoutes = require('./routes/paises');
const departamentosRoutes = require('./routes/departamentos');
const empleadosRoutes = require('./routes/empleados');
const unidad_ventaRoutes = require('./routes/unidad_venta');
const area_productoRoutes = require('./routes/area_producto');
const categoria_productoRoutes = require('./routes/categoria_producto');
const tipo_pacienteRoutes = require('./routes/tipo_paciente');
const tipo_vias_administracionRoutes = require('./routes/vias_administracion');
const comprasRoutes = require('./routes/compras');
const detalles_comprasRoutes = require('./routes/detalles_compras');
const unidad_empaqueRoutes = require('./routes/unidad_empaque');
const venta_espeRoutes = require('./routes/venta_espe');
const cajasRoutes = require('./routes/cajas');
const nueva_compraRoutes = require('./routes/nueva_compra');
// const detallesempleadosRoutes = require('./routes/detallesempleados');

const rolesRoutes = require('./routes/roles');
const sucursalesRoutes = require('./routes/sucursales');
const vista_ventas = require('./routes/vista_ventas');
const rutas_login = require('./routes/login');
const adminCajas = require('./routes/admincajas');
const vistareportes = require('./routes/vista_reportes');

const vistafinanzas = require('./routes/vista_Finanzas');
// Añade esta línea al principio de tu app.js
const notificacionesRoutes = require('./routes/notificaciones');

//#endregion
const graficosRouter = require('./routes/graficos'); // Ajusta la ruta según la ubicación de tu archivo graficos.js
 
//reportes
const generador_reportesRoutes = require('./routes/generador_reportes');
const reportestareasRoutes = require('./routes/reporte_tareas');
const reporte_fut_ventasRoutes = require('./routes/reporte_fut_ventas');
const reporte_compras_GRoutes = require('./routes/reporte_compras_G');
const reporte_Productos_VRoutes = require('./routes/reporte_Productos_V');
const reporte_ventasRoutes = require('./routes/reporte_ventas');
const reporte_proveedoresRoutes = require('./routes/reporte_proveedores');

//impresiones
const impre_ciudades = require('./routes/impre_ciudades');
const impre_paises = require('./routes/impre_paises');
const impre_departamentos = require('./routes/impre_departamentos');
const impre_unidad_venta = require('./routes/impre_unidad_venta');
const impre_empleado = require('./routes/impre_empleado');
const impre_proveedor = require('./routes/impre_proveedor');
const impre_unidad_empaque = require('./routes/impre_unidad_empaque');
const impre_areas_producto = require('./routes/impre_areas_producto');
const impre_categoria = require('./routes/impre_categoria');
const impre_tipo_paciente = require('./routes/impre_tipo_paciente');
const impre_clientes = require('./routes/impre_clientes');


//papeleria
const ventas_pRouter = require('./papeleria/ventas');
const compras_pRouter = require('./papeleria/compras');
//AI

const buscadorIARouter = require('./routes/buscador_ai');



const coneccion = require('./database/db');

//#region - rutas y llamados


//seteamos urlencoded para capturar datos de formularios
app.use(express.urlencoded({extended:false}));
app.use(express.json());

// invocamos a dotenv
const dotenv = require('dotenv');
dotenv.config({path: './env/.env'})
// motor de plantillas
app.set('view engine','ejs');
const path = require('path');

//#endregion


//#region estilos - js - css 
app.use('/resources',express.static('assets'));
app.use('/resources', express.static(__dirname + '/assets'));

app.use('/fotos',express.static('storage'));
app.use('/fotos', express.static(__dirname + '/storage'));
app.use('/pdf-viewer', express.static(path.join(__dirname, 'reportes_generados')));
app.use('/impre', express.static(path.join(__dirname, 'impresiones')));
app.use('/facturas_ventas', express.static(path.join(__dirname, 'facturas_ventas')));

app.use('/js', express.static(__dirname + '/views/graficos/js'));
//#endregion

//#region - iniciar sesion - login - autenticacion 
const session = require('express-session');


app.use(session({
    secret:'secret',
    resave:true,
    saveUninitialized:true
}));


app.get('/mantenimiento',(req, res)=>{
    res.render('./paginas/mantenimiento');
})


app.get('/login',(req, res)=>{
    res.render('login');
})

app.get('/', (req, res) => {
    if (req.session.loggedin) {
        
        const primerNombre = req.session.Nombre.split(' ')[0];
        const primerApellido = req.session.Apellido.split(' ')[0];

        res.render('index', {
            login: true,
            Nombre: primerNombre,
            Apellido: primerApellido,
            Fotografia: req.session.Fotografia,
            Dirección: req.session.Dirección,
            Teléfono: req.session.Teléfono,
            sesion: req.session.ID_Rol,
            Situacion: req.session.Situacion
        });
    } else {
        res.render('login', {
            login: false,
            Nombre: 'Debe iniciar sesión'
        });
    }
});


app.get('/logout', (req, res) => {
    const ID_Empleado = req.session.ID_Empleado;

    // Actualizar Situacion a 1 en la base de datos
    coneccion.query('UPDATE empleados SET Situacion = 1 WHERE ID_Empleado = ?', [ID_Empleado], (updateError, updateResults) => {
        if (updateError) {
            console.log("Error al actualizar Situacion:", updateError);
        }

        // Limpiar la sesión actual
        req.session.destroy(err => {
            if (err) {
                console.error("Error al destruir la sesión:", err);
            }
            
            // Redirigir al usuario a la página de inicio de sesión
            res.send(`
                <script>
                    window.top.location.href = '/login';
                </script>
            `);
        });
    });
});



//#endregion


//#region  rutas - pagina 

app.use(ciudadesRoutes);
app.use(proveedoresRoutes);
app.use(ventasRoutes);
app.use(detallesventasRoutes);
app.use(clientesRoutes);
app.use(inventarioRoutes);
app.use(inventario_vistaRoutes);
app.use(productosRoutes);
app.use(nuevaventaRoutes);
app.use(ganancias_esRoutes);
app.use(paisesRoutes);
app.use(departamentosRoutes);
app.use(empleadosRoutes);
// app.use(detallesempleadosRoutes);

app.use(unidad_ventaRoutes);
app.use(area_productoRoutes);
app.use(categoria_productoRoutes);
app.use(tipo_pacienteRoutes);
app.use(tipo_vias_administracionRoutes);
app.use(comprasRoutes);
app.use(detalles_comprasRoutes);
app.use(unidad_empaqueRoutes);
app.use(venta_espeRoutes);
app.use(cajasRoutes);
app.use(nueva_compraRoutes);
app.use(rolesRoutes);
app.use(sucursalesRoutes);
app.use(vista_ventas);
app.use(rutas_login);
app.use(notificacionesRoutes);
app.use(vistafinanzas);
app.use(adminCajas);
app.use(vistareportes);
//reportes

app.use(generador_reportesRoutes);
app.use(reporte_fut_ventasRoutes);
app.use(reportestareasRoutes);
app.use(reporte_compras_GRoutes);
app.use(reporte_Productos_VRoutes);
app.use(reporte_ventasRoutes);
app.use(reporte_proveedoresRoutes);
//impresiones 
app.use(impre_ciudades);
app.use(impre_paises);
app.use(impre_departamentos);
app.use(impre_unidad_venta);
app.use(impre_empleado);
app.use(graficosRouter);
app.use(impre_proveedor);
app.use(impre_unidad_empaque);
app.use(impre_areas_producto);
app.use(impre_categoria);
app.use(impre_tipo_paciente);
app.use(impre_clientes);

//dashboard
app.use(graficosRouter);

//papeleria

app.use(ventas_pRouter);
app.use(compras_pRouter);

//AI
app.use(buscadorIARouter);


//#endregion


//#region  Reportes - Rutas de reportes

app.get('/reporte_ganancias',(req, res)=>{
    res.render('./reportes/reporte_ganancias');
})
app.get('/reporte_productos',(req, res)=>{
    res.render('./reportes/reporte_productos');
})
app.get('/reporte_ventas',(req, res)=>{
    res.render('./reportes/reporte_ventas');
})
app.get('/reporte_proveedores',(req, res)=>{
    res.render('./reportes/reporte_proveedores');
})
app.get('/reporte_compras',(req, res)=>{
    res.render('./reportes/reporte_compras');
})
app.get('/reporte_tareas_e',(req, res)=>{
    res.render('./reportes/reporte_tareas');
})


//#endregion

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Servidor conectado en http://localhost:${PORT}`);
});