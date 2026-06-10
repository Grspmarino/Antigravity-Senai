const express = require('express');
const { dbGet, dbAll } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Middleware para garantir que todas as rotas sejam privadas
router.use(authenticateToken);

router.get('/', async (req, res) => {
  const userId = req.user.id;
  
  // Obter data de hoje no formato YYYY-MM-DD
  const today = req.query.today || new Date().toISOString().split('T')[0];

  try {
    // 1. Total de tarefas do usuário
    const totalResult = await dbGet('SELECT COUNT(*) as count FROM tasks WHERE user_id = ?', [userId]);
    const totalTasks = totalResult ? totalResult.count : 0;

    // 2. Tarefas concluídas no total
    const completedResult = await dbGet('SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND completed = 1', [userId]);
    const totalCompleted = completedResult ? completedResult.count : 0;

    // 3. Tarefas concluídas hoje
    const completedTodayResult = await dbGet(
      'SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND completed = 1 AND completed_at = ?',
      [userId, today]
    );
    const completedToday = completedTodayResult ? completedTodayResult.count : 0;

    // 4. Tarefas atrasadas (não concluídas e com data limite menor que hoje)
    const overdueResult = await dbGet(
      'SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND completed = 0 AND due_date < ? AND due_date IS NOT NULL',
      [userId, today]
    );
    const overdueTasks = overdueResult ? overdueResult.count : 0;

    // 5. Distribuição por categoria
    const categoryStats = await dbAll(
      'SELECT category, COUNT(*) as count FROM tasks WHERE user_id = ? GROUP BY category',
      [userId]
    );

    // 6. Distribuição por prioridade
    const priorityStats = await dbAll(
      'SELECT priority, COUNT(*) as count FROM tasks WHERE user_id = ? GROUP BY priority',
      [userId]
    );

    // 7. Obter humor de hoje (se houver)
    const moodToday = await dbGet('SELECT mood, notes FROM moods WHERE user_id = ? AND date = ?', [userId, today]);

    // 8. Obter progresso dos hábitos de hoje
    // Para simplificar, listamos os hábitos do usuário e se eles foram concluídos hoje
    const habits = await dbAll('SELECT * FROM habits WHERE user_id = ?', [userId]);
    const habitsWithStatus = habits.map(habit => {
      const completedToday = habit.last_completed === today;
      return {
        id: habit.id,
        name: habit.name,
        streak: habit.streak,
        completedToday
      };
    });

    res.json({
      totalTasks,
      totalCompleted,
      completedToday,
      overdueTasks,
      categoryStats,
      priorityStats,
      moodToday: moodToday || null,
      habits: habitsWithStatus
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas do dashboard:', error);
    res.status(500).json({ error: 'Erro ao calcular estatísticas do painel.' });
  }
});

module.exports = router;
