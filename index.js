const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Generar una clave secreta aleatoria de 32 bytes (256 bits)

const app = express();
const secretKey = crypto.randomBytes(32).toString('hex');

app.use(bodyParser.json());


const usuarios = [];
const jugadores=[];
const convocados=[];

// ---------------------------------------------------------------------------------------------
// MIDDLEWARE DE AUTENTICACIÓN
// ---------------------------------------------------------------------------------------------
const authenticate = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) return res.status(401).json({ message: 'Acceso no autorizado' });

    try {
        const decoded = jwt.verify(token, secretKey);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token inválido' });
    }
};


// ---------------------------------------------------------------------------------------------
// USUARIOS
// ---------------------------------------------------------------------------------------------

// Función para registrar un nuevo usuario
function registrarUsuario(nuevoUsuario) {
    usuarios.push(nuevoUsuario);
}

// Función para encontrar un usuario por su nombre de usuario y contraseña
function encontrarUsuario(username, password) {
    return usuarios.find(user => user.username === username && user.password === password);
}

// Ruta para el registro de usuarios
app.post('/api/register', (req, res) => {
    const { username, password } = req.body;

    // Verificar si el usuario ya existe
    if (usuarios.find(user => user.username === username)) {
        return res.status(400).json({ message: 'El usuario ya existe' });
    }

    // Registrar al nuevo usuario
    const nuevoUsuario = { username, password };
    registrarUsuario(nuevoUsuario);

    // Emitir un token JWT
    const token = jwt.sign({ username }, secretKey);
    res.json({ message: 'Registro exitoso', token });
});

// Ruta para el login de usuarios
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    // Verificar las credenciales del usuario
    const usuario = encontrarUsuario(username, password);
    if (!usuario) {
        return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Emitir un token JWT
    const token = jwt.sign({ username }, secretKey);
    res.json({ message: 'Login exitoso', token });
});


// ---------------------------------------------------------------------------------------------
// JUGADORES
// ---------------------------------------------------------------------------------------------

// Agregar un jugador
app.post('/api/players', authenticate, (req, res) => {
    try{
        const newPlayer = {...req.body};
        jugadores.push(newPlayer);
        res.json({error: false, mensage: 'Jugador agregado exitosamente', juagador: newPlayer });

    }catch{
        res.json({ error: true, mensage: 'Error al agregar jugador'});
    }
});


// Función para eliminar un jugador por su ID
function eliminarJugador(idJugador) {
    const indice = jugadores.findIndex(jugador => jugador.id === idJugador);
    if (indice !== -1) {
        jugadores.splice(indice, 1);
        return true; // Éxito al eliminar
    }
    return false; // La jugador no fue encontrada
}
// Eliminar un jugador por su ID
app.delete('/api/players/:id', authenticate, (req, res) => {
    const idJugadorAEliminar = parseInt(req.params.id);
    const eliminacionExitosa = eliminarJugador(idJugadorAEliminar);
    if (eliminacionExitosa) {
        res.json({ message: `Jugador con ID ${idJugadorAEliminar} eliminada correctamente` });
    } else {
        res.status(404).json({ message: `No se encontró el jugador con ID ${idJugadorAEliminar}` });
    }
});

// Ruta para modificar un atributo de un jugador por su ID
app.put('/api/players/:id', authenticate, (req, res) => {
    const idJugador = req.params.id;
    const { attribute, value } = req.body; // El cuerpo de la solicitud debe contener el atributo a modificar y su nuevo valor

    // Encuentra el índice del jugador en el array de jugadores
    const jugadorIndex = jugadores.findIndex(jugador => jugador.id === idJugador);

    if (jugadorIndex !== -1) {
        if (Object.prototype.hasOwnProperty.call(jugadores[jugadorIndex], attribute)) {
            // Actualiza el valor del atributo del jugador
            jugadores[jugadorIndex][attribute] = value;

            res.json({ message: `Atributo '${attribute}' del jugador con ID ${idJugador} actualizado correctamente` });
        } else {
            res.status(400).json({ error: `El atributo '${attribute}' no es válido para un jugador` });
        }
    } else {
        res.status(404).json({ error: `No se encontró el jugador con ID ${idJugador}` });
    }
});

// Función para obtener todos los jugadores
function obtenerTodosLosJugadores() {
    return jugadores;
}
// Obtener todas los jugadores
app.get('/api/players', authenticate, (req, res) => {
    const todasLosJugadores = obtenerTodosLosJugadores();
    res.json(todasLosJugadores);
});

// Ver los datos de un jugador por su ID
app.get('/api/players/:id', authenticate, (req, res) => {
    const idJugador = parseInt(req.params.id);
    const jugadorEncontrado = jugadores.find(jugador => jugador.id === idJugador);
    if (jugadorEncontrado) {
        res.json(jugadorEncontrado);
    } else {
        res.status(404).json({ message: `No se encontró el jugador con ID ${idJugador}` });
    }
});


// ---------------------------------------------------------------------------------------------
// Convocados
// ---------------------------------------------------------------------------------------------

// Agregar jugadores convocados
app.post('/api/summoned', authenticate, (req, res) => {
    const jugadoresConvocados = req.body.summonedPlayersId;
    for (let index = 0; index < jugadoresConvocados.length; index++) {
        const jugadorIndex = jugadores.findIndex((jugador) => jugador.id === jugadoresConvocados[index]);
        if((convocados.length < 22) && (jugadores[jugadorIndex].suspended === false) && (jugadores[jugadorIndex].injured === false)){
            convocados.push(jugadores[jugadorIndex]);
            res.json({ error: false, message: 'Jugador convocado exitosamente', retorno: jugadores[jugadorIndex]});
        }else{
            res.json({error: true, message: 'No se pudo convocar al jugador' })
        }
    }
    // Verifica que haya al menos un jugador por posición en la convocatoria
    const posiciones = new Set(llamados.map(jugador => jugador.position));
    const posicionesRequeridas = ['GK', 'DF', 'MD', 'FW'];

    const faltanPosiciones = posicionesRequeridas.some(pos => !posiciones.has(pos));

    if (faltanPosiciones && convocados.length==21) {
        llamados.length = 0; // Vacía la convocatoria si falta alguna posición
        res.status(400).json({ error: 'Debe haber al menos un jugador por posición en la convocatoria. Convocatoria eliminada.' });
    } else {
        res.json({ message: 'Convocatoria exitosa', convocados: llamados });
    }
});

// Función para obtener todos los jugadores
function obtenerTodosLosConvocados() {
    return convocados;
}

// Obtener todos los convocados
app.get('/api/summoned', authenticate, (req, res) => {
    try{
        res.json({error: false, mensaje: 'Lista de jugadores convocados encontrada: ', retorno: convocados});
    }catch{
        res.json({error: true, mensaje: 'No se pudo devolver la lista de jugadores convocados'})
    }
});

// Estructura básica de un Jugador
// Puedes ajustar esto según tus necesidades
class Jugador {
    constructor(id, name, position, suspended, injured) {
        this.id = id;
        this.name = name;
        this.position = position;
        this.suspended = suspended;
        this.injured = injured;
    }
}


console.log(obtenerTodosLosJugadores());
console.log(obtenerTodosLosConvocados());


// INICIA EL SERVIDOR
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor en ejecución en http://localhost:${PORT}`);
});
