const express = require('express');
const { dbRun, dbAll, dbGet } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Middleware de autenticação
router.use(authenticateToken);

// Listar hábitos do usuário com status de hoje
router.get('/', async (req, res) => {
  const userId = req.user.id;
  const today = req.query.today || new Date().toISOString().split('T')[0];

  try {
    const habits = await dbAll('SELECT * FROM habits WHERE user_id = ? ORDER BY id DESC', [userId]);
    const habitsWithStatus = habits.map(habit => {
      return {
        id: habit.id,
        name: habit.name,
        streak: habit.streak,
        completedToday: habit.last_completed === today,
        lastCompleted: habit.last_completed
      };
    });
    res.json(habitsWithStatus);
  } catch (error) {
    console.error('Erro ao buscar hábitos:', error);
    res.status(500).json({ error: 'Erro ao buscar hábitos.' });
  }
});

// Criar hábito
router.post('/', async (req, res) => {
  const userId = req.user.id;
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'O nome do hábito é obrigatório.' });
  }

  try {
    const result = await dbRun('INSERT INTO habits (user_id, name, streak) VALUES (?, ?, 0)', [userId, name]);
    const createdHabit = await dbGet('SELECT * FROM habits WHERE id = ?', [result.lastID]);
    createdHabit.completedToday = false;
    res.status(201).json(createdHabit);
  } catch (error) {
    console.error('Erro ao criar hábito:', error);
    res.status(500).json({ error: 'Erro ao salvar hábito.' });
  }
});

// Alternar conclusão do hábito para hoje (Completar/Desmarcar)
router.post('/:id/toggle', async (req, res) => {
  const userId = req.user.id;
  const habitId = req.params.id;
  const today = req.body.today || new Date().toISOString().split('T')[0];

  try {
    const habit = await dbGet('SELECT * FROM habits WHERE id = ? AND user_id = ?', [habitId, userId]);
    if (!habit) {
      return res.status(404).json({ error: 'Hábito não encontrado.' });
    }

    const isCurrentlyCompleted = habit.last_completed === today;
    let newStreak = habit.streak;
    let newLastCompleted = habit.last_completed;

    if (isCurrentlyCompleted) {
      // Desmarcar: diminuir streak (mínimo 0) e limpar data
      newLastCompleted = null;
      newStreak = Math.max(0, newStreak - 1);
    } else {
      // Marcar como concluído:
      // Se a última conclusão foi ontem, aumenta streak.
      // Se foi hoje (já tratado), faz nada.
      // Se foi em outro dia anterior, reinicia para 1.
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (habit.last_completed === yesterdayStr) {
        newStreak += 1;
      } else if (!habit.last_completed || habit.last_completed !== today) {
        newStreak = 1; // Reinicia a sequência
      }
      newLastCompleted = today;
    }

    await dbRun(
      'UPDATE habits SET streak = ?, last_completed = ? WHERE id = ?',
      [newStreak, newLastCompleted, habitId]
    );

    res.json({
      id: habit.id,
      name: habit.name,
      streak: newStreak,
      completedToday: !isCurrentlyCompleted,
      lastCompleted: newLastCompleted
    });
  } catch (error) {
    console.error('Erro ao alterar status de hábito:', error);
    res.status(500).json({ error: 'Erro ao alterar status do hábito.' });
  }
});

// Excluir hábito
router.delete('/:id', async (req, res) => {
  const userId = req.user.id;
  const habitId = req.params.id;

  try {
    const habit = await dbGet('SELECT * FROM habits WHERE id = ? AND user_id = ?', [habitId, userId]);
    if (!habit) {
      return res.status(404).json({ error: 'Hábito não encontrado.' });
    }

    await dbRun('DELETE FROM habits WHERE id = ?', [habitId]);
    res.json({ message: 'Hábito excluído com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir hábito:', error);
    res.status(500).json({ error: 'Erro ao excluir hábito.' });
  }
});

module.exports = router;
