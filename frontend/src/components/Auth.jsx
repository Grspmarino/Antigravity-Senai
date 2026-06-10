import React, { useState } from 'react';
import { Shield, Lock, User, Sparkles, Smile } from 'lucide-react';

export default function Auth({ onLoginSuccess, backendUrl }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!username.trim() || !password) {
      setError('Por favor, preencha todos os campos.');
      setLoading(false);
      return;
    }

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

    try {
      const response = await fetch(`${backendUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ocorreu um erro na autenticação.');
      }

      if (isLogin) {
        onLoginSuccess(data.token, data.user);
      } else {
        setSuccess('Cadastro realizado com sucesso! Faça login.');
        setIsLogin(true);
        setPassword('');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <span className="logo-skull" style={{ fontSize: '48px', display: 'block', marginBottom: '8px' }}>☠️</span>
          <h2 className="auth-title">Kuromi Plan</h2>
          <p className="auth-subtitle">
            {isLogin 
              ? 'Organize sua vida travessa com estilo gótico-fofo' 
              : 'Junte-se à gangue da Kuromi e planeje seus dias'}
          </p>
        </div>

        {error && (
          <div className="error-message">
            <Shield size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="error-message" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.4)', color: '#a7f3d0' }}>
            <Smile size={18} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={14} className="remove-tag-btn" /> Nome de Usuário
              </span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Digite seu usuário"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '28px' }}>
            <label className="form-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lock size={14} className="remove-tag-btn" /> Senha
              </span>
            </label>
            <input
              type="password"
              className="form-input"
              placeholder="Digite sua senha (mín. 6 caracteres)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            className={`btn ${isLogin ? 'btn-pink' : 'btn-purple'}`}
            style={{ width: '100%', padding: '12px', fontSize: '16px' }}
            disabled={loading}
          >
            {loading ? (
              'Processando...'
            ) : isLogin ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                Entrar <Sparkles size={16} />
              </span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                Cadastrar <Sparkles size={16} />
              </span>
            )}
          </button>
        </form>

        <div className="auth-toggle-link">
          {isLogin ? (
            <>
              Não tem uma conta?{' '}
              <span onClick={() => { setIsLogin(false); setError(''); setSuccess(''); }}>
                Cadastre-se aqui
              </span>
            </>
          ) : (
            <>
              Já tem uma conta?{' '}
              <span onClick={() => { setIsLogin(true); setError(''); setSuccess(''); }}>
                Faça login
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
