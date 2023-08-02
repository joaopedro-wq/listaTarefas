const formularioTarefa = document.getElementById('formularioTarefa');
const listaTarefas = document.getElementById('listaTarefas');
const formEditarTarefa = document.getElementById('formEditarTarefa');
const formEditar = document.getElementById('formEditar');
let draggedIndex; 


function excluirTarefa(idTarefa) {
  
  const confirmacao = window.confirm('Tem certeza que deseja excluir esta tarefa?');
  if (confirmacao) {
    axios.delete(`https://listatarefasfatto1-9765e8130ba4.herokuapp.com/${idTarefa}`)
      .then(response => {
        console.log('Tarefa excluída com sucesso:', response.data);
        carregarTarefas(); 
      })
      .catch(error => {
        console.error('Erro ao excluir a tarefa:', error);
      });
  } else {
    
    console.log('Exclusão cancelada pelo usuário.');
  }
}

function dragStart(event) {
  draggedIndex = parseInt(event.target.dataset.index, 10);
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', draggedIndex);
}

function dragOver(event) {
  event.preventDefault();
}

function drop(event) {
  event.preventDefault();
  const targetIndex = parseInt(event.target.dataset.index, 10);
  if (draggedIndex !== targetIndex) {
    const listaTarefas = document.getElementById('listaTarefas');
    const tarefas = Array.from(listaTarefas.children);
    const draggedTask = tarefas[draggedIndex];
    const targetTask = tarefas[targetIndex];
    listaTarefas.insertBefore(draggedTask, targetTask);
    
  }
}

function carregarTarefas() {
   axios.get('https://listatarefasfatto1-9765e8130ba4.herokuapp.com/api/tarefas')
    .then(response => {
      const tarefas = response.data;
      console.log('Dados recebidos do servidor:', tarefas); 
      listaTarefas.innerHTML = '';
      tarefas.forEach((tarefa, index) => { 
        const li = document.createElement('li');
        li.dataset.index = index;
        li.draggable = true;
        li.ondragstart = dragStart;
        li.ondragover = dragOver;
        li.ondrop = drop;
        li.innerHTML = `
        <span class="drag-handle"> ${tarefa.id}</span>
         
          <span>${tarefa.nome}</span>
          <span>${tarefa.custo.toFixed(2)}</span>
          <span>${formatarData(tarefa.data_limite)}</span>
         
          <div class="botoes-tarefa">
          <button id="editar-btn" onclick="exibirFormEditar(${tarefa.id}, '${tarefa.nome}', ${tarefa.custo}, '${tarefa.dataLimite}')">
          <i class="fas fa-pencil-alt"></i> Editar
        </button>
        <button id="excluir-btn" onclick="excluirTarefa(${tarefa.id})">
          <i class="fas fa-trash"></i> Excluir
        </button>
          </div>

         
        `;

        if (tarefa.custo >= 1000) {
          li.classList.add('tarefa-custo-alto');
        }


        listaTarefas.appendChild(li);
      });
    })
    .catch(error => {
      console.error('Erro ao obter as tarefas:', error);
    });  
}




function adicionarTarefa(event) {
  event.preventDefault();
  const nomeTarefa = document.getElementById('nomeTarefa').value;
  const custoTarefa = parseFloat(document.getElementById('custoTarefa').value);
  const dataLimiteTarefa = document.getElementById('dataLimiteTarefa').value;

  // Verificar se já existe uma tarefa com o mesmo nome
     axios.get('https://listatarefasfatto1-9765e8130ba4.herokuapp.com/api/tarefas')
    .then(response => {
      const tarefas = response.data;
      const tarefaExistente = tarefas.find(tarefa => tarefa.nome === nomeTarefa);
      if (tarefaExistente) {
        const mensagem = `Já existe uma tarefa com o mesmo nome: ${nomeTarefa}`;
        exibirMensagemErro(mensagem);
        return;
      }

      // Remove a propriedade ordemApresentacaoTarefa do objeto de dados da tarefa
      const dadosTarefa = {
        nome: nomeTarefa,
        custo: custoTarefa,
        dataLimite: dataLimiteTarefa,
      };

      axios.post('https://listatarefasfatto1-9765e8130ba4.herokuapp.com/api/tarefas', dadosTarefa)
        .then(response => {
          console.log('Tarefa adicionada com sucesso:', response.data);
          carregarTarefas();
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
  
  document.getElementById('editarNomeTarefa').value = nomeTarefa;
  document.getElementById('editarCustoTarefa').value = custoTarefa;
  document.getElementById('editarDataLimiteTarefa').value = dataLimiteTarefa;

  
  document.getElementById('idTarefaEditar').value = idTarefa;

  
  formEditarTarefa.style.display = 'block';

  
  formEditar.onsubmit = function(event) {
    event.preventDefault();
    
    const novoNomeTarefa = document.getElementById('editarNomeTarefa').value;
    const novoCustoTarefa = parseFloat(document.getElementById('editarCustoTarefa').value);
    const novaDataLimiteTarefa = document.getElementById('editarDataLimiteTarefa').value;

   
       axios.get('https://listatarefasfatto1-9765e8130ba4.herokuapp.com/api/tarefas')
      .then(response => {
        const tarefas = response.data;
        const tarefaExistente = tarefas.find(tarefa => tarefa.nome === novoNomeTarefa && tarefa.id !== idTarefa);
        if (tarefaExistente) {
          const mensagem = `Já existe uma tarefa com o mesmo nome: ${novoNomeTarefa}`;
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

 
    axios.get('https://listatarefasfatto1-9765e8130ba4.herokuapp.com/api/tarefas/${idTarefa}`)
    .then(response => {
      const tarefa = response.data;
      exibirFormEditar(tarefa.id, tarefa.nome, tarefa.custo, tarefa.dataLimite, tarefa.ordemApresentacao);
    })
    .catch(error => {
      console.error('Erro ao obter os dados da tarefa:', error);
    });
}



function atualizarTarefa(idTarefa, dadosTarefa) {
  axios.put(`https://listatarefasfatto1-9765e8130ba4.herokuapp.com/${idTarefa}`, dadosTarefa)
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
