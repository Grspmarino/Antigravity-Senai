const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { dbGet, dbRun } = require('../database');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// Registro
router.post('/register', async (req, res) => {
  const { username, password, security_question, security_answer } = req.body;

  if (!username || !password || !security_question || !security_answer) {
    return res.status(400).json({ error: 'Todos os campos, incluindo a pergunta e resposta secreta, são obrigatórios.' });
  }

  // Validação de caracteres especiais no nome do usuário (apenas letras, números e sublinhados)
  const usernameRegex = /^[a-zA-Z0-9_]+$/;
  if (!usernameRegex.test(username)) {
    return res.status(400).json({ 
      error: 'O nome de usuário só pode conter letras, números e caracteres de sublinhado (_). Espaços e caracteres especiais não são permitidos.' 
    });
  }

  if (username.length < 3) {
    return res.status(400).json({ error: 'O nome de usuário deve ter pelo menos 3 caracteres.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres.' });
  }

  try {
    // Verificar se usuário existe
    const existingUser = await dbGet('SELECT * FROM users WHERE username = ?', [username]);
    if (existingUser) {
      return res.status(400).json({ error: 'Este nome de usuário já está em uso.' });
    }

    // Criar hash da senha e da resposta de segurança
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    // Padronizar a resposta para evitar problemas com maiúsculas/minúsculas e espaços
    const cleanedAnswer = security_answer.trim().toLowerCase();
    const answerHash = await bcrypt.hash(cleanedAnswer, salt);

    // Salvar no banco
    await dbRun(
      'INSERT INTO users (username, password, security_question, security_answer) VALUES (?, ?, ?, ?)',
      [username, passwordHash, security_question, answerHash]
    );

    res.status(201).json({ message: 'Usuário registrado com sucesso!' });
  } catch (error) {
    console.error('Erro no registro de usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor ao registrar usuário.' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuário e senha são obrigatórios.' });
  }

  try {
    // Buscar usuário
    const user = await dbGet('SELECT * FROM users WHERE username = ?', [username]);
    if (!user) {
      return res.status(400).json({ error: 'Usuário ou senha inválidos.' });
    }

    // Comparar senha
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Usuário ou senha inválidos.' });
    }

    // Gerar JWT
    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' } // Token expira em 7 dias
    );

    res.json({
      message: 'Login bem-sucedido!',
      token,
      user: {
        id: user.id,
        username: user.username
      }
    });
  } catch (error) {
    console.error('Erro no login de usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor ao realizar login.' });
  }
});

// Buscar pergunta de segurança para recuperação de senha
router.get('/recovery-question/:username', async (req, res) => {
  const { username } = req.params;

  try {
    const user = await dbGet('SELECT security_question FROM users WHERE username = ?', [username]);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    res.json({ question: user.security_question });
  } catch (error) {
    console.error('Erro ao buscar pergunta de segurança:', error);
    res.status(500).json({ error: 'Erro ao buscar pergunta de segurança.' });
  }
});

// Redefinir a senha após responder a pergunta secreta
router.post('/reset-password', async (req, res) => {
  const { username, security_answer, new_password } = req.body;

  if (!username || !security_answer || !new_password) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
  }

  if (new_password.length < 6) {
    return res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres.' });
  }

  try {
    const user = await dbGet('SELECT id, security_answer FROM users WHERE username = ?', [username]);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    // Comparar resposta secreta
    const cleanedAnswer = security_answer.trim().toLowerCase();
    const isAnswerCorrect = await bcrypt.compare(cleanedAnswer, user.security_answer);
    
    if (!isAnswerCorrect) {
      return res.status(400).json({ error: 'Resposta secreta incorreta. Redefinição não autorizada.' });
    }

    // Criar hash da nova senha
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(new_password, salt);

    // Atualizar no banco
    await dbRun('UPDATE users SET password = ? WHERE id = ?', [newPasswordHash, user.id]);

    res.json({ message: 'Senha redefinida com sucesso! Você já pode fazer login.' });
  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    res.status(500).json({ error: 'Erro interno do servidor ao redefinir senha.' });
  }
});

module.exports = router;
