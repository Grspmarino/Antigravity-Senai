const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { initDatabase } = require('./database');

// Importação das rotas
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const dashboardRoutes = require('./routes/dashboard');
const habitRoutes = require('./routes/habits');
const moodRoutes = require('./routes/moods');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Registro de Rotas
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/moods', moodRoutes);

// Rota raiz para verificação de status do servidor
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor Kuromi rodando perfeitamente!' });
});

// Tratamento de rotas não encontradas
app.use((req, res, next) => {
  res.status(404).json({ error: 'Rota não encontrada.' });
});

// Tratamento de erros global
app.use((err, req, res, next) => {
  console.error('Erro detectado na aplicação:', err);
  res.status(500).json({ error: 'Ocorreu um erro interno no servidor.' });
});

// Inicializar banco de dados e subir o servidor
async function startServer() {
  await initDatabase();
  app.listen(PORT, () => {
    console.log(`=============================================`);
    console.log(`💜 Kuromi Server está online na porta ${PORT} 💜`);
    console.log(`=============================================`);
  });
}

startServer();
