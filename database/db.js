const mysql = require('mysql');

// Configuración de la conexión
const db_config = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'innovat1_farmacia'
};

let coneccion;

function handleDisconnect() {
    coneccion = mysql.createConnection(db_config); // Re-crear la conexión, ya que la conexión anterior se cerró.

    // Intentar conectarse a la base de datos
    coneccion.connect(function (err) {
        if (err) {
            console.error('Error al conectar a la base de datos:', err);
            setTimeout(handleDisconnect, 2000); // Reintentar la conexión tras 2 segundos
        } else {
            console.log("¡Conexión exitosa a la base de datos!");
        }
    });

    // Manejar errores de conexión
    coneccion.on('error', function (err) {
        console.error('Error en la conexión a MySQL:', err);

        if (err.code === 'PROTOCOL_CONNECTION_LOST') {  // Maneja cuando la conexión se pierde
            console.log('Conexión perdida, intentando reconectar...');
            handleDisconnect();  // Reconectar
        } else {
            throw err;  // Otros errores deben manejarse de manera diferente
        }
    });
}

handleDisconnect();

module.exports = coneccion;
