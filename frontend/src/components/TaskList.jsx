import React, { useState, useEffect } from 'react';
import { Plus, Search, Calendar, Tag, Filter, Check, Edit2, Trash2, ShieldAlert, CheckCircle } from 'lucide-react';

export default function TaskList({ user, backendUrl }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estados dos Filtros
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterCompleted, setFilterCompleted] = useState('false'); // default: mostrar pendentes
  const [filterDueDate, setFilterDueDate] = useState(''); // 'overdue', 'today', 'upcoming'
  const [tagSearch, setTagSearch] = useState('');

  // Estados do Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' ou 'edit'
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  
  // Campos do formulário de tarefas
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('medium');
  const [category, setCategory] = useState('general');
  const [tagsInput, setTagsInput] = useState('');

  const getTodayString = () => new Date().toISOString().split('T')[0];
  const todayStr = getTodayString();

  useEffect(() => {
    fetchTasks();
  }, [filterCategory, filterPriority, filterCompleted]); // Recarregar quando filtros da API mudarem

  const fetchTasks = async () => {
    setLoading(true);
    setError('');
    try {
      let url = `${backendUrl}/api/tasks?`;
      if (filterCategory) url += `category=${filterCategory}&`;
      if (filterPriority) url += `priority=${filterPriority}&`;
      if (filterCompleted !== 'all') url += `completed=${filterCompleted}&`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao carregar tarefas.');

      setTasks(data);
    } catch (err) {
      console.error(err);
      setError('Erro ao carregar a lista de tarefas.');
    } finally {
      setLoading(false);
    }
  };

  // Abrir modal de criação
  const openCreateModal = () => {
    setModalMode('create');
    setSelectedTaskId(null);
    setTitle('');
    setDescription('');
    setDueDate('');
    setPriority('medium');
    setCategory('general');
    setTagsInput('');
    setIsModalOpen(true);
  };

  // Abrir modal de edição
  const openEditModal = (task) => {
    setModalMode('edit');
    setSelectedTaskId(task.id);
    setTitle(task.title);
    setDescription(task.description);
    setDueDate(task.due_date || '');
    setPriority(task.priority);
    setCategory(task.category);
    setTagsInput(task.tags ? task.tags.join(', ') : '');
    setIsModalOpen(true);
  };

  // Enviar formulário do Modal (Criar ou Editar)
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('O título é obrigatório.');
      return;
    }

    // Processar tags (separar por vírgula e limpar espaços)
    const tagsArray = tagsInput
      .split(',')
      .map(t => t.trim().toLowerCase())
      .filter(t => t !== '');

    const taskPayload = {
      title: title.trim(),
      description: description.trim(),
      due_date: dueDate || null,
      priority,
      category,
      tags: tagsArray
    };

    try {
      let response;
      if (modalMode === 'create') {
        response = await fetch(`${backendUrl}/api/tasks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
          },
          body: JSON.stringify(taskPayload)
        });
      } else {
        response = await fetch(`${backendUrl}/api/tasks/${selectedTaskId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
          },
          body: JSON.stringify(taskPayload)
        });
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao salvar tarefa.');

      setIsModalOpen(false);
      fetchTasks(); // Recarregar lista
    } catch (err) {
      alert(err.message);
    }
  };

  // Alternar estado de conclusão
  const handleToggleCompleted = async (task) => {
    try {
      const response = await fetch(`${backendUrl}/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ completed: !task.completed })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      // Atualizar localmente
      setTasks(tasks.map(t => t.id === task.id ? data : t));
    } catch (err) {
      alert(err.message || 'Erro ao alterar status da tarefa.');
    }
  };

  // Excluir tarefa
  const handleDeleteTask = async (taskId) => {
    if (!confirm('Tem certeza de que deseja deletar esta tarefa? ☠️')) return;

    try {
      const response = await fetch(`${backendUrl}/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setTasks(tasks.filter(t => t.id !== taskId));
    } catch (err) {
      alert(err.message || 'Erro ao deletar tarefa.');
    }
  };

  // Filtros locais adicionais (Data Limite Local e Busca por Tag)
  const getFilteredTasks = () => {
    return tasks.filter(task => {
      // 1. Filtro de tags
      if (tagSearch.trim()) {
        const query = tagSearch.toLowerCase().trim();
        const matchesTag = task.tags && task.tags.some(tag => tag.includes(query));
        if (!matchesTag) return false;
      }

      // 2. Filtro de data limite (local)
      if (filterDueDate) {
        if (!task.due_date) return false;

        if (filterDueDate === 'overdue') {
          // Não concluída e vencida
          return !task.completed && task.due_date < todayStr;
        } else if (filterDueDate === 'today') {
          return task.due_date === todayStr;
        } else if (filterDueDate === 'upcoming') {
          return task.due_date > todayStr;
        }
      }

      return true;
    });
  };

  const filteredTasks = getFilteredTasks();

  return (
    <div className="task-manager-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>Gerenciador de Tarefas ☠️</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '2px' }}>
            Crie, filtre e domine seus afazeres diários.
          </p>
        </div>
        <button className="btn btn-pink" onClick={openCreateModal}>
          <Plus size={16} /> Nova Tarefa
        </button>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="filters-bar">
        <div className="filters-group">
          {/* Busca por Tags */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Buscar por tag..."
              className="form-input"
              value={tagSearch}
              onChange={(e) => setTagSearch(e.target.value)}
              style={{ paddingLeft: '36px', fontSize: '13px', width: '180px' }}
            />
          </div>

          {/* Filtro por Categoria */}
          <select 
            className="select-filter" 
            value={filterCategory} 
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">Todas Categorias</option>
            <option value="trabalho">Trabalho</option>
            <option value="casa">Casa</option>
            <option value="estudos">Estudos</option>
            <option value="outros">Outros</option>
          </select>

          {/* Filtro por Prioridade */}
          <select 
            className="select-filter" 
            value={filterPriority} 
            onChange={(e) => setFilterPriority(e.target.value)}
          >
            <option value="">Todas Prioridades</option>
            <option value="high">Alta / Urgente 😈</option>
            <option value="medium">Média</option>
            <option value="low">Baixa</option>
          </select>

          {/* Filtro por Conclusão */}
          <select 
            className="select-filter" 
            value={filterCompleted} 
            onChange={(e) => setFilterCompleted(e.target.value)}
          >
            <option value="all">Todas as Tarefas</option>
            <option value="false">Pendentes</option>
            <option value="true">Concluídas</option>
          </select>

          {/* Filtro por Data Limite */}
          <select 
            className="select-filter" 
            value={filterDueDate} 
            onChange={(e) => setFilterDueDate(e.target.value)}
          >
            <option value="">Qualquer Data</option>
            <option value="overdue">Atrasadas 💀</option>
            <option value="today">Vencem Hoje</option>
            <option value="upcoming">Próximas</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <ShieldAlert size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Lista de Cards de Tarefas */}
      {loading ? (
        <div className="empty-state">
          <div className="empty-state-skull animate-pulse">💀</div>
          <p>Organizando listas...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-skull">☠️</div>
          <p>Nenhuma tarefa encontrada com os filtros selecionados.</p>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Crie uma nova ou ajuste seus filtros.</p>
        </div>
      ) : (
        <div className="tasks-grid">
          {filteredTasks.map((task) => {
            const isOverdue = task.due_date && task.due_date < todayStr && !task.completed;
            const isToday = task.due_date && task.due_date === todayStr;

            return (
              <div 
                key={task.id} 
                className={`task-card priority-${task.priority} ${task.completed ? 'completed' : ''}`}
              >
                <div>
                  <div className="task-card-header">
                    <div className="task-title-area">
                      <div 
                        className={`task-card-checkbox ${task.completed ? 'checked' : ''}`}
                        onClick={() => handleToggleCompleted(task)}
                      >
                        {task.completed && <Check size={12} strokeWidth={3} />}
                      </div>
                      <span className="task-title">{task.title}</span>
                    </div>
                  </div>

                  {task.description && (
                    <p className="task-description">{task.description}</p>
                  )}

                  <div className="task-card-meta">
                    {/* Categoria */}
                    <span className="task-badge badge-category">
                      {task.category === 'trabalho' && '💻 Trabalho'}
                      {task.category === 'casa' && '🏠 Casa'}
                      {task.category === 'estudos' && '📚 Estudos'}
                      {task.category === 'general' && '📂 Geral'}
                      {task.category === 'outros' && '🔮 Outros'}
                    </span>

                    {/* Data Limite */}
                    {task.due_date && (
                      <span className={`task-badge badge-due-date ${isOverdue ? 'overdue' : ''}`}>
                        <Calendar size={12} />
                        {task.due_date.split('-').reverse().join('/')} 
                        {isOverdue && ' (Atrasada!)'}
                        {isToday && ' (Hoje!)'}
                      </span>
                    )}
                  </div>

                  {/* Tags */}
                  {task.tags && task.tags.length > 0 && (
                    <div className="task-tags-container" style={{ marginLeft: '30px' }}>
                      {task.tags.map((tag, idx) => (
                        <span key={idx} className="task-tag">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="task-card-actions">
                  <button 
                    className="btn btn-outline btn-icon-only" 
                    onClick={() => openEditModal(task)}
                    title="Editar Tarefa"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    className="btn btn-danger btn-icon-only" 
                    onClick={() => handleDeleteTask(task.id)}
                    title="Excluir Tarefa"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Criar / Editar Tarefa */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                <span>☠️ {modalMode === 'create' ? 'Criar Tarefa Kuromi' : 'Editar Tarefa'}</span>
              </h3>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="form-group">
                <label className="form-label">Título da Tarefa</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="O que você precisa fazer?"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Descrição</label>
                <textarea
                  className="form-input"
                  placeholder="Detalhes ou planos para executar..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="3"
                  style={{ resize: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Categoria</label>
                  <select
                    className="form-input"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="general">Geral 📂</option>
                    <option value="trabalho">Trabalho 💻</option>
                    <option value="casa">Casa 🏠</option>
                    <option value="estudos">Estudos 📚</option>
                    <option value="outros">Outros 🔮</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Prioridade</label>
                  <select
                    className="form-input"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  >
                    <option value="low">Baixa 🤍</option>
                    <option value="medium">Média 💜</option>
                    <option value="high">Alta / Urgente 😈</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Data Limite (Prazo)</label>
                <input
                  type="date"
                  className="form-input"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tags (separadas por vírgula)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="ex: urgente, compras, faxina"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  As tags ajudam a agrupar e buscar tarefas rapidamente.
                </span>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-pink">
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
