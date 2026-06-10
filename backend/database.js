const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'database.sqlite');

// Garantir que o diretório exista
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados SQLite:', err.message);
  } else {
    console.log('Conectado ao banco de dados SQLite com sucesso.');
  }
});

// Funções utilitárias usando Promises para evitar "callback hell" e facilitar async/await
const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        console.error(`Erro ao executar Query Run: ${sql}`, err);
        reject(err);
      } else {
        resolve(this);
      }
    });
  });
};

const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error(`Erro ao executar Query All: ${sql}`, err);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        console.error(`Erro ao executar Query Get: ${sql}`, err);
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

// Inicialização do Esquema do Banco de Dados
async function initDatabase() {
  try {
    // Tabela de Usuários
    await dbRun(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        security_question TEXT,
        security_answer TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Migração automática para adicionar colunas caso o banco já existisse sem elas
    try {
      await dbRun('ALTER TABLE users ADD COLUMN security_question TEXT');
      console.log('Coluna security_question adicionada à tabela users.');
    } catch (e) {
      // Ignorar se a coluna já existir
    }

    try {
      await dbRun('ALTER TABLE users ADD COLUMN security_answer TEXT');
      console.log('Coluna security_answer adicionada à tabela users.');
    } catch (e) {
      // Ignorar se a coluna já existir
    }

    // Tabela de Tarefas
    await dbRun(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        due_date TEXT,
        priority TEXT DEFAULT 'medium',
        category TEXT DEFAULT 'general',
        completed INTEGER DEFAULT 0,
        completed_at TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Tabela de Tags
    await dbRun(`
      CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
      )
    `);

    // Tabela de Hábitos
    await dbRun(`
      CREATE TABLE IF NOT EXISTS habits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        streak INTEGER DEFAULT 0,
        last_completed TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Tabela de Humor (Mood Tracker)
    await dbRun(`
      CREATE TABLE IF NOT EXISTS moods (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        mood TEXT NOT NULL,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id, date)
      )
    `);

    console.log('Tabelas do banco de dados inicializadas ou verificadas com sucesso.');
  } catch (error) {
    console.error('Erro ao inicializar o banco de dados:', error);
  }
}

module.exports = {
  db,
  dbRun,
  dbAll,
  dbGet,
  initDatabase
};
