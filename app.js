const express = require('express');
const app = express();
const port = 3000;
const mysql = require('mysql2/promise');
const fs = require('fs');
const cors = require('cors');

app.use(cors());
const corsOptions = {
    origin: ['http://127.0.0.1:3001', 'http://localhost:3001'],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
// Middleware para manejar los cuerpos de las solicitudes
app.use(express.json());  // Para parsear JSON
app.use(express.urlencoded({ extended: true }));  // Para parsear datos de formularios

// Crear la piscina de conexiones
const pool = mysql.createPool({
    host: 'mysql-conversor-soy-7596.i.aivencloud.com',
    port: 12655,
    user: 'avnadmin',
    password: 'AVNS_QbjHj-vGWZmBnhv3u0L',
    database: 'defaultdb',
    ssl: {
        ca: fs.readFileSync('./ca.pem'),
    }
});

pool.getConnection()
    .then(() => {
        console.log("Conexión a la base de datos exitosa");
    })
    .catch(err => {
        console.error("Error al conectar a la base de datos:", err.message);
    });

// Ruta para el inicio de sesión de usuarios
app.get('/login', async (req, res) => {
    console.log("Recibiendo solicitud de login...");
    const { usuario, clave } = req.query;

    if (!usuario || !clave) {
        return res.status(400).send('Usuario y clave son requeridos');
    }

    try {
        const [rows] = await pool.query(
            'SELECT * FROM usuarios WHERE usuario = ? AND clave = ?',
            [usuario, clave]
        );

        if (rows.length > 0) {
            console.log('Usuario encontrado:', rows[0]);
            res.send('Usuario y contraseña correctos');
        } else {
            res.status(401).send('Usuario o contraseña incorrectos');
        }
    } catch (err) {
        console.error('Error en el inicio de sesión:', err.message);
        res.status(500).send('Error en la base de datos: ' + err.message);  // Proveer detalles más claros
    }
});

// Ruta para el registro de nuevos usuarios
app.post('/register', async (req, res) => {
    console.log("Recibiendo solicitud POST en /register");  // Esta línea ayudará a verificar que la ruta se está invocando

    const { usuario, clave } = req.body;
    if (!usuario || !clave) {
        return res.status(400).send('Usuario y clave son requeridos');
    }
    try {
        const [rows] = await pool.query('SELECT * FROM usuarios WHERE usuario = ?', [usuario]);
        if (rows.length > 0) {
            return res.status(400).send('El usuario ya existe');
        }
        const [result] = await pool.query('INSERT INTO usuarios (usuario, clave) VALUES (?, ?)', [usuario, clave]);
        if (result.affectedRows > 0) {
            return res.send('Usuario registrado correctamente');
        } else {
            return res.status(500).send('Error al registrar el usuario');
        }
    } catch (err) {
        console.error('Error al registrar el usuario:', err);
        return res.status(500).send('Error en la base de datos');
    }
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});