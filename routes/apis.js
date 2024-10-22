// Invocamos a Express y creamos un router
const express = require('express');
const router = express.Router();

// Invocamos a la conexión de la base de datos
const coneccion = require('../database/db');


router.get('/api/ciudades', (req, res) => {
    const sql = 'SELECT ID_Ciudad as id, Nombre as nombre FROM ciudades';
    coneccion.query(sql, (err, results) => {
      if (err) {
        console.error('Error al obtener ciudades:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
        return;
      }
      res.json(results);
    });
  });
  router.get('/api/generos', (req, res) => {
    const sql = 'SELECT ID_Generos as id, Nombre as nombre FROM generos';
    coneccion.query(sql, (err, results) => {
      if (err) {
        console.error('Error al obtener ciudades:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
        return;
      }
      res.json(results);
    });
  });
  router.get('/api/roles', (req, res) => {
    const sql = 'SELECT ID_Rol as id, Nombre as nombre FROM roles';
    coneccion.query(sql, (err, results) => {
      if (err) {
        console.error('Error al obtener ciudades:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
        return;
      }
      res.json(results);
    });
  });
  router.get('/api/sucursales', (req, res) => {
    const sql = 'SELECT ID_Sucursal as id, Nombre as nombre FROM sucursales';
    coneccion.query(sql, (err, results) => {
      if (err) {
        console.error('Error al obtener ciudades:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
        return;
      }
      res.json(results);
    });
  });
  router.get('/api/cajas', (req, res) => {
    const sql = 'SELECT ID_Caja as id, Codigo as nombre FROM cajas';
    coneccion.query(sql, (err, results) => {
      if (err) {
        console.error('Error al obtener ciudades:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
        return;
      }
      res.json(results);
    });
  });
  // Ruta para obtener todos los departamentos
router.get('/api/departamentos', (req, res) => {
    const sql = 'SELECT ID_Departamento as id, Nombre as nombre FROM departamentos';
    coneccion.query(sql, (err, results) => {
      if (err) {
        console.error('Error al obtener departamentos:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
        return;
      }
      res.json(results);
    });
  });
  
  // Ruta para obtener todos los países
router.get('/api/paises', (req, res) => {
    const sql = 'SELECT ID_Pais as id, Nombre as nombre FROM paises';
    coneccion.query(sql, (err, results) => {
      if (err) {
        console.error('Error al obtener países:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
        return;
      }
      res.json(results);
    });
  });





module.exports = router;
