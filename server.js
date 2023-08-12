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



app.get('/api/tarefas', (req, res) => {
  db.all('SELECT * FROM tarefas', (err, rows) => {
    if (err) {
      console.error(err.message);
      res.status(500).json({ error: 'Erro ao obter as tarefas' });
    } else {
      res.json(rows);
    }
  });
});


app.get('/api/tarefas/:id', (req, res) => {
  const idTarefa = req.params.id;
  db.get('SELECT * FROM tarefas WHERE id = ?', [idTarefa], (err, row) => {
    if (err) {
      console.error(err.message);
      res.status(500).json({ error: 'Erro ao obter a tarefa' });
    } else {
      res.json(row);
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
      db.run(query, [nome, custo, dataLimite, ordemApresentacao], function (err) {
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
  const { nome, custo, dataLimite, ordemApresentacao } = req.body;
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

app.put('/api/atualizar-ordem', (req, res) => {
  const ordensApresentacao = req.body;

  try {
    console.log('Recebendo requisição PUT para atualizar ordem...');
    console.log('Ordens de Apresentação recebidas:', ordensApresentacao);

    // Para cada ordem de apresentação na lista de ordensApresentacao, atualize a ordem no banco de dados
    ordensApresentacao.forEach(async (ordem) => {
      const { id, ordemApresentacao } = ordem;
      const query = 'UPDATE tarefas SET ordem_apresentacao = ? WHERE id = ?';

      console.log(`Atualizando ordem da tarefa com ID ${id} para ${ordemApresentacao}...`);
      db.run(query, [ordemApresentacao, id], (err) => {
        if (err) {
          console.error(err.message);
        } else {
          console.log(`Ordem da tarefa com ID ${id} atualizada.`);
        }
      });
    });

    res.json({ message: 'Ordem das tarefas atualizada com sucesso.' });
  } catch (error) {
    console.error('Erro ao atualizar a ordem das tarefas:', error);
    res.status(500).json({ error: 'Erro ao atualizar a ordem das tarefas.' });
  }
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
