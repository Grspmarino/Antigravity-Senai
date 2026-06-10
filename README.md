# ☠️ Kuromi Plan & Task Manager 😈

Um aplicativo de gerenciamento de tarefas pessoal (Full-Stack) com estética inspirada na personagem Kuromi (Sanrio), misturando o estilo gótico-fofo com alta produtividade.

---

## 🎨 Funcionalidades da Estética Kuromi
- **Modo Claro & Escuro (Light/Dark Theme)**: Alternância de temas no cabeçalho. O modo escuro usa tons neon e roxo profundo; o modo claro traz tons pastel lavanda de alto contraste.
- **Destaque de Tarefas (Evidência)**: Títulos ampliados e sombras brilhantes (neon glow) associadas às cores das prioridades (Alta, Média, Baixa) das tarefas.
- **Mood Tracker (Diário de Humor)**: Registre o seu humor diário com 4 expressões típicas da Kuromi (Travessa 😈, Feliz 🖤, Cansada 💀, Irritada 💢).
- **Habit Tracker (Rastreador de Hábitos)**: Crie hábitos diários e acompanhe o seu recorde de dias seguidos (streaks 🔥).
- **Foco Kuromi (Pomodoro Timer)**: Cronômetro persistente de foco (25 min) e descanso (5 min) que continua contando mesmo ao navegar pelo app ou mudar de abas no navegador, com alerta sonoro nativo.

---

## 🛠️ Tecnologias Utilizadas
- **Frontend**: React (Vite), JavaScript, Vanilla CSS, Lucide Icons.
- **Backend**: Express.js (Node.js), Cors, JWT para autenticação, bcryptjs para criptografia.
- **Banco de Dados**: SQLite3 (banco de dados em arquivo local).

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos
- Node.js instalado (v18+)
- NPM instalado

### Passo 1: Configurar e Rodar o Backend
1. Navegue até a pasta do backend:
   ```bash
   cd backend
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Crie um arquivo `.env` na pasta do backend com as seguintes chaves:
   ```env
   PORT=5000
   JWT_SECRET=sua_chave_secreta_aqui
   ```
4. Inicie o servidor:
   ```bash
   npm start
   ```
   *O servidor iniciará no endereço `http://localhost:5000`.*

### Passo 2: Configurar e Rodar o Frontend
1. Navegue até a pasta do frontend:
   ```bash
   cd frontend
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
   *A aplicação estará disponível em `http://localhost:5173`.*

---

## 🔒 Segurança e Recuperação de Senhas
O cadastro de novos usuários exige a configuração de uma **Pergunta e Resposta de Segurança**. Se a senha for esquecida:
1. Clique em **Esqueci minha senha?** na tela de login.
2. Insira o seu usuário e clique em **Verificar**.
3. Responda à sua pergunta secreta para desbloquear a redefinição de senha e criar uma nova senha com total segurança.

*As respostas e as senhas são criptografadas antes de serem armazenadas no banco de dados SQLite.*
