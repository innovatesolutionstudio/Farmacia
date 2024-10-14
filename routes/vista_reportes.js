// Invocamos a express
const express = require('express');
const router = express.Router();

// Invocamos a la conexión de la base de datos
const connection = require('../database/db');

router.get('/vista_reportes',(req,res)=>{
    res.render('./reportes/vista_reportes')
})

module.exports = router;
