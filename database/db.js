// En tu archivo db.js
const mysql = require('mysql');

// Configuración del pool de conexiones
const pool = mysql.createPool({
    connectionLimit: 10,
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'innovat1_farmacia'
});

// Manejar errores de conexión
pool.on('connection', function (connection) {
    console.log('Conexión a la base de datos establecida');
});

pool.on('error', function (err) {
    console.error('Error en el pool de conexiones:', err);
});

module.exports = pool;
