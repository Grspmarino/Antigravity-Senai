import React, { useState, useEffect, useRef } from 'react';
import { CheckSquare, Calendar, AlertTriangle, Plus, Trash2, Flame, Play, Pause, RotateCcw, Smile, Save, Compass } from 'lucide-react';

export default function Dashboard({ user, backendUrl }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estados do Habit Tracker
  const [newHabitName, setNewHabitName] = useState('');
  const [habits, setHabits] = useState([]);

  // Estados do Mood Tracker
  const [selectedMood, setSelectedMood] = useState('');
  const [moodNotes, setMoodNotes] = useState('');
  const [moodSavedToday, setMoodSavedToday] = useState(null);

  // Estados do Pomodoro
  const [pomodoroMinutes, setPomodoroMinutes] = useState(25);
  const [pomodoroSeconds, setPomodoroSeconds] = useState(0);
  const [pomodoroActive, setPomodoroActive] = useState(false);
  const [pomodoroMode, setPomodoroMode] = useState('focus'); // 'focus' ou 'break'
  const timerIntervalRef = useRef(null);

  // Data local hoje formato YYYY-MM-DD
  const getTodayString = () => new Date().toISOString().split('T')[0];
  const todayStr = getTodayString();

  useEffect(() => {
    fetchDashboardData();
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      // Buscar dados do dashboard
      const response = await fetch(`${backendUrl}/api/dashboard?today=${todayStr}`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao carregar dados.');

      setStats(data);
      setHabits(data.habits || []);
      
      if (data.moodToday) {
        setSelectedMood(data.moodToday.mood);
        setMoodNotes(data.moodToday.notes);
        setMoodSavedToday(data.moodToday);
      }
    } catch (err) {
      console.error(err);
      setError('Não foi possível carregar as informações do painel.');
    } finally {
      setLoading(false);
    }
  };

  // Funções de Hábitos
  const handleCreateHabit = async (e) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;

    try {
      const response = await fetch(`${backendUrl}/api/habits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ name: newHabitName.trim() })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setHabits([data, ...habits]);
      setNewHabitName('');
    } catch (err) {
      alert(err.message || 'Erro ao criar hábito.');
    }
  };

  const handleToggleHabit = async (habitId) => {
    try {
      const response = await fetch(`${backendUrl}/api/habits/${habitId}/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ today: todayStr })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setHabits(habits.map(h => h.id === habitId ? data : h));
      
      // Atualizar estatísticas secundárias se necessário
      const updatedCompletedToday = data.completedToday 
        ? (stats.completedToday + 0) // Opcional, hábitos não interferem na contagem de tarefas diretamente, mas é bom recarregar o dashboard
        : stats.completedToday;
    } catch (err) {
      alert(err.message || 'Erro ao atualizar hábito.');
    }
  };

  const handleDeleteHabit = async (habitId) => {
    if (!confirm('Deseja excluir este hábito permanentemente?')) return;
    try {
      const response = await fetch(`${backendUrl}/api/habits/${habitId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setHabits(habits.filter(h => h.id !== habitId));
    } catch (err) {
      alert(err.message || 'Erro ao deletar hábito.');
    }
  };

  // Funções de Humor
  const handleSaveMood = async () => {
    if (!selectedMood) {
      alert('Por favor, selecione um humor antes de salvar.');
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/api/moods`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          mood: selectedMood,
          notes: moodNotes,
          date: todayStr
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setMoodSavedToday(data);
      alert('Humor registrado com sucesso na estética Kuromi! 🖤');
    } catch (err) {
      alert(err.message || 'Erro ao registrar humor.');
    }
  };

  // Pomodoro Timer Logic
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // Nota A5
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);

      oscillator.start();
      setTimeout(() => oscillator.stop(), 500);
    } catch (err) {
      console.error('Falha ao tocar som:', err);
    }
  };

  const startTimer = () => {
    if (pomodoroActive) return;
    setPomodoroActive(true);
    timerIntervalRef.current = setInterval(() => {
      setPomodoroSeconds((prevSec) => {
        if (prevSec === 0) {
          setPomodoroMinutes((prevMin) => {
            if (prevMin === 0) {
              // Timer Finalizado!
              clearInterval(timerIntervalRef.current);
              playBeep();
              alert(pomodoroMode === 'focus' ? 'Hora de descansar, Kuromi! 🌸' : 'De volta ao trabalho focado! 💻');
              
              const nextMode = pomodoroMode === 'focus' ? 'break' : 'focus';
              setPomodoroMode(nextMode);
              setPomodoroMinutes(nextMode === 'focus' ? 25 : 5);
              setPomodoroActive(false);
              return 0;
            }
            return prevMin - 1;
          });
          return 59;
        }
        return prevSec - 1;
      });
    }, 1000);
  };

  const pauseTimer = () => {
    setPomodoroActive(false);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
  };

  const resetTimer = () => {
    setPomodoroActive(false);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setPomodoroMode('focus');
    setPomodoroMinutes(25);
    setPomodoroSeconds(0);
  };

  const changeTimerMode = (mode) => {
    setPomodoroActive(false);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setPomodoroMode(mode);
    setPomodoroMinutes(mode === 'focus' ? 25 : 5);
    setPomodoroSeconds(0);
  };

  if (loading) {
    return (
      <div className="empty-state" style={{ padding: '80px 0' }}>
        <div className="empty-state-skull animate-pulse">💀</div>
        <p>Invocando os poderes da Kuromi no painel...</p>
      </div>
    );
  }

  return (
    <div className="task-manager-section">
      <div style={{ marginBottom: '10px' }}>
        <h1 style={{ margin: '0', fontSize: '32px', textAlign: 'left', fontWeight: '800' }}>
          Olá, <span style={{ color: 'var(--accent-pink)' }}>{user.username}</span>! ☠️
        </h1>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'left', marginTop: '4px' }}>
          Aqui está o seu painel de controle pessoal na estética Kuromi.
        </p>
      </div>

      {/* Estatísticas Principais */}
      {stats && (
        <div className="dashboard-grid">
          <div className="stat-box">
            <div className="stat-icon-wrapper">
              <CheckSquare size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats.totalTasks}</span>
              <span className="stat-label">Total de Tarefas</span>
            </div>
          </div>

          <div className="stat-box completed">
            <div className="stat-icon-wrapper">
              <CheckSquare size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-value" style={{ color: 'var(--accent-pink)' }}>{stats.completedToday}</span>
              <span className="stat-label">Concluídas Hoje</span>
            </div>
          </div>

          <div className="stat-box overdue">
            <div className="stat-icon-wrapper">
              <AlertTriangle size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-value" style={{ color: '#ef4444' }}>{stats.overdueTasks}</span>
              <span className="stat-label">Tarefas Atrasadas</span>
            </div>
          </div>
        </div>
      )}

      {/* Grid de Widgets extras (Hábitos + Humor e Pomodoro) */}
      <div className="widgets-container">
        
        {/* Lado Esquerdo: Hábitos + Humor */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Rastreador de Hábitos */}
          <div className="card">
            <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Flame size={18} style={{ color: 'var(--accent-pink)' }} /> Rastreador de Hábitos
            </h3>
            
            <form onSubmit={handleCreateHabit} className="habit-input-group" style={{ marginBottom: '16px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Ex: Beber 2L de água, estudar..."
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                style={{ flex: 1, padding: '8px 12px', fontSize: '14px' }}
              />
              <button type="submit" className="btn btn-purple" style={{ padding: '8px 16px' }}>
                <Plus size={16} /> Adicionar
              </button>
            </form>

            {habits.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', padding: '16px' }}>
                Nenhum hábito cadastrado ainda. Comece a construir sua rotina!
              </p>
            ) : (
              <div className="habit-widget-list">
                {habits.map((habit) => (
                  <div className="habit-item" key={habit.id}>
                    <span className="habit-name" style={{ textDecoration: habit.completedToday ? 'line-through' : 'none', color: habit.completedToday ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                      {habit.name}
                    </span>
                    
                    <div className="habit-info-side">
                      {habit.streak > 0 && (
                        <span className="habit-streak">
                          <Flame size={12} fill="var(--accent-pink)" /> {habit.streak}d
                        </span>
                      )}
                      <div 
                        className={`habit-checkbox ${habit.completedToday ? 'completed' : ''}`}
                        onClick={() => handleToggleHabit(habit.id)}
                      >
                        {habit.completedToday && <span style={{ fontSize: '12px' }}>✓</span>}
                      </div>
                      <button 
                        className="btn-close" 
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                        onClick={() => handleDeleteHabit(habit.id)}
                      >
                        <Trash2 size={14} className="remove-tag-btn" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Rastreador de Humor */}
          <div className="card mood-widget">
            <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Smile size={18} style={{ color: 'var(--accent-purple)' }} /> Como você está se sentindo hoje?
            </h3>
            
            <div className="mood-options">
              {[
                { type: 'mischievous', label: 'Travessa 😈', emoji: '😈' },
                { type: 'happy', label: 'Feliz 🖤', emoji: '🖤' },
                { type: 'tired', label: 'Cansada 💀', emoji: '💀' },
                { type: 'grumpy', label: 'Irritada 💢', emoji: '💢' }
              ].map((m) => (
                <div 
                  key={m.type}
                  className={`mood-btn ${selectedMood === m.type ? 'selected' : ''}`}
                  onClick={() => setSelectedMood(m.type)}
                >
                  <span className="mood-emoji">{m.emoji}</span>
                  <span className="mood-label">{m.label.split(' ')[0]}</span>
                </div>
              ))}
            </div>

            <div className="form-group">
              <input
                type="text"
                className="form-input"
                placeholder="Adicione notas sobre o seu dia..."
                value={moodNotes}
                onChange={(e) => setMoodNotes(e.target.value)}
                style={{ fontSize: '14px', padding: '10px' }}
              />
            </div>

            <button 
              className="btn btn-pink" 
              style={{ width: '100%', padding: '10px' }}
              onClick={handleSaveMood}
            >
              <Save size={16} /> Salvar Humor de Hoje
            </button>
          </div>
        </div>

        {/* Lado Direito: Pomodoro Timer */}
        <div className="card pomodoro-card">
          <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Compass size={18} style={{ color: 'var(--accent-pink)' }} /> Foco Kuromi (Pomodoro)
          </h3>
          
          <div style={{ display: 'flex', gap: '10px', width: '100%', justifyContent: 'center' }}>
            <button 
              className={`btn btn-outline ${pomodoroMode === 'focus' ? 'active' : ''}`}
              style={{ padding: '6px 14px', fontSize: '12px', borderColor: pomodoroMode === 'focus' ? 'var(--accent-pink)' : 'var(--border-color)', color: pomodoroMode === 'focus' ? 'var(--accent-pink)' : 'var(--text-secondary)' }}
              onClick={() => changeTimerMode('focus')}
            >
              Foco (25m)
            </button>
            <button 
              className={`btn btn-outline ${pomodoroMode === 'break' ? 'active' : ''}`}
              style={{ padding: '6px 14px', fontSize: '12px', borderColor: pomodoroMode === 'break' ? 'var(--accent-purple)' : 'var(--border-color)', color: pomodoroMode === 'break' ? 'var(--accent-purple)' : 'var(--text-secondary)' }}
              onClick={() => changeTimerMode('break')}
            >
              Pausa (5m)
            </button>
          </div>

          <div className={`timer-circle ${pomodoroActive ? 'active' : ''}`}>
            <span className="timer-time">
              {String(pomodoroMinutes).padStart(2, '0')}:{String(pomodoroSeconds).padStart(2, '0')}
            </span>
            <span className="timer-status">
              {pomodoroMode === 'focus' ? 'Foco!' : 'Pausa!'}
            </span>
          </div>

          <div className="timer-controls">
            {!pomodoroActive ? (
              <button className="btn btn-pink btn-icon-only" onClick={startTimer}>
                <Play size={20} fill="white" />
              </button>
            ) : (
              <button className="btn btn-outline btn-icon-only" style={{ borderColor: 'var(--accent-pink)' }} onClick={pauseTimer}>
                <Pause size={20} />
              </button>
            )}
            <button className="btn btn-outline btn-icon-only" onClick={resetTimer}>
              <RotateCcw size={20} />
            </button>
          </div>
          
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Ligue o timer e concentre-se nas suas tarefas com energia da Kuromi!
          </p>
        </div>

      </div>
    </div>
  );
}
