const mysql = require('mysql');
const coneccion = mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'',
    database:'farmacia_1'
});
//Conexión a la database
coneccion.connect(function(error){
    if(error){
        throw error;
    }else{
        console.log("¡Conexión exitosa a la base de datos!");
    }
});

 

module.exports = coneccion;
