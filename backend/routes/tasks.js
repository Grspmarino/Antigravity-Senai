const express = require('express');
const { dbRun, dbAll, dbGet } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Middleware para garantir que todas as rotas de tarefas sejam privadas
router.use(authenticateToken);

// Listar todas as tarefas do usuário (com filtros)
router.get('/', async (req, res) => {
  const userId = req.user.id;
  const { category, priority, completed, due_date } = req.query;

  let query = 'SELECT * FROM tasks WHERE user_id = ?';
  const params = [userId];

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  if (priority) {
    query += ' AND priority = ?';
    params.push(priority);
  }
  if (completed !== undefined) {
    query += ' AND completed = ?';
    params.push(completed === 'true' ? 1 : 0);
  }
  if (due_date) {
    query += ' AND due_date = ?';
    params.push(due_date);
  }

  // Ordenar por data limite e depois por id decrescente
  query += ' ORDER BY due_date ASC, id DESC';

  try {
    const tasks = await dbAll(query, params);

    if (tasks.length === 0) {
      return res.json([]);
    }

    // Buscar todas as tags das tarefas retornadas para agregá-las
    const taskIds = tasks.map(t => t.id);
    const placeholders = taskIds.map(() => '?').join(',');
    const tags = await dbAll(`SELECT * FROM tags WHERE task_id IN (${placeholders})`, taskIds);

    // Mapear tags para cada tarefa
    const tasksWithTags = tasks.map(task => {
      return {
        ...task,
        completed: !!task.completed, // Converter 1/0 para boolean
        tags: tags.filter(tag => tag.task_id === task.id).map(tag => tag.name)
      };
    });

    res.json(tasksWithTags);
  } catch (error) {
    console.error('Erro ao listar tarefas:', error);
    res.status(500).json({ error: 'Erro ao buscar tarefas.' });
  }
});

// Criar nova tarefa
router.post('/', async (req, res) => {
  const userId = req.user.id;
  const { title, description, due_date, priority, category, tags } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'O título da tarefa é obrigatório.' });
  }

  // Validar se a data limite não está no passado
  const today = new Date().toISOString().split('T')[0];
  if (due_date && due_date < today) {
    return res.status(400).json({ error: 'A data limite não pode ser no passado.' });
  }

  try {
    // Inserir tarefa
    const result = await dbRun(
      `INSERT INTO tasks (user_id, title, description, due_date, priority, category, completed)
       VALUES (?, ?, ?, ?, ?, ?, 0)`,
      [userId, title, description || '', due_date || null, priority || 'medium', category || 'general']
    );

    const taskId = result.lastID;

    // Inserir tags se fornecidas
    if (tags && Array.isArray(tags)) {
      for (const tagName of tags) {
        if (tagName.trim() !== '') {
          await dbRun('INSERT INTO tags (task_id, name) VALUES (?, ?)', [taskId, tagName.trim().toLowerCase()]);
        }
      }
    }

    // Retornar a tarefa criada
    const createdTask = await dbGet('SELECT * FROM tasks WHERE id = ?', [taskId]);
    createdTask.completed = !!createdTask.completed;
    createdTask.tags = tags || [];

    res.status(201).json(createdTask);
  } catch (error) {
    console.error('Erro ao criar tarefa:', error);
    res.status(500).json({ error: 'Erro ao salvar a tarefa.' });
  }
});

// Atualizar tarefa
router.put('/:id', async (req, res) => {
  const userId = req.user.id;
  const taskId = req.params.id;
  const { title, description, due_date, priority, category, completed, tags } = req.body;

  try {
    // Verificar se a tarefa pertence ao usuário
    const task = await dbGet('SELECT * FROM tasks WHERE id = ? AND user_id = ?', [taskId, userId]);
    if (!task) {
      return res.status(404).json({ error: 'Tarefa não encontrada.' });
    }

    // Validar se a data limite foi alterada e não está no passado
    if (due_date !== undefined && due_date !== task.due_date) {
      const today = new Date().toISOString().split('T')[0];
      if (due_date && due_date < today) {
        return res.status(400).json({ error: 'A data limite não pode ser no passado.' });
      }
    }

    // Preparar campos para atualização
    const updatedTitle = title !== undefined ? title : task.title;
    const updatedDesc = description !== undefined ? description : task.description;
    const updatedDueDate = due_date !== undefined ? due_date : task.due_date;
    const updatedPriority = priority !== undefined ? priority : task.priority;
    const updatedCategory = category !== undefined ? category : task.category;
    
    let updatedCompleted = task.completed;
    let completedAt = task.completed_at;

    if (completed !== undefined) {
      const isCompleted = completed ? 1 : 0;
      if (isCompleted !== task.completed) {
        updatedCompleted = isCompleted;
        // Se marcou como concluído agora, registrar a data atual local
        completedAt = isCompleted ? new Date().toISOString().split('T')[0] : null;
      }
    }

    await dbRun(
      `UPDATE tasks 
       SET title = ?, description = ?, due_date = ?, priority = ?, category = ?, completed = ?, completed_at = ?
       WHERE id = ?`,
      [updatedTitle, updatedDesc, updatedDueDate, updatedPriority, updatedCategory, updatedCompleted, completedAt, taskId]
    );

    // Se tags forem fornecidas, substituir as antigas pelas novas
    if (tags && Array.isArray(tags)) {
      // Remover antigas
      await dbRun('DELETE FROM tags WHERE task_id = ?', [taskId]);
      // Adicionar novas
      for (const tagName of tags) {
        if (tagName.trim() !== '') {
          await dbRun('INSERT INTO tags (task_id, name) VALUES (?, ?)', [taskId, tagName.trim().toLowerCase()]);
        }
      }
    }

    // Buscar tarefa atualizada
    const updatedTask = await dbGet('SELECT * FROM tasks WHERE id = ?', [taskId]);
    const finalTags = await dbAll('SELECT name FROM tags WHERE task_id = ?', [taskId]);
    
    updatedTask.completed = !!updatedTask.completed;
    updatedTask.tags = finalTags.map(t => t.name);

    res.json(updatedTask);
  } catch (error) {
    console.error('Erro ao atualizar tarefa:', error);
    res.status(500).json({ error: 'Erro ao atualizar a tarefa.' });
  }
});

// Excluir tarefa
router.delete('/:id', async (req, res) => {
  const userId = req.user.id;
  const taskId = req.params.id;

  try {
    // Verificar se a tarefa pertence ao usuário
    const task = await dbGet('SELECT * FROM tasks WHERE id = ? AND user_id = ?', [taskId, userId]);
    if (!task) {
      return res.status(404).json({ error: 'Tarefa não encontrada.' });
    }

    // Excluir tarefa (tags são removidas automaticamente por causa da constraint de cascata)
    await dbRun('DELETE FROM tasks WHERE id = ?', [taskId]);

    res.json({ message: 'Tarefa excluída com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir tarefa:', error);
    res.status(500).json({ error: 'Erro ao excluir a tarefa.' });
  }
});

module.exports = router;
