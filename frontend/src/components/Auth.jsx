import React, { useState } from 'react';
import { Shield, Lock, User, Sparkles, Smile, HelpCircle, ArrowLeft } from 'lucide-react';

const SECURITY_QUESTIONS = [
  'Qual é o nome do seu primeiro animal de estimação?',
  'Qual é o nome da sua cidade natal?',
  'Qual era o seu apelido de infância?',
  'Qual é o seu personagem favorito da Sanrio?'
];

export default function Auth({ onLoginSuccess, backendUrl }) {
  // Estados do Modo de Tela: 'login', 'register', 'recovery'
  const [authMode, setAuthMode] = useState('login'); 
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Campos adicionais de cadastro
  const [securityQuestion, setSecurityQuestion] = useState(SECURITY_QUESTIONS[0]);
  const [securityAnswer, setSecurityAnswer] = useState('');

  // Campos de recuperação
  const [recoveryStep, setRecoveryStep] = useState(1); // 1: informar usuário, 2: responder pergunta
  const [fetchedQuestion, setFetchedQuestion] = useState('');
  const [recoveryAnswer, setRecoveryAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Estados de feedback
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!username.trim() || !password || !securityAnswer.trim()) {
      setError('Por favor, preencha todos os campos.');
      setLoading(false);
      return;
    }

    // Validação de caracteres especiais no username (apenas letras, números e sublinhados)
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username.trim())) {
      setError('O nome de usuário só pode conter letras, números e sublinhados (_). Espaços e caracteres especiais não são permitidos.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password,
          security_question: securityQuestion,
          security_answer: securityAnswer.trim()
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao realizar cadastro.');
      }

      setSuccess('Cadastro realizado com sucesso! Faça login.');
      setAuthMode('login');
      setPassword('');
      setSecurityAnswer('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch(`${backendUrl}/api/auth/login`, {
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
        throw new Error(data.error || 'Usuário ou senha inválidos.');
      }

      onLoginSuccess(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fluxo de Recuperação - Passo 1: Buscar pergunta
  const handleFetchQuestion = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!username.trim()) {
      setError('Digite seu nome de usuário.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/api/auth/recovery-question/${username.trim()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar pergunta.');
      }

      setFetchedQuestion(data.question);
      setRecoveryStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fluxo de Recuperação - Passo 2: Redefinir senha
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!recoveryAnswer.trim() || !newPassword) {
      setError('Preencha todos os campos para continuar.');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('A nova senha deve ter pelo menos 6 caracteres.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          security_answer: recoveryAnswer.trim(),
          new_password: newPassword
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Resposta incorreta.');
      }

      setSuccess('Senha redefinida com sucesso! Entre com a nova senha.');
      setAuthMode('login');
      setPassword('');
      setRecoveryStep(1);
      setRecoveryAnswer('');
      setNewPassword('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const changeMode = (mode) => {
    setError('');
    setSuccess('');
    setAuthMode(mode);
    setRecoveryStep(1);
    setPassword('');
    setSecurityAnswer('');
    setRecoveryAnswer('');
    setNewPassword('');
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        
        {/* Renderização da tela de Login */}
        {authMode === 'login' && (
          <>
            <div className="auth-header">
              <span className="logo-skull" style={{ fontSize: '48px', display: 'block', marginBottom: '8px' }}>☠️</span>
              <h2 className="auth-title">Kuromi Plan</h2>
              <p className="auth-subtitle">Organize sua vida travessa com estilo gótico-fofo</p>
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

            <form onSubmit={handleLogin}>
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

              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Lock size={14} className="remove-tag-btn" /> Senha
                  </span>
                </label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div style={{ textAlign: 'right', marginBottom: '24px' }}>
                <span 
                  onClick={() => changeMode('recovery')} 
                  style={{ color: 'var(--text-muted)', fontSize: '13px', cursor: 'pointer', fontWeight: 500 }}
                  className="remove-tag-btn"
                >
                  Esqueci minha senha?
                </span>
              </div>

              <button
                type="submit"
                className="btn btn-pink"
                style={{ width: '100%', padding: '12px', fontSize: '16px' }}
                disabled={loading}
              >
                {loading ? 'Entrando...' : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                    Entrar <Sparkles size={16} />
                  </span>
                )}
              </button>
            </form>

            <div className="auth-toggle-link">
              Não tem uma conta?{' '}
              <span onClick={() => changeMode('register')}>
                Cadastre-se aqui
              </span>
            </div>
          </>
        )}

        {/* Renderização da tela de Registro */}
        {authMode === 'register' && (
          <>
            <div className="auth-header">
              <span className="logo-skull" style={{ fontSize: '48px', display: 'block', marginBottom: '8px' }}>😈</span>
              <h2 className="auth-title">Criar Conta</h2>
              <p className="auth-subtitle">Junte-se à gangue da Kuromi e planeje seus dias</p>
            </div>

            {error && (
              <div className="error-message">
                <Shield size={18} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label className="form-label">Nome de Usuário</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: kuromi_123"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  required
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Apenas letras, números e sublinhados (_). Sem caracteres especiais ou espaços.
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Senha</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Mínimo de 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Pergunta de Segurança</label>
                <select
                  className="form-input"
                  value={securityQuestion}
                  onChange={(e) => setSecurityQuestion(e.target.value)}
                  disabled={loading}
                >
                  {SECURITY_QUESTIONS.map((q, idx) => (
                    <option key={idx} value={q}>{q}</option>
                  ))}
                </select>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Necessária para redefinir sua senha caso a esqueça.
                </span>
              </div>

              <div className="form-group" style={{ marginBottom: '28px' }}>
                <label className="form-label">Resposta de Segurança</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Sua resposta secreta"
                  value={securityAnswer}
                  onChange={(e) => setSecurityAnswer(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-purple"
                style={{ width: '100%', padding: '12px', fontSize: '16px' }}
                disabled={loading}
              >
                {loading ? 'Cadastrando...' : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                    Cadastrar <Sparkles size={16} />
                  </span>
                )}
              </button>
            </form>

            <div className="auth-toggle-link">
              Já tem uma conta?{' '}
              <span onClick={() => changeMode('login')}>
                Faça login
              </span>
            </div>
          </>
        )}

        {/* Renderização da tela de Recuperação de Senha */}
        {authMode === 'recovery' && (
          <>
            <div className="auth-header">
              <span className="logo-skull" style={{ fontSize: '48px', display: 'block', marginBottom: '8px' }}>🗝️</span>
              <h2 className="auth-title">Recuperar Conta</h2>
              <p className="auth-subtitle">Responda sua pergunta secreta para redefinir a senha</p>
            </div>

            {error && (
              <div className="error-message">
                <Shield size={18} />
                <span>{error}</span>
              </div>
            )}

            {recoveryStep === 1 ? (
              <form onSubmit={handleFetchQuestion}>
                <div className="form-group" style={{ marginBottom: '28px' }}>
                  <label className="form-label">Nome de Usuário</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Usuário cadastrado"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-purple"
                  style={{ width: '100%', padding: '12px', fontSize: '16px' }}
                  disabled={loading}
                >
                  {loading ? 'Verificando...' : 'Verificar Usuário'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword}>
                <div className="form-group" style={{ backgroundColor: 'rgba(157, 78, 221, 0.1)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
                  <label className="form-label" style={{ color: 'var(--accent-pink)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <HelpCircle size={14} /> Pergunta Secreta:
                  </label>
                  <p style={{ fontSize: '15px', fontWeight: 600, marginTop: '4px' }}>{fetchedQuestion}</p>
                </div>

                <div className="form-group">
                  <label className="form-label">Resposta Secreta</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Sua resposta"
                    value={recoveryAnswer}
                    onChange={(e) => setRecoveryAnswer(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '28px' }}>
                  <label className="form-label">Nova Senha</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Mínimo de 6 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-pink"
                  style={{ width: '100%', padding: '12px', fontSize: '16px' }}
                  disabled={loading}
                >
                  {loading ? 'Salvando...' : 'Redefinir Senha'}
                </button>
              </form>
            )}

            <div className="auth-toggle-link" style={{ marginTop: '24px' }}>
              <span onClick={() => changeMode('login')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <ArrowLeft size={14} /> Voltar para o Login
              </span>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
