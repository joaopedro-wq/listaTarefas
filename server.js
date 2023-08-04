const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('tarefas.db');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000; 

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Definir cabeçalhos para evitar problemas de CORS (Cross-Origin Resource Sharing)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  next();
});

// Configurar o middleware para servir arquivos estáticos na pasta "public"
app.use(express.static(path.join(__dirname, 'public')));

// Definir rota para obter todas as tarefas
app.get('/api/tarefas', (req, res) => {
  db.all('SELECT * FROM tarefas ORDER BY ordem_apresentacao', (err, rows) => {
    if (err) {
      console.error(err.message);
      res.status(500).json({ error: 'Erro ao obter as tarefas' });
    } else {
      res.json(rows);
    }
  });
});

// Definir rota para adicionar uma nova tarefa
app.post('/api/tarefas', (req, res) => {
  const { nome, custo, dataLimite } = req.body;

  // Obter o número atual de tarefas na tabela
  db.get('SELECT COUNT(*) as total FROM tarefas', (err, row) => {
    if (err) {
      console.error(err.message);
      res.status(500).json({ error: 'Erro ao adicionar a tarefa' });
    } else {
      const ordemApresentacao = row.total + 1; // Incrementar 1 para a nova tarefa
      const query = 'INSERT INTO tarefas (nome, custo, data_limite, ordem_apresentacao) VALUES (?, ?, ?, ?)';
db.run(query, [novoNomeTarefa, custo, dataLimite, ordemApresentacao], function (err) {
  if (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Erro ao adicionar a tarefa' });
  } else {
    res.json({ id: this.lastID });
  }
});

    }
  });
});

// Definir rota para atualizar uma tarefa pelo ID
app.put('/:id', (req, res) => {
  const idTarefa = req.params.id;
  const { nome, custo, dataLimite } = req.body;
  const query = 'UPDATE tarefas SET nome = ?, custo = ?, data_limite = ? WHERE id = ?';

  db.run(query, [nome, custo, dataLimite, idTarefa], function (err) {
    if (err) {
      console.error(err.message);
      res.status(500).json({ error: 'Erro ao atualizar a tarefa' });
    } else {
      res.json({ message: 'Tarefa atualizada com sucesso' });
    }
  });
});


// Definir rota para excluir uma tarefa pelo ID
app.delete('/:id', (req, res) => {
  const idTarefa = req.params.id;
  const query = 'DELETE FROM tarefas WHERE id = ?';
  db.run(query, [idTarefa], function (err) {
    if (err) {
      console.error(err.message);
      res.status(500).json({ error: 'Erro ao excluir a tarefa' });
    } else {
      res.json({ message: 'Tarefa excluída com sucesso' });
    }
  });
});

// Iniciar o servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});