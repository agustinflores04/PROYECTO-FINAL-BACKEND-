// ============================================
// SERVIDOR BACKEND - EL NEXO DIGITAL
// ============================================

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================
// MIDDLEWARES
// ============================================
app.use(cors({
  origin: ['https://splendorous-pasca-aef4d2.netlify.app'],
  credentials: true
}));
app.use(cors()); // Permitir peticiones desde el frontend
app.use(express.json()); // Para procesar JSON

// ============================================
// CONEXIÓN A MONGODB
// ============================================
const MONGODB_URI = process.env.MONGODB_URI || 
  'mongodb+srv://jacobogarcesoquendo:aFJzVMGN3o7fA38A@cluster0.mqwbn.mongodb.net/AgustinFlores?retryWrites=true&w=majority';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Conectado a MongoDB'))
  .catch(err => console.error('❌ Error conectando a MongoDB:', err));

// ============================================
// MODELOS (SCHEMAS)
// ============================================

// Schema para Reseñas (sin acento en el nombre de la colección)
const resenaSchema = new mongoose.Schema({
  nombreJuego: { type: String, required: true },
  categoria: { type: String, required: true },
  puntuacion: { type: Number, required: true, min: 1, max: 5 },
  texto: { type: String, required: true },
  imagenUrl: { type: String, default: 'https://via.placeholder.com/400x250/0f3460/e94560?text=Sin+Imagen' },
  autor: { type: String, default: 'Anónimo' },
  likes: { type: Number, default: 0 },
  tipo: { type: String, required: true }, // Videojuegos, Anime, Peliculas, Series
  fecha: { type: String, default: () => new Date().toLocaleDateString('es-ES') },
  createdAt: { type: Date, default: Date.now }
});

// Schema para Biblioteca Personal
const bibliotecaSchema = new mongoose.Schema({
  usuarioId: { type: String, default: 'default-user' },
  videojuegos: [
    {
      nombre: String,
      estado: String,
      horasJugadas: Number,
      fechaAgregado: String
    }
  ],
  anime: [
    {
      nombre: String,
      estado: String,
      fechaAgregado: String
    }
  ],
  peliculas: [
    {
      nombre: String,
      estado: String,
      fechaAgregado: String
    }
  ],
  series: [
    {
      nombre: String,
      estado: String,
      fechaAgregado: String
    }
  ],
  updatedAt: { type: Date, default: Date.now }
});

const Resena = mongoose.model('Resena', resenaSchema);
const Biblioteca = mongoose.model('Biblioteca', bibliotecaSchema);

// ============================================
// RUTAS - RESEÑAS (sin acento en la URL)
// ============================================

// Obtener todas las reseñas
app.get('/api/resenas', async (req, res) => {
  try {
    const resenas = await Resena.find().sort({ createdAt: -1 });
    res.json({ success: true, data: resenas });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Crear una nueva reseña
app.post('/api/resenas', async (req, res) => {
  try {
    const nuevaResena = new Resena(req.body);
    await nuevaResena.save();
    res.json({ success: true, data: nuevaResena });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Eliminar una reseña
app.delete('/api/resenas/:id', async (req, res) => {
  try {
    await Resena.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Reseña eliminada' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// RUTAS - BIBLIOTECA PERSONAL
// ============================================

// Obtener biblioteca del usuario
app.get('/api/biblioteca/:usuarioId', async (req, res) => {
  try {
    let biblioteca = await Biblioteca.findOne({ usuarioId: req.params.usuarioId });
    
    // Si no existe, crear una nueva
    if (!biblioteca) {
      biblioteca = new Biblioteca({
        usuarioId: req.params.usuarioId,
        videojuegos: [],
        anime: [],
        peliculas: [],
        series: []
      });
      await biblioteca.save();
    }
    
    res.json({ success: true, data: biblioteca });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Actualizar biblioteca completa
app.put('/api/biblioteca/:usuarioId', async (req, res) => {
  try {
    const biblioteca = await Biblioteca.findOneAndUpdate(
      { usuarioId: req.params.usuarioId },
      { 
        ...req.body,
        updatedAt: Date.now()
      },
      { new: true, upsert: true }
    );
    
    res.json({ success: true, data: biblioteca });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Agregar item a una categoría específica
app.post('/api/biblioteca/:usuarioId/:categoria', async (req, res) => {
  try {
    const { usuarioId, categoria } = req.params;
    const nuevoItem = req.body;
    
    let biblioteca = await Biblioteca.findOne({ usuarioId });
    
    if (!biblioteca) {
      biblioteca = new Biblioteca({
        usuarioId,
        videojuegos: [],
        anime: [],
        peliculas: [],
        series: []
      });
    }
    
    biblioteca[categoria].push(nuevoItem);
    biblioteca.updatedAt = Date.now();
    await biblioteca.save();
    
    res.json({ success: true, data: biblioteca });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// RUTA DE PRUEBA
// ============================================
app.get('/', (req, res) => {
  res.json({ 
    message: '🎮 El Nexo Digital API funcionando correctamente',
    endpoints: {
      resenas: {
        getAll: 'GET /api/resenas',
        create: 'POST /api/resenas',
        delete: 'DELETE /api/resenas/:id'
      },
      biblioteca: {
        get: 'GET /api/biblioteca/:usuarioId',
        update: 'PUT /api/biblioteca/:usuarioId',
        addItem: 'POST /api/biblioteca/:usuarioId/:categoria'
      }
    }
  });
});

// ============================================
// INICIAR SERVIDOR
// ============================================
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});