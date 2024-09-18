// Invocamos a express
const express = require('express');
const router = express.Router();

// Invocamos a la conexión de la base de datos
const connection = require('../database/db');

router.get('/vista_ventas',(req,res)=>{
    res.render('./ventas/vista_ventas')
})


module.exports = router;
