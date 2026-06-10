import React, { useState, useEffect } from 'react';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import TaskList from './components/TaskList';
import { LogOut, Home, ListTodo } from 'lucide-react';

const BACKEND_URL = 'http://localhost:5000';

function App() {
  const [user, setUser] = useState(null);
  const [currentTab, setCurrentTab] = useState('dashboard'); // 'dashboard' ou 'tasks'

  useEffect(() => {
    // Carregar sessão existente
    const savedToken = localStorage.getItem('kuromi_token');
    const savedUser = localStorage.getItem('kuromi_user');

    if (savedToken && savedUser) {
      setUser({
        token: savedToken,
        ...JSON.parse(savedUser)
      });
    }
  }, []);

  const handleLoginSuccess = (token, userInfo) => {
    localStorage.setItem('kuromi_token', token);
    localStorage.setItem('kuromi_user', JSON.stringify(userInfo));
    setUser({
      token,
      ...userInfo
    });
    setCurrentTab('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('kuromi_token');
    localStorage.removeItem('kuromi_user');
    setUser(null);
  };

  // Se não estiver logado, exibe tela de Autenticação
  if (!user) {
    return <Auth onLoginSuccess={handleLoginSuccess} backendUrl={BACKEND_URL} />;
  }

  return (
    <>
      {/* Cabeçalho da Aplicação */}
      <header className="app-header">
        <div className="logo-container">
          <span className="logo-skull">☠️</span>
          <span className="logo-text">Kuromi Plan</span>
        </div>
        <div className="user-nav-info">
          <span className="username-display">😈 {user.username}</span>
          <button className="btn btn-outline" onClick={handleLogout} style={{ padding: '8px 12px' }}>
            <LogOut size={16} /> Sair
          </button>
        </div>
      </header>

      {/* Grid Lateral de Layout */}
      <div className="app-container">
        <aside className="sidebar">
          <button 
            className={`sidebar-nav-btn ${currentTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentTab('dashboard')}
          >
            <Home size={18} /> Painel Inicial
          </button>
          <button 
            className={`sidebar-nav-btn ${currentTab === 'tasks' ? 'active' : ''}`}
            onClick={() => setCurrentTab('tasks')}
          >
            <ListTodo size={18} /> Minhas Tarefas
          </button>
          
          <div style={{ marginTop: 'auto', padding: '10px 0', borderTop: '1px solid var(--border-color)', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
            Estética Kuromi S2 v1.0.0
          </div>
        </aside>

        {/* Área de Conteúdo */}
        <main style={{ backgroundColor: 'var(--bg-primary)', overflowY: 'auto', maxHeight: 'calc(100vh - 80px)' }}>
          {currentTab === 'dashboard' ? (
            <Dashboard user={user} backendUrl={BACKEND_URL} />
          ) : (
            <TaskList user={user} backendUrl={BACKEND_URL} />
          )}
        </main>
      </div>
    </>
  );
}

export default App;
