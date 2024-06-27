const DIMENSAO = 12; // Definindo dimensões da grade
let letterPosition = []; // Array para armazenar as posições das palavras
let cores = ['#FC785E', '#FFDB80', '#91DEE7'];
let indiceCorAtual = 0;
async function carregarPalavras(fase) {
  try {
    const response = await fetch('palavras.json');
    if (!response.ok) {
      throw new Error('Falha ao carregar o arquivo palavras.json');
    }
    const data = await response.json();
    // Verifica se a fase existe no JSON
    if (!data || !data[fase] || !Array.isArray(data[fase])) {
      throw new Error(`Formato inválido ou fase '${fase}' não encontrada no arquivo palavras.json`);
    }
    // Converte todas as palavras para maiúsculas antes de retornar
    return data[fase].map(palavra => palavra.toUpperCase());
  } catch (error) {
    console.error(`Erro ao carregar o arquivo palavras.json para a fase '${fase}':`, error);
    return []; // Retornar um array vazio em caso de erro
  }
}

function criarGradeVazia() {
  return Array.from({ length: DIMENSAO }, () => Array(DIMENSAO).fill('-'));
}

function cabeNaGrade(grade, palavra, linha, coluna, deltaLinha, deltaColuna) {
  for (let i = 0; i < palavra.length; i++) {
    const novaLinha = linha + i * deltaLinha;
    const novaColuna = coluna + i * deltaColuna;
    if (novaLinha < 0 || novaLinha >= DIMENSAO || novaColuna < 0 || novaColuna >= DIMENSAO || grade[novaLinha][novaColuna] !== '-') {
      return false;
    }
  }
  return true;
}

function inserirPalavra(grade, palavra, linha, coluna, deltaLinha, deltaColuna) {
  for (let i = 0; i < palavra.length; i++) {
    grade[linha + i * deltaLinha][coluna + i * deltaColuna] = palavra[i];
    letterPosition.push(`r${linha + i * deltaLinha + 1}c${coluna + i * deltaColuna + 1}`);
  }
}

function posicionarPalavras(grade, palavras) {
  const direcoes = [
    { deltaLinha: 0, deltaColuna: 1 }, // Horizontal
    { deltaLinha: 1, deltaColuna: 0 }, // Vertical
    { deltaLinha: 1, deltaColuna: 1 }, // Diagonal
  ];

  palavras.forEach(palavra => {
    let posicionado = false;
    while (!posicionado) {
      const direcao = direcoes[Math.floor(Math.random() * direcoes.length)];
      const linha = Math.floor(Math.random() * DIMENSAO);
      const coluna = Math.floor(Math.random() * DIMENSAO);

      if (cabeNaGrade(grade, palavra, linha, coluna, direcao.deltaLinha, direcao.deltaColuna)) {
        inserirPalavra(grade, palavra, linha, coluna, direcao.deltaLinha, direcao.deltaColuna);
        posicionado = true;
      }
    }
  });
}

function preencherEspacosVazios(grade) {
  for (let i = 0; i < DIMENSAO; i++) {
    for (let j = 0; j < DIMENSAO; j++) {
      if (grade[i][j] === '-') {
        grade[i][j] = String.fromCharCode(65 + Math.floor(Math.random() * 26)); // Letras A-Z
      }
    }
  }
}

function desenharGrade(grade) {
  const container = document.getElementById('grade');
  container.innerHTML = ''; // Limpa a grade anterior
  const tabela = document.createElement('table');
  grade.forEach((linha, rowIndex) => {
    const tr = document.createElement('tr');
    linha.forEach((celula, colIndex) => {
      const td = document.createElement('td');
      td.textContent = celula;
      td.classList.add('celula');
      td.id = `r${rowIndex}c${colIndex}`;

      // Evento de início de seleção
      td.addEventListener('mousedown', iniciarSelecao);
      td.addEventListener('touchstart', iniciarSelecao);

      // Evento de continuação de seleção
      td.addEventListener('mouseenter', continuarSelecao);
      td.addEventListener('touchmove', continuarSelecao);

      tr.appendChild(td);
    });
    tabela.appendChild(tr);
  });
  container.appendChild(tabela);

  // Evento de finalização de seleção
  document.addEventListener('mouseup', finalizarSelecao);
  document.addEventListener('touchend', finalizarSelecao);
}

function iniciarSelecao(event) {
  event.preventDefault(); // Previne a seleção de texto ou outros comportamentos padrão
  selecionando = true;
  toggleSelecao(this); // Seleciona a célula onde o evento começou
}


function toggleSelecao(celula) {
  if (celula.classList.contains('celula-selecionada')) {
    celula.classList.remove('celula-selecionada'); // Remove a seleção se já estiver selecionada
    celula.style.backgroundColor = ''; // Remove a cor de fundo
  } else {
    celula.classList.add('celula-selecionada'); // Adiciona a seleção se não estiver selecionada
    celula.style.backgroundColor = cores[indiceCorAtual]; // Aplica a cor baseada no índice atual
    indiceCorAtual = (indiceCorAtual + 1) % cores.length; // Avança o índice circularmente
  }
}


function continuarSelecao(event) {
  if (!selecionando) return;
  event.preventDefault();

  let element = null;
  if (event.touches) {
    const touch = event.touches[0];
    element = document.elementFromPoint(touch.clientX, touch.clientY);
  } else {
    element = event.target;
  }

  // Verifica se a célula é diferente da última processada e se é uma célula válida
  if (element && element !== ultimaCelula && element.classList.contains('celula')) {
    requestAnimationFrame(() => {
      toggleSelecao(element);
    });
    ultimaCelula = element; // Atualiza a última célula processada
  }
}
let ultimaCelula = null;
let selecionando = false;
let touchStarted = false; // Variável de controle para eventos de toque

document.querySelectorAll('.celula').forEach(celula => {
  celula.addEventListener('touchstart', handleSelecaoInicial);
  celula.addEventListener('mousedown', (event) => {
    // Verifica se um evento de toque foi iniciado recentemente
    if (!touchStarted) {
      handleSelecaoInicial(event);
    }
  });
});

function handleSelecaoInicial(event) {
  if (!selecionando || event.type === 'touchstart') {
    selecionando = true;
    event.preventDefault();
    let element = event.target;
    if (element && element.classList.contains('celula')) {
      requestAnimationFrame(() => {
        toggleSelecao(element);
      });
      ultimaCelula = element;
    }
    // Reseta a variável de controle após um curto delay
    if (event.type === 'touchstart') {
      touchStarted = true;
      setTimeout(() => {
        touchStarted = false;
      }, 200); // Delay pode ser ajustado conforme necessário
    }
  }
}
// Função de debounce (pode ser ajustada conforme necessário)
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function finalizarSelecao() {
  selecionando = false;
}



function atualizarListaPalavras(palavras) {
  const lista = document.getElementById('lista-palavras'); // Certifique-se de ter um elemento com este ID na sua página
  lista.innerHTML = ''; // Limpa a lista atual
  palavras.forEach(palavra => {
    const item = document.createElement('li');
    item.textContent = palavra;
    item.id = `palavra-${palavra}`; // Cria um ID único para cada palavra
    lista.appendChild(item);
  });
}

let score = 0; // Inicializa a pontuação

// Função para atualizar a pontuação na view
function atualizarPontuacao(pontos) {
  score += pontos; // Atualiza a pontuação
  const elementoPontuacao = document.getElementById('pontuacao');
  elementoPontuacao.textContent = `Pontos: ${score}`; // Atualiza o texto do elemento
}

// Modifique esta função para marcar palavras encontradas
function verificarPalavraEncontrada() {
  // Sua lógica para verificar se uma palavra foi encontrada
  // Supondo que você tenha uma variável `palavraEncontrada`
  const palavraEncontrada = 'exemplo'; // Exemplo, substitua pela sua lógica
  const item = document.getElementById(`palavra-${palavraEncontrada}`);
  if (item) {
    item.style.textDecoration = 'line-through'; // Marca a palavra como encontrada
    item.style.color = 'green'; // Muda a cor para verde
  }
}

function iniciarCronometro() {
  tempoInicio = new Date();
  const cronometro = document.getElementById('cronometro');
  function atualizarCronometro() {
    const agora = new Date();
    const decorrido = agora - tempoInicio;
    const segundos = Math.floor(decorrido / 1000);
    cronometro.textContent = `Tempo: ${segundos} segundos`;
    requestAnimationFrame(atualizarCronometro);
  }
  requestAnimationFrame(atualizarCronometro);
}



const fases = ["palavras", "IPTU", "ISS", "ITBI"];
let indiceFaseAtual = 0; // Inicia na primeira fase


async function iniciarJogo() {
  try {
    const faseAtual = fases[indiceFaseAtual];
    const palavras = await carregarPalavras(faseAtual);
    if (palavras.length === 0) {
      console.error('Nenhuma palavra carregada.');
      return;
    }

    // Atualiza a view com a fase atual e as palavras
    atualizarViewFaseEListaPalavras(faseAtual, palavras);

    const grade = criarGradeVazia();
    posicionarPalavras(grade, palavras);
    preencherEspacosVazios(grade);
    desenharGrade(grade);

    const tableCells = document.querySelectorAll('table tbody tr td');
    let palavrasEncontradas = new Set(); // Armazena as palavras encontradas

    tableCells.forEach(cell => {
      cell.addEventListener('click', () => {
        const id = cell.id;
        if (onlyLetterOfTargetWords(id, letterPosition)) {
          const stringValue = addOrRemoveValue(id, cell);
          const foundMatch = checkWordInWordSearch(stringValue, letterPosition);

          if (foundMatch[0]) {
            const elementFound = document.getElementById(foundMatch[1]);
            elementFound.innerHTML = `<strike>${elementFound.innerText}</strike>`;
            letterPosition[foundMatch[1]] = '';
            palavrasEncontradas.add(foundMatch[1]); // Adiciona a palavra encontrada ao conjunto

            // Verifica se todas as palavras foram encontradas
            if (palavrasEncontradas.size === palavras.length) {
              console.log("Fase concluída!");
              indiceFaseAtual += 1; // Avança para a próxima fase
              if (indiceFaseAtual < fases.length) {
                iniciarJogo(); // Inicia a próxima fase
              } else {
                console.log("Parabéns! Você completou todas as fases!");
                // Implemente qualquer lógica de conclusão do jogo aqui
              }
            }
          }
        }
      });
    });
  } catch (error) {
    console.error('Erro ao iniciar o jogo:', error);
  }
}
function atualizarViewFaseEListaPalavras(faseAtual, palavras) {
  // Atualiza o elemento que mostra a fase atual
  const elementoFaseAtual = document.getElementById('faseAtual');
  elementoFaseAtual.innerText = `Fase: ${faseAtual.toUpperCase()}`;

  // Limpa a lista de palavras anterior
  const listaPalavrasElement = document.getElementById('listaPalavras');
  listaPalavrasElement.innerHTML = '';

  // Adiciona as palavras da fase atual à lista
  palavras.forEach(palavra => {
    const item = document.createElement('li');
    item.innerText = palavra;
    listaPalavrasElement.appendChild(item);
  });
}

function onSubmit() {
  // Processa as células selecionadas, verifica se as palavras estão corretas, atualiza a pontuação, etc.
  console.log('Submit clicado');
  // Exemplo: Desabilitar o botão de submit após o clique
  document.getElementById('btnSubmit').disabled = true;
  // Adicione aqui a lógica para processar as seleções
}

function onlyLetterOfTargetWords(id, letterPosition) {
  return letterPosition.includes(id);
}

function checkWordInWordSearch(stringValue, letterPosition) {
  let stringFound = false;
  let indexFound = 0;
  const sortedValue = stringValue.sort().join(',');

  for (let i = 0; i < letterPosition.length; i++) {
    const positionSort = letterPosition[i].split(',').sort().join(',');
    if (sortedValue === positionSort) {
      stringFound = true;
      indexFound = i;
      break;
    }
  }
  return [stringFound, indexFound];
}

document.addEventListener('DOMContentLoaded', iniciarJogo);
