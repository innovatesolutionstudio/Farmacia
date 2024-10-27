// Invocamos a express
const express = require('express');
const router = express.Router();

// Invocamos a la conexión de la base de datos
const connection = require('../database/db');
const session = require('express-session');

router.get('/vista_ventas',(req,res)=>{
    if(req.session.loggedin){
    res.render('./ventas/vista_ventas')
} else {
    res.render('./paginas/logout');
}
})


module.exports = router;
