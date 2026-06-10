const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { dbGet, dbRun } = require('../database');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// Registro
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuário e senha são obrigatórios.' });
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

    // Criar hash da senha
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Salvar no banco
    await dbRun('INSERT INTO users (username, password) VALUES (?, ?)', [username, passwordHash]);

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

module.exports = router;
