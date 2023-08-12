const formularioTarefa = document.getElementById('formularioTarefa');
const listaTarefas = document.getElementById('listaTarefas');
const formEditarTarefa = document.getElementById('formEditarTarefa');
const formEditar = document.getElementById('formEditar');
const apiBaseUrl = 'https://listatarefasfatto1-9765e8130ba4.herokuapp.com/';
let draggedIndex; 
let ordemOriginalTarefas = [];


function excluirTarefa(idTarefa) {
  const confirmacao = window.confirm('Tem certeza que deseja excluir esta tarefa?');
  if (confirmacao) {
    axios.delete(`${apiBaseUrl}/${idTarefa}`)
      .then(response => {
        console.log('Tarefa excluída com sucesso:', response.data);
        carregarTarefas(); 
        fecharFormEditar();
      })
      .catch(error => {
        console.error('Erro ao excluir a tarefa:', error);
      });
  } else {
    console.log('Exclusão cancelada pelo usuário.');
  }
}


function carregarTarefas() {
  axios
    .get(`${apiBaseUrl}/api/tarefas`)
          
    .then(response => {
      const tarefas = response.data;
      console.log('Dados recebidos do servidor:', tarefas);
      const listaTarefas = document.getElementById('listaTarefas');
      listaTarefas.innerHTML = '';
      const ordemArmazenada = localStorage.getItem('ordemApresentacao');
      let ordensApresentacao;
    
      if (ordemArmazenada) {
        ordensApresentacao = JSON.parse(ordemArmazenada);
    
        // Ordenar as tarefas de acordo com a ordem armazenada
        tarefas.sort((a, b) => {
          const ordemA = a ? ordensApresentacao.find(item => item.id === a.id)?.ordemApresentacao : 0;
          const ordemB = b ? ordensApresentacao.find(item => item.id === b.id)?.ordemApresentacao : 0;
          return ordemA - ordemB;
        });
        
      } else {
        // Se não houver ordem armazenada, manter a ordem original do servidor
        ordensApresentacao = tarefas.map((tarefa, index) => ({
          id: tarefa.id,
          ordemApresentacao: index + 1
        }));
      }
      tarefas.forEach((tarefa, index) => {
        const tr = document.createElement('tr');
        tr.dataset.index = index;
     
        tr.dataset.ordemApresentacao = tarefa.ordemApresentacao;
        tr.innerHTML = `
        <td><span class="drag-handle">${tarefa.id}</span></td>
        <td>${decodeURIComponent(tarefa.nome)}</td>
        <td>${tarefa.custo.toFixed(2)}</td>
        <td>${formatarData(tarefa.data_limite)}</td>
        <td>
          <div class="botoes-tarefa">
          <button class="move-up-btn" onclick="moverTarefa(this.closest('tr'), 'up')">
          <i class="fas fa-chevron-up"></i> 
        </button>
        <button id="editar-btn" data-nome="${(tarefa.nome)}" onclick="exibirFormEditar(${tarefa.id}, this.getAttribute('data-nome'), ${tarefa.custo}, '${tarefa.data_limite}')">
        <i class="fas fa-pencil-alt"></i> Editar
      </button>
      
            <button id="excluir-btn" onclick="excluirTarefa(${tarefa.id})">
              <i class="fas fa-trash"></i> Excluir
            </button>
          
          <button class="move-down-btn" onclick="moverTarefa(this.closest('tr'), 'down')">
            <i class="fas fa-chevron-down"></i> 
          </button>
          

          </div>
        </td>
      `;

      tr.querySelector('.move-up-btn').onclick = () => moverTarefa(index, 'up');
      tr.querySelector('.move-down-btn').onclick = () => moverTarefa(index, 'down');
      
      if (tarefa.custo >= 1000) {
        tr.classList.add('tarefa-custo-alto');
      }

      listaTarefas.appendChild(tr);
    });
  })
  .catch(error => {
    console.error('Erro ao obter as tarefas:', error);
  });
}



function atualizarOrdemNoServidor() {
  const listaTarefas = document.getElementById('listaTarefas');
  const tarefas = Array.from(listaTarefas.querySelectorAll('tbody tr'));

  const ordensApresentacao = tarefas.map((tarefa, index) => ({
    id: parseInt(tarefa.querySelector('.drag-handle').textContent),
    ordemApresentacao: index + 1
  }));

  console.log('Ordens de Apresentação antes da requisição PUT:', ordensApresentacao); 

  console.log('Enviando requisição PUT para atualizar ordem...');
  axios.put(`${apiBaseUrl}/api/atualizar-ordem`, ordensApresentacao)
  .then(response => {
    console.log('Resposta do servidor:', response.data);
    console.log('Ordem das tarefas atualizada com sucesso no servidor:', response.data);

    // Armazenar a ordem das tarefas no Local Storage
    localStorage.setItem('ordemApresentacao', JSON.stringify(ordensApresentacao));
  })
  .catch(error => {
    console.error('Erro ao atualizar a ordem das tarefas no servidor:', error);
  });
}
function moverTarefa(index, direcao) {
  const listaTarefas = document.getElementById('listaTarefas');
  const tarefas = Array.from(listaTarefas.querySelectorAll('tbody tr'));

  if ((direcao === 'up' && index > 0) || (direcao === 'down' && index < tarefas.length - 1)) {
    const novaPosicao = direcao === 'up' ? index - 1 : index + 1;
    const tarefa = tarefas[index];
    const tarefaDestino = tarefas[novaPosicao];

    console.log(`Movendo tarefa de posição ${index} para posição ${novaPosicao}`);

    listaTarefas.innerHTML = '';

    // Trocar a ordem das tarefas no array
    tarefas.splice(index, 1);
    tarefas.splice(novaPosicao, 0, tarefa);

    tarefas.forEach((tarefa, index) => {
      tarefa.dataset.index = index;
      tarefa.querySelector('.move-up-btn').onclick = () => moverTarefa(index, 'up');
      tarefa.querySelector('.move-down-btn').onclick = () => moverTarefa(index, 'down');
      listaTarefas.appendChild(tarefa);
    });

    atualizarOrdemNoServidor(); // Adicione esta linha
  }
}


function adicionarTarefa(event) {
  event.preventDefault();
  const nomeTarefa = document.getElementById('nomeTarefa').value;
  const custoTarefa = parseFloat(document.getElementById('custoTarefa').value);
  const dataLimiteTarefa = document.getElementById('dataLimiteTarefa').value;

  // Remove a propriedade ordemApresentacaoTarefa do objeto de dados da tarefa
  const dadosTarefa = {
    nome: encodeURIComponent(nomeTarefa),
    custo: custoTarefa,
    dataLimite: dataLimiteTarefa,
  };

  // Verificar se já existe uma tarefa com o mesmo nome
  axios.get(`${apiBaseUrl}/api/tarefas`)
    .then(response => {
      const tarefas = response.data;
      const tarefaExistente = tarefas.find(tarefa => tarefa.nome.toLowerCase() === nomeTarefa.toLowerCase());
      if (tarefaExistente) {
        const mensagem = `Já existe uma tarefa com o mesmo nome: ${nomeTarefa}`;
        exibirMensagemErro(mensagem);
        return;
      }

      axios.post(`${apiBaseUrl}/api/tarefas`, dadosTarefa)
        .then(response => {
          console.log('Tarefa adicionada com sucesso:', response.data);
          carregarTarefas();

          document.getElementById('nomeTarefa').value = '';
          document.getElementById('custoTarefa').value = '';
          document.getElementById('dataLimiteTarefa').value = '';
        })
        .catch(error => {
          console.error('Erro ao adicionar a tarefa:', error);
        });
    })
    .catch(error => {
      console.error('Erro ao obter as tarefas:', error);
    });
}


function exibirMensagemErro(mensagem) {
  const mensagemErro = document.getElementById('mensagemErro');
  mensagemErro.textContent = mensagem;
  mensagemErro.style.display = 'block';

  
  setTimeout(() => {
    mensagemErro.style.display = 'none';
  }, 5000); 
}

function formatarData(dataString) {
  const data = new Date(dataString);
  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const ano = data.getFullYear();
  return `${dia}/${mes}/${ano}`;
}


function exibirFormEditar(idTarefa, nomeTarefa, custoTarefa, dataLimiteTarefa) {
  const editarNomeTarefa = document.getElementById('editarNomeTarefa');
  const editarCustoTarefa = document.getElementById('editarCustoTarefa');
  const editarDataLimiteTarefa = document.getElementById('editarDataLimiteTarefa');
  const idTarefaEditar = document.getElementById('idTarefaEditar');

  editarNomeTarefa.value = decodeURIComponent(nomeTarefa);
  editarCustoTarefa.value = custoTarefa;
  editarDataLimiteTarefa.value = dataLimiteTarefa;

  idTarefaEditar.value = idTarefa;

  formEditarTarefa.style.display = 'block';

  formEditar.onsubmit = function(event) {
    event.preventDefault();

    const novoNomeTarefa = encodeURIComponent(document.getElementById('editarNomeTarefa').value);
    const novoCustoTarefa = parseFloat(document.getElementById('editarCustoTarefa').value);
    const novaDataLimiteTarefa = document.getElementById('editarDataLimiteTarefa').value;

    axios.get(`${apiBaseUrl}/api/tarefas`)
      .then(response => {
        const tarefas = response.data;
        const tarefaExistente = tarefas.find(tarefa => tarefa.nome === novoNomeTarefa && tarefa.id !== idTarefa);
        if (tarefaExistente) {
          const mensagem = `Já existe uma tarefa com o mesmo nome: ${decodeURIComponent(novoNomeTarefa)}`;
          exibirMensagemErro(mensagem);
          return;
        }
        const dadosTarefa = {
          nome: novoNomeTarefa,
          custo: novoCustoTarefa,
          dataLimite: novaDataLimiteTarefa
        };

        atualizarTarefa(idTarefa, dadosTarefa);

        formEditarTarefa.style.display = 'none';
      })
      .catch(error => {
        console.error('Erro ao obter as tarefas:', error);
      });
  };
}

function editarTarefa(idTarefa) {
  console.log('Exibindo formulário de edição para a tarefa de ID:', idTarefa);
  axios.get(`${apiBaseUrl}/api/tarefas`)
    .then(response => {
      const tarefa = response.data;
      exibirFormEditar(tarefa.id, tarefa.nome, tarefa.custo, tarefa.dataLimite, tarefa.ordemApresentacao);
    })
    .catch(error => {
      console.error('Erro ao obter os dados da tarefa:', error);
    });
}

function atualizarTarefa(idTarefa, dadosTarefa) {
  axios.put(`${apiBaseUrl}/${idTarefa}`, dadosTarefa)
    .then(response => {
      console.log('Tarefa atualizada com sucesso:', response.data);
      carregarTarefas();
    })
    .catch(error => {
      console.error('Erro ao atualizar a tarefa:', error);
    });
}


function fecharFormEditar() {
  formEditarTarefa.style.display = 'none';
}

formularioTarefa.addEventListener('submit', adicionarTarefa);
carregarTarefas();
