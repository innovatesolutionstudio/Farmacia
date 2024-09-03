const mysql = require('mysql');
const coneccion = mysql.createConnection({
    host:'31.22.7.56',
    user:'innovat1_admin',
    password:'iss1234qwert',
    database:'innovat1_farmacia'
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
