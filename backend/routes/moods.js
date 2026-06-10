const express = require('express');
const { dbRun, dbAll, dbGet } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Middleware de autenticação
router.use(authenticateToken);

// Buscar histórico de humor dos últimos 30 dias
router.get('/history', async (req, res) => {
  const userId = req.user.id;

  try {
    const moods = await dbAll(
      'SELECT date, mood, notes FROM moods WHERE user_id = ? ORDER BY date DESC LIMIT 30',
      [userId]
    );
    res.json(moods);
  } catch (error) {
    console.error('Erro ao buscar histórico de humor:', error);
    res.status(500).json({ error: 'Erro ao carregar histórico de humor.' });
  }
});

// Registrar ou atualizar humor de hoje/uma data específica
router.post('/', async (req, res) => {
  const userId = req.user.id;
  const { mood, notes, date } = req.body;
  const targetDate = date || new Date().toISOString().split('T')[0];

  if (!mood) {
    return res.status(400).json({ error: 'O humor é obrigatório.' });
  }

  try {
    // Usar INSERT OR REPLACE para atualizar se já houver registro para a data
    await dbRun(
      `INSERT OR REPLACE INTO moods (user_id, date, mood, notes) 
       VALUES (?, ?, ?, ?)`,
      [userId, targetDate, mood, notes || '']
    );

    const savedMood = await dbGet(
      'SELECT date, mood, notes FROM moods WHERE user_id = ? AND date = ?',
      [userId, targetDate]
    );

    res.status(201).json(savedMood);
  } catch (error) {
    console.error('Erro ao registrar humor:', error);
    res.status(500).json({ error: 'Erro ao registrar humor.' });
  }
});

module.exports = router;
